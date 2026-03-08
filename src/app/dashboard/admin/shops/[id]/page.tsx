"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ExternalLink,
  Users,
  Stamp,
  Gift,
  Check,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap,
  Search,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";

const ADMIN_EMAIL = "mbathie@gmail.com";

const activityChartConfig = {
  visits: { label: "Visits", color: "var(--chart-1)" },
  stamps: { label: "Stamps", color: "var(--chart-2)" },
  redeems: { label: "Redeems", color: "var(--chart-3)" },
} satisfies ChartConfig;

interface ShopDetail {
  shop: {
    _id: string;
    name: string;
    code: string;
    stampThreshold: number;
    bgColor: string;
    fgColor: string;
    bgPattern: string;
    logo: boolean;
    createdAt: string;
    dripDay3Sent: boolean;
    dripDay7Sent: boolean;
    isPro: boolean;
    owner: { name: string; email: string; phone?: string; authMethods?: string[] };
  };
  customers: {
    name: string | null;
    email: string | null;
    cookieId: string | null;
    stamps: number;
    totalEarned: number;
    freeRedeemed: number;
    lastVisit: string;
  }[];
  stats: {
    totalCustomers: number;
    totalApproved: number;
    totalRejected: number;
    totalRedeems: number;
    totalStampsAwarded: number;
    firstActivity: string | null;
    lastActivity: string | null;
  };
  dailyActivity: {
    _id: string;
    stamps: number;
    visits: number;
    redeems: number;
  }[];
  recentRequests: RequestRow[];
}

interface RequestRow {
  status: string;
  stampsAwarded: number;
  redeem: boolean;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: string;
}

