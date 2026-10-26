"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowRight, Loader2, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkline } from "@/components/sparkline";
import { PageHeader } from "@/components/page-header";
import type { Period, Totals } from "@/lib/dashboard-stats";
import type { GroupShopRow, GroupStats } from "@/lib/group-stats";
import {
  COLORS,
  ChartCard,
  Delta,
  EmptyState,
  KpiTile,
  Section,
  StatRow,
  bucketLabel,
  bucketTick,
  fmtDay,
  nf,
  pct,
} from "@/components/dashboard/parts";

interface Props {
  // Active plan's shop-limit headroom — used to muted-out the "Add a shop"
  // button and redirect to billing instead of /shops/new when capped.
  atShopLimit?: boolean;
  shopLimit?: number;
  planLabel?: string;
}

const PRESETS: { value: Period; label: string; long: string }[] = [
  { value: "7d", label: "7D", long: "Last 7 days" },
  { value: "30d", label: "30D", long: "Last 30 days" },
  { value: "90d", label: "90D", long: "Last 90 days" },
  { value: "12m", label: "12M", long: "Last 12 months" },
];

// Shares the single-shop dashboard's saved period, so switching between a shop
// and "All shops" keeps the same range.
const PERIOD_KEY = "brewstamp.dashboard.period";

// The stamps-by-shop chart stacks the busiest shops and folds the rest into
// "Other", so 25 shops stay readable.
const CHART_SHOPS = 5;
const SHOP_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

// Search the shop table once there are more shops than fit at a glance.
const SEARCH_FROM = 8;

function readSavedPeriod(): Period {
  try {
    const v = localStorage.getItem(PERIOD_KEY);
    if (v && PRESETS.some((p) => p.value === v)) return v as Period;
  } catch {}
  return "30d";
}

async function switchTo(shopId: string) {
  // POST then hard-reload, as the top-bar ShopSwitcher does: a plain <Link>
  // would keep Next's cached render after the cookie changes.
  const res = await fetch("/api/shop-context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: shopId }),
  });
  if (res.ok) window.location.href = "/dashboard";
  return res.ok;
}

