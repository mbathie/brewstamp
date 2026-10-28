"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Loader2, RefreshCw, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { planBadgeClass } from "../shops/shops-table";

interface CustomerRow {
  shopId: string | null;
  // "stampystamp" for a legacy StampyStamp merchant billed from the stampy db.
  legacy: "stampystamp" | null;
  shopName: string;
  ownerEmail: string;
  ownerName: string;
  provider: "stripe" | "paypal";
  // Which Stripe account: Brewstamp's own ("main") or the old shared one.
  stripeAccount: "main" | "legacy" | null;
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

type SortKey = "shopName" | "price" | "nextBillAt" | "total" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = "active" | "attention" | "canceled" | "all";
type ProductFilter = "all" | "brewstamp" | "stampystamp";
type BillingFilter = "all" | "stripe_main" | "stripe_legacy" | "paypal";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Paying" },
  { value: "attention", label: "Needs attention" },
  { value: "canceled", label: "Canceled" },
  { value: "all", label: "All" },
];
const PRODUCT_FILTERS: { value: ProductFilter; label: string }[] = [
  { value: "all", label: "All products" },
  { value: "brewstamp", label: "Brewstamp" },
  { value: "stampystamp", label: "StampyStamp" },
];
const BILLING_LABELS: Record<BillingFilter, string> = {
  all: "All billing",
  stripe_main: "Stripe · Brewstamp",
  stripe_legacy: "Stripe · old shared",
  paypal: "PayPal",
};

const STAMPY_BADGE = "border-orange-500/30 bg-orange-500/15 text-orange-300";

const sym = (cur: string) => (cur === "aud" ? "A$" : cur === "usd" ? "US$" : cur.toUpperCase() + " ");
const money = (cents: number, cur: string) => `${sym(cur)}${(cents / 100).toFixed(2)}`;
// Headline tiles: whole dollars read faster; the table keeps cents.
const moneyWhole = (cents: number, cur: string) => `${sym(cur)}${Math.round(cents / 100).toLocaleString()}`;
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" }) : "—";
const daysUntil = (d: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000) : null);

const isLive = (r: CustomerRow) => ["active", "past_due"].includes(r.status);
const billingOf = (r: CustomerRow): Exclude<BillingFilter, "all"> =>
  r.provider === "paypal" ? "paypal" : r.stripeAccount === "main" ? "stripe_main" : "stripe_legacy";

// Why a live customer needs a look, or null. Past due (a charge failed),
// overdue (the renewal date passed with no charge recorded — usually a sub
// billed outside our cron), or cancelling at the end of the period.
function attentionReason(r: CustomerRow): string | null {
  if (!isLive(r)) return null;
  if (r.status === "past_due") return "payment failed";
  const d = daysUntil(r.nextBillAt);
  if (d != null && d < 0) return `${-d}d overdue`;
  if (r.cancelAtPeriodEnd) return "cancelling";
  return null;
}

// Sum a per-currency map at par for sorting only (cells show the real split).
const atPar = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);
function totalLabel(m: Record<string, number>, whole = false) {
  const parts = Object.entries(m).sort().map(([c, v]) => (whole ? moneyWhole : money)(v, c));
  return parts.length ? parts.join(" + ") : "—";
}
function addTo(m: Record<string, number>, cur: string, cents: number) {
  m[cur] = (m[cur] ?? 0) + cents;
}

