"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Crown, Info, Loader2, Lock, Mail, Search, Store, Trash2, UserPlus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/page-header";
import { Hint } from "@/components/ui/hint";
import { avatarTint } from "@/lib/avatar";
import type { TeamShop } from "@/lib/team";

type Role = "owner" | "manager" | "staff";
type TeamRole = "manager" | "staff";

interface Person {
  userId: string;
  name: string;
  email: string;
  isMe: boolean;
  since: string;
  /** Follows every shop the owner has, including ones added later. */
  allShops: boolean;
  access: { membershipId: string; shopId: string; role: Role }[];
}

interface PendingInvite {
  email: string;
  role: TeamRole;
  expiresAt: string;
  invitedBy: string;
  allShops: boolean;
  items: { inviteId: string; shopId: string; role: TeamRole }[];
}

interface TeamData {
  currentShopId: string | null;
  shops: TeamShop[];
  people: Person[];
  invites: PendingInvite[];
}

const ROLES: { role: Role; label: string; blurb: string }[] = [
  { role: "owner", label: "Owner", blurb: "Everything, including billing and adding shops." },
  { role: "manager", label: "Manager", blurb: "Runs the shop day to day and manages its staff. No billing." },
  { role: "staff", label: "Staff", blurb: "Accepts stamps at the counter and serves customers." },
];

// Search and shop filters appear once the list stops fitting at a glance.
const FILTER_FROM = 8;
const SHOP_SEARCH_FROM = 8;

// Email-aware initials (splits on @ . _ - too, so avatars work before a member
// has set a display name). Tint is shared with the rest of the dashboard.
function initials(name: string, email: string) {
  const src = (name || email || "").trim();
  if (!src) return "?";
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function expiresLabel(iso: string) {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "expired";
  if (days === 1) return "expires tomorrow";
  return `expires in ${days} days`;
}

/** The person's role, or "mixed" when it differs between shops. */
function topRole(roles: Role[]): Role | "mixed" {
  if (roles.includes("owner")) return "owner";
  return new Set(roles).size > 1 ? "mixed" : (roles[0] ?? "staff");
}

function RoleBadge({ role }: { role: Role | "mixed" }) {
  if (role === "owner") {
    return (
      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
        <Crown className="mr-1 size-3" />
        Owner
      </Badge>
    );
  }
  if (role === "manager") {
    return <Badge className="border-sky-500/30 bg-sky-500/15 text-sky-300 hover:bg-sky-500/15">Manager</Badge>;
  }
  if (role === "mixed") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Mixed roles
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Staff
    </Badge>
  );
}

