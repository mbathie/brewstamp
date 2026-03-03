"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronRight, Users, Stamp, Store } from "lucide-react";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

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

const stampsChartConfig = {
  stamps: { label: "Stamps", color: "var(--chart-1)" },
} satisfies ChartConfig;

const customersChartConfig = {
  customers: { label: "Customers", color: "var(--chart-2)" },
} satisfies ChartConfig;

const shopsChartConfig = {
  shops: { label: "Shops", color: "var(--chart-3)" },
} satisfies ChartConfig;

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

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const totalStamps = shops.reduce((sum, s) => sum + s.totalStamps, 0);
  const totalCustomers = shops.reduce((sum, s) => sum + s.customers, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Shops</h1>
        <p className="text-muted-foreground">
          All signed up shops ({shops.length})
        </p>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stamps ({totalStamps})
            </CardTitle>
            <Stamp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ChartContainer config={stampsChartConfig} className="h-[120px] w-full">
              <BarChart data={charts.dailyStamps.map(d => ({ date: formatDate(d._id), stamps: d.stamps }))}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="stamps" fill="var(--color-stamps)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers ({totalCustomers})
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ChartContainer config={customersChartConfig} className="h-[120px] w-full">
              <BarChart data={charts.dailyCustomers.map(d => ({ date: formatDate(d._id), customers: d.customers }))}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="customers" fill="var(--color-customers)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Shop Signups ({shops.length})
            </CardTitle>
            <Store className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ChartContainer config={shopsChartConfig} className="h-[120px] w-full">
              <BarChart data={charts.dailyShops.map(d => ({ date: formatDate(d._id), shops: d.shops }))}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="shops" fill="var(--color-shops)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

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
                  <TableCell className="text-right">{shop.totalStamps}</TableCell>
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