export default function DashboardAggregate({ atShopLimit = false, shopLimit = 1, planLabel = "your" }: Props) {
  const [period, setPeriod] = useState<Period>(() => (typeof window === "undefined" ? "30d" : readSavedPeriod()));
  const [loaded, setLoaded] = useState<{ period: Period; stats: GroupStats } | null>(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    fetch(`/api/dashboard/group?period=${period}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((stats: GroupStats | null) => {
        if (id === requestId.current && stats) setLoaded({ period, stats });
      })
      .catch(() => {});
  }, [period]);

  useEffect(load, [load]);

  // Approvals from the header modal refresh the numbers, debounced.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const handler = () => {
      clearTimeout(t);
      t = setTimeout(load, 1500);
    };
    window.addEventListener("stamp-approved", handler);
    return () => {
      clearTimeout(t);
      window.removeEventListener("stamp-approved", handler);
    };
  }, [load]);

  const choose = (p: Period) => {
    setPeriod(p);
    try {
      localStorage.setItem(PERIOD_KEY, p);
    } catch {}
  };

  const data = loaded?.stats ?? null;
  const loading = loaded?.period !== period;

  const addShop = atShopLimit ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/dashboard/billing"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-amber-700/40 px-2.5 py-1 text-xs text-amber-500 transition-colors hover:bg-amber-700/10"
          >
            <Plus className="h-3.5 w-3.5" />
            Add a shop
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          You&apos;re at the {shopLimit}-shop limit on the {planLabel} plan. Upgrade to add more.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Link
      href="/dashboard/shops/new"
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-amber-700/40 px-2.5 py-1 text-xs text-amber-500 transition-colors hover:bg-amber-700/10"
    >
      <Plus className="h-3.5 w-3.5" />
      Add a shop
    </Link>
  );

  if (!data) return <AggregateSkeleton />;

  const { today, crossShop, shops } = data;
  const k = data.period.kpis;
  const p = data.period.prevKpis;
  const comparable = p.visits > 0;
  const prev = (v: number) => (comparable ? v : null);
  const spark = (key: "stamps" | "rewards") => data.period.buckets.map((b) => b[key]);
  const weekday = fmtDay(data.todayDate, { weekday: "long" });
  const rangeLabel = PRESETS.find((x) => x.value === period)!.long;
  const activeToday = shops.filter((s) => s.today.visits > 0).length;
  const topShare = k.stamps && shops[0] ? shops[0].kpis.stamps / k.stamps : null;

  return (
    <div className="space-y-8">
      <PageHeader title="All shops" description={`Combined activity across the ${shops.length} shops you belong to.`} />

      {/* ── Today ─────────────────────────────────────────────────────── */}
      <Section
        title="Today"
        description={`${fmtDay(data.todayDate, { weekday: "short", day: "numeric", month: "short" })} · ${activeToday} of ${shops.length} shops active · vs last ${weekday} at this time`}
      >
        <div className={`grid grid-cols-2 gap-4 transition-opacity lg:grid-cols-4 ${loading ? "opacity-60" : ""}`}>
          <TodayTile label="Stamps" k="stamps" today={today.totals} lastWeek={today.lastWeek} color={COLORS.stamps} />
          <TodayTile label="Rewards" k="rewards" today={today.totals} lastWeek={today.lastWeek} color={COLORS.rewards} />
          <TodayTile label="Customers" k="customers" today={today.totals} lastWeek={today.lastWeek} color={COLORS.customers} />
          <TodayTile label="New customers" k="newCustomers" today={today.totals} lastWeek={today.lastWeek} color={COLORS.customers} />
        </div>
      </Section>

      {/* ── Performance ───────────────────────────────────────────────── */}
      <Section
        title="Performance"
        description={`${rangeLabel} · vs the ${PRESETS.find((x) => x.value === period)!.long.toLowerCase().replace("last ", "previous ")}`}
        right={
          <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
            {PRESETS.map((x) => (
              <button
                key={x.value}
                type="button"
                onClick={() => choose(x.value)}
                className={`cursor-pointer rounded-md px-2.5 py-1 font-medium transition ${
                  period === x.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {x.label}
              </button>
            ))}
          </div>
        }
      >
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiTile
              label="Stamps"
              value={nf.format(k.stamps)}
              delta={<Delta value={k.stamps} prev={prev(p.stamps)} suffix="vs previous" />}
              spark={spark("stamps")}
              color={COLORS.stamps}
            />
            <KpiTile
              label="Rewards redeemed"
              value={nf.format(k.rewards)}
              delta={<Delta value={k.rewards} prev={prev(p.rewards)} suffix="vs previous" />}
              spark={spark("rewards")}
              color={COLORS.rewards}
            />
            <KpiTile
              label="Customers"
              value={nf.format(k.customers)}
              delta={<Delta value={k.customers} prev={prev(p.customers)} suffix="vs previous" />}
              color={COLORS.customers}
            />
            <KpiTile
              label="New customers"
              value={nf.format(k.newCustomers)}
              delta={<Delta value={k.newCustomers} prev={prev(p.newCustomers)} suffix="vs previous" />}
              color={COLORS.customers}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Stamps by shop"
              description={
                shops.length > CHART_SHOPS
                  ? `Your ${CHART_SHOPS} busiest shops this period, the rest as Other.`
                  : "Each shop's share of the stamps over the period."
              }
            >
              <ShopsChart stats={data} />
            </ChartCard>

            <ChartCard title="Across your shops" description="How customers and activity spread between shops.">
              <div className="divide-y">
                <StatRow
                  label="Visited 2+ shops"
                  hint={rangeLabel}
                  value={nf.format(crossShop.period)}
                  extra={<span className="text-xs text-muted-foreground">{pct(k.customers ? crossShop.period / k.customers : null)} of customers</span>}
                />
                <StatRow
                  label="Visited 2+ shops"
                  hint="All time"
                  value={nf.format(crossShop.lifetime)}
                  extra={
                    <span className="text-xs text-muted-foreground">
                      {pct(crossShop.lifetimeCustomers ? crossShop.lifetime / crossShop.lifetimeCustomers : null)} of{" "}
                      {nf.format(crossShop.lifetimeCustomers)}
                    </span>
                  }
                />
                <StatRow
                  label="Busiest shop"
                  hint={shops[0] && k.stamps ? shops[0].name : "No stamps this period"}
                  value={pct(topShare)}
                  extra={<span className="text-xs text-muted-foreground">of stamps</span>}
                />
                <StatRow
                  label="Visits per customer"
                  hint={rangeLabel}
                  value={k.visitsPerCustomer === null ? "—" : k.visitsPerCustomer.toFixed(1)}
                  extra={<Delta value={k.visitsPerCustomer} prev={comparable ? p.visitsPerCustomer : null} />}
                />
              </div>
            </ChartCard>
          </div>

          <ShopTable shops={shops} total={k.stamps} comparable={comparable} addShop={addShop} />
        </div>
      </Section>
    </div>
  );
}

