"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronRight,
  Trophy,
  Coffee,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, CartesianGrid } from "recharts";
import { Sparkline } from "@/components/sparkline";

const ADMIN_EMAIL = "mbathie@gmail.com";

type PlanSlug = "free" | "pro" | "plus" | "max";

interface ShopRow {
  _id: string;
  name: string;
  ownerEmail: string;
  perkMode: boolean;
  planSlug: PlanSlug;
  planLabel: string;
  monthlyCents: number;
  totalStamps: number;
  freeCoffees: number;
  customers: number;
  createdAt: string;
  lastActive: string | null;
}

interface ChartPoint {
  _id: string;
  stamps?: number;
  customers?: number;
  shops?: number;
  upgrades?: number;
}

type SortKey =
  | "name"
  | "ownerEmail"
  | "activity"
  | "customers"
  | "createdAt"
  | "lastActive";
type SortDir = "asc" | "desc";
type TimeRange = "daily" | "weekly" | "monthly";
type Metric = "stamps" | "customers" | "shops" | "upgrades";

const METRIC_LABELS: Record<Metric, string> = {
  stamps: "Stamps",
  customers: "Customers",
  shops: "Shop signups",
  upgrades: "Upgrades",
};

const METRIC_COLORS: Record<Metric, string> = {
  stamps: "var(--chart-1)",
  customers: "var(--chart-2)",
  shops: "var(--chart-3)",
  upgrades: "var(--chart-4)",
};

// Tier colours — Free neutral, then a cool→warm ramp by value.
const PLAN_STYLE: Record<
  PlanSlug,
  { label: string; badge: string; bar: string }
> = {
  free: {
    label: "Free",
    badge: "border-border text-muted-foreground",
    bar: "bg-muted-foreground/40",
  },
  pro: {
    label: "Pro",
    badge: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    bar: "bg-emerald-500",
  },
  plus: {
    label: "Plus",
    badge: "border-sky-500/30 bg-sky-500/15 text-sky-300",
    bar: "bg-sky-500",
  },
  max: {
    label: "Max",
    badge: "border-violet-500/30 bg-violet-500/15 text-violet-300",
    bar: "bg-violet-500",
  },
};

const chartConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function formatLabel(key: string, range: TimeRange): string {
  if (range === "monthly") {
    const d = new Date(key + "-01T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  if (range === "weekly") {
    const d = new Date(key + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return new Date(key + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function aggregateByRange(
  data: ChartPoint[],
  field: Metric,
  range: TimeRange,
): { key: string; value: number }[] {
  const map = new Map<string, number>();
  for (const d of data) {
    const bucket =
      range === "weekly"
        ? getWeekKey(d._id)
        : range === "monthly"
          ? getMonthKey(d._id)
          : d._id;
    const fieldKey: keyof ChartPoint =
      field === "shops" ? "shops" : field === "upgrades" ? "upgrades" : field;
    map.set(bucket, (map.get(bucket) || 0) + ((d[fieldKey] as number) || 0));
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));
}

function toCumulative(
  data: { key: string; value: number }[],
): { key: string; value: number }[] {
  let total = 0;
  return data.map((d) => {
    total += d.value;
    return { key: d.key, value: total };
  });
}

function sparkLast(daily: ChartPoint[], field: Metric, days: number): number[] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const out: number[] = [];
  const byKey = new Map<string, number>();
  for (const d of daily) {
    byKey.set(d._id, (d[field as keyof ChartPoint] as number) || 0);
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(byKey.get(key) || 0);
  }
  return out;
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })
    : "—";

const fmtDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        year: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export default function AdminShopsPage() {
  const { data: session, status } = useSession();
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [mrrUsd, setMrrUsd] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [planCounts, setPlanCounts] = useState<Record<PlanSlug, number>>({
    free: 0,
    pro: 0,
    plus: 0,
    max: 0,
  });
  const [totalFreeCoffees, setTotalFreeCoffees] = useState(0);
  const [charts, setCharts] = useState<{
    dailyStamps: ChartPoint[];
    dailyCustomers: ChartPoint[];
    dailyShops: ChartPoint[];
    dailyUpgrades: ChartPoint[];
  }>({
    dailyStamps: [],
    dailyCustomers: [],
    dailyShops: [],
    dailyUpgrades: [],
  });
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");
  const [metric, setMetric] = useState<Metric>("stamps");
  const router = useRouter();

  // Restore sort + tab anchor from last visit.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("brewstamp.admin-shops");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.sortKey) setSortKey(saved.sortKey);
      if (saved.sortDir) setSortDir(saved.sortDir);
      if (saved.hash && !window.location.hash) {
        window.location.hash = saved.hash;
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "brewstamp.admin-shops",
        JSON.stringify({ sortKey, sortDir, hash: window.location.hash }),
      );
    } catch {}
  }, [sortKey, sortDir]);

  useEffect(() => {
    const onHashChange = () => {
      try {
        const raw = localStorage.getItem("brewstamp.admin-shops");
        const saved = raw ? JSON.parse(raw) : {};
        localStorage.setItem(
          "brewstamp.admin-shops",
          JSON.stringify({ ...saved, hash: window.location.hash }),
        );
      } catch {}
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.email !== ADMIN_EMAIL) {
      redirect("/dashboard");
    }
    fetch("/api/admin/shops")
      .then((res) => res.json())
      .then((data) => {
        setShops(data.shops || []);
        setMrrUsd(data.mrrUsd || 0);
        setPaidCount(data.paidCount || 0);
        if (data.planCounts) setPlanCounts(data.planCounts);
        setTotalFreeCoffees(data.totalFreeCoffees || 0);
        if (data.charts) setCharts(data.charts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, status]);

  // Honour the URL hash once the (async) content exists. The browser's native
  // anchor scroll fires while the page is still showing the loading state, so
  // the target section isn't in the DOM yet and it lands at the top.
  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash;
    if (!hash) return;
    requestAnimationFrame(() => {
      try {
        document.querySelector(hash)?.scrollIntoView();
      } catch {}
    });
  }, [loading]);

  // Activity = stamps for stamp shops, free coffees for perk shops — so a perk
  // shop's column shows something meaningful and sorts sensibly.
  const rows = useMemo(
    () =>
      shops.map((s) => ({
        ...s,
        activity: s.perkMode ? s.freeCoffees : s.totalStamps,
      })),
    [shops],
  );

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortKey === "createdAt" || sortKey === "lastActive") {
        aVal = a[sortKey] ? new Date(a[sortKey]!).getTime() : 0;
        bVal = b[sortKey] ? new Date(b[sortKey]!).getTime() : 0;
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }
      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal as string);
        return sortDir === "asc" ? cmp : -cmp;
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [rows, sortKey, sortDir]);

  const totalStamps = useMemo(
    () => shops.reduce((sum, s) => sum + s.totalStamps, 0),
    [shops],
  );
  const activeCustomers = useMemo(
    () => shops.reduce((sum, s) => sum + s.customers, 0),
    [shops],
  );
  const paidPct = shops.length
    ? Math.round((paidCount / shops.length) * 100)
    : 0;

  const stampsSpark = useMemo(
    () => sparkLast(charts.dailyStamps, "stamps", 14),
    [charts.dailyStamps],
  );
  const customersSpark = useMemo(
    () => sparkLast(charts.dailyCustomers, "customers", 14),
    [charts.dailyCustomers],
  );
  const shopsSpark = useMemo(
    () => sparkLast(charts.dailyShops, "shops", 14),
    [charts.dailyShops],
  );
  const upgradesSpark = useMemo(
    () => sparkLast(charts.dailyUpgrades, "upgrades", 14),
    [charts.dailyUpgrades],
  );

  const trendData = useMemo(() => {
    let source: ChartPoint[] = [];
    if (metric === "stamps") source = charts.dailyStamps;
    else if (metric === "customers") source = charts.dailyCustomers;
    else if (metric === "shops") source = charts.dailyShops;
    else source = charts.dailyUpgrades;

    const agg = aggregateByRange(source, metric, timeRange);
    const series = metric === "stamps" ? agg : toCumulative(agg);
    return series.map((d) => ({
      date: formatLabel(d.key, timeRange),
      value: d.value,
    }));
  }, [metric, timeRange, charts]);

  const top5 = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.activity - a.activity)
        .filter((s) => s.activity > 0)
        .slice(0, 5),
    [rows],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "ownerEmail" ? "asc" : "desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline size-3" />
    ) : (
      <ArrowDown className="ml-1 inline size-3" />
    );
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const showFreeCoffees = totalFreeCoffees > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Shops</h1>
        <p className="text-sm text-muted-foreground">
          {shops.length} signed up · {paidCount} paid ·{" "}
          <span className="font-medium text-amber-400">${mrrUsd}</span> MRR
        </p>
      </div>

      <nav className="sticky top-14 z-10 -mx-6 flex flex-wrap gap-2 border-b border-border/40 bg-background/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <AnchorPill href="#overview" label="Overview" />
        <AnchorPill href="#trends" label="Trends" />
        <AnchorPill href="#top" label="Top shops" />
        <AnchorPill href="#all" label="All shops" />
      </nav>

      {/* Overview KPIs — money first */}
      <section id="overview" className="scroll-mt-20 space-y-3">
        <div
          className={`grid grid-cols-2 gap-3 ${showFreeCoffees ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}
        >
          <KpiCard
            label="MRR"
            value={mrrUsd}
            valuePrefix="$"
            valueSuffix="/mo"
            spark={upgradesSpark}
            color="var(--chart-4)"
            tone="accent"
          />
          <KpiCard
            label="Shops"
            value={shops.length}
            spark={shopsSpark}
            color={METRIC_COLORS.shops}
          />
          <KpiCard
            label="Paid"
            value={paidCount}
            valueSuffix={`· ${paidPct}%`}
            spark={upgradesSpark}
            color={METRIC_COLORS.upgrades}
          />
          <KpiCard
            label="Active customers"
            value={activeCustomers}
            spark={customersSpark}
            color={METRIC_COLORS.customers}
          />
          <KpiCard
            label="Stamps"
            value={totalStamps}
            spark={stampsSpark}
            color={METRIC_COLORS.stamps}
          />
          {showFreeCoffees && (
            <KpiCard
              label="Free rewards"
              value={totalFreeCoffees}
              color="var(--chart-1)"
            />
          )}
        </div>

        {/* Plan mix — stacked bar + legend, replaces the old "N on Pro" */}
        <PlanMix counts={planCounts} total={shops.length} />
      </section>

      {/* Trends */}
      <section id="trends" className="scroll-mt-20">
        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1">
                {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      metric === m
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {METRIC_LABELS[m]}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-md border p-0.5">
                {(["daily", "weekly", "monthly"] as TimeRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors ${
                      timeRange === r
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {trendData.some((d) => d.value > 0) ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart
                data={trendData}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <defs>
                  <linearGradient id="fillTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={METRIC_COLORS[metric]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={METRIC_COLORS[metric]}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={METRIC_COLORS[metric]}
                  strokeWidth={2}
                  fill="url(#fillTrend)"
                />
              </AreaChart>
            </ChartContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">
                  No data for this period yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Top performing */}
      {top5.length > 0 && (
        <section id="top" className="scroll-mt-20">
          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                <h2 className="text-sm font-medium">Top performing shops</h2>
              </div>
              <div className="space-y-1">
                {top5.map((shop, i) => (
                  <div
                    key={shop._id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/dashboard/admin/shops/${shop._id}`)
                    }
                  >
                    <RankBadge rank={i + 1} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {shop.name}
                        <PlanBadge
                          slug={shop.planSlug}
                          label={shop.planLabel}
                          monthlyCents={shop.monthlyCents}
                        />
                        {shop.perkMode && <PerkBadge />}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {shop.ownerEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {shop.activity.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {shop.perkMode ? "rewards" : "stamps"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shop.customers} active
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* All shops */}
      <section id="all" className="scroll-mt-20">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead
                  k="name"
                  label="Shop"
                  sortKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHead
                  k="ownerEmail"
                  label="Owner"
                  sortKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHead
                  k="activity"
                  label="Activity"
                  align="right"
                  sortKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHead
                  k="customers"
                  label="Active"
                  align="right"
                  sortKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHead
                  k="createdAt"
                  label="Signed up"
                  sortKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHead
                  k="lastActive"
                  label="Last active"
                  sortKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No shops found
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((shop) => (
                  <TableRow
                    key={shop._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/dashboard/admin/shops/${shop._id}`)
                    }
                  >
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-1.5">
                        {shop.name}
                        <PlanBadge
                          slug={shop.planSlug}
                          label={shop.planLabel}
                          monthlyCents={shop.monthlyCents}
                        />
                        {shop.perkMode && <PerkBadge />}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {shop.ownerEmail}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {shop.perkMode ? (
                        <span className="inline-flex items-center justify-end gap-1 text-amber-300">
                          <Coffee className="size-3" />
                          {shop.freeCoffees.toLocaleString()}
                        </span>
                      ) : (
                        shop.totalStamps.toLocaleString()
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {shop.customers.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(shop.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {fmtDateTime(shop.lastActive)}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          Customers shown are active in the last 90 days; stamp shops show
          stamps, perk shops show free rewards.
        </p>
      </section>
    </div>
  );
}

function AnchorPill({ href, label }: { href: string; label: string }) {
  return (
    <Button
      asChild
      size="sm"
      variant="secondary"
      className="h-7 cursor-pointer rounded-full px-3 text-xs"
    >
      <a href={href}>{label}</a>
    </Button>
  );
}

function fmtPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
}

function PlanBadge({
  slug,
  label,
  monthlyCents,
}: {
  slug: PlanSlug;
  label: string;
  monthlyCents: number;
}) {
  const s = PLAN_STYLE[slug] ?? PLAN_STYLE.free;
  if (slug === "free") {
    return (
      <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${s.badge}`}>
        Free
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`px-1.5 py-0 text-[10px] hover:bg-transparent ${s.badge}`}
    >
      {label}
      {monthlyCents > 0 && (
        <span className="ml-1 opacity-70">{fmtPrice(monthlyCents)}</span>
      )}
    </Badge>
  );
}