function Avatar({ name, email, pending }: { name: string; email: string; pending?: boolean }) {
  if (pending) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
        <Mail className="size-4" />
      </div>
    );
  }
  return (
    <div
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarTint(name || email)}`}
    >
      {initials(name, email)}
    </div>
  );
}

/** Which shops a row can use: names for a few, a count for many. */
function ShopAccess({ ids, shops, all }: { ids: string[]; shops: TeamShop[]; all?: boolean }) {
  if (all) {
    return (
      <span className="text-xs text-muted-foreground" title="Including shops added later">
        All shops <span className="text-amber-500/80">· incl. new</span>
      </span>
    );
  }
  if (ids.length === shops.length) {
    return <span className="text-xs text-muted-foreground">All {shops.length} shops</span>;
  }
  const names = shops.filter((s) => ids.includes(s._id)).map((s) => s.name);
  const shown = names.slice(0, 2);
  return (
    <div className="flex flex-wrap items-center gap-1" title={names.join(", ")}>
      {shown.map((n) => (
        <span key={n} className="max-w-[140px] truncate rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {n}
        </span>
      ))}
      {names.length > shown.length && (
        <span className="text-xs text-muted-foreground">+{names.length - shown.length} more</span>
      )}
    </div>
  );
}

export default function TeamClient() {
  const [data, setData] = useState<TeamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [shopFilter, setShopFilter] = useState("all");
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/team");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Couldn't load team");
      return;
    }
    setData(json);
    setError(null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    if (!data) return { people: [], invites: [] };
    const q = query.trim().toLowerCase();
    const match = (name: string, email: string) => !q || name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    const atShop = (ids: string[]) => shopFilter === "all" || ids.includes(shopFilter);
    return {
      people: data.people.filter((p) => match(p.name, p.email) && atShop(p.access.map((a) => a.shopId))),
      invites: data.invites.filter((i) => match("", i.email) && atShop(i.items.map((x) => x.shopId))),
    };
  }, [data, query, shopFilter]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Team" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      </div>
    );
  }
  if (!data) return <TeamSkeleton />;

  const { shops } = data;
  const multiShop = shops.length > 1;
  const managed = shops.filter((s) => s.myRole === "owner" || s.myRole === "manager");
  const canInviteAnywhere = managed.length > 0;
  const shopById = new Map(shops.map((s) => [s._id, s]));
  // Plan state for the banner, from the shops this viewer manages.
  const noLogins = managed.length > 0 && managed.every((s) => !s.plan.hasStaffLogins);
  const allFull =
    !noLogins &&
    managed.length > 0 &&
    managed.every((s) => s.plan.staffLoginLimit !== "unlimited" && s.staffLoginsUsed >= s.plan.staffLoginLimit);
  const planLabel = managed[0]?.plan.label ?? "Free";
  const showFilters = multiShop || data.people.length + data.invites.length >= FILTER_FROM;

  async function revoke(inv: PendingInvite) {
    setBusyId(inv.email);
    try {
      const results = await Promise.all(
        inv.items.map((i) => fetch(`/api/team/invites/${i.inviteId}`, { method: "DELETE" }).then((r) => r.ok)),
      );
      if (results.every(Boolean)) toast.success(`Invite to ${inv.email} cancelled`);
      else toast.error("Couldn't cancel every invite — you may not manage all of those shops.");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description={
          multiShop
            ? "Who can log in, and which of your shops they can use."
            : "Invite managers and staff to accept stamps on the counter."
        }
        actions={
          canInviteAnywhere && (
            <Button
              onClick={() => setInviting(true)}
              disabled={noLogins || allFull}
              className="cursor-pointer bg-amber-700 text-white hover:bg-amber-800"
            >
              <UserPlus className="mr-2 size-4" />
              Invite people
            </Button>
          )
        }
      />

      {(noLogins || allFull) && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-center">
          <Lock className="hidden size-5 shrink-0 text-amber-400 sm:block" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground">
              {noLogins
                ? `Team logins aren't included on ${planLabel}`
                : `You're using every staff login on ${planLabel}`}
            </p>
            <p className="text-muted-foreground">
              {noLogins
                ? "Pro includes one staff login. Business gives you unlimited managers and staff, across up to 3 shops."
                : "Upgrade to Business for unlimited managers and staff, or remove someone to free a seat."}
            </p>
          </div>
          <Button asChild size="sm" className="cursor-pointer bg-amber-700 text-white hover:bg-amber-800">
            <Link href="/dashboard/billing">See plans</Link>
          </Button>
        </div>
      )}

      <Card className="gap-0 py-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="size-4 text-muted-foreground" />
            {data.people.length} {data.people.length === 1 ? "person" : "people"}
            {data.invites.length > 0 && (
              <span className="font-normal text-muted-foreground">· {data.invites.length} invited</span>
            )}
          </div>
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or email"
                  className="h-9 w-full pl-9 text-sm sm:w-72"
                />
              </div>
              {multiShop && (
                <Select value={shopFilter} onValueChange={setShopFilter}>
                  <SelectTrigger className="!h-9 w-48">
                    <Store className="size-3.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All shops</SelectItem>
                    {shops.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {/* People + pending invites, one list */}
        <div className="divide-y">
          {rows.people.map((p) => {
            const role = topRole(p.access.map((a) => a.role));
            // Editable when the viewer manages at least one shop where this
            // person could be changed.
            const editable =
              !p.isMe &&
              role !== "owner" &&
              managed.some((s) => {
                const theirs = p.access.find((a) => a.shopId === s._id)?.role;
                return s.myRole === "owner" || theirs === undefined || theirs === "staff";
              });
            return (
              <div key={p.userId} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
                <Avatar name={p.name} email={p.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {p.name || p.email}
                    {p.isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{p.name ? p.email : "No name set yet"}</p>
                </div>
                {multiShop && (
                  <div className="hidden w-56 md:block">
                    <ShopAccess ids={p.access.map((a) => a.shopId)} shops={shops} all={p.allShops} />
                  </div>
                )}
                <div className="w-28">
                  <RoleBadge role={role} />
                </div>
                <div className="flex w-24 justify-end">
                  {editable && (
                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setEditing(p)}>
                      {multiShop ? "Access" : "Edit"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {rows.invites.map((inv) => {
            const cancellable = inv.items.some((i) => {
              const s = shopById.get(i.shopId);
              return s && (s.myRole === "owner" || (s.myRole === "manager" && i.role === "staff"));
            });
            return (
              <div key={inv.email} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
                <Avatar name="" email={inv.email} pending />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{inv.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Invited{inv.invitedBy && ` by ${inv.invitedBy}`} · {expiresLabel(inv.expiresAt)}
                  </p>
                </div>
                {multiShop && (
                  <div className="hidden w-56 md:block">
                    <ShopAccess ids={inv.items.map((i) => i.shopId)} shops={shops} all={inv.allShops} />
                  </div>
                )}
                <div className="w-28">
                  <RoleBadge role={inv.role} />
                </div>
                <div className="flex w-24 justify-end">
                  {cancellable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === inv.email}
                      onClick={() => revoke(inv)}
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                    >
                      {busyId === inv.email ? <Loader2 className="size-4 animate-spin" /> : "Cancel"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {!rows.people.length && !rows.invites.length && (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">Nobody matches that search.</p>
          )}
          {data.people.length === 1 && !data.invites.length && canInviteAnywhere && !noLogins && !allFull && (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <p className="text-sm font-medium text-foreground">It&apos;s just you so far</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Invite your staff so they can accept stamps at the counter from their own login.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* What each role can do */}
      <div className="grid gap-3 sm:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.role} className="rounded-xl border px-4 py-3">
            <RoleBadge role={r.role} />
            <p className="mt-2 text-xs text-muted-foreground">{r.blurb}</p>
          </div>
        ))}
      </div>

      <InviteSheet
        open={inviting}
        onOpenChange={setInviting}
        shops={managed}
        defaultShopId={data.currentShopId}
        onDone={load}
      />
      <AccessSheet person={editing} shops={managed} onClose={() => setEditing(null)} onDone={load} />
    </div>
  );
}

// ── Shop picker ───────────────────────────────────────────────────────────

function ShopPicker({
  shops,
  selected,
  onChange,
  disabled,
  note,
  allShops,
  onAllShops,
}: {
  shops: TeamShop[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Shops shown but not toggleable, with the reason. */
  disabled?: Map<string, string>;
  note?: Map<string, string>;
  /** Owners only: every shop, including ones added later. */
  allShops?: boolean;
  onAllShops?: (on: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const togglable = allShops ? [] : shops.filter((s) => !disabled?.has(s._id));
  const shown = query ? shops.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())) : shops;
  const allOn = togglable.every((s) => selected.has(s._id));

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Label>Shops</Label>
      {onAllShops && (
        <button
          type="button"
          onClick={() => onAllShops(!allShops)}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
            allShops ? "border-amber-600 bg-amber-600/10" : "hover:bg-muted/50"
          }`}
        >
          <span
            className={`flex size-4 shrink-0 items-center justify-center rounded border ${
              allShops ? "border-amber-600 bg-amber-600 text-white" : "border-muted-foreground/40"
            }`}
          >
            {allShops && <Check className="size-3" />}
          </span>
          <span className="flex-1 truncate">
            <span className="font-medium text-foreground">All shops</span>
            <span className="text-xs text-muted-foreground"> · including any you add later</span>
          </span>
        </button>
      )}
      {!allShops && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">{onAllShops ? "Or pick shops" : ""}</span>
          <button
            type="button"
            className="cursor-pointer text-xs text-amber-500 hover:underline"
            onClick={() => {
              const next = new Set(selected);
              for (const s of togglable) {
                if (allOn) next.delete(s._id);
                else next.add(s._id);
              }
              onChange(next);
            }}
          >
            {allOn ? "Clear all" : `Select all ${togglable.length}`}
          </button>
        </div>
      )}
      {!allShops && shops.length >= SHOP_SEARCH_FROM && (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a shop" className="h-8 pl-8 text-sm" />
        </div>
      )}
      <div className="min-h-48 flex-1 divide-y overflow-y-auto rounded-lg border">
        {shown.map((s) => {
          const lock = disabled?.get(s._id) ?? (allShops ? "" : undefined);
          const on = allShops || selected.has(s._id);
          return (
            <button
              key={s._id}
              type="button"
              disabled={lock !== undefined}
              onClick={() => toggle(s._id)}
              className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                  on ? "border-amber-600 bg-amber-600 text-white" : "border-muted-foreground/40"
                }`}
              >
                {on && <Check className="size-3" />}
              </span>
              <span className="flex-1 truncate">{s.name}</span>
              {(lock || note?.get(s._id)) && (
                <span className="shrink-0 text-xs text-muted-foreground">{lock || note?.get(s._id)}</span>
              )}
            </button>
          );
        })}
        {!shown.length && <p className="px-3 py-4 text-center text-xs text-muted-foreground">No shop matches.</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        {allShops
          ? `All ${shops.length} shops now, and any you add later.`
          : `${selected.size} of ${shops.length} selected. They'll only see these shops in their shop switcher.`}
      </p>
    </div>
  );
}

function RolePicker({
  value,
  onChange,
  canManager,
}: {
  value: TeamRole;
  onChange: (r: TeamRole) => void;
  canManager: boolean;
}) {
  // A compact toggle; what each role can do is in the tooltip, and in the
  // role cards on the page behind the sheet.
  return (
    <div className="flex items-center justify-between gap-3">
      <Label>Role</Label>
      <div className="inline-flex rounded-lg border p-0.5">
        {ROLES.filter((r): r is (typeof ROLES)[number] & { role: TeamRole } => r.role !== "owner").map((r) => {
          const locked = r.role === "manager" && !canManager;
          return (
            <Hint key={r.role} label={locked ? "Only the owner can add managers." : r.blurb}>
              <button
                type="button"
                disabled={locked}
                onClick={() => onChange(r.role)}
                aria-pressed={value === r.role}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  value === r.role ? "bg-amber-600 text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
                <Info className="size-3.5 opacity-60" />
              </button>
            </Hint>
          );
        })}
      </div>
    </div>
  );
}

// ── Invite ────────────────────────────────────────────────────────────────

function InviteSheet({
  open,
  onOpenChange,
  shops,
  defaultShopId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  shops: TeamShop[];
  defaultShopId: string | null;
  onDone: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Invite people</SheetTitle>
          <SheetDescription>They&apos;ll get an email with a link to set up their login. Invites expire in 7 days.</SheetDescription>
        </SheetHeader>
        {open && <InviteForm shops={shops} defaultShopId={defaultShopId} onSent={() => (onOpenChange(false), onDone())} />}
      </SheetContent>
    </Sheet>
  );
}

function InviteForm({
  shops,
  defaultShopId,
  onSent,
}: {
  shops: TeamShop[];
  defaultShopId: string | null;
  onSent: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("staff");
  // Start from the shop being viewed, or every shop from "All shops".
  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(defaultShopId && shops.some((s) => s._id === defaultShopId) ? [defaultShopId] : shops.map((s) => s._id)),
  );
  const [sending, setSending] = useState(false);
  const [allShops, setAllShops] = useState(false);

  const ownerSomewhere = shops.some((s) => s.myRole === "owner");
  // "All shops" means all the owner's shops, so only an owner of every shop here gets it.
  const canAll = shops.length > 1 && shops.every((s) => s.myRole === "owner");
  const effectiveRole = role === "manager" && !ownerSomewhere ? "staff" : role;
  // Managers can't be invited to shops the viewer only manages.
  const locked = new Map(
    shops
      .filter((s) => effectiveRole === "manager" && s.myRole !== "owner")
      .map((s) => [s._id, "Owner only"] as const),
  );
  const chosen = allShops ? shops.map((s) => s._id) : [...selected].filter((id) => !locked.has(id));

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: effectiveRole, shopIds: chosen, allShops }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || "Couldn't send invite");
        return;
      }
      toast.success(
        json.skipped?.length
          ? `Invite sent to ${email}. Already on ${json.skipped.join(", ")}.`
          : `Invite sent to ${email}`,
      );
      onSent();
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={send} className="flex flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            required
            autoFocus
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <RolePicker value={effectiveRole} onChange={setRole} canManager={ownerSomewhere} />
        {shops.length > 1 && (
          <ShopPicker
            shops={shops}
            selected={selected}
            onChange={setSelected}
            disabled={locked}
            allShops={allShops}
            onAllShops={canAll ? setAllShops : undefined}
          />
        )}
      </div>
      <SheetFooter className="border-t">
        <Button
          type="submit"
          disabled={sending || !email.trim() || !chosen.length}
          className="cursor-pointer bg-amber-700 text-white hover:bg-amber-800"
        >
          {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}
          {shops.length <= 1
            ? "Send invite"
            : allShops
              ? "Send invite · all shops"
              : `Send invite · ${chosen.length} shop${chosen.length === 1 ? "" : "s"}`}
        </Button>
      </SheetFooter>
    </form>
  );
}

// ── Edit access ───────────────────────────────────────────────────────────

function AccessSheet({
  person,
  shops,
  onClose,
  onDone,
}: {
  person: Person | null;
  shops: TeamShop[];
  onClose: () => void;
  onDone: () => void;
}) {
  if (!person) return null;
  return <AccessSheetBody key={person.userId} person={person} shops={shops} onClose={onClose} onDone={onDone} />;
}

function AccessSheetBody({
  person,
  shops,
  onClose,
  onDone,
}: {
  person: Person;
  shops: TeamShop[];
  onClose: () => void;
  onDone: () => void;
}) {
  const mine = person.access.filter((a) => shops.some((s) => s._id === a.shopId));
  const [role, setRole] = useState<TeamRole>(() => (mine.some((a) => a.role === "manager") ? "manager" : "staff"));
  const [selected, setSelected] = useState<Set<string>>(() => new Set(mine.map((a) => a.shopId)));
  const [saving, setSaving] = useState<"save" | "remove" | null>(null);
  const [allShops, setAllShops] = useState(person.allShops);

  const theirs = new Map(person.access.map((a) => [a.shopId, a.role]));
  const ownerSomewhere = shops.some((s) => s.myRole === "owner");
  const canAll = shops.length > 1 && shops.every((s) => s.myRole === "owner");
  // Shops where the viewer can't make this change: they're the owner there, or
  // the viewer is a manager and they're a manager (or would become one).
  const locked = new Map<string, string>();
  for (const s of shops) {
    const r = theirs.get(s._id);
    if (r === "owner") locked.set(s._id, "Owner");
    else if (s.myRole !== "owner" && (r === "manager" || role === "manager")) locked.set(s._id, "Owner only");
  }
  const mixed = new Set(person.access.map((a) => a.role)).size > 1;

  async function save(remove = false) {
    setSaving(remove ? "remove" : "save");
    try {
      const res = remove
        ? await fetch(`/api/team/people/${person.userId}`, { method: "DELETE" })
        : await fetch(`/api/team/people/${person.userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access: Object.fromEntries(
                shops
                  .filter((s) => !locked.has(s._id))
                  .map((s) => [s._id, allShops || selected.has(s._id) ? role : null]),
              ),
              ...(canAll ? { allShops } : {}),
            }),
          });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || "Couldn't save");
        return;
      }
      toast.success(remove ? `${person.name || person.email} removed` : "Access updated");
      onClose();
      onDone();
    } finally {
      setSaving(null);
    }
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar name={person.name} email={person.email} />
            <div className="min-w-0">
              <SheetTitle className="truncate">{person.name || person.email}</SheetTitle>
              <SheetDescription className="truncate">{person.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
          <RolePicker value={role} onChange={setRole} canManager={ownerSomewhere} />
          {mixed && (
            <p className="-mt-3 text-xs text-amber-400">
              They have different roles at different shops. Saving makes them {role === "manager" ? "a manager" : "staff"} at
              every shop selected below.
            </p>
          )}
          {shops.length > 1 && (
            <ShopPicker
              shops={shops}
              selected={selected}
              onChange={setSelected}
              disabled={locked}
              allShops={allShops}
              onAllShops={canAll ? setAllShops : undefined}
            />
          )}
        </div>
        <SheetFooter className="flex-row justify-between border-t">
          <Button
            variant="ghost"
            disabled={!!saving}
            onClick={() => {
              if (window.confirm(`Remove ${person.name || person.email} from ${shops.length > 1 ? "all your shops" : "the team"}?`)) save(true);
            }}
            className="cursor-pointer text-muted-foreground hover:text-destructive"
          >
            {saving === "remove" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
            Remove
          </Button>
          <Button
            disabled={!!saving || (shops.length > 1 && !allShops && selected.size === 0)}
            onClick={() => save()}
            className="cursor-pointer bg-amber-700 text-white hover:bg-amber-800"
          >
            {saving === "save" && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-64" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}