function TodayTile({
  label,
  k,
  today,
  lastWeek,
  color,
}: {
  label: string;
  k: keyof Totals;
  today: Totals;
  lastWeek: Totals;
  color: string;
}) {
  return (
    <KpiTile
      label={label}
      value={nf.format(today[k])}
      delta={
        lastWeek[k] > 0 ? (
          <Delta value={today[k]} prev={lastWeek[k]} />
        ) : (
          <span className="text-xs text-muted-foreground">{nf.format(lastWeek[k])} last week</span>
        )
      }
      color={color}
    />
  );
}

function ShopsChart({ stats }: { stats: GroupStats }) {
  const { buckets, grain, days } = stats.period;
  const top = stats.shops.filter((s) => s.kpis.stamps > 0).slice(0, CHART_SHOPS);
  const rest = stats.shops.filter((s) => !top.includes(s));
  if (!top.length) {
    return <EmptyState height={260} title="No stamps in this period" hint="Pick a longer period above." />;
  }
  const config: ChartConfig = Object.fromEntries(top.map((s, i) => [`s${i}`, { label: s.name, color: SHOP_COLORS[i] }]));
  const hasOther = rest.some((s) => s.kpis.stamps > 0);
  if (hasOther) config.other = { label: "Other", color: COLORS.muted };

  const data = buckets.map((b) => {
    const row: Record<string, number | string> = { start: b.start, label: bucketTick(b.start, grain, days) };
    top.forEach((s, i) => (row[`s${i}`] = b.byShop[s.shopId] ?? 0));
    if (hasOther) row.other = rest.reduce((sum, s) => sum + (b.byShop[s.shopId] ?? 0), 0);
    return row;
  });
  const keys = Object.keys(config);

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.25} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} tickMargin={8} minTickGap={16} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} width={32} allowDecimals={false} tickCount={4} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(_, pl) => bucketLabel(pl?.[0]?.payload?.start, grain)} />}
        />
        <ChartLegend content={<ChartLegendContent className="flex-wrap" />} />
        {keys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="shops"
            fill={`var(--color-${key})`}
            radius={i === keys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            maxBarSize={32}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

function ShopTable({
  shops,
  total,
  comparable,
  addShop,
}: {
  shops: GroupShopRow[];
  total: number;
  comparable: boolean;
  addShop: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? shops.filter((s) => s.name.toLowerCase().includes(q)) : shops;
  }, [shops, query]);

  const go = async (id: string) => {
    if (pending) return;
    setPending(id);
    if (!(await switchTo(id))) setPending(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">Shops compared</CardTitle>
          <p className="text-xs text-muted-foreground">Busiest first. Click a shop to open its dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
          {shops.length >= SEARCH_FROM && (
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a shop"
                className="h-7 w-40 rounded-md border bg-transparent pr-2 pl-7 text-xs outline-none focus:border-amber-600"
              />
            </div>
          )}
          {addShop}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop</TableHead>
              <TableHead className="text-right">Today</TableHead>
              <TableHead className="text-right">Stamps</TableHead>
              <TableHead className="hidden text-right md:table-cell">Share</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Customers</TableHead>
              <TableHead className="hidden text-right lg:table-cell">New</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Rewards</TableHead>
              <TableHead className="hidden lg:table-cell">Trend</TableHead>
              <TableHead className="hidden text-right md:table-cell">Last stamp</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((s) => (
              <TableRow
                key={s.shopId}
                onClick={() => go(s.shopId)}
                data-pending={pending === s.shopId}
                className="cursor-pointer transition-colors hover:bg-muted/40 data-[pending=true]:opacity-50"
              >
                <TableCell className="max-w-[220px] truncate font-medium">{s.name}</TableCell>
                <TableCell className="text-right tabular-nums">{nf.format(s.perkMode ? s.today.rewards : s.today.stamps)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  <div className="flex flex-col items-end gap-0.5">
                    {nf.format(s.kpis.stamps)}
                    {comparable && s.prevKpis.visits > 0 && <Delta value={s.kpis.stamps} prev={s.prevKpis.stamps} />}
                  </div>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                  {pct(total ? s.kpis.stamps / total : null)}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{nf.format(s.kpis.customers)}</TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">{nf.format(s.kpis.newCustomers)}</TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">{nf.format(s.kpis.rewards)}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {s.spark.some((v) => v > 0) ? (
                    <Sparkline data={s.spark} color={COLORS.stamps} width={80} height={24} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-right text-xs text-muted-foreground md:table-cell">
                  {s.lastActivity ? fmtDay(s.lastActivity, { day: "numeric", month: "short" }) : "Never"}
                </TableCell>
                <TableCell className="w-10 text-amber-600">
                  {pending === s.shopId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                </TableCell>
              </TableRow>
            ))}
            {!shown.length && (
              <TableRow>
                <TableCell colSpan={10} className="py-6 text-center text-sm text-muted-foreground">
                  No shop matches &ldquo;{query}&rdquo;
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AggregateSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
