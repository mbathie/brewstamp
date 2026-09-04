"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VisitCadence, { type CadenceDay } from "@/components/visit-cadence";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pager } from "@/components/ui/pager";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ChevronDown, ChevronUp, X, Pencil, Ban } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import StampDisplay from "@/components/stamp-display";
import MerchantCheckin from "@/components/merchant-checkin";
import { getProgram } from "@/lib/program";
import { ActivityValue } from "@/components/activity-value";
import { avatarTint, initialsOf } from "@/lib/avatar";
import { timeAgo, shortDateTime, membershipDuration } from "@/lib/date";
import { toast } from "sonner";

interface HistoryRow {
  id: string;
  createdAt: string;
  status: "approved" | "rejected";
  stampsAwarded: number;
  redeem: boolean;
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
  backHref = "/dashboard/customers",
}: Props) {
  const [showCardPreview, setShowCardPreview] = useState(false);
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link
            href={backHref}
            className="mt-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {/* Monogram — same colour this customer carries in the list, so the
              detail page reads as "the same person" at a glance. */}
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              disabled ? "bg-muted text-muted-foreground" : avatarTint(displayName)
            }`}
          >
            {initialsOf(displayName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">
                {displayName}
              </h1>
              {!readOnly && (
                <button
                  type="button"
                  onClick={openEdit}
                  aria-label="Edit customer"
                  className="cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {disabled && (
                <Badge
                  variant="outline"
                  className="border-red-500/40 font-normal text-red-400"
                >
                  Disabled
                </Badge>
              )}
            </div>
            {email && (
              <a
                href={`mailto:${email}`}
                className="text-sm text-muted-foreground hover:text-amber-700 hover:underline"
              >
                {email}
              </a>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge
                variant="outline"
                className="font-normal"
                suppressHydrationWarning
              >
                Last visit · {timeAgo(lastVisit)}
              </Badge>
              <Badge variant="outline" className="font-normal">
                {visitsLast30d} visit{visitsLast30d === 1 ? "" : "s"} · last 30d
              </Badge>
              <Badge
                variant="outline"
                className="font-normal"
                suppressHydrationWarning
              >
                Member · {membershipDuration(memberSince)}
              </Badge>
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
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {readOnly ? (
            disabled && (
              <Badge
                variant="outline"
                className="border-red-500/40 px-3 py-1.5 font-normal text-red-400"
              >
                Disabled — can&apos;t earn or claim
              </Badge>
            )
          ) : disabled ? (
            <>
              <Badge
                variant="outline"
                className="border-red-500/40 px-3 py-1.5 font-normal text-red-400"
              >
                Disabled — can&apos;t earn or claim
              </Badge>
              <Button
                variant="outline"
                onClick={toggleDisabled}
                disabled={togglingDisabled}
                className="cursor-pointer"
              >
                {togglingDisabled ? "…" : "Enable customer"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={toggleDisabled}
                disabled={togglingDisabled}
                className="cursor-pointer border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-400"
              >
                <Ban className="mr-1.5 size-4" />
                {togglingDisabled ? "…" : "Disable"}
              </Button>
              <MerchantCheckin
                shopId={shopId}
                customerId={customerId}
                customerName={displayName}
                stamps={stamps}
                threshold={threshold}
              />
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{program.detailTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {perkMode ? (
            // Perk customers earn no stamps — the meaningful number is how many
            // free coffees they've redeemed (the reimbursement figure).
            <div className="space-y-2 text-sm text-foreground">
              <div>
                <strong className="text-2xl font-bold">{freeRedeemed}</strong>{" "}
                <span className="text-muted-foreground">
                  {freeRedeemed === 1 ? program.unit : program.unitPlural}{" "}
                  redeemed
                </span>
              </div>
              {perkVerifications >= 2 && (
                <p className="text-xs text-muted-foreground">
                  Email verified{" "}
                  <strong className="text-foreground">{perkVerifications}</strong>{" "}
                  times — their phone isn&apos;t keeping the cookie between
                  scans, so they&apos;re re-entering the code.
                </p>
              )}
            </div>
          ) : (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {stamps} of {threshold} stamps
                  </span>
                  <span className="text-muted-foreground">
                    {canRedeem
                      ? "Reward earned"
                      : `${threshold - stamps} to go`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${canRedeem ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{
                      width: `${Math.min(100, (stamps / threshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="text-foreground">
                  <strong className="font-semibold">{totalEarned}</strong>{" "}
                  <span className="text-muted-foreground">lifetime stamps</span>
                </span>
                <span className="text-foreground">
                  <strong className="font-semibold">{freeRedeemed}</strong>{" "}
                  <span className="text-muted-foreground">
                    reward{freeRedeemed === 1 ? "" : "s"} redeemed
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowCardPreview((v) => !v)}
                className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {showCardPreview ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {showCardPreview ? "Hide card preview" : "Show card preview"}
              </button>
              {showCardPreview && (
                <div className="mx-auto max-w-xs pt-2">
                  <StampDisplay stamps={stamps} threshold={threshold} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {cadence.length > 0 && (
        <VisitCadence cadence={cadence} perkMode={perkMode} />
      )}

      {readOnly ? (
        (tags.length > 0 || notes.trim()) && (
          <Card>
            <CardHeader className="pb-3">
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
                <p className="whitespace-pre-wrap text-sm text-foreground">{notes}</p>
              )}
            </CardContent>
          </Card>
        )
      ) : (
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Notes &amp; tags</CardTitle>
          {savingNotes && (
            <p className="text-xs text-muted-foreground">Saving…</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Tags</p>
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
                placeholder={
                  tags.length === 0
                    ? "Add tags (e.g. VIP, regular)"
                    : "Add another"
                }
                className="h-7 w-40 text-xs"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">Notes</p>
            <Textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesDirty(true);
              }}
              placeholder="Allergies, preferences, anything worth remembering…"
              className="min-h-[80px] text-sm"
              maxLength={2000}
            />
          </div>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Stamps</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedHistory.map((req) => {
                    const awarded = req.stampsAwarded || 0;
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="text-muted-foreground">
                          {req.redeem && !perkMode && (
                            <Badge
                              variant="outline"
                              className="mr-2 border-amber-500/50 font-normal text-amber-500"
                            >
                              Redeem
                            </Badge>
                          )}
                          <span suppressHydrationWarning>
                            {shortDateTime(req.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ActivityValue
                            status={req.status}
                            redeem={req.redeem}
                            stampsAwarded={awarded}
                            threshold={threshold}
                            program={program}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <StatusBadge status={req.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
