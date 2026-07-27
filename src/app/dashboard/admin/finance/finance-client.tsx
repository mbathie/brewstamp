"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { RefreshCw, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  combineAtRate,
  estimateMonthlyGrowth,
  projectMrr,
  type CurrencyMap,
  type FinanceSummary,
} from "@/lib/finance-math";

// ---- formatting helpers ----
const SYM: Record<string, string> = { usd: "US$", aud: "A$", nzd: "NZ$", gbp: "£", eur: "€" };
const sym = (c: string) => SYM[c] ?? c.toUpperCase() + " ";
const fmt = (cents: number, cur: string) =>
  `${sym(cur)}${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtMap = (m: CurrencyMap) => {
  const e = Object.entries(m).filter(([, v]) => v !== 0);
  return e.length ? e.map(([c, v]) => fmt(v, c)).join("  +  ") : "$0.00";
};
// Combined "at par" (AUD+USD 1:1) — an approximation for a single headline number.
const combinedDollars = (m: CurrencyMap) => combineAtRate(m) / 100;
const fmtCombined = (m: CurrencyMap) =>
  `$${combinedDollars(m).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const iso = (d: Date) => d.toISOString().slice(0, 10);

type PresetKey = "30d" | "90d" | "12m" | "ytd" | "all";
const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "12m", label: "12 months" },
  { key: "ytd", label: "This year" },
  { key: "all", label: "All time" },
];

function presetRange(key: PresetKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (key === "30d") from.setDate(from.getDate() - 30);
  else if (key === "90d") from.setDate(from.getDate() - 90);
  else if (key === "12m") from.setMonth(from.getMonth() - 12);
  else if (key === "ytd") from.setMonth(0, 1);
  else from.setFullYear(2020, 0, 1); // "all"
  return { from: iso(from), to: iso(to) };
}