type CustSortKey = "name" | "email" | "stamps" | "totalEarned" | "freeRedeemed" | "lastVisit";
type ReqSortKey = "customer" | "status" | "stampsAwarded" | "redeem" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function AdminShopDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const [data, setData] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Customer table state
  const [custSearch, setCustSearch] = useState("");
  const [custSortKey, setCustSortKey] = useState<CustSortKey>("lastVisit");
  const [custSortDir, setCustSortDir] = useState<SortDir>("desc");
  const [custPage, setCustPage] = useState(0);

  // Request table state
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [reqSortKey, setReqSortKey] = useState<ReqSortKey>("createdAt");
  const [reqSortDir, setReqSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.email !== ADMIN_EMAIL) {
      redirect("/dashboard");
    }

    fetch(`/api/admin/shops/${params.id}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, status, params.id]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter, reqSortKey, reqSortDir]);

  const filteredRequests = useMemo(() => {
    if (!data) return [];
    let rows = data.recentRequests;

    // Filter by status
    if (statusFilter.length > 0) {
      rows = rows.filter((r) => statusFilter.includes(r.status));
    }

    // Sort
    return [...rows].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (reqSortKey) {
        case "customer":
          aVal = (a.customerName || a.customerEmail || "").toLowerCase();
          bVal = (b.customerName || b.customerEmail || "").toLowerCase();
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "stampsAwarded":
          aVal = a.stampsAwarded ?? 0;
          bVal = b.stampsAwarded ?? 0;
          break;
        case "redeem":
          aVal = a.redeem ? 1 : 0;
          bVal = b.redeem ? 1 : 0;
          break;
        case "createdAt":
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal as string);
        return reqSortDir === "asc" ? cmp : -cmp;
      }
      return reqSortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [data, statusFilter, reqSortKey, reqSortDir]);

  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE);
  const pagedRequests = filteredRequests.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  function toggleReqSort(key: ReqSortKey) {
    if (reqSortKey === key) {
      setReqSortDir(reqSortDir === "asc" ? "desc" : "asc");
    } else {
      setReqSortKey(key);
      setReqSortDir(key === "createdAt" || key === "stampsAwarded" ? "desc" : "asc");
    }
  }

  function ReqSortIcon({ col }: { col: ReqSortKey }) {
    if (reqSortKey !== col) return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />;
    return reqSortDir === "asc"
      ? <ArrowUp className="ml-1 inline size-3" />
      : <ArrowDown className="ml-1 inline size-3" />;
  }

  // Customer table sort/pagination
  useEffect(() => {
    setCustPage(0);
  }, [custSortKey, custSortDir, custSearch]);

  const sortedCustomers = useMemo(() => {
    if (!data) return [];
    let rows = data.customers;
    if (custSearch.trim()) {
      const q = custSearch.toLowerCase();
      rows = rows.filter((c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (custSortKey) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "email":
          aVal = (a.email || "").toLowerCase();
          bVal = (b.email || "").toLowerCase();
          break;
        case "stamps":
          aVal = a.stamps; bVal = b.stamps; break;
        case "totalEarned":
          aVal = a.totalEarned; bVal = b.totalEarned; break;
        case "freeRedeemed":
          aVal = a.freeRedeemed; bVal = b.freeRedeemed; break;
        case "lastVisit":
        default:
          aVal = new Date(a.lastVisit).getTime();
          bVal = new Date(b.lastVisit).getTime();
          break;
      }
      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal as string);
        return custSortDir === "asc" ? cmp : -cmp;
      }
      return custSortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [data, custSearch, custSortKey, custSortDir]);

  const custTotalPages = Math.ceil(sortedCustomers.length / PAGE_SIZE);
  const pagedCustomers = sortedCustomers.slice(
    custPage * PAGE_SIZE,
    (custPage + 1) * PAGE_SIZE,
  );

  function toggleCustSort(key: CustSortKey) {
    if (custSortKey === key) {
      setCustSortDir(custSortDir === "asc" ? "desc" : "asc");
    } else {
      setCustSortKey(key);
      setCustSortDir(key === "lastVisit" || key === "stamps" || key === "totalEarned" || key === "freeRedeemed" ? "desc" : "asc");
    }
  }

  function CustSortIcon({ col }: { col: CustSortKey }) {
    if (custSortKey !== col) return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />;
    return custSortDir === "asc"
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

  if (!data?.shop) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Shop not found</p>
      </div>
    );
  }

  const { shop, customers, stats, dailyActivity } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/admin/shops"
          className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {shop.name}
            </h1>
            {shop.isPro ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs px-2 py-0.5">
                <Zap className="mr-1 size-3" />
                Pro
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-xs px-2 py-0.5">
                Free
              </Badge>
            )}
            <a
              href={`/s/${shop.code}?checkin=0`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            {shop.owner.name} &middot; {shop.owner.email}
            {shop.owner.phone && ` · ${shop.owner.phone}`}
            {shop.owner.authMethods && shop.owner.authMethods.length > 0 && (
              <> &middot; Auth: {shop.owner.authMethods.join(", ")}</>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Code: <span className="font-mono">{shop.code}</span> &middot;
            Threshold: {shop.stampThreshold} stamps &middot; Signed up{" "}
            {new Date(shop.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" })}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stamps Given
            </CardTitle>
            <Stamp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalStampsAwarded}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Free Drinks Redeemed
            </CardTitle>
            <Gift className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalRedeems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Activity
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.lastActivity
                ? timeAgo(new Date(stats.lastActivity))
                : "Never"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={shop.dripDay3Sent ? "default" : "outline"} className={shop.dripDay3Sent ? "bg-green-600 hover:bg-green-600" : "border-red-400/50 text-red-400"}>
          {shop.dripDay3Sent ? <Check className="mr-1 size-3" /> : <X className="mr-1 size-3" />}
          Day 3 drip
        </Badge>
        <Badge variant={shop.dripDay7Sent ? "default" : "outline"} className={shop.dripDay7Sent ? "bg-green-600 hover:bg-green-600" : "border-red-400/50 text-red-400"}>
          {shop.dripDay7Sent ? <Check className="mr-1 size-3" /> : <X className="mr-1 size-3" />}
          Day 7 drip
        </Badge>
        <Badge variant={shop.logo ? "default" : "outline"} className={shop.logo ? "bg-green-600 hover:bg-green-600" : "border-red-400/50 text-red-400"}>
          {shop.logo ? <Check className="mr-1 size-3" /> : <X className="mr-1 size-3" />}
          Logo
        </Badge>
        {(() => {
          const customColors = shop.bgColor !== "stone-800" || shop.fgColor !== "amber-600";
          return (
            <Badge variant={customColors ? "default" : "outline"} className={customColors ? "bg-green-600 hover:bg-green-600" : "border-red-400/50 text-red-400"}>
              {customColors ? <Check className="mr-1 size-3" /> : <X className="mr-1 size-3" />}
              Colors
            </Badge>
          );
        })()}
        {(() => {
          const customPattern = shop.bgPattern && shop.bgPattern !== "none";
          return (
            <Badge variant={customPattern ? "default" : "outline"} className={customPattern ? "bg-green-600 hover:bg-green-600" : "border-red-400/50 text-red-400"}>
              {customPattern ? <Check className="mr-1 size-3" /> : <X className="mr-1 size-3" />}
              Pattern
            </Badge>
          );
        })()}
      </div>

      {/* Customers table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Customers ({sortedCustomers.length}{custSearch.trim() ? ` of ${customers.length}` : ""})
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={custSearch}
              onChange={(e) => setCustSearch(e.target.value)}
              className="pl-9 text-foreground"
            />
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { key: "name" as CustSortKey, label: "Name", align: "" },
                  { key: "email" as CustSortKey, label: "Email", align: "" },
                  { key: "stamps" as CustSortKey, label: "Current Stamps", align: "text-right" },
                  { key: "totalEarned" as CustSortKey, label: "Total Earned", align: "text-right" },
                  { key: "freeRedeemed" as CustSortKey, label: "Free Drinks", align: "text-right" },
                  { key: "lastVisit" as CustSortKey, label: "Last Visit", align: "" },
                ].map(({ key, label, align }) => (
                  <TableHead
                    key={key}
                    className={`cursor-pointer select-none ${align}`}
                    onClick={() => toggleCustSort(key)}
                  >
                    {label}
                    <CustSortIcon col={key} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No customers yet
                  </TableCell>
                </TableRow>
              ) : (
                pagedCustomers.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {c.name || (
                        <span className="text-muted-foreground">Anonymous</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.email || (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{c.stamps}</TableCell>
                    <TableCell className="text-right">{c.totalEarned}</TableCell>
                    <TableCell className="text-right">
                      {c.freeRedeemed}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.lastVisit).toLocaleString("en-AU", { day: "numeric", month: "short", year: "2-digit", hour: "numeric", minute: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Customer pagination */}
        {custTotalPages > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {custPage + 1} of {custTotalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={custPage === 0}
                onClick={() => setCustPage(custPage - 1)}
                className="border-border text-foreground"
              >
                <ChevronLeft className="mr-1 size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={custPage >= custTotalPages - 1}
                onClick={() => setCustPage(custPage + 1)}
                className="border-border text-foreground"
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Daily activity chart */}
      {dailyActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Daily Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityChartConfig} className="h-[250px] w-full">
              <BarChart
                data={[...dailyActivity].reverse().map((day) => ({
                  date: new Date(day._id + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
                  visits: day.visits,
                  stamps: day.stamps,
                  redeems: day.redeems,
                }))}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="visits" fill="var(--color-visits)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="stamps" fill="var(--color-stamps)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="redeems" fill="var(--color-redeems)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Requests table */}
      {data.recentRequests.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Requests ({filteredRequests.length})
            </h2>
            <MultiSelect
              values={statusFilter}
              onValuesChange={setStatusFilter}
            >
              <MultiSelectTrigger className="h-9 min-w-[140px]">
                <MultiSelectValue placeholder="All statuses" />
              </MultiSelectTrigger>
              <MultiSelectContent search={false}>
                <MultiSelectItem value="approved">
                  <span className="text-green-500">approved</span>
                </MultiSelectItem>
                <MultiSelectItem value="rejected">
                  <span className="text-red-400">rejected</span>
                </MultiSelectItem>
                <MultiSelectItem value="expired">
                  <span className="text-muted-foreground">expired</span>
                </MultiSelectItem>
                <MultiSelectItem value="pending">
                  <span className="text-yellow-500">pending</span>
                </MultiSelectItem>
              </MultiSelectContent>
            </MultiSelect>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {([
                    { key: "customer" as ReqSortKey, label: "Customer", align: "" },
                    { key: "status" as ReqSortKey, label: "Status", align: "" },
                    { key: "stampsAwarded" as ReqSortKey, label: "Stamps", align: "text-right" },
                    { key: "redeem" as ReqSortKey, label: "Redeem", align: "" },
                    { key: "createdAt" as ReqSortKey, label: "Time", align: "" },
                  ]).map((col) => (
                    <TableHead
                      key={col.key}
                      className={`${col.align} cursor-pointer select-none hover:text-foreground`}
                      onClick={() => toggleReqSort(col.key)}
                    >
                      {col.label}
                      <ReqSortIcon col={col.key} />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No requests match filter
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedRequests.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {r.customerName || r.customerEmail || (
                          <span className="text-muted-foreground">Anonymous</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            r.status === "approved"
                              ? "border-green-500/50 text-green-500"
                              : r.status === "rejected"
                                ? "border-red-400/50 text-red-400"
                                : "text-muted-foreground"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.stampsAwarded ?? "—"}
                      </TableCell>
                      <TableCell>
                        {r.redeem ? (
                          <Gift className="size-4 text-amber-500" />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString("en-AU", { day: "numeric", month: "short", year: "2-digit", hour: "numeric", minute: "2-digit" })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="border-border text-foreground"
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="border-border text-foreground"
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
