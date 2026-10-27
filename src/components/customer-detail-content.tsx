"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VisitCadence, { type CadenceDay } from "@/components/visit-cadence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Ban,
  Check,
  CircleCheck,
  Combine,
  Gift,
  Mail,
  MinusCircle,
  MoreHorizontal,
  Pencil,
  Stamp,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/ui/hint";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MergeCustomerDialog from "@/components/merge-customer-dialog";
import StampActions from "@/components/stamp-actions";
import { getProgram } from "@/lib/program";
import { avatarTint, initialsOf } from "@/lib/avatar";
import { timeAgo, shortDateTime, membershipDuration } from "@/lib/date";
import type { ProgramConfig } from "@/lib/program";
import { toast } from "sonner";

interface HistoryRow {
  id: string;
  createdAt: string;
  status: "approved" | "rejected" | "adjusted";
  stampsAwarded: number;
  redeem: boolean;
  // Removals ("adjusted"): why, and who did it.
  reason?: string | null;
  adjustedBy?: string | null;
}

interface Props {
  shopId: string;
  customerId: string;
  customerName: string;
  customerRealName?: string | null;
  customerEmail?: string | null;
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
  threshold: number;
  perkMode?: boolean;
  memberSince: string;
  lastVisit: string | null;
  visitsLast30d: number;
  cadence: CadenceDay[];
  // Perk mode: how many times this email has been verified. >1 means the
  // phone keeps losing its cookie between scans.
  perkVerifications?: number;
  history: HistoryRow[];
  initialNotes: string;
  initialTags: string[];
  initialDisabled?: boolean;
  // Admin view: no editing, no check-in, no disable — the write APIs are
  // merchant-scoped, and support shouldn't be changing a shop's records.
  readOnly?: boolean;
  // Owners and managers can add, remove and redeem stamps, merge and disable.
  // Staff see those controls disabled, with the reason.
  canManage?: boolean;
  // Where the back arrow goes; defaults to the merchant's customer list.
  backHref?: string;
}

const PAGE_SIZE = 10;