function PerkBadge() {
  return (
    <Badge className="border-amber-500/30 bg-amber-500/15 px-1.5 py-0 text-[10px] text-amber-300 hover:bg-amber-500/15">
      <Coffee className="mr-0.5 size-2.5" />
      Perk
    </Badge>
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
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${medal}`}
    >
      {rank}
    </span>
  );
}

function PlanMix({
  counts,
  total,
}: {
  counts: Record<PlanSlug, number>;
  total: number;
}) {
  const order: PlanSlug[] = ["max", "plus", "pro", "free"];
  const paid = counts.pro + counts.plus + counts.max;
  return (
    <Card>
      <CardContent className="space-y-2.5 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Plan mix</span>
          <span className="text-muted-foreground">
            {paid} paid of {total}
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          {order.map((slug) =>
            counts[slug] > 0 ? (
              <div
                key={slug}
                className={PLAN_STYLE[slug].bar}
                style={{
                  width: `${(counts[slug] / Math.max(total, 1)) * 100}%`,
                }}
                title={`${PLAN_STYLE[slug].label}: ${counts[slug]}`}
              />
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {(["free", "pro", "plus", "max"] as PlanSlug[]).map((slug) => (
            <span key={slug} className="inline-flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${PLAN_STYLE[slug].bar}`} />
              <span className="text-muted-foreground">
                {PLAN_STYLE[slug].label}
              </span>
              <span className="font-medium text-foreground">
                {counts[slug]}
              </span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SortHead({
  k,
  label,
  align,
  sortKey,
  dir,
  onClick,
}: {
  k: SortKey;
  label: string;
  align?: "right";
  sortKey: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  return (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground ${align === "right" ? "text-right" : ""}`}
      onClick={() => onClick(k)}
    >
      {label}
      {sortKey !== k ? (
        <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
      ) : dir === "asc" ? (
        <ArrowUp className="ml-1 inline size-3" />
      ) : (
        <ArrowDown className="ml-1 inline size-3" />
      )}
    </TableHead>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  spark?: number[];
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  tone?: "default" | "accent";
}

function KpiCard({
  label,
  value,
  spark,
  color,
  valuePrefix,
  valueSuffix,
  tone = "default",
}: KpiCardProps) {
  return (
    <Card
      className={
        tone === "accent"
          ? "border-amber-500/30 bg-amber-500/[0.04]"
          : undefined
      }
    >
      <CardContent className="space-y-2 px-4 py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-end justify-between gap-3">
          <p className="text-2xl font-bold leading-none text-foreground">
            {valuePrefix}
            {value.toLocaleString()}
            {valueSuffix && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {valueSuffix}
              </span>
            )}
          </p>
          {spark && (
            <Sparkline data={spark} color={color} width={64} height={24} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
