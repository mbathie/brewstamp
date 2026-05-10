"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ChevronDown, ChevronUp, X } from "lucide-react";
import StampDisplay from "@/components/stamp-display";
import MerchantCheckin from "@/components/merchant-checkin";
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
  customerEmail?: string | null;
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
  threshold: number;
  memberSince: string;
  lastVisit: string | null;
  visitsLast30d: number;
  weeklyVisits: number[]; // last 12 weeks
  history: HistoryRow[];
  initialNotes: string;
  initialTags: string[];
}

const PAGE_SIZE = 10;

export default function CustomerDetailContent({
  shopId,
  customerId,
  customerName,
  customerEmail,
  stamps,
  totalEarned,
  freeRedeemed,
  threshold,
  memberSince,
  lastVisit,
  visitsLast30d,
  weeklyVisits,
  history,
  initialNotes,
  initialTags,
}: Props) {
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [page, setPage] = useState(0);
  const [notes, setNotes] = useState(initialNotes);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);

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

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const pagedHistory = useMemo(() => {
    return history.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [history, page]);

  function formatHistoryTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    const sameYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      ...(sameYear ? {} : { year: "2-digit" }),
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function relativeDay(iso: string | null) {
    if (!iso) return "Never";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;
    if (diffDay < 365) return `${Math.floor(diffDay / 30)}mo ago`;
    return `${Math.floor(diffDay / 365)}y ago`;
  }

  function memberDuration(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.max(1, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
    if (diffDays < 30) return `${diffDays}d`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`;
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return months > 0 ? `${years}y ${months}mo` : `${years}y`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/customers"
            className="mt-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{customerName}</h1>
            {customerEmail && (
              <a
                href={`mailto:${customerEmail}`}
                className="text-sm text-muted-foreground hover:text-amber-700 hover:underline"
              >
                {customerEmail}
              </a>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="font-normal" suppressHydrationWarning>
                Last visit · {relativeDay(lastVisit)}
              </Badge>
              <Badge variant="outline" className="font-normal">
                {visitsLast30d} visit{visitsLast30d === 1 ? "" : "s"} · last 30d
              </Badge>
              <Badge variant="outline" className="font-normal" suppressHydrationWarning>
                Member · {memberDuration(memberSince)}
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
        <MerchantCheckin
          shopId={shopId}
          customerId={customerId}
          customerName={customerName}
          stamps={stamps}
          threshold={threshold}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Loyalty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {stamps} of {threshold} stamps
              </span>
              <span className="text-muted-foreground">
                {canRedeem
                  ? "Free drink earned"
                  : `${threshold - stamps} to go`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${canRedeem ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(100, (stamps / threshold) * 100)}%` }}
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
                free drink{freeRedeemed === 1 ? "" : "s"} redeemed
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
        </CardContent>
      </Card>

      {weeklyVisits.length > 0 && weeklyVisits.some((v) => v > 0) && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Visit cadence</CardTitle>
            <p className="text-xs text-muted-foreground">Last 12 weeks</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5">
              {weeklyVisits.map((v, i) => {
                const max = Math.max(...weeklyVisits, 1);
                const pct = (v / max) * 100;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-16 w-full items-end">
                      <div
                        className={`w-full rounded-sm transition-colors ${
                          v > 0 ? "bg-amber-500" : "bg-muted"
                        }`}
                        style={{ height: v > 0 ? `${Math.max(8, pct)}%` : "4px" }}
                        title={`${v} visit${v === 1 ? "" : "s"}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {i === weeklyVisits.length - 1 ? "now" : `${weeklyVisits.length - 1 - i}w`}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                placeholder={tags.length === 0 ? "Add tags (e.g. VIP, regular)" : "Add another"}
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
                          {req.redeem && (
                            <Badge
                              variant="outline"
                              className="mr-2 border-amber-500/50 font-normal text-amber-500"
                            >
                              Redeem
                            </Badge>
                          )}
                          <span suppressHydrationWarning>
                            {formatHistoryTime(req.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {req.status === "approved" ? (
                            req.redeem && awarded === 0 ? (
                              <span className="text-muted-foreground">-{threshold}</span>
                            ) : req.redeem && awarded > 0 ? (
                              <span>
                                <span className="text-muted-foreground">-{threshold}</span>{" "}
                                <span className="text-amber-500">+{awarded}</span>
                              </span>
                            ) : (
                              <span className="text-amber-500">+{awarded}</span>
                            )
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              req.status === "approved"
                                ? "border-green-500/50 text-green-500"
                                : "border-red-400/50 text-red-400"
                            }
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {history.length > PAGE_SIZE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {page * PAGE_SIZE + 1}–
                    {Math.min((page + 1) * PAGE_SIZE, history.length)} of{" "}
                    {history.length}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="cursor-pointer disabled:opacity-50"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="cursor-pointer disabled:opacity-50"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