export default function CustomerDetailContent({
  shopId,
  customerId,
  customerName,
  customerRealName,
  customerEmail,
  stamps,
  totalEarned,
  freeRedeemed,
  threshold,
  perkMode = false,
  memberSince,
  lastVisit,
  visitsLast30d,
  cadence,
  perkVerifications = 0,
  history,
  initialNotes,
  initialTags,
  initialDisabled = false,
  readOnly = false,
  canManage = false,
  backHref = "/dashboard/customers",
}: Props) {
  const [page, setPage] = useState(0);
  const [notes, setNotes] = useState(initialNotes);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);

  // Editable name/email (the merchant can fix typos). `realName` is the stored
  // name; the header falls back to the generated display name when it's blank.
  const [realName, setRealName] = useState(customerRealName || "");
  const [email, setEmail] = useState(customerEmail || "");
  const [editOpen, setEditOpen] = useState(false);
  const [formName, setFormName] = useState(customerRealName || "");
  const [formEmail, setFormEmail] = useState(customerEmail || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState("");

  // Per-shop disable state.
  const [disabled, setDisabled] = useState(initialDisabled);
  const [togglingDisabled, setTogglingDisabled] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  const displayName = realName.trim() || customerName;

  async function toggleDisabled() {
    const next = !disabled;
    setTogglingDisabled(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: next }),
      });
      if (!res.ok) throw new Error("toggle-failed");
      setDisabled(next);
      setEditOpen(false);
      toast.success(next ? "Customer disabled" : "Customer enabled");
    } catch {
      toast.error("Could not update. Please try again.");
    } finally {
      setTogglingDisabled(false);
    }
  }

  function openEdit() {
    setFormName(realName);
    setFormEmail(email);
    setEditErr("");
    setEditOpen(true);
  }

  async function saveEdit() {
    setEditErr("");
    const trimmedEmail = formEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEditErr("Enter a valid email address.");
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), email: trimmedEmail }),
      });
      if (!res.ok) throw new Error("save-failed");
      setRealName(formName.trim());
      setEmail(trimmedEmail);
      setEditOpen(false);
      toast.success("Customer details updated");
    } catch {
      setEditErr("Could not save. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  }

  const program = getProgram(perkMode);
  const canRedeem = stamps >= threshold;

  // Auto-save notes/tags 1.5s after last edit
  useEffect(() => {
    if (!notesDirty) return;
    const t = setTimeout(async () => {
      setSavingNotes(true);
      try {
        const res = await fetch(`/api/customers/${customerId}/notes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes, tags }),
        });
        if (!res.ok) throw new Error("save failed");
        setNotesDirty(false);
      } catch {
        toast.error("Couldn't save notes");
      } finally {
        setSavingNotes(false);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [notes, tags, notesDirty, customerId]);

  function addTag(raw: string) {
    const t = raw.trim();
    if (!t || tags.includes(t) || tags.length >= 10) return;
    setTags([...tags, t]);
    setNotesDirty(true);
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
    setNotesDirty(true);
  }

  const pagedHistory = useMemo(() => {
    return history.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [history, page]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          title="Back to all customers"
        >
          <ArrowLeft className="size-4" />
          Customers
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {/* Monogram — same colour this customer carries in the list, so the
                detail page reads as "the same person" at a glance. */}
            <div
              className={`flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${
                disabled
                  ? "bg-muted text-muted-foreground"
                  : avatarTint(displayName)
              }`}
            >
              {initialsOf(displayName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold text-foreground">
                  {displayName}
                </h1>
                {disabled && (
                  <Badge
                    variant="outline"
                    className="border-red-500/40 font-normal text-red-400"
                  >
                    Disabled
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    title={`Email ${displayName}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline"
                  >
                    <Mail className="size-3.5" />
                    {email}
                  </a>
                ) : (
                  !readOnly && (
                    <button
                      type="button"
                      onClick={openEdit}
                      title="Add an email address for this customer"
                      className="inline-flex cursor-pointer items-center gap-1.5 hover:text-foreground"
                    >
                      <Mail className="size-3.5" />
                      Add email
                    </button>
                  )
                )}
                <span suppressHydrationWarning>
                  Customer for {membershipDuration(memberSince)}
                </span>
              </div>
            </div>
          </div>

          {!readOnly && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Customer actions"
                      className="shrink-0 cursor-pointer"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Edit, merge or disable this customer
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onSelect={openEdit}>
                  <Pencil className="size-4" />
                  Edit name &amp; email
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setMergeOpen(true)}
                  disabled={!canManage}
                >
                  <Combine className="size-4" />
                  Merge a duplicate card
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {disabled ? (
                  <DropdownMenuItem
                    onSelect={toggleDisabled}
                    disabled={togglingDisabled || !canManage}
                  >
                    <CircleCheck className="size-4" />
                    Enable customer
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={toggleDisabled}
                    disabled={togglingDisabled || !canManage}
                  >
                    <Ban className="size-4" />
                    Disable customer
                  </DropdownMenuItem>
                )}
                {!canManage && (
                  // Disabled menu items can't show a tooltip, so say why here.
                  <p className="px-2 pt-1.5 pb-1 text-xs text-muted-foreground">
                    Only the owner or a manager can merge or disable customers.
                  </p>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {disabled && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-red-400">
              <Ban className="size-4 shrink-0" />
              Disabled at this shop: they can&apos;t earn stamps or claim
              rewards.
            </span>
            {!readOnly && (
              <Hint
                label={
                  canManage
                    ? "Let them earn stamps and claim rewards again"
                    : "Only the owner or a manager can enable customers."
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleDisabled}
                  disabled={togglingDisabled || !canManage}
                  className="cursor-pointer"
                >
                  {togglingDisabled ? "…" : "Enable customer"}
                </Button>
              </Hint>
            )}
          </div>
        )}
      </div>

      {/* Two columns on desktop: the card, activity and history on the left,
          the at-a-glance facts and notes on the right. On a phone the side
          column drops in straight after the card. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">
              {perkMode ? program.detailTitle : "Stamp card"}
            </CardTitle>
            {!readOnly && !disabled && (
              <StampActions
                shopId={shopId}
                customerId={customerId}
                displayName={displayName}
                stamps={stamps}
                threshold={threshold}
                canManage={canManage}
                perk={perkMode}
              />
            )}
          </CardHeader>
          <CardContent>
            {perkMode ? (
              // Perk customers earn no stamps — the meaningful number is how
              // many free coffees they've redeemed (the reimbursement figure).
              <div className="space-y-2 text-sm text-foreground">
                <div>
                  <strong className="text-3xl font-bold">{freeRedeemed}</strong>{" "}
                  <span className="text-muted-foreground">
                    {freeRedeemed === 1 ? program.unit : program.unitPlural}{" "}
                    redeemed
                  </span>
                </div>
                {perkVerifications >= 2 && (
                  <p className="text-xs text-muted-foreground">
                    Email verified{" "}
                    <strong className="text-foreground">
                      {perkVerifications}
                    </strong>{" "}
                    times — their phone isn&apos;t keeping the cookie between
                    scans, so they&apos;re re-entering the code.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <StampDots stamps={stamps} threshold={threshold} />
                <p className="text-sm">
                  <strong className="text-foreground">
                    {stamps} of {threshold}
                  </strong>{" "}
                  {canRedeem ? (
                    <span className="font-medium text-emerald-500">
                      · reward ready to redeem
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      · {threshold - stamps} more for a reward
                    </span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-start-3 lg:row-span-3 lg:row-start-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y text-sm">
                <Fact label="Last visit">
                  <span suppressHydrationWarning>{timeAgo(lastVisit)}</span>
                </Fact>
                <Fact label="Visits, last 30 days">{visitsLast30d}</Fact>
                {!perkMode && (
                  <Fact label="Lifetime stamps">{totalEarned}</Fact>
                )}
                <Fact
                  label={
                    perkMode
                      ? program.unitPlural.replace(/^./, (c) => c.toUpperCase())
                      : "Rewards redeemed"
                  }
                >
                  {freeRedeemed}
                </Fact>
                <Fact label="Customer since">
                  <span suppressHydrationWarning>
                    {new Date(memberSince).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </Fact>
              </dl>
            </CardContent>
          </Card>

          {readOnly ? (
            (tags.length > 0 || notes.trim()) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes &amp; tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="border-amber-500/50 font-normal text-amber-500"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {notes.trim() && (
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Notes &amp; tags</CardTitle>
                  <span
                    className="text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {savingNotes ? "Saving…" : notesDirty ? "" : "Saved"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your team sees these on the check-in popup when this customer
                  scans. Customers never see them.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="gap-1 border-amber-500/50 font-normal text-amber-500"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="cursor-pointer text-amber-500/70 hover:text-amber-500"
                        aria-label={`Remove tag ${t}`}
                        title={`Remove tag ${t}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagInput);
                        setTagInput("");
                      }
                    }}
                    onBlur={() => {
                      if (tagInput.trim()) {
                        addTag(tagInput);
                        setTagInput("");
                      }
                    }}
                    placeholder="+ Add tag"
                    aria-label="Add tag"
                    title="Type a tag and press Enter, e.g. VIP or Oat milk"
                    className="h-7 w-32 text-xs"
                  />
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setNotesDirty(true);
                  }}
                  placeholder="Allergies, usual order, anything worth remembering…"
                  aria-label="Notes"
                  className="min-h-[96px] text-sm"
                  maxLength={2000}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {cadence.length > 0 && (
          <div className="lg:col-span-2">
            <VisitCadence cadence={cadence} perkMode={perkMode} />
          </div>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history yet.</p>
            ) : (
              <>
                <ul className="divide-y">
                  {pagedHistory.map((row) => (
                    <HistoryItem
                      key={row.id}
                      row={row}
                      threshold={threshold}
                      program={program}
                    />
                  ))}
                </ul>
                <Pager
                  page={page}
                  pageSize={PAGE_SIZE}
                  count={history.length}
                  onPage={setPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {!readOnly && (
        <MergeCustomerDialog
          open={mergeOpen}
          onOpenChange={setMergeOpen}
          customerId={customerId}
          displayName={displayName}
          stamps={stamps}
          totalEarned={totalEarned}
          freeRedeemed={freeRedeemed}
          threshold={threshold}
        />
      )}

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) setEditOpen(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cust-name">Name</Label>
              <Input
                id="cust-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                value={formEmail}
                onChange={(e) => {
                  setFormEmail(e.target.value);
                  setEditErr("");
                }}
                placeholder="customer@example.com"
              />
            </div>
            {editErr && <p className="text-sm text-red-400">{editErr}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={saveEdit}
                disabled={savingEdit}
                className="cursor-pointer"
              >
                {savingEdit ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">{children}</dd>
    </div>
  );
}

// The card as stamp slots: filled ones in amber, empty ones dashed, all
// green once a reward is ready. Falls back to a bar for very long cards.
function StampDots({
  stamps,
  threshold,
}: {
  stamps: number;
  threshold: number;
}) {
  const ready = stamps >= threshold;
  if (threshold > 20) {
    return (
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${ready ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${Math.min(100, (stamps / threshold) * 100)}%` }}
        />
      </div>
    );
  }
  return (
    <div
      className="flex flex-wrap gap-2"
      aria-label={`${stamps} of ${threshold} stamps`}
    >
      {Array.from({ length: threshold }, (_, i) => {
        const filled = i < stamps;
        return (
          <span
            key={i}
            className={`flex size-9 items-center justify-center rounded-full border-2 sm:size-10 ${
              filled
                ? ready
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-amber-500 bg-amber-500 text-white"
                : "border-dashed border-muted-foreground/30"
            }`}
          >
            {filled ? (
              <Check className="size-4" strokeWidth={3} />
            ) : (
              i === threshold - 1 && (
                <Gift className="size-4 text-muted-foreground/50" />
              )
            )}
          </span>
        );
      })}
    </div>
  );
}

// One row of the history: what happened in plain words, with an icon, and
// when. Removals also say who made them and why.
function HistoryItem({
  row,
  threshold,
  program,
}: {
  row: HistoryRow;
  threshold: number;
  program: ProgramConfig;
}) {
  const n = Math.abs(row.stampsAwarded || 0);
  const stampsText = `${n} stamp${n === 1 ? "" : "s"}`;
  let icon = <Stamp className="size-4" />;
  let tint = "bg-amber-500/15 text-amber-500";
  let title: string;
  let detail: string | null = null;
  let delta: React.ReactNode = null;

  if (row.status === "adjusted") {
    icon = <MinusCircle className="size-4" />;
    tint = "bg-red-500/15 text-red-400";
    title = `Removed ${stampsText}`;
    detail =
      [row.reason, row.adjustedBy && `by ${row.adjustedBy}`]
        .filter(Boolean)
        .join(" · ") || null;
    delta = <span className="text-red-400">−{n}</span>;
  } else if (row.status === "rejected") {
    icon = <X className="size-4" />;
    tint = "bg-muted text-muted-foreground";
    title = "Request declined";
  } else if (program.isPerk) {
    icon = <Gift className="size-4" />;
    tint = "bg-emerald-500/15 text-emerald-500";
    title = program.eventLabel;
  } else if (row.redeem) {
    icon = <Gift className="size-4" />;
    tint = "bg-emerald-500/15 text-emerald-500";
    title = n ? `Reward redeemed, plus ${stampsText}` : "Reward redeemed";
    delta = (
      <span>
        <span className="text-muted-foreground">−{threshold}</span>
        {n > 0 && <span className="text-amber-500"> +{n}</span>}
      </span>
    );
  } else {
    title = `Earned ${stampsText}`;
    delta = <span className="text-amber-500">+{n}</span>;
  }

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tint}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p
          className="truncate text-xs text-muted-foreground"
          suppressHydrationWarning
        >
          {shortDateTime(row.createdAt)}
          {detail && ` · ${detail}`}
        </p>
      </div>
      {delta && (
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {delta}
        </span>
      )}
    </li>
  );
}
