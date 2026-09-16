"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CustomerRow {
  shopId: string | null;
  // "stampystamp" for a legacy StampyStamp merchant billed from the stampy db.
  legacy: "stampystamp" | null;
  shopName: string;
  ownerEmail: string;
  ownerName: string;
  provider: "stripe" | "paypal";
  status: string;
  cancelAtPeriodEnd: boolean;
  planSlug: string;
  planLabel: string;
  interval: "month" | "year";
  priceCents: number;
  currency: string;
  monthlyCents: number;
  startedAt: string | null;
  lastPaidAt: string | null;
  nextBillAt: string | null;
  endsAt: string | null;
  timesBilled: number;
  failedCharges: number;
  totalPaid: Record<string, number>;
  refundedCents: number;
  card: { brand?: string; last4?: string; expiry?: string } | null;
  migration: "migrated" | "awaiting_card" | "not_sent" | "n/a";
  migrationEmailedAt: string | null;
  migratedAt: string | null;
  failedAttempts: number;
  nextAttemptAt: string | null;
}

type SortKey = "shopName" | "plan" | "price" | "startedAt" | "nextBillAt" | "timesBilled" | "total" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "active" | "canceled";

const PLAN_BADGE: Record<string, string> = {
  pro: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  plus: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  max: "border-violet-500/30 bg-violet-500/15 text-violet-300",
  stampy: "border-orange-500/30 bg-orange-500/15 text-orange-300",
};

const sym = (cur: string) => (cur === "aud" ? "A$" : cur === "usd" ? "US$" : cur.toUpperCase() + " ");
const money = (cents: number, cur: string) => `${sym(cur)}${(cents / 100).toFixed(2)}`;
// Headline tiles: whole dollars read faster; the table keeps cents.
const moneyWhole = (cents: number, cur: string) => `${sym(cur)}${Math.round(cents / 100).toLocaleString()}`;
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" }) : "—";
const daysUntil = (d: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000) : null);

// Sum a per-currency map at par for sorting/headline only (the cell shows
// the real split).
const atPar = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);
function totalLabel(m: Record<string, number>, whole = false) {
  const parts = Object.entries(m).sort().map(([c, v]) => (whole ? moneyWhole : money)(v, c));
  return parts.length ? parts.join(" + ") : "—";
}

