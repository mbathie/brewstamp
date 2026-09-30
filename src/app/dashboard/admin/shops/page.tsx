"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Sparkles,
  Sprout,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Sparkline } from "@/components/sparkline";
import {
  ShopsTable,
  PlanBadge,
  PerkBadge,
  setShopsTableView,
  type PlanSlug,
  type ShopRow,
} from "./shops-table";

const ADMIN_EMAIL = "mbathie@gmail.com";
const DAY_MS = 86_400_000;
const NEAR_CAP = 0.7;

interface ChartPoint {
  _id: string;
  stamps?: number;
  customers?: number;
  shops?: number;
  upgrades?: number;
}

interface Charts {
  dailyStamps: ChartPoint[];
  dailyCustomers: ChartPoint[];
  dailyShops: ChartPoint[];
  dailyUpgrades: ChartPoint[];
}

interface ShopsResponse {
  shops: ShopRow[];
  mrrUsd: number;
  mrrMonthAgoUsd: number;
  mrrMovement: { newSubscriptions: number; churnedSubscriptions: number };
  paidCount: number;
  pastDueCount: number;
  freeStampLimit: number;
  planCounts: Record<PlanSlug, number>;
  totalFreeCoffees: number;
  charts: Charts;
}

type Metric = "stamps" | "customers" | "shops" | "upgrades";
type Bucket = "daily" | "weekly";

const METRICS: Record<Metric, { label: string; unit: string; color: string; source: keyof Charts }> = {
  stamps: { label: "Stamps", unit: "stamps", color: "var(--chart-1)", source: "dailyStamps" },
  customers: { label: "New customers", unit: "customers", color: "var(--chart-2)", source: "dailyCustomers" },
  shops: { label: "Signups", unit: "shops", color: "var(--chart-3)", source: "dailyShops" },
  upgrades: { label: "Upgrades", unit: "upgrades", color: "var(--chart-4)", source: "dailyUpgrades" },
};

const PAID_TIERS: PlanSlug[] = ["pro", "plus", "max"];
const PLAN_BAR: Record<PlanSlug, string> = {
  free: "bg-muted-foreground/30",
  pro: "bg-emerald-500",
  plus: "bg-sky-500",
  max: "bg-violet-500",
};
const PLAN_LABEL: Record<PlanSlug, string> = { free: "Free", pro: "Pro", plus: "Plus", max: "Max" };

// ── Series helpers ───────────────────────────────────────────────────────
// The API sends sparse daily rows (only days with data). These densify to a
// fixed window so zero days show as zero and period sums are comparable.

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function dailySeries(rows: ChartPoint[], field: Metric, days: number, endOffset = 0): number[] {
  const byDay = new Map(rows.map((r) => [r._id, (r[field] as number) || 0]));
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - endOffset);
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(byDay.get(isoDay(d)) ?? 0);
  }
  return out;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** This 30 days vs the 30 before, plus a 30-day daily sparkline. */
function period(rows: ChartPoint[], field: Metric) {
  const current = dailySeries(rows, field, 30);
  const prior = dailySeries(rows, field, 30, 30);
  return { value: sum(current), prior: sum(prior), spark: current };
}