export default function FinanceClient() {
  const [preset, setPreset] = useState<PresetKey>("12m");
  const [range, setRange] = useState(() => presetRange("12m"));
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Projection controls (percentages, as whole numbers in the UI)
  const [months, setMonths] = useState(12);
  const [growthPct, setGrowthPct] = useState<number | null>(null); // null until seeded from data
  const [churnPct, setChurnPct] = useState(3);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/finance?from=${range.from}&to=${range.to}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      const json: FinanceSummary = await res.json();
      setData(json);
      // Seed the growth slider from the observed trend the first time only.
      setGrowthPct((prev) =>
        prev === null
          ? Math.max(0, Math.min(60, Math.round(estimateMonthlyGrowth(json.revenueByMonth) * 100)))
          : prev,
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  function applyPreset(key: PresetKey) {
    setPreset(key);
    setRange(presetRange(key));
  }

  const g = (growthPct ?? 0) / 100;
  const c = churnPct / 100;

  const projection = useMemo(() => {
    if (!data) return [];
    const startCents = combineAtRate(data.mrr);
    const startMonth = new Date().toISOString().slice(0, 7);
    const pts = projectMrr(startCents, { months, growthRate: g, churnRate: c, startMonth });
    return [
      { month: startMonth, mrr: startCents / 100, projected: false },
      ...pts.map((p) => ({ month: p.month, mrr: p.mrrCents / 100, projected: true })),
    ];
  }, [data, months, g, c]);

  const revenueChart = useMemo(
    () =>
      (data?.revenueByMonth ?? []).map((m) => ({
        month: m.month,
        revenue: combineAtRate(m.byCurrency) / 100,
      })),
    [data],
  );

  const netRate = g - c;
  const projectedEnd = projection.length ? projection[projection.length - 1].mrr : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">
            Brewstamp · live from Stripe
            {data && (
              <> · updated {new Date(data.generatedAt).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}</>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Headline metrics (point-in-time, not affected by date range) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="MRR" loading={loading} value={data && fmtCombined(data.mrr)} sub={data && fmtMap(data.mrr)} />
        <Metric label="ARR (run-rate)" loading={loading} value={data && fmtCombined(data.arr)} sub={data && fmtMap(data.arr)} />
        <Metric label="Active subscriptions" loading={loading} value={data ? String(data.activeSubscriptions) : undefined} sub={data ? `${data.activeCustomers} customers` : undefined} />
        <Metric label="Lifetime revenue" loading={loading} value={data && fmtCombined(data.lifetimeRevenue)} sub={data ? `${data.lifetimeInvoiceCount} payments · since ${data.firstPaymentAt ?? "—"}` : undefined} />
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Combined figures add AUD + USD at par (1:1) for a single headline; the smaller line shows the real per-currency split.
      </p>

      {/* Date range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Revenue collected</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.key}
                size="sm"
                variant={preset === p.key ? "default" : "outline"}
                onClick={() => applyPreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
            <span className="mx-1 text-muted-foreground">·</span>
            <input
              type="date"
              value={range.from}
              onChange={(e) => { setPreset("all"); setRange((r) => ({ ...r, from: e.target.value })); }}
              className="rounded-md border px-2 py-1 text-sm"
            />
            <span className="text-muted-foreground">→</span>
            <input
              type="date"
              value={range.to}
              onChange={(e) => { setPreset("all"); setRange((r) => ({ ...r, to: e.target.value })); }}
              className="rounded-md border px-2 py-1 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div>
              <div className="text-2xl font-semibold">{loading || !data ? "—" : fmtCombined(data.revenueInRange)}</div>
              <div className="text-xs text-muted-foreground">
                {data && `${fmtMap(data.revenueInRange)} · ${data.invoiceCountInRange} payments`}
              </div>
            </div>
          </div>

          <div className="h-[240px] w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : revenueChart.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No revenue in this range.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue (at par)"]} />
                  <Bar dataKey="revenue" fill="#0065ed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MRR by plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">MRR by plan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || !data ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Subs</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.mrrByPlan.map((p) => (
                  <TableRow key={`${p.plan}-${p.currency}`}>
                    <TableCell>{p.plan} <span className="text-muted-foreground">({p.currency.toUpperCase()})</span></TableCell>
                    <TableCell className="text-right">{p.subscriptions}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(p.monthlyCents, p.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Projections */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" /> MRR forward projection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Slider label={`Monthly growth: ${growthPct ?? 0}%`} min={0} max={60} value={growthPct ?? 0} onChange={setGrowthPct} hint="new + expansion" />
            <Slider label={`Monthly churn: ${churnPct}%`} min={0} max={30} value={churnPct} onChange={setChurnPct} hint="lost MRR" />
            <Slider label={`Horizon: ${months} months`} min={3} max={36} value={months} onChange={setMonths} hint="projection length" />
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-lg bg-muted/40 p-3 text-sm">
            <div><span className="text-muted-foreground">Net monthly rate: </span><span className={netRate >= 0 ? "text-green-600" : "text-red-600"}>{(netRate * 100).toFixed(1)}%</span></div>
            <div><span className="text-muted-foreground">MRR in {months} months: </span><span className="font-semibold">${projectedEnd.toLocaleString("en-AU", { maximumFractionDigits: 0 })}</span></div>
            <div><span className="text-muted-foreground">Implied ARR: </span><span className="font-semibold">${(projectedEnd * 12).toLocaleString("en-AU", { maximumFractionDigits: 0 })}</span></div>
          </div>

          <div className="h-[260px] w-full">
            {loading || !data ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projection} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(0)}`, "Projected MRR"]} />
                  <Line type="monotone" dataKey="mrr" stroke="#0065ed" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Simple compounding model from current MRR ({data ? fmtCombined(data.mrr) : "—"}, at par): each month ×(1 + growth − churn).
            Growth is seeded from the observed month-over-month revenue trend — adjust the sliders to model scenarios. Not a committed forecast.
          </p>
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || !data ? (
            <Skeleton className="h-40 w-full" />
          ) : data.recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments in this range.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap">{t.date}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{t.email}</TableCell>
                    <TableCell>{t.plan}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(t.amountCents, t.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, sub, loading }: { label: string; value?: string | null; sub?: string | null; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        {loading || value == null ? (
          <Skeleton className="mt-2 h-7 w-24" />
        ) : (
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        )}
        {sub && !loading && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Slider({ label, min, max, value, onChange, hint }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#0065ed]"
      />
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
