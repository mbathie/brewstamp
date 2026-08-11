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
  ChevronLeft,
  ChevronRight,
  Zap,
  Search,
  Check,
  Circle,
  Globe,
  Compass,
  Gift,
  Coffee,
} from "lucide-react";
import { Sparkline } from "@/components/sparkline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
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
import { Area, AreaChart, XAxis, CartesianGrid } from "recharts";
import { LANGUAGE_META } from "@/lib/i18n";

const ADMIN_EMAIL = "mbathie@gmail.com";

function langFlag(code: string): string {
  const key = code as keyof typeof LANGUAGE_META;
  return LANGUAGE_META[key]?.flag ?? "🏳";
}

type ActivityMetric = "stamps" | "visits" | "redeems";

const ACTIVITY_LABEL: Record<ActivityMetric, string> = {
  stamps: "Stamps",
  visits: "Visits",
  redeems: "Redeems",
};

const ACTIVITY_COLOR: Record<ActivityMetric, string> = {
  stamps: "var(--chart-2)",
  visits: "var(--chart-1)",
  redeems: "var(--chart-3)",
};

const activityChartConfig = {
  value: { label: "Value", color: "var(--chart-2)" },
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
    goLiveNudgeSent: boolean;
    upgradeNudgeSent: boolean;
    firstCustomerEmailSent: boolean;
    language: string;
    isPro: boolean;
    perkMode: boolean;
    walletPasses: boolean;
    planSlug: string;
    planLabel: string;
    owner: {
      name: string;
      email: string;
      phone?: string;
      authMethods?: string[];
      signupReferrer?: string;
      signupLandingPage?: string;
    };
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

// Tier badge colours, kept in sync with the admin shops list.
const PLAN_BADGE: Record<string, string> = {
  free: "border-border text-muted-foreground",
  pro: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  plus: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  max: "border-violet-500/30 bg-violet-500/15 text-violet-300",
};

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

  const [activityMetric, setActivityMetric] = useState<ActivityMetric>("stamps");

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

  // 14-day sparklines for the KPI cards. dailyActivity may only contain days
  // that had activity, so we backfill zeros for missing dates.
  const sparks = useMemo(() => {
    const empty = { stamps: [0], visits: [0], redeems: [0] };
    if (!data) return empty;
    const byDay = new Map(data.dailyActivity.map((d) => [d._id, d]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const stamps: number[] = [];
    const visits: number[] = [];
    const redeems: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const row = byDay.get(key);
      stamps.push(row?.stamps ?? 0);
      visits.push(row?.visits ?? 0);
      redeems.push(row?.redeems ?? 0);
    }
    return { stamps, visits, redeems };
  }, [data]);

  // Activity chart series — last 30 days of the selected metric.
  const activitySeries = useMemo(() => {
    if (!data) return [] as Array<{ date: string; value: number }>;
    const byDay = new Map(data.dailyActivity.map((d) => [d._id, d]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const series: Array<{ date: string; value: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const row = byDay.get(key);
      series.push({
        date: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
        value: row?.[activityMetric] ?? 0,
      });
    }
    return series;
  }, [data, activityMetric]);

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

  const customColors = shop.bgColor !== "stone-800" || shop.fgColor !== "amber-600";
  const customPattern = !!shop.bgPattern && shop.bgPattern !== "none";
  const langChanged = !!shop.language && shop.language !== "en";

  const setupItems: Array<{ label: string; on: boolean; icon?: string }> = [
    { label: "Logo", on: !!shop.logo },
    { label: "Colors", on: customColors },
    { label: "Pattern", on: customPattern },
    {
      // Language always counts as configured — even English is a valid
      // choice. Surface the flag in the indicator slot so the merchant can
      // see at a glance which language the customer card is in.
      label: `Language · ${(shop.language || "en").toUpperCase()}`,
      on: true,
      icon: langFlag(shop.language || "en"),
    },
    { label: "Wallet passes", on: shop.walletPasses },
  ];
  const outreachItems: Array<{ label: string; on: boolean }> = [
    { label: "1st-stamp email", on: !!shop.firstCustomerEmailSent },
    { label: "Go-live nudge", on: !!shop.goLiveNudgeSent },
    { label: "Upgrade nudge", on: !!shop.upgradeNudgeSent },
  ];

  const referrer = shop.owner.signupReferrer || "";
  const landing = shop.owner.signupLandingPage || "";
  const referrerHost = referrer ? safeHost(referrer) : "";

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
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">{shop.name}</h1>
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 hover:bg-transparent ${
                PLAN_BADGE[shop.planSlug] ?? PLAN_BADGE.free
              }`}
            >
              {shop.planSlug !== "free" && <Zap className="mr-1 size-3" />}
              {shop.planLabel}
            </Badge>
            {shop.perkMode && (
              <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/15 text-xs px-2 py-0.5">
                <Coffee className="mr-1 size-3" />
                Perk
              </Badge>
            )}
            <a
              href={`/s/${shop.code}?checkin=0`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              title="Open customer view"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            {shop.owner.name} &middot; {shop.owner.email}
            {shop.owner.phone && ` · ${shop.owner.phone}`}
            {shop.owner.authMethods && shop.owner.authMethods.length > 0 && (
              <> &middot; {shop.owner.authMethods.join(", ")}</>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{shop.code}</span>
            {" · "}
            Threshold {shop.stampThreshold}
            {" · "}
            Signed up{" "}
            {new Date(shop.createdAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "2-digit",
            })}
          </p>
          {(referrer || landing) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
              {landing && (
                <span className="inline-flex items-center gap-1.5">
                  <Compass className="size-3 text-amber-500" />
                  <span>
                    Landed on{" "}
                    <span className="font-mono text-foreground">{landing}</span>
                  </span>
                </span>
              )}
              {referrer && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="size-3 text-amber-500" />
                  <span>
                    From{" "}
                    <a
                      href={referrer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {referrerHost || referrer}
                    </a>
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Anchor pill nav */}
      <nav className="sticky top-0 z-10 -mx-6 flex flex-wrap gap-2 border-b border-border/40 bg-background/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <AnchorPill href="#overview" label="Overview" />
        <AnchorPill href="#activity" label="Activity" />
        <AnchorPill href="#customers" label="Customers" />
        {data.recentRequests.length > 0 && (
          <AnchorPill href="#requests" label="Requests" />
        )}
      </nav>

      {/* Overview — compact KPI cards */}
      <section id="overview" className="scroll-mt-16 space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Customers"
            value={stats.totalCustomers}
            spark={sparks.visits}
            color="var(--chart-1)"
          />
          <KpiCard
            label="Stamps given"
            value={stats.totalStampsAwarded}
            spark={sparks.stamps}
            color="var(--chart-2)"
          />
          <KpiCard
            label="Free rewards redeemed"
            value={stats.totalRedeems}
            spark={sparks.redeems}
            color="var(--chart-3)"
          />
          <KpiCard
            label="Last activity"
            textValue={stats.lastActivity ? timeAgo(new Date(stats.lastActivity)) : "Never"}
            spark={sparks.stamps}
            color="var(--chart-2)"
          />
        </div>

        {/* Setup & outreach checklist — replaces the old red/green badge wall */}
        <div className="grid gap-3 md:grid-cols-2">
          <ChecklistCard title="Setup" items={setupItems} />
          <ChecklistCard title="Outreach emails" items={outreachItems} />
        </div>
      </section>

      {/* Customers table */}
      <section id="customers" className="scroll-mt-16">
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
      </section>

      {/* Activity chart — metric switcher over a 30d area chart */}
      {dailyActivity.length > 0 && (
        <section id="activity" className="scroll-mt-16">
          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Daily activity
                  </h2>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
                <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
                  {(["stamps", "visits", "redeems"] as ActivityMetric[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setActivityMetric(m)}
                      className={`cursor-pointer rounded-md px-3 py-1 text-xs transition-colors ${
                        activityMetric === m
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {ACTIVITY_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>
              <ChartContainer config={activityChartConfig} className="h-[220px] w-full">
                <AreaChart
                  data={activitySeries}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACTIVITY_COLOR[activityMetric]} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={ACTIVITY_COLOR[activityMetric]} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    minTickGap={24}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={ACTIVITY_COLOR[activityMetric]}
                    strokeWidth={2}
                    fill="url(#activityFill)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Requests table */}
      {data.recentRequests.length > 0 && (
        <section id="requests" className="scroll-mt-16">
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
        </section>
      )}
    </div>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function AnchorPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex h-7 items-center rounded-full bg-muted/50 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {label}
    </a>
  );
}

interface KpiCardProps {
  label: string;
  value?: number;
  textValue?: string;
  spark: number[];
  color: string;
}

function KpiCard({ label, value, textValue, spark, color }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2 px-4 py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-end justify-between gap-3">
          <p className="text-2xl font-bold leading-none text-foreground">
            {textValue ?? (value ?? 0).toLocaleString()}
          </p>
          <Sparkline data={spark} color={color} width={64} height={24} />
        </div>
      </CardContent>
    </Card>
  );
}

function ChecklistCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; on: boolean; icon?: string }>;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <ul className="space-y-1.5">
          {items.map(({ label, on, icon }) => (
            <li key={label} className="flex items-center gap-2 text-sm">
              {icon ? (
                <span className="inline-flex size-4 shrink-0 items-center justify-center text-base leading-none">
                  {icon}
                </span>
              ) : on ? (
                <Check className="size-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground/40" />
              )}
              <span className={on ? "text-foreground" : "text-muted-foreground"}>
                {label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
