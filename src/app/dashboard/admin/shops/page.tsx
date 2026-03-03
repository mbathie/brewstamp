"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronRight, Users, Stamp, Store, Trophy, AlertTriangle } from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, CartesianGrid } from "recharts";

const ADMIN_EMAIL = "mbathie@gmail.com";

interface ShopRow {
  _id: string;
  name: string;
  code: string;
  ownerEmail: string;
  totalStamps: number;
  customers: number;
  createdAt: string;
}

interface ChartPoint {
  _id: string;
  stamps?: number;
  customers?: number;
  shops?: number;
}

type SortKey = "name" | "ownerEmail" | "code" | "totalStamps" | "customers" | "createdAt";
type SortDir = "asc" | "desc";
type TimeRange = "daily" | "weekly" | "monthly";

const chartConfig = {
  stamps: { label: "Stamps", color: "var(--chart-1)" },
  customers: { label: "Customers", color: "var(--chart-2)" },
  shops: { label: "Shops", color: "var(--chart-3)" },
} satisfies ChartConfig;

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

function formatLabel(key: string, range: TimeRange): string {
  if (range === "monthly") {
    const d = new Date(key + "-01T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  if (range === "weekly") {
    const d = new Date(key + "T00:00:00");
    return "w/c " + d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return new Date(key + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function aggregateByRange(
  data: ChartPoint[],
  field: "stamps" | "customers" | "shops",
  range: TimeRange,
): { key: string; value: number }[] {
  const map = new Map<string, number>();
  for (const d of data) {
    const bucket =
      range === "weekly" ? getWeekKey(d._id) :
      range === "monthly" ? getMonthKey(d._id) :
      d._id;
    map.set(bucket, (map.get(bucket) || 0) + ((d as any)[field] || 0));
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));
}

function toCumulative(data: { key: string; value: number }[]): { key: string; value: number }[] {
  let total = 0;
  return data.map(d => {
    total += d.value;
    return { key: d.key, value: total };
  });
}

export default function AdminShopsPage() {
  const { data: session, status } = useSession();
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [charts, setCharts] = useState<{
    dailyStamps: ChartPoint[];
    dailyCustomers: ChartPoint[];
    dailyShops: ChartPoint[];
  }>({ dailyStamps: [], dailyCustomers: [], dailyShops: [] });
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");
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
        if (data.charts) setCharts(data.charts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, status]);

  const sorted = useMemo(() => {
    return [...shops].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortKey === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }

      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal as string);
        return sortDir === "asc" ? cmp : -cmp;
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [shops, sortKey, sortDir]);

  const stampsData = useMemo(() => {
    const agg = aggregateByRange(charts.dailyStamps, "stamps", timeRange);
    return agg.map(d => ({ date: formatLabel(d.key, timeRange), stamps: d.value }));
  }, [charts.dailyStamps, timeRange]);

  const customersData = useMemo(() => {
    const agg = aggregateByRange(charts.dailyCustomers, "customers", timeRange);
    const cum = toCumulative(agg);
    return cum.map(d => ({ date: formatLabel(d.key, timeRange), customers: d.value }));
  }, [charts.dailyCustomers, timeRange]);

  const shopsData = useMemo(() => {
    const agg = aggregateByRange(charts.dailyShops, "shops", timeRange);
    const cum = toCumulative(agg);
    return cum.map(d => ({ date: formatLabel(d.key, timeRange), shops: d.value }));
  }, [charts.dailyShops, timeRange]);

  const totalStamps = useMemo(() => shops.reduce((sum, s) => sum + s.totalStamps, 0), [shops]);
  const totalCustomers = useMemo(() => shops.reduce((sum, s) => sum + s.customers, 0), [shops]);

  const top5 = useMemo(() => {
    return [...shops]
      .sort((a, b) => b.totalStamps - a.totalStamps)
      .slice(0, 5)
      .filter(s => s.totalStamps > 0);
  }, [shops]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "ownerEmail" || key === "code" ? "asc" : "desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="ml-1 inline size-3" />
      : <ArrowDown className="ml-1 inline size-3" />;
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
        <p className="text-muted-foreground">
          All signed up shops ({shops.length})
        </p>
      </div>

      {/* Time range toggle */}
      <div className="inline-flex rounded-lg border p-1">
        {(["daily", "weekly", "monthly"] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              timeRange === range
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stamps</CardDescription>
            <CardTitle className="text-2xl">{totalStamps}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[140px] w-full">
              <AreaChart data={stampsData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="fillStamps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-stamps)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-stamps)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="stamps" stroke="var(--color-stamps)" strokeWidth={2} fill="url(#fillStamps)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Customers</CardDescription>
            <CardTitle className="text-2xl">{totalCustomers}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[140px] w-full">
              <AreaChart data={customersData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="fillCustomers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-customers)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-customers)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="customers" stroke="var(--color-customers)" strokeWidth={2} fill="url(#fillCustomers)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Shop Signups</CardDescription>
            <CardTitle className="text-2xl">{shops.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[140px] w-full">
              <AreaChart data={shopsData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="fillShops" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-shops)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-shops)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="shops" stroke="var(--color-shops)" strokeWidth={2} fill="url(#fillShops)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 shops */}
      {top5.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Trophy className="size-4 text-amber-500" />
            <CardTitle className="text-sm font-medium">Top Performing Shops</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
              {top5.map((shop, i) => (
                <div
                  key={shop._id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/admin/shops/${shop._id}`)}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{shop.name}</p>
                    <p className="text-xs text-muted-foreground">{shop.ownerEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{shop.totalStamps} stamps</p>
                    <p className="text-xs text-muted-foreground">{shop.customers} customers</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {([
                { key: "name" as SortKey, label: "Shop Name", align: "" },
                { key: "ownerEmail" as SortKey, label: "Owner", align: "" },
                { key: "code" as SortKey, label: "Code", align: "" },
                { key: "totalStamps" as SortKey, label: "Stamps", align: "text-right" },
                { key: "customers" as SortKey, label: "Customers", align: "text-right" },
                { key: "createdAt" as SortKey, label: "Signed Up", align: "" },
              ]).map((col) => (
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
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No shops found
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((shop) => (
                <TableRow
                  key={shop._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/admin/shops/${shop._id}`)}
                >
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>{shop.ownerEmail}</TableCell>
                  <TableCell className="font-mono text-xs">{shop.code}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1.5">
                      {shop.totalStamps}
                      {shop.totalStamps >= 100 && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500 text-[10px] px-1 py-0">
                          <AlertTriangle className="mr-0.5 size-2.5" />
                          limit
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{shop.customers}</TableCell>
                  <TableCell>
                    {new Date(shop.createdAt).toLocaleDateString()}
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
    </div>
  );
}