/** Last 6 weeks per day, or last 12 weeks per week. */
function bucketed(rows: ChartPoint[], field: Metric, bucket: Bucket) {
  const days = bucket === "daily" ? 42 : 84;
  const daily = dailySeries(rows, field, days);
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const dayAt = (i: number) => {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    return d;
  };
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  if (bucket === "daily") return daily.map((v, i) => ({ label: fmt(dayAt(i)), value: v }));
  const out: { label: string; value: number }[] = [];
  for (let w = 0; w < days; w += 7) out.push({ label: fmt(dayAt(w)), value: sum(daily.slice(w, w + 7)) });
  return out;
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function AdminShopsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ShopsResponse | null>(null);
  const [error, setError] = useState(false);
  const [metric, setMetric] = useState<Metric>("stamps");
  const [bucket, setBucket] = useState<Bucket>("weekly");
  const [topRange, setTopRange] = useState<"30d" | "all">("30d");
  const [now] = useState(() => Date.now());

  // Restore the section anchor from the last visit. (The table keeps its own
  // sort and page size under the same key; filters live in the URL.)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("brewstamp.admin-shops") || "{}");
      if (saved.hash && !window.location.hash) window.location.hash = saved.hash;
    } catch {}
    const onHashChange = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("brewstamp.admin-shops") || "{}");
        localStorage.setItem("brewstamp.admin-shops", JSON.stringify({ ...saved, hash: window.location.hash }));
      } catch {}
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Start the data request immediately rather than after the session loads:
  // the API enforces admin itself, so waiting only added a round-trip.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/admin/shops", { signal: ctrl.signal })
      .then((res) => {
        if (res.status === 403) {
          window.location.replace("/dashboard");
          return null;
        }
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((d: ShopsResponse | null) => d && setData(d))
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard");
  }, [session, status]);

  // Honour the URL hash once the (async) content exists — the browser's own
  // anchor scroll fired while the skeleton was showing.
  useEffect(() => {
    if (!data) return;
    const hash = window.location.hash;
    if (!hash) return;
    requestAnimationFrame(() => {
      try {
        document.querySelector(hash)?.scrollIntoView();
      } catch {}
    });
  }, [data]);

  const shops = useMemo(() => data?.shops ?? [], [data]);
  const charts = data?.charts;

  const kpis = useMemo(() => {
    if (!charts) return null;
    return {
      signups: period(charts.dailyShops, "shops"),
      stamps: period(charts.dailyStamps, "stamps"),
      customers: period(charts.dailyCustomers, "customers"),
    };
  }, [charts]);

  // Action counts — each one is a table view one click away.
  const attention = useMemo(() => {
    const idle = (s: ShopRow) => (s.lastActive ? (now - new Date(s.lastActive).getTime()) / DAY_MS : Infinity);
    const free = shops.filter((s) => s.planSlug === "free" && !s.coveredBy);
    const paying = shops.filter((s) => s.planSlug !== "free");
    const pastDue = paying.filter((s) => s.subStatus === "past_due").length;
    const cancelling = paying.filter((s) => s.cancelAtPeriodEnd).length;
    const quiet = paying.filter((s) => s.subStatus !== "past_due" && !s.cancelAtPeriodEnd && idle(s) > 14).length;
    return {
      leads: {
        high: shops.filter((s) => s.likelihood === "high").length,
        medium: shops.filter((s) => s.likelihood === "medium").length,
      },
      risk: { total: pastDue + cancelling + quiet, pastDue, cancelling, quiet },
      nearCap: free.filter((s) => (s.freeCapUsed ?? 0) >= NEAR_CAP).length,
      atCap: free.filter((s) => (s.freeCapUsed ?? 0) >= 1).length,
      // Free shops that stamped in the last 7 days — the live trial base.
      activeTrials: free.filter((s) => idle(s) <= 7).length,
      freeTotal: free.length,
    };
  }, [shops, now]);

  const trend = useMemo(
    () => (charts ? bucketed(charts[METRICS[metric].source], metric, bucket) : []),
    [charts, metric, bucket],
  );
  const trendTotal = sum(trend.map((t) => t.value));

  const top = useMemo(() => {
    const val = (s: ShopRow) => (topRange === "30d" ? s.stamps30d : s.perkMode ? s.freeCoffees : s.totalStamps);
    return [...shops]
      .filter((s) => val(s) > 0)
      .sort((a, b) => val(b) - val(a))
      .slice(0, 5)
      .map((s) => ({ shop: s, value: val(s) }));
  }, [shops, topRange]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load shops.</p>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }
  if (!data || !kpis) return <PageSkeleton />;

  const mrrDelta = data.mrrUsd - data.mrrMonthAgoUsd;
  const paidPct = shops.length ? (data.paidCount / shops.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Shops</h1>
          <p className="text-sm text-muted-foreground">
            {shops.length} shops · {data.paidCount} paying · ${data.mrrUsd.toFixed(0)} MRR
          </p>
        </div>
        <Link
          href="/dashboard/admin/finance"
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Finance →
        </Link>
      </header>

      <nav className="sticky top-14 z-10 -mx-6 flex flex-wrap gap-2 border-b border-border/40 bg-background/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <AnchorPill href="#overview" label="Overview" />
        <AnchorPill href="#trends" label="Trends" />
        <AnchorPill href="#top" label="Top shops" />
        <AnchorPill href="#all" label="All shops" />
      </nav>

      <section id="overview" className="scroll-mt-28 space-y-4" aria-label="Overview">
        {/* Headline numbers, each compared to the 30 days before */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="MRR"
            value={`$${data.mrrUsd.toFixed(0)}`}
            delta={{
              abs: mrrDelta,
              pct: pctChange(data.mrrUsd, data.mrrMonthAgoUsd),
              fmt: (n) => `$${Math.abs(n).toFixed(0)}`,
            }}
            footnote={`${data.mrrMovement.newSubscriptions} new · ${data.mrrMovement.churnedSubscriptions} churned in 30 days`}
            accent
            title="AUD and USD subscriptions combined at par, as on the finance page"
          />
          <StatCard
            label="Paying shops"
            value={String(data.paidCount)}
            suffix={`${paidPct.toFixed(1)}% of ${shops.length}`}
            footnote={<PaidTierBar counts={data.planCounts} />}
          />
          <StatCard
            label="Signups · 30 days"
            value={String(kpis.signups.value)}
            delta={{
              abs: kpis.signups.value - kpis.signups.prior,
              pct: pctChange(kpis.signups.value, kpis.signups.prior),
            }}
            footnote={`${kpis.signups.prior} in the 30 days before`}
            spark={kpis.signups.spark}
            color={METRICS.shops.color}
          />
          <StatCard
            label="Stamps · 30 days"
            value={kpis.stamps.value.toLocaleString()}
            delta={{
              abs: kpis.stamps.value - kpis.stamps.prior,
              pct: pctChange(kpis.stamps.value, kpis.stamps.prior),
            }}
            footnote={`${kpis.customers.value.toLocaleString()} new customers${
              data.totalFreeCoffees ? ` · ${data.totalFreeCoffees.toLocaleString()} perk rewards all time` : ""
            }`}
            spark={kpis.stamps.spark}
            color={METRICS.stamps.color}
          />
        </div>

        {/* Needs attention: each card opens the matching table view */}
        <div>
          <h2 className="mb-2 px-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Needs attention
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ActionCard
              icon={<Sparkles className="size-4" />}
              tone="good"
              label="Upgrade leads"
              value={attention.leads.high + attention.leads.medium}
              detail={`${attention.leads.high} high · ${attention.leads.medium} medium`}
              onClick={() => setShopsTableView("leads")}
            />
            <ActionCard
              icon={<AlertTriangle className="size-4" />}
              tone={attention.risk.total ? "bad" : "neutral"}
              label="Paying, at risk"
              value={attention.risk.total}
              detail={
                attention.risk.total
                  ? [
                      attention.risk.pastDue && `${attention.risk.pastDue} past due`,
                      attention.risk.cancelling && `${attention.risk.cancelling} cancelling`,
                      attention.risk.quiet && `${attention.risk.quiet} quiet 14d+`,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "All paying shops healthy"
              }
              onClick={() => setShopsTableView("risk")}
            />
            <ActionCard
              icon={<Gauge className="size-4" />}
              tone={attention.nearCap ? "warn" : "neutral"}
              label="Near the free cap"
              value={attention.nearCap}
              detail={`${Math.round(NEAR_CAP * 100)}%+ of their free stamps${
                attention.atCap ? ` · ${attention.atCap} at the cap` : ""
              }`}
              onClick={() => setShopsTableView("free", { nearCap: true })}
            />
            <ActionCard
              icon={<Sprout className="size-4" />}
              tone="neutral"
              label="Active free trials"
              value={attention.activeTrials}
              detail={`stamped in 7 days · of ${attention.freeTotal} free`}
              onClick={() => setShopsTableView("free", { activity: "7d" })}
            />
          </div>
        </div>
      </section>

      {/* Trends */}
      <section id="trends" className="scroll-mt-28">
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Trend metric" className="flex flex-wrap gap-1">
                {(Object.keys(METRICS) as Metric[]).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={metric === m}
                    onClick={() => setMetric(m)}
                    className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      metric === m ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {METRICS[m].label}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Bucket size">
                {(["daily", "weekly"] as Bucket[]).map((b) => (
                  <button
                    key={b}
                    aria-pressed={bucket === b}
                    onClick={() => setBucket(b)}
                    className={`cursor-pointer rounded px-2 py-1 text-xs font-medium capitalize transition-colors ${
                      bucket === b ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm">
              <span className="text-2xl font-semibold tabular-nums">{trendTotal.toLocaleString()}</span>{" "}
              <span className="text-muted-foreground">
                {METRICS[metric].unit} in the last {bucket === "daily" ? "6" : "12"} weeks, per{" "}
                {bucket === "daily" ? "day" : "week"}
              </span>
            </p>
            {trendTotal > 0 ? (
              <ChartContainer
                config={{ value: { label: METRICS[metric].label, color: METRICS[metric].color } } satisfies ChartConfig}
                className="h-[200px] w-full"
              >
                <BarChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} minTickGap={16} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={32} allowDecimals={false} />
                  <ChartTooltip cursor={{ fillOpacity: 0.1 }} content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={METRICS[metric].color} radius={[3, 3, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-sm text-muted-foreground">Nothing in this period yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Top shops */}
      {top.length > 0 && (
        <section id="top" className="scroll-mt-28">
          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-amber-500" />
                  <h2 className="text-sm font-medium">Top shops</h2>
                </div>
                <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Top shops range">
                  {(
                    [
                      ["30d", "30 days"],
                      ["all", "All time"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      aria-pressed={topRange === id}
                      onClick={() => setTopRange(id)}
                      className={`cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors ${
                        topRange === id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <ol className="space-y-1">
                {top.map(({ shop, value }, i) => (
                  <li key={shop._id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/admin/shops/${shop._id}`)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50"
                    >
                      <RankBadge rank={i + 1} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          <span className="truncate">{shop.name}</span>
                          <PlanBadge slug={shop.planSlug} label={shop.planLabel} monthlyCents={shop.monthlyCents} />
                          {shop.perkMode && <PerkBadge />}
                        </p>
                        {/* Share of the leader, so the gaps read at a glance */}
                        <div className="mt-1 h-1 max-w-md overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-amber-500/70"
                            style={{ width: `${(value / top[0].value) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-28 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {value.toLocaleString()}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {topRange === "all" && shop.perkMode ? "rewards" : "stamps"}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">{shop.customers} active customers</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>
      )}

      {/* All shops */}
      <section id="all" className="scroll-mt-28">
        <ShopsTable shops={shops} freeStampLimit={data.freeStampLimit} />
      </section>
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────

function pctChange(now: number, before: number): number | null {
  if (!before) return null;
  return ((now - before) / before) * 100;
}

function StatCard({
  label,
  value,
  suffix,
  delta,
  footnote,
  spark,
  color,
  accent,
  title,
}: {
  label: string;
  value: string;
  suffix?: string;
  delta?: { abs: number; pct: number | null; fmt?: (n: number) => string };
  footnote?: React.ReactNode;
  spark?: number[];
  color?: string;
  accent?: boolean;
  title?: string;
}) {
  const flat = !delta || delta.abs === 0;
  const up = !flat && delta!.abs > 0;
  return (
    <Card className={accent ? "border-amber-500/30 bg-amber-500/[0.04]" : undefined} title={title}>
      <CardContent className="flex h-full flex-col gap-2 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-3xl font-semibold leading-none tabular-nums text-foreground">{value}</span>
            {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
            {delta && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                  flat ? "text-muted-foreground" : up ? "text-emerald-400" : "text-red-400"
                }`}
                aria-label={`${flat ? "unchanged" : up ? "up" : "down"} versus the previous 30 days`}
              >
                {!flat && (up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />)}
                {flat ? "no change" : delta.fmt ? delta.fmt(delta.abs) : Math.abs(delta.abs).toLocaleString()}
                {delta.pct !== null && !flat && (
                  <span className="opacity-70">({Math.abs(delta.pct).toFixed(0)}%)</span>
                )}
              </span>
            )}
          </div>
          {spark && <Sparkline data={spark} color={color} width={72} height={26} />}
        </div>
        {footnote && <div className="mt-auto text-xs text-muted-foreground">{footnote}</div>}
      </CardContent>
    </Card>
  );
}

const ACTION_TONE = {
  good: "text-emerald-400 bg-emerald-500/10",
  warn: "text-amber-400 bg-amber-500/10",
  bad: "text-red-400 bg-red-500/10",
  neutral: "text-muted-foreground bg-muted",
} as const;

function ActionCard({
  icon,
  tone,
  label,
  value,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  tone: keyof typeof ACTION_TONE;
  label: string;
  value: number;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${ACTION_TONE[tone]}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
          <span className="truncate text-sm font-medium text-foreground">{label}</span>
        </span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
        View →
      </span>
    </button>
  );
}

/**
 * Split of the paying shops by tier. Free is left out of the bar on purpose:
 * at ~95% of shops it would fill the bar and hide the part that matters.
 */
function PaidTierBar({ counts }: { counts: Record<PlanSlug, number> }) {
  const paid = PAID_TIERS.reduce((t, s) => t + counts[s], 0);
  if (!paid) return <span>No paying shops yet</span>;
  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 gap-px overflow-hidden rounded-full bg-muted">
        {PAID_TIERS.map((slug) =>
          counts[slug] > 0 ? (
            <div
              key={slug}
              className={PLAN_BAR[slug]}
              style={{ width: `${(counts[slug] / paid) * 100}%` }}
              title={`${PLAN_LABEL[slug]}: ${counts[slug]}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {PAID_TIERS.map((slug) => (
          <span key={slug} className={`inline-flex items-center gap-1 ${counts[slug] ? "" : "opacity-50"}`}>
            <span className={`size-1.5 rounded-full ${PLAN_BAR[slug]}`} />
            {PLAN_LABEL[slug]} <span className="font-medium text-foreground">{counts[slug]}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          Free <span className="font-medium text-foreground">{counts.free}</span>
        </span>
      </div>
    </div>
  );
}

function AnchorPill({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild size="sm" variant="secondary" className="h-7 cursor-pointer rounded-full px-3 text-xs">
      <a href={href}>{label}</a>
    </Button>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? "bg-amber-500/20 text-amber-300"
      : rank === 2
        ? "bg-slate-400/20 text-slate-300"
        : rank === 3
          ? "bg-orange-700/25 text-orange-300"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${medal}`}>
      {rank}
    </span>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading shops">
      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
