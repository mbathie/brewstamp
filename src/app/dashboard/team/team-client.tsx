"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Mail,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Users,
} from "lucide-react";

type Role = "owner" | "manager" | "staff";

interface Member {
  _id: string;
  role: Role;
  acceptedAt: string | null;
  createdAt: string;
  shop: { _id: string; name: string };
  user: { _id: string; name: string; email: string };
}

interface Invite {
  _id: string;
  email: string;
  role: "manager" | "staff";
  expiresAt: string;
  createdAt: string;
  shop: { _id: string; name: string };
  invitedBy: { name: string; email: string };
}

interface TeamData {
  aggregate: boolean;
  shop: { _id: string; name: string } | null;
  myRole: Role | null;
  myRolesByShop: Record<string, Role>;
  plan: { slug: string; label: string; hasStaffLogins: boolean };
  members: Member[];
  invites: Invite[];
}

function initials(name: string, email: string) {
  const src = (name || email || "").trim();
  if (!src) return "?";
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function RoleBadge({ role }: { role: Role }) {
  if (role === "owner") {
    return (
      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
        <ShieldCheck className="mr-1 size-3" />
        Owner
      </Badge>
    );
  }
  if (role === "manager") {
    return (
      <Badge className="border-sky-500/30 bg-sky-500/15 text-sky-300 hover:bg-sky-500/15">
        Manager
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Staff
    </Badge>
  );
}

function expiresLabel(iso: string) {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "expires today";
  if (days === 1) return "expires tomorrow";
  return `expires in ${days}d`;
}

export default function TeamClient() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"staff" | "manager">("staff");
  const [inviting, setInviting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Couldn't load team");
        return;
      }
      setData(json);
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.upgradeRequired) {
          window.location.href = "/dashboard/billing";
          return;
        }
        toast.error(json.error || "Couldn't send invite");
        return;
      }
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      load();
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(memberId: string, role: "manager" | "staff") {
    setBusyId(memberId);
    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Couldn't change role");
        return;
      }
      toast.success("Role updated");
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(memberId: string, name: string) {
    if (!window.confirm(`Remove ${name} from the team?`)) return;
    setBusyId(memberId);
    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Couldn't remove member");
        return;
      }
      toast.success("Removed from team");
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function revokeInvite(inviteId: string) {
    setBusyId(inviteId);
    try {
      const res = await fetch(`/api/team/invites/${inviteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Couldn't revoke invite");
        return;
      }
      toast.success("Invite revoked");
      load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {error || "Team data unavailable."}
        </CardContent>
      </Card>
    );
  }

  // Per-row permissions. In aggregate ("All shops") mode the viewer might be
  // owner on Shop A and staff on Shop B, so actions are scoped to the viewer's
  // role on each member's specific shop.
  const roleOn = (shopId: string) => data.myRolesByShop[shopId] || null;
  const canManageShop = (shopId: string) => {
    const r = roleOn(shopId);
    return r === "owner" || r === "manager";
  };
  const canManage = data.myRole === "owner" || data.myRole === "manager";
  // Invites are scoped to a single shop, so only offered in single-shop mode.
  const showInviteForm = !data.aggregate && !!data.shop && canManage;
  const canInvite = showInviteForm && data.plan.hasStaffLogins;

  return (
    <div className="space-y-6">
      {/* Plan gate */}
      {!data.plan.hasStaffLogins && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <Lock className="mt-0.5 size-5 shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Team logins are a Plus &amp; Max feature
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;re on the {data.plan.label} plan. Upgrade to Plus or
                Max to invite managers and staff who can accept stamps on the
                counter.
              </p>
              <Link href="/dashboard/billing">
                <Button className="mt-3 cursor-pointer bg-amber-700 hover:bg-amber-800">
                  See plans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aggregate notice */}
      {data.aggregate && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <p className="text-sm text-muted-foreground">
              Viewing every member across your shops. To invite people or change
              roles, switch to a specific shop from the top bar — invites are
              scoped per shop.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invite form. A grid keeps Email / Role / Send invite on one row that
          aligns by grid row (immune to control-height quirks) and stacks
          cleanly on mobile. Hidden entirely when the plan can't invite — the
          gate card above already explains why, so we don't show a dead form. */}
      {showInviteForm && data.plan.hasStaffLogins && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Invite to {data.shop!.name}
            </CardTitle>
            <CardDescription>
              They&apos;ll get an email with a link to set up their login.
              Invites expire in 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleInvite}
              className="grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_9rem_auto]"
            >
              <Label
                htmlFor="invite-email"
                className="sm:col-start-1 sm:row-start-1"
              >
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                required
                placeholder="teammate@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={!canInvite}
                className="sm:col-start-1 sm:row-start-2"
              />

              <Label
                htmlFor="invite-role"
                className="mt-2 sm:col-start-2 sm:row-start-1 sm:mt-0"
              >
                Role
              </Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as "manager" | "staff")}
                disabled={!canInvite}
              >
                <SelectTrigger
                  id="invite-role"
                  className="sm:col-start-2 sm:row-start-2"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  {data.myRole === "owner" && (
                    <SelectItem value="manager">Manager</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Button
                type="submit"
                disabled={!canInvite || inviting || !inviteEmail.trim()}
                className="mt-2 cursor-pointer bg-amber-700 hover:bg-amber-800 sm:col-start-3 sm:row-start-2 sm:mt-0"
              >
                {inviting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 size-4" />
                )}
                Send invite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-muted-foreground" />
            Members
            <span className="text-muted-foreground">
              ({data.members.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border border-t border-border">
            {data.members.map((m) => {
              const isOwner = m.role === "owner";
              const viewerRoleHere = data.aggregate
                ? roleOn(m.shop._id)
                : data.myRole;
              const canEditRow =
                viewerRoleHere === "owner" || viewerRoleHere === "manager";
              return (
                <div key={m._id} className="flex items-center gap-3 px-6 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-300">
                    {initials(m.user.name, m.user.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.user.name || "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.user.email}
                      {data.aggregate && ` · ${m.shop.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isOwner ? (
                      <RoleBadge role="owner" />
                    ) : viewerRoleHere === "owner" ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) =>
                          changeRole(m._id, v as "manager" | "staff")
                        }
                        disabled={busyId === m._id}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                    {!isOwner && canEditRow ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busyId === m._id}
                        onClick={() =>
                          removeMember(m._id, m.user.name || m.user.email)
                        }
                        aria-label="Remove member"
                        className="size-8 cursor-pointer text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : (
                      <span className="w-8" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending invites */}
      {data.invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-muted-foreground" />
              Pending invites
              <span className="text-muted-foreground">
                ({data.invites.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border border-t border-border">
              {data.invites.map((inv) => {
                const canEdit = data.aggregate
                  ? canManageShop(inv.shop._id)
                  : canManage;
                return (
                  <div
                    key={inv._id}
                    className="flex items-center gap-3 px-6 py-3"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                      <Mail className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {inv.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Invited by {inv.invitedBy.name || inv.invitedBy.email}
                        {data.aggregate && ` · ${inv.shop.name}`} ·{" "}
                        {expiresLabel(inv.expiresAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RoleBadge role={inv.role} />
                      {canEdit ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={busyId === inv._id}
                          onClick={() => revokeInvite(inv._id)}
                          aria-label="Revoke invite"
                          className="size-8 cursor-pointer text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : (
                        <span className="w-8" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
