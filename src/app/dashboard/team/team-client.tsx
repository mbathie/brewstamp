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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Mail,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Lock,
} from "lucide-react";

interface Member {
  _id: string;
  role: "owner" | "manager" | "staff";
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
  myRole: "owner" | "manager" | "staff" | null;
  myRolesByShop: Record<string, "owner" | "manager" | "staff">;
  plan: { slug: string; label: string; hasStaffLogins: boolean };
  members: Member[];
  invites: Invite[];
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

  // Helpers for per-row permissions. In aggregate mode the viewer might
  // be owner on Shop A and staff on Shop B — actions are scoped to the
  // viewer's role on each member's specific shop.
  function roleOn(shopId: string) {
    return data!.myRolesByShop[shopId] || null;
  }
  function canManageShop(shopId: string) {
    const r = roleOn(shopId);
    return r === "owner" || r === "manager";
  }
  const canManage = data.aggregate
    ? Object.values(data.myRolesByShop).some(
        (r) => r === "owner" || r === "manager"
      )
    : data.myRole === "owner" || data.myRole === "manager";
  // Invites are scoped to a single shop — only show the form in single mode.
  const canInvite =
    !data.aggregate &&
    (data.myRole === "owner" || data.myRole === "manager") &&
    data.plan.hasStaffLogins;

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

  return (
    <div className="space-y-6">
      {/* Plan gate banner */}
      {!data.plan.hasStaffLogins && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <Lock className="mt-0.5 size-5 shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Team logins are a Plus &amp; Max feature
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;re on the {data.plan.label} plan. Upgrade to Plus
                or Max to invite unlimited managers and staff who can
                accept stamps on the counter.
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
              Viewing every member across your shops. To invite new team
              members or change roles, switch to a specific shop from the
              top bar — invites are scoped per shop.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invite form */}
      {!data.aggregate && data.shop && canInvite !== undefined && (data.myRole === "owner" || data.myRole === "manager") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite to {data.shop.name}</CardTitle>
            <CardDescription>
              They&apos;ll get an email with a link to set up their login.
              Invites expire in 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleInvite}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={!canInvite}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "manager" | "staff")
                  }
                  disabled={!canInvite}
                  className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                >
                  <option value="staff">Staff</option>
                  {data.myRole === "owner" && (
                    <option value="manager">Manager</option>
                  )}
                </select>
              </div>
              <Button
                type="submit"
                disabled={!canInvite || inviting || !inviteEmail.trim()}
                className="cursor-pointer bg-amber-700 hover:bg-amber-800"
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

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Members ({data.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                {data.aggregate && <TableHead>Shop</TableHead>}
                <TableHead>Role</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.members.map((m) => {
                const isOwner = m.role === "owner";
                const viewerRoleHere = data.aggregate
                  ? roleOn(m.shop._id)
                  : data.myRole;
                const canEditRow =
                  viewerRoleHere === "owner" || viewerRoleHere === "manager";
                return (
                  <TableRow key={m._id}>
                    <TableCell>
                      <span className="font-medium">
                        {m.user.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.user.email}
                    </TableCell>
                    {data.aggregate && (
                      <TableCell className="text-sm text-muted-foreground">
                        {m.shop.name}
                      </TableCell>
                    )}
                    <TableCell>
                      {isOwner ? (
                        <Badge className="bg-amber-500/20 text-amber-300">
                          <ShieldCheck className="mr-1 size-3" />
                          Owner
                        </Badge>
                      ) : canEditRow && viewerRoleHere === "owner" ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            changeRole(m._id, e.target.value as "manager" | "staff")
                          }
                          disabled={busyId === m._id}
                          className="h-8 w-32 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                        </select>
                      ) : (
                        <Badge variant="outline" className="capitalize">
                          {m.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isOwner && canEditRow && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === m._id}
                          onClick={() =>
                            removeMember(m._id, m.user.name || m.user.email)
                          }
                          className="cursor-pointer text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending invites */}
      {data.invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pending invites ({data.invites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  {data.aggregate && <TableHead>Shop</TableHead>}
                  <TableHead>Role</TableHead>
                  <TableHead>Invited by</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invites.map((inv) => {
                  const canEdit = data.aggregate
                    ? canManageShop(inv.shop._id)
                    : canManage;
                  return (
                    <TableRow key={inv._id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      {data.aggregate && (
                        <TableCell className="text-sm text-muted-foreground">
                          {inv.shop.name}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {inv.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.invitedBy.name || inv.invitedBy.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.expiresAt).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyId === inv._id}
                            onClick={() => revokeInvite(inv._id)}
                            className="cursor-pointer text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