export default function CustomersClient() {
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("nextBillAt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filter, setFilter] = useState<StatusFilter>("active");

  function load() {
    setLoading(true);
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => setRows(d.customers ?? []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const visible = useMemo(() => {
    if (!rows) return [];
    const f = rows.filter((r) =>
      filter === "all" ? true : filter === "active" ? ["active", "past_due"].includes(r.status) : !["active", "past_due"].includes(r.status)
    );
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (r: CustomerRow): number | string => {
      switch (sortKey) {
        case "shopName": return r.shopName.toLowerCase();
        case "plan": return r.monthlyCents;
        case "price": return r.monthlyCents;
        case "startedAt": return r.startedAt ? new Date(r.startedAt).getTime() : 0;
        case "nextBillAt": return r.nextBillAt ? new Date(r.nextBillAt).getTime() : Number.MAX_SAFE_INTEGER;
        case "timesBilled": return r.timesBilled;
        case "total": return atPar(r.totalPaid);
        case "status": return r.status;
      }
    };
    return [...f].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [rows, sortKey, sortDir, filter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "shopName" || key === "nextBillAt" ? "asc" : "desc");
    }
  }

  // Headline tiles over the visible (filtered) set.
  const summary = useMemo(() => {
    const live = (rows ?? []).filter((r) => ["active", "past_due"].includes(r.status));
    const mrr: Record<string, number> = {};
    const collected: Record<string, number> = {};
    for (const r of live) mrr[r.currency] = (mrr[r.currency] ?? 0) + r.monthlyCents;
    for (const r of rows ?? []) for (const [c, v] of Object.entries(r.totalPaid)) collected[c] = (collected[c] ?? 0) + v;
    const dueSoon = live.filter((r) => { const d = daysUntil(r.nextBillAt); return d != null && d <= 7; }).length;
    const onPaypal = live.filter((r) => r.provider === "paypal").length;
    const stampy = live.filter((r) => r.legacy === "stampystamp").length;
    return { live: live.length, mrr, collected, dueSoon, onPaypal, stampy };
  }, [rows]);

  if (loading && !rows) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Every shop that has held a paid plan — from the billing ledger, both providers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
            {(["active", "canceled", "all"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`cursor-pointer rounded px-3 py-1 capitalize transition ${filter === f ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="cursor-pointer">
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Paying now" value={String(summary.live)} sub={`${summary.onPaypal} on PayPal · ${summary.live - summary.onPaypal} on Stripe${summary.stampy ? ` · ${summary.stampy} legacy StampyStamp` : ""}`} />
        <Tile label="MRR" value={totalLabel(summary.mrr, true)} sub="at current prices" />
        <Tile label="Collected all-time" value={totalLabel(summary.collected, true)} sub="gross of refunds" />
        <Tile label="Renewing in 7 days" value={String(summary.dueSoon)} sub="next charge within a week" />
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead label="Shop / owner" k="shopName" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHead label="Plan" k="plan" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHead label="Price" k="price" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-right" />
                <TableHead>Provider</TableHead>
                <SortHead label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHead label="Started" k="startedAt" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHead label="Next bill" k="nextBillAt" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHead label="Billed" k="timesBilled" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-right" />
                <SortHead label="Total paid" k="total" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-right" />
                <TableHead>Migration</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-sm text-muted-foreground">
                    No customers match this filter.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((r) => {
                const days = daysUntil(r.nextBillAt);
                return (
                  <TableRow key={r.shopId ?? `stampy:${r.ownerEmail}`}>
                    <TableCell>
                      <div className="font-medium text-foreground">{r.shopName}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {r.legacy === "stampystamp" && (
                          <span className="rounded bg-orange-500/15 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-orange-300">legacy</span>
                        )}
                        {r.ownerEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={PLAN_BADGE[r.planSlug] ?? ""}>{r.planLabel}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="text-foreground">{money(r.priceCents, r.currency)}<span className="text-xs text-muted-foreground">/{r.interval === "year" ? "yr" : "mo"}</span></div>
                      {r.interval === "year" && <div className="text-xs text-muted-foreground">{money(r.monthlyCents, r.currency)}/mo</div>}
                    </TableCell>
                    <TableCell>
                      <div className="capitalize text-foreground">{r.provider}</div>
                      {r.card && <div className="text-xs text-muted-foreground">{r.card.brand?.toLowerCase()} •••• {r.card.last4}</div>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} cancelAtPeriodEnd={r.cancelAtPeriodEnd} />
                      {r.status === "past_due" && r.nextAttemptAt && (
                        <div className="mt-0.5 text-xs text-muted-foreground">retry {fmtDate(r.nextAttemptAt)} · attempt {r.failedAttempts}</div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(r.startedAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.nextBillAt ? (
                        <>
                          <div className={days != null && days <= 7 ? "text-amber-400" : "text-foreground"}>{fmtDate(r.nextBillAt)}</div>
                          <div className="text-xs text-muted-foreground">{days != null && days >= 0 ? `in ${days}d` : days != null ? `${-days}d overdue` : ""}</div>
                        </>
                      ) : r.endsAt ? (
                        <>
                          <div className="text-amber-400">ends {fmtDate(r.endsAt)}</div>
                          <div className="text-xs text-muted-foreground">cancel scheduled</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-foreground">{r.timesBilled}</div>
                      {r.failedCharges > 0 && <div className="text-xs text-red-400">{r.failedCharges} failed</div>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="text-foreground">{totalLabel(r.totalPaid)}</div>
                      {r.refundedCents > 0 && <div className="text-xs text-muted-foreground">−{(r.refundedCents / 100).toFixed(2)} refunded</div>}
                      {r.lastPaidAt && <div className="text-xs text-muted-foreground">last {fmtDate(r.lastPaidAt)}</div>}
                    </TableCell>
                    <TableCell>
                      <MigrationBadge state={r.migration} />
                      {r.migration === "awaiting_card" && r.migrationEmailedAt && (
                        <div className="mt-0.5 text-xs text-muted-foreground">emailed {fmtDate(r.migrationEmailedAt)}</div>
                      )}
                      {r.migration === "migrated" && r.migratedAt && (
                        <div className="mt-0.5 text-xs text-muted-foreground">card saved {fmtDate(r.migratedAt)}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.shopId && (
                        <Link href={`/dashboard/admin/shops/${r.shopId}`} className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
                          Shop <ChevronRight className="size-3.5" />
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function SortHead({
  label, k, sortKey, sortDir, onClick, className = "",
}: { label: string; k: SortKey; sortKey: SortKey; sortDir: SortDir; onClick: (k: SortKey) => void; className?: string }) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button type="button" onClick={() => onClick(k)} className={`inline-flex cursor-pointer items-center gap-1 ${active ? "text-foreground" : ""}`}>
        {label} <Icon className="size-3 opacity-60" />
      </button>
    </TableHead>
  );
}

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd: boolean }) {
  const cls =
    status === "active" && !cancelAtPeriodEnd ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
    : status === "active" ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
    : status === "past_due" ? "border-red-500/30 bg-red-500/15 text-red-300"
    : "border-border text-muted-foreground";
  const label = status === "active" && cancelAtPeriodEnd ? "cancelling" : status.replace("_", " ");
  return <Badge variant="outline" className={cls}>{label}</Badge>;
}

// Stripe → PayPal migration state: email not sent → sent, waiting for the
// customer to save a card → done. PayPal-native subs have nothing to migrate.
function MigrationBadge({ state }: { state: CustomerRow["migration"] }) {
  if (state === "n/a") return <span className="text-xs text-muted-foreground">on PayPal</span>;
  const [cls, label] =
    state === "migrated" ? ["border-emerald-500/30 bg-emerald-500/15 text-emerald-300", "migrated"]
    : state === "awaiting_card" ? ["border-amber-500/30 bg-amber-500/15 text-amber-300", "awaiting card"]
    : ["border-border text-muted-foreground", "email not sent"];
  return <Badge variant="outline" className={cls}>{label}</Badge>;
}