export default function CustomersClient() {
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("nextBillAt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [product, setProduct] = useState<ProductFilter>("all");
  const [billing, setBilling] = useState<BillingFilter>("all");
  const [query, setQuery] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => setRows(d.customers ?? []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  // The product filter scopes everything, the tiles included; status, billing
  // and search narrow the table only.
  const inProduct = useMemo(
    () =>
      (rows ?? []).filter((r) =>
        product === "all" ? true : product === "stampystamp" ? r.legacy === "stampystamp" : r.legacy !== "stampystamp",
      ),
    [rows, product],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = inProduct.filter((r) => {
      if (status === "active" && !isLive(r)) return false;
      if (status === "canceled" && isLive(r)) return false;
      if (status === "attention" && !attentionReason(r)) return false;
      if (billing !== "all" && billingOf(r) !== billing) return false;
      if (q && ![r.shopName, r.ownerEmail, r.ownerName].some((s) => s?.toLowerCase().includes(q))) return false;
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (r: CustomerRow): number | string => {
      switch (sortKey) {
        case "shopName": return r.shopName.toLowerCase();
        case "price": return r.monthlyCents;
        case "nextBillAt": return r.nextBillAt ? new Date(r.nextBillAt).getTime() : Number.MAX_SAFE_INTEGER;
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
  }, [inProduct, status, billing, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "shopName" || key === "nextBillAt" ? "asc" : "desc");
    }
  }

  const summary = useMemo(() => {
    const live = inProduct.filter(isLive);
    const mrr: Record<string, number> = {};
    const collected: Record<string, number> = {};
    const thisMonth: Record<string, number> = {};
    for (const r of live) addTo(mrr, r.currency, r.monthlyCents);
    for (const r of inProduct) for (const [c, v] of Object.entries(r.totalPaid)) addTo(collected, c, v);
    // What the next 30 days should bring in: each live, non-cancelling sub
    // whose next charge falls inside the window, at its full price.
    for (const r of live) {
      const d = daysUntil(r.nextBillAt);
      if (d != null && d >= 0 && d <= 30) addTo(thisMonth, r.currency, r.priceCents);
    }
    const byBilling = { stripe_main: 0, stripe_legacy: 0, paypal: 0 };
    for (const r of live) byBilling[billingOf(r)]++;
    const attention = live.filter((r) => attentionReason(r));
    return {
      live: live.length,
      annual: live.filter((r) => r.interval === "year").length,
      mrr,
      collected,
      thisMonth,
      byBilling,
      attention: attention.length,
      pastDue: attention.filter((r) => r.status === "past_due").length,
      overdue: attention.filter((r) => r.status !== "past_due" && (daysUntil(r.nextBillAt) ?? 0) < 0).length,
      cancelling: attention.filter((r) => r.cancelAtPeriodEnd).length,
      productCounts: {
        all: (rows ?? []).filter(isLive).length,
        brewstamp: (rows ?? []).filter((r) => isLive(r) && r.legacy !== "stampystamp").length,
        stampystamp: (rows ?? []).filter((r) => isLive(r) && r.legacy === "stampystamp").length,
      },
    };
  }, [inProduct, rows]);

  const filtered = status !== "active" || billing !== "all" || query.trim() !== "";
  function clearFilters() {
    setStatus("active");
    setBilling("all");
    setQuery("");
  }

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
        <PageHeader title="Customers" description="Every paid plan, from the billing ledger: Brewstamp and legacy StampyStamp, Stripe and PayPal." />
        <div className="flex items-center gap-2">
          <Segmented
            value={product}
            onChange={setProduct}
            options={PRODUCT_FILTERS.map((p) => ({ ...p, count: summary.productCounts[p.value] }))}
          />
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="cursor-pointer" aria-label="Refresh">
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Paying now"
          value={String(summary.live)}
          sub={[
            summary.byBilling.stripe_main && `${summary.byBilling.stripe_main} Stripe`,
            summary.byBilling.stripe_legacy && `${summary.byBilling.stripe_legacy} old Stripe`,
            summary.byBilling.paypal && `${summary.byBilling.paypal} PayPal`,
          ].filter(Boolean).join(" · ") || "none"}
        />
        <Tile
          label="MRR"
          value={totalLabel(summary.mrr, true)}
          sub={`${summary.annual} annual, counted monthly`}
        />
        <Tile
          label="Due in 30 days"
          value={totalLabel(summary.thisMonth, true)}
          sub={`collected all-time ${totalLabel(summary.collected, true)}`}
        />
        <Tile
          label="Needs attention"
          value={String(summary.attention)}
          tone={summary.attention ? "warn" : undefined}
          sub={
            summary.attention
              ? [
                  summary.pastDue && `${summary.pastDue} past due`,
                  summary.overdue && `${summary.overdue} overdue`,
                  summary.cancelling && `${summary.cancelling} cancelling`,
                ].filter(Boolean).join(" · ")
              : "all renewing normally"
          }
          onClick={summary.attention ? () => setStatus("attention") : undefined}
          active={status === "attention"}
        />
      </div>

      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-48 flex-1 sm:max-w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Shop, owner or email"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Segmented value={status} onChange={setStatus} options={STATUS_FILTERS} />
          <Select value={billing} onValueChange={(v) => setBilling(v as BillingFilter)}>
            <SelectTrigger className="h-8 w-auto cursor-pointer text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(BILLING_LABELS) as BillingFilter[]).map((k) => (
                <SelectItem key={k} value={k} className="cursor-pointer text-xs">
                  {BILLING_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            {visible.length} {visible.length === 1 ? "customer" : "customers"}
            {filtered && (
              <button type="button" onClick={clearFilters} className="inline-flex cursor-pointer items-center gap-0.5 hover:text-foreground">
                <X className="size-3" /> Clear
              </button>
            )}
          </div>
        </div>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortHead label="Customer" k="shopName" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="pl-4" />
                <SortHead label="Plan" k="price" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <TableHead className="hidden md:table-cell">Billing</TableHead>
                <SortHead label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHead label="Next charge" k="nextBillAt" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHead label="Lifetime" k="total" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="hidden pr-4 text-right lg:table-cell" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No customers match these filters.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((r) => {
                const days = daysUntil(r.nextBillAt);
                const attention = attentionReason(r);
                const stampy = r.legacy === "stampystamp";
                return (
                  <TableRow key={r.shopId ?? `stampy:${r.ownerEmail}`} className={isLive(r) ? "" : "opacity-60"}>
                    <TableCell className="max-w-64 pl-4">
                      <div className="flex items-center gap-1.5">
                        {r.shopId ? (
                          <Link href={`/dashboard/admin/shops/${r.shopId}`} className="truncate font-medium text-foreground hover:underline">
                            {r.shopName}
                          </Link>
                        ) : (
                          <span className="truncate font-medium text-foreground">{r.shopName}</span>
                        )}
                        {stampy && (
                          <span className="shrink-0 rounded bg-orange-500/15 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-orange-300">
                            Stampy
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{r.ownerEmail}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={stampy ? STAMPY_BADGE : planBadgeClass(r.planSlug)}>
                        {r.planLabel.replace(/^StampyStamp /, "")}
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span className="text-foreground">{money(r.priceCents, r.currency)}</span>/{r.interval === "year" ? "yr" : "mo"}
                        {r.interval === "year" && ` · ${money(r.monthlyCents, r.currency)}/mo`}
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap md:table-cell">
                      <div className="text-sm text-foreground">
                        {r.provider === "paypal" ? "PayPal" : "Stripe"}
                        {r.provider === "stripe" && (
                          <span className={`ml-1.5 text-xs ${r.stripeAccount === "main" ? "text-emerald-400" : "text-muted-foreground"}`}>
                            {r.stripeAccount === "main" ? "Brewstamp" : "old shared"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.card ? `${r.card.brand?.toLowerCase() ?? "card"} •••• ${r.card.last4}` : r.provider === "paypal" ? "no card saved" : ""}
                        {r.migration === "awaiting_card" && (
                          <span className="text-amber-400"> · move emailed {fmtDate(r.migrationEmailedAt)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={r.status} cancelAtPeriodEnd={r.cancelAtPeriodEnd} />
                      {r.status === "past_due" && r.nextAttemptAt && (
                        <div className="mt-1 text-xs text-muted-foreground">retry {fmtDate(r.nextAttemptAt)} · try {r.failedAttempts}</div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.nextBillAt ? (
                        <>
                          <div className={days != null && days < 0 ? "text-red-400" : days != null && days <= 7 ? "text-amber-400" : "text-foreground"}>
                            {fmtDate(r.nextBillAt)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {attention && attention.endsWith("overdue") && <AlertTriangle className="size-3 text-red-400" />}
                            {days != null && days >= 0 ? (days === 0 ? "today" : `in ${days}d`) : `${-(days ?? 0)}d overdue`}
                          </div>
                        </>
                      ) : r.endsAt ? (
                        <>
                          <div className="text-amber-400">ends {fmtDate(r.endsAt)}</div>
                          <div className="text-xs text-muted-foreground">won&apos;t renew</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap pr-4 text-right lg:table-cell">
                      <div className="text-foreground">{totalLabel(r.totalPaid)}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.timesBilled} {r.timesBilled === 1 ? "charge" : "charges"} since {fmtDate(r.startedAt)}
                      </div>
                      {(r.failedCharges > 0 || r.refundedCents > 0) && (
                        <div className="text-xs">
                          {r.failedCharges > 0 && <span className="text-red-400">{r.failedCharges} failed</span>}
                          {r.failedCharges > 0 && r.refundedCents > 0 && <span className="text-muted-foreground"> · </span>}
                          {r.refundedCents > 0 && <span className="text-muted-foreground">−{(r.refundedCents / 100).toFixed(2)} refunded</span>}
                        </div>
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

function Segmented<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`cursor-pointer whitespace-nowrap rounded px-2.5 py-1 transition ${value === o.value ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {o.label}
          {o.count != null && <span className="ml-1 tabular-nums opacity-60">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

function Tile({
  label, value, sub, tone, onClick, active,
}: { label: string; value: string; sub: string; tone?: "warn"; onClick?: () => void; active?: boolean }) {
  const body = (
    <CardContent className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone === "warn" ? "text-amber-400" : "text-foreground"}`}>{value}</div>
      <div className="truncate text-xs text-muted-foreground">{sub}</div>
    </CardContent>
  );
  return (
    <Card className={`py-0 ${onClick ? "cursor-pointer transition hover:border-amber-500/40" : ""} ${active ? "border-amber-500/50" : ""}`}>
      {onClick ? (
        <button type="button" onClick={onClick} className="w-full cursor-pointer text-left">
          {body}
        </button>
      ) : (
        body
      )}
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
