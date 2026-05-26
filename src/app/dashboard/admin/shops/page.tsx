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
  Zap,
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

interface ShopRow {
  _id: string;
  name: string;
  ownerEmail: string;
  totalStamps: number;
  customers: number;
  createdAt: string;
  lastActive: string | null;
  isPro: boolean;
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
  | "totalStamps"
  | "customers"
  | "createdAt"
  | "lastActive";
type SortDir = "asc" | "desc";
type TimeRange = "daily" | "weekly" | "monthly";
type Metric = "stamps" | "customers" | "shops" | "upgrades";

const METRIC_LABELS: Record<Metric, string> = {
  stamps: "Stamps",
  customers: "Customers",
  shops: "Shop Signups",
  upgrades: "Upgrades",
};

const METRIC_COLORS: Record<Metric, string> = {
  stamps: "var(--chart-1)",
  customers: "var(--chart-2)",
  shops: "var(--chart-3)",
  upgrades: "var(--chart-4)",
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

export default function AdminShopsPage() {
  const { data: session, status } = useSession();
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [proCount, setProCount] = useState(0);
  const [mrrUsd, setMrrUsd] = useState(0);
  const [charts, setCharts] = useState<{
    dailyStamps: ChartPoint[];
    dailyCustomers: ChartPoint[];
    dailyShops: ChartPoint[];
    dailyUpgrades: ChartPoint[];
  }>({ dailyStamps: [], dailyCustomers: [], dailyShops: [], dailyUpgrades: [] });
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");
  const [metric, setMetric] = useState<Metric>("stamps");
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.email !== ADMIN_EMAIL) {
      redirect("/dashboard");
    }
    fetch("/api/admin/shops")
      .then((res) => res.json())
      .then((data) => {
        setShops(data.shops || data);
        setProCount(data.proCount || 0);
        setMrrUsd(data.mrrUsd || 0);
        if (data.charts) setCharts(data.charts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, status]);

  const sorted = useMemo(() => {
    return [...shops].sort((a, b) => {
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
  }, [shops, sortKey, sortDir]);

  const totalStamps = useMemo(
    () => shops.reduce((sum, s) => sum + s.totalStamps, 0),
    [shops],
  );
  const totalCustomers = useMemo(
    () => shops.reduce((sum, s) => sum + s.customers, 0),
    [shops],
  );

  // 14-day sparkline data
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

  // Combined trend chart data — switches by metric, cumulative for stocks
  // (customers, signups, upgrades), absolute for flow (stamps).
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

  const top5 = useMemo(() => {
    return [...shops]
      .sort((a, b) => b.totalStamps - a.totalStamps)
      .slice(0, 5)
      .filter((s) => s.totalStamps > 0);
  }, [shops]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Shops</h1>
        <p className="text-sm text-muted-foreground">
          {shops.length} signed up · {proCount} on Pro
        </p>
      </div>

      {/* Anchor pill nav — lets users (especially on mobile) jump straight
          past the charts to the tables. Sticks just below the page header on
          scroll. */}
      <nav className="sticky top-0 z-10 -mx-6 flex flex-wrap gap-2 border-b border-border/40 bg-background/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <AnchorPill href="#overview" label="Overview" />
        <AnchorPill href="#trends" label="Trends" />
        <AnchorPill href="#top" label="Top shops" />
        <AnchorPill href="#all" label="All shops" />
      </nav>

      {/* Overview — 5 compact KPI cards (2x2 on mobile, 5x1 on desktop) */}
      <section id="overview" className="scroll-mt-16">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard
            label="Stamps"
            value={totalStamps}
            spark={stampsSpark}
            color={METRIC_COLORS.stamps}
          />
          <KpiCard
            label="Customers"
            value={totalCustomers}
            spark={customersSpark}
            color={METRIC_COLORS.customers}
          />
          <KpiCard
            label="Signups"
            value={shops.length}
            spark={shopsSpark}
            color={METRIC_COLORS.shops}
          />
          <KpiCard
            label="Upgraded"
            value={proCount}
            spark={upgradesSpark}
            color={METRIC_COLORS.upgrades}
            valueSuffix={shops.length > 0 ? ` (${Math.round((proCount / shops.length) * 100)}%)` : ""}
          />
          <KpiCard
            label="MRR"
            value={mrrUsd}
            valuePrefix="$"
            valueSuffix=" /mo"
            spark={upgradesSpark}
            color={METRIC_COLORS.upgrades}
          />
        </div>
      </section>

      {/* Trends — single chart with metric switcher + range toggle */}
      <section id="trends" className="scroll-mt-16">
        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1">
                {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
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
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
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
          </CardContent>
        </Card>
      </section>

      {/* Top performing */}
      {top5.length > 0 && (
        <section id="top" className="scroll-mt-16">
          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                <h2 className="text-sm font-medium">Top performing shops</h2>
              </div>
              <div className="space-y-2">
                {top5.map((shop, i) => (
                  <div
                    key={shop._id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/dashboard/admin/shops/${shop._id}`)
                    }
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="inline-flex items-center gap-1.5 truncate text-sm font-medium">
                        {shop.name}
                        {shop.isPro ? (
                          <Badge className="bg-emerald-500/15 px-1.5 py-0 text-[10px] text-emerald-400 hover:bg-emerald-500/25">
                            <Zap className="mr-0.5 size-2.5" />
                            Pro
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-[10px] text-muted-foreground"
                          >
                            Free
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shop.ownerEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {shop.totalStamps} stamps
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shop.customers} customers
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* All shops table */}
      <section id="all" className="scroll-mt-16">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {(
                  [
                    { key: "name" as SortKey, label: "Shop Name", align: "" },
                    { key: "ownerEmail" as SortKey, label: "Owner", align: "" },
                    {
                      key: "totalStamps" as SortKey,
                      label: "Stamps",
                      align: "text-right",
                    },
                    {
                      key: "customers" as SortKey,
                      label: "Customers",
                      align: "text-right",
                    },
                    { key: "createdAt" as SortKey, label: "Signed Up", align: "" },
                    {
                      key: "lastActive" as SortKey,
                      label: "Last Active",
                      align: "",
                    },
                  ]
                ).map((col) => (
                  <TableHead
                    key={col.key}
                    className={`${col.align} cursor-pointer select-none hover:text-foreground`}
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon col={col.key} />
                  </TableHead>
                ))}
                <TableHead className="w-8"></TableHead>
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
                      <span className="inline-flex items-center gap-1.5">
                        {shop.name}
                        {shop.isPro ? (
                          <Badge className="bg-emerald-500/15 px-1.5 py-0 text-[10px] text-emerald-400 hover:bg-emerald-500/25">
                            <Zap className="mr-0.5 size-2.5" />
                            Pro
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-[10px] text-muted-foreground"
                          >
                            Free
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{shop.ownerEmail}</TableCell>
                    <TableCell className="text-right">
                      {shop.totalStamps}
                    </TableCell>
                    <TableCell className="text-right">{shop.customers}</TableCell>
                    <TableCell>
                      {new Date(shop.createdAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {shop.lastActive
                        ? new Date(shop.lastActive).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })
                        : "—"}
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

interface KpiCardProps {
  label: string;
  value: number;
  spark: number[];
  color: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

function KpiCard({ label, value, spark, color, valuePrefix, valueSuffix }: KpiCardProps) {
  return (
    <Card>
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
          <Sparkline data={spark} color={color} width={64} height={24} />
        </div>
      </CardContent>
    </Card>
  );
}
