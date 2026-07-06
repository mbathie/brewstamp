"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pager } from "@/components/ui/pager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowDown,
  ArrowUp,
  CalendarIcon,
  Crown,
  Download,
  Monitor,
  QrCode,
  Settings as SettingsIcon,
  Smartphone,
  UserPen,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function fmtRangeLabel(r: DateRange | undefined): string {
  if (!r?.from) return "";
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "2-digit",
  };
  const from = r.from.toLocaleDateString("en-AU", opts);
  if (!r.to || r.from.toDateString() === r.to.toDateString()) return from;
  const to = r.to.toLocaleDateString("en-AU", opts);
  return `${from} – ${to}`;
}
import Link from "next/link";
import { generateAnimalName } from "@/lib/animal-names";
import { Sparkline } from "@/components/sparkline";
import { getProgram } from "@/lib/program";
import { ActivityValue } from "@/components/activity-value";

type Range = "today" | "week" | "month" | "all" | "date";

interface CheckIn {
  _id: string;
  customer: {
    _id: string;
    name?: string;
    email?: string;
    cookieId: string;
  };
  stampsAwarded: number;
  redeem?: boolean;
  status: string;
  createdAt: string;
  tags?: string[];
}

interface TopCustomer {
  rank: number;
  id: string;
  name: string | null;
  email: string | null;
  cookieId: string;
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
  lastSeenAt: string;
}

interface ChartPoint {
  _id: string | number;
  stamps: number;
  checkins: number;
  redeems: number;
}

interface Props {
  shopName: string;
  shopCode: string;
  shopLogo?: string | null;
  stampThreshold: number;
  perkMode?: boolean;
  isNewShop: boolean;
  hasEarnedStamps?: boolean;
  hasActivity?: boolean;
  needsProfileUpdate?: boolean;
  setupComplete?: boolean;
}

const chartConfig = {
  stamps: {
    label: "Stamps",
    color: "var(--color-amber-500)",
  },
  redeems: {
    label: "Redeems",
    color: "var(--color-green-500)",
  },
} satisfies ChartConfig;

export default function DashboardContent({
  shopName,
  shopCode,
  shopLogo,
  stampThreshold,
  perkMode = false,
  isNewShop,
  hasEarnedStamps = false,
  hasActivity = false,
  needsProfileUpdate,
  setupComplete = false,
}: Props) {
  const program = getProgram(perkMode);
  const [range, setRange] = useState<Range>("today");
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState({ customers: 0, stamps: 0, redeems: 0 });
  const [prevStats, setPrevStats] = useState({
    customers: 0,
    stamps: 0,
    redeems: 0,
  });
  const [sparkline, setSparkline] = useState<{
    stamps: number[];
    customers: number[];
    redeems: number[];
  }>({
    stamps: [],
    customers: [],
    redeems: [],
  });
  const [chartRaw, setChartRaw] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topLoading, setTopLoading] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);

  // Reset to first page when range/date filter changes
  useEffect(() => {
    setPage(0);
  }, [range, selectedRange]);

  // Fetch active dates for the calendar
  useEffect(() => {
    fetch("/api/stamp-request/active-dates")
      .then((r) => r.json())
      .then((data) => {
        setActiveDates(new Set(data.dates || []));
      })
      .catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (range === "date" && selectedRange?.from) {
      const to = selectedRange.to ?? selectedRange.from;
      params.set("from", toIsoDate(selectedRange.from));
      params.set("to", toIsoDate(to));
    } else {
      params.set("range", range === "date" ? "today" : range);
    }
    fetch(`/api/stamp-request/history?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCheckins(data.requests || []);
        setStats(data.stats || { customers: 0, stamps: 0, redeems: 0 });
        setPrevStats(data.prevStats || { customers: 0, stamps: 0, redeems: 0 });
        setSparkline(
          data.sparkline || { stamps: [], customers: [], redeems: [] },
        );
        setChartRaw(data.chart || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range, selectedRange, refreshKey]);

  // Listen for stamp approvals to auto-refresh
  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("stamp-approved", handler);
    return () => window.removeEventListener("stamp-approved", handler);
  }, []);

  // Top customers — lifetime ranking, doesn't depend on the date filter so
  // we fetch independently. Refreshes when a stamp is approved so the list
  // can shift in real time.
  useEffect(() => {
    setTopLoading(true);
    fetch("/api/customers/top?limit=5")
      .then((r) => r.json())
      .then((data) => {
        setTopCustomers(data.customers || []);
        setTopLoading(false);
      })
      .catch(() => setTopLoading(false));
  }, [refreshKey]);

  const chartData = useMemo(() => {
    // Custom range covering more than one day → fall through to the daily
    // binning path below so the chart shows one bar per day.
    const isMultiDay =
      range === "date" &&
      !!selectedRange?.from &&
      !!selectedRange?.to &&
      selectedRange.from.toDateString() !== selectedRange.to.toDateString();

    if (!isMultiDay && (range === "today" || range === "date")) {
      const targetDay = range === "date" ? selectedRange?.from : undefined;
      const isToday =
        range === "today" ||
        (targetDay && targetDay.toDateString() === new Date().toDateString());
      const currentHour = isToday ? new Date().getHours() : 23;
      const hours: Record<number, ChartPoint> = {};
      for (let h = 0; h <= currentHour; h++) {
        hours[h] = { _id: h, stamps: 0, checkins: 0, redeems: 0 };
      }
      for (const p of chartRaw) {
        const h = Number(p._id);
        if (hours[h]) {
          hours[h] = p;
        }
      }
      // Trim to the active band: from the earlier of (first activity hour, 6am)
      // to the later of (current hour, last activity hour, 6pm). Avoids the
      // dead-empty 09:00→18:00 stretch on quiet mornings.
      const allHours = Object.values(hours).sort(
        (a, b) => Number(a._id) - Number(b._id),
      );
      const activeHours = allHours.filter((p) => p.stamps > 0 || p.redeems > 0);
      let startHour = 6;
      let endHour = Math.max(currentHour, 18);
      if (activeHours.length > 0) {
        startHour = Math.min(startHour, Number(activeHours[0]._id));
        endHour = Math.max(
          endHour,
          Number(activeHours[activeHours.length - 1]._id),
        );
      }
      return allHours
        .filter((p) => Number(p._id) >= startHour && Number(p._id) <= endHour)
        .map((p) => ({
          label: `${String(p._id).padStart(2, "0")}:00`,
          stamps: p.stamps,
          redeems: p.redeems,
        }));
    } else if (range === "all") {
      // Backend returns YYYY-MM keys. Render every month between the first
      // active month and the current month (no gaps).
      if (chartRaw.length === 0) return [];
      const keys = chartRaw.map((p) => String(p._id)).sort();
      const [startY, startM] = keys[0].split("-").map(Number);
      const now = new Date();
      const monthMap: Record<string, ChartPoint> = {};
      const cursor = new Date(startY, startM - 1, 1);
      const endCursor = new Date(now.getFullYear(), now.getMonth(), 1);
      while (cursor <= endCursor) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        monthMap[key] = { _id: key, stamps: 0, checkins: 0, redeems: 0 };
        cursor.setMonth(cursor.getMonth() + 1);
      }
      for (const p of chartRaw) {
        const key = String(p._id);
        if (monthMap[key]) monthMap[key] = p;
      }
      return Object.values(monthMap).map((p) => {
        const [y, m] = String(p._id).split("-").map(Number);
        const d = new Date(y, m - 1, 1);
        return {
          label: d.toLocaleDateString("en-AU", {
            month: "short",
            year: "2-digit",
          }),
          stamps: p.stamps,
          redeems: p.redeems,
        };
      });
    } else {
      // week, month, or custom multi-day range — bin by day
      let startDate: Date;
      let endDate: Date;
      if (range === "date" && selectedRange?.from) {
        startDate = new Date(selectedRange.from);
        endDate = new Date(selectedRange.to ?? selectedRange.from);
      } else {
        endDate = new Date();
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (range === "week" ? 7 : 30));
      }
      const dateMap: Record<string, ChartPoint> = {};
      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        const key = toIsoDate(cursor);
        dateMap[key] = { _id: key, stamps: 0, checkins: 0, redeems: 0 };
        cursor.setDate(cursor.getDate() + 1);
      }
      for (const p of chartRaw) {
        const key = String(p._id);
        if (dateMap[key]) {
          dateMap[key] = p;
        }
      }
      const spanDays =
        Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
      // Short labels for ≤ ~10-day spans (weekday name), numeric day-of-month
      // otherwise so longer ranges stay readable.
      const fmt: Intl.DateTimeFormatOptions =
        spanDays > 10 ? { day: "numeric" } : { weekday: "short" };
      return Object.values(dateMap).map((p) => ({
        label: new Date(String(p._id) + "T00:00:00").toLocaleDateString(
          "en-AU",
          fmt,
        ),
        stamps: p.stamps,
        redeems: p.redeems,
      }));
    }
  }, [chartRaw, range, selectedRange]);

  // Whether the chart has any non-zero bar — drives the empty-state fallback.
  const chartHasData = useMemo(
    () => chartData.some((d) => d.stamps > 0 || d.redeems > 0),
    [chartData],
  );
  const rangeNoun =
    range === "today"
      ? "day"
      : range === "week"
        ? "week"
        : range === "month"
          ? "month"
          : range === "date"
            ? "range"
            : "period";

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const singleDay =
      range === "date" &&
      selectedRange?.from &&
      (!selectedRange.to ||
        selectedRange.from.toDateString() === selectedRange.to.toDateString());
    const isToday =
      range === "today" ||
      (singleDay && d.toDateString() === selectedRange!.from!.toDateString());
    if (isToday) {
      return d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    const opts: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    };
    if (range === "all") opts.year = "2-digit";
    return d.toLocaleString(undefined, opts);
  }

  const hasRedeems = checkins.some((c) => c.redeem);

  // Customer-grouping: identify consecutive runs of the same customer so we
  // render the name + email only on the first row of each run.
  const PAGE_SIZE = 10;
  const pageStart = page * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;

  const groupedCheckins = useMemo(() => {
    const slice = checkins.slice(pageStart, pageEnd);
    return slice.map((c, i) => {
      const prev = slice[i - 1];
      const next = slice[i + 1];
      const sameAsPrev = !!prev && prev.customer?._id === c.customer?._id;
      const sameAsNext = !!next && next.customer?._id === c.customer?._id;
      return { ...c, sameAsPrev, sameAsNext };
    });
  }, [checkins, pageStart, pageEnd]);

  // Show the welcome / activation card until the shop earns its first stamp.
  const showSetup = isNewShop || !hasEarnedStamps;
  // Customers have been scanning but no stamp has actually been awarded yet.
  const stuckOnActivation = !isNewShop && hasActivity && !hasEarnedStamps;
  // Set up and tested, but not yet running for real customers — reframe the
  // checklist as "go live" rather than "welcome".
  const testedNotLive = isNewShop && hasEarnedStamps;

  return (
    <div className="space-y-6">
      {showSetup ? (
        <div className="space-y-6">
          <Card className="border-amber-600/30 bg-amber-700/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground">
                {stuckOnActivation
                  ? perkMode
                    ? "You're almost there — let's approve your first free reward"
                    : "You're almost there — let's land your first stamp"
                  : testedNotLive
                    ? "You've tested it — now go live"
                    : "Welcome! Let's get you set up"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-sm text-muted-foreground">
                {stuckOnActivation
                  ? perkMode
                    ? "Staff have started scanning your QR code but no free rewards have been approved yet. Walk through step 4 below to approve your first one."
                    : "Customers have started scanning your QR code but no stamps have been approved yet. Walk through step 4 below to award your first one."
                  : testedNotLive
                    ? perkMode
                      ? "Your perk is set up and tested. Put your QR code where staff can scan it to start serving free rewards for real."
                      : "Your card is set up and tested. Put your QR code on the counter to start collecting stamps from real customers."
                    : perkMode
                      ? "Follow these four steps to start serving free rewards to your staff."
                      : "Follow these four steps to start collecting stamps from your customers."}
              </p>
              <div className="space-y-5">
                {needsProfileUpdate && (
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-600/30 bg-amber-700/10 text-sm font-bold text-amber-700">
                      <UserPen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          Complete your profile
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add your name and contact info in{" "}
                        <Link
                          href="/dashboard/settings"
                          className="font-medium text-amber-700 hover:underline"
                        >
                          Shop Setup
                        </Link>{" "}
                        so customers know who you are.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-amber-700" />
                      <p className="font-medium text-foreground">
                        Download &amp; print your QR code
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Go to{" "}
                      <Link
                        href="/dashboard/settings"
                        className="font-medium text-amber-700 hover:underline"
                      >
                        Shop Setup
                      </Link>{" "}
                      to download a printable PDF with your shop&apos;s unique
                      QR code. Print it out and place it where customers can
                      easily scan it — at the register, on the counter, or next
                      to the menu.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-amber-700" />
                      <p className="font-medium text-foreground">
                        Stay logged in at the point of sale
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Keep this dashboard open on a device at your counter — a
                      tablet, laptop, or phone. When a customer scans the QR
                      code, a {perkMode ? "free-coffee" : "stamp"} request will
                      pop up here for you to approve in real-time.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-amber-700" />
                      <p className="font-medium text-foreground">
                        Customers scan &amp; you approve
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Customers simply point their phone camera at the QR code —
                      no app download or account needed. You&apos;ll see a
                      request instantly on your dashboard and can approve it
                      with one tap.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-sm font-bold text-white">
                    4
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-amber-700" />
                      <p className="font-medium text-foreground">
                        Try it yourself right now
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Don&apos;t wait for a real customer — test the flow now so
                      you know what to expect. Open the QR code from{" "}
                      <Link
                        href="/dashboard/settings"
                        className="font-medium text-amber-700 hover:underline"
                      >
                        Shop Setup
                      </Link>{" "}
                      on this device, point your phone&apos;s camera at the
                      screen, complete the customer flow on your phone, then
                      come back here and approve the{" "}
                      {perkMode ? "free-coffee" : "stamp"} request when it
                      appears. Once you&apos;ve done it once, you&apos;ll never
                      second-guess a real one.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/dashboard/settings">
                  <Button className="cursor-pointer bg-amber-700 hover:bg-amber-800">
                    <Download className="mr-2 h-4 w-4" />
                    {stuckOnActivation
                      ? "Open your QR code"
                      : "Go to Shop Setup to download your QR code"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {!setupComplete && (
            <Card className="border-amber-600/30 bg-amber-700/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <SettingsIcon className="h-5 w-5 text-amber-700" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Make your loyalty card yours
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Add your logo and pick brand colors so the customer card
                      matches your shop.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/settings">
                  <Button
                    size="sm"
                    className="cursor-pointer bg-amber-700 hover:bg-amber-800"
                  >
                    Open Shop Setup
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {shopName} Dashboard
            </h1>
            <div className="flex gap-1 rounded-lg border p-1">
              {(["today", "week", "month", "all"] as Range[]).map((r) => (
                <Button
                  key={r}
                  variant={range === r ? "default" : "ghost"}
                  size="xs"
                  onClick={() => {
                    setRange(r);
                    setSelectedRange(undefined);
                  }}
                  className={`cursor-pointer capitalize ${range !== r ? "text-muted-foreground" : ""}`}
                >
                  {r}
                </Button>
              ))}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={range === "date" ? "default" : "ghost"}
                    size="xs"
                    className={`cursor-pointer gap-1.5 ${range !== "date" ? "text-muted-foreground" : ""}`}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {range === "date"
                      ? fmtRangeLabel(selectedRange) || null
                      : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={selectedRange}
                    onSelect={(r) => {
                      setSelectedRange(r);
                      if (r?.from) {
                        setRange("date");
                        // Close once the user picks a complete range (or
                        // explicitly selects a single day by clicking the same
                        // date twice).
                        if (r.to) setCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    defaultMonth={selectedRange?.from || new Date()}
                    captionLayout="dropdown"
                    startMonth={
                      activeDates.size > 0
                        ? (() => {
                            const [y, m] = [...activeDates]
                              .sort()[0]
                              .split("-")
                              .map(Number);
                            return new Date(y, m - 1);
                          })()
                        : undefined
                    }
                    endMonth={new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {perkMode ? (
              <KpiCard
                label={program.kpiLabel}
                value={stats.redeems}
                prevValue={prevStats.redeems}
                loading={loading}
                range={range}
                sparkline={sparkline.redeems}
                color="var(--color-amber-500)"
              />
            ) : (
              <KpiCard
                label={program.kpiLabel}
                value={stats.stamps}
                prevValue={prevStats.stamps}
                loading={loading}
                range={range}
                sparkline={sparkline.stamps}
                color="var(--color-amber-500)"
                subline={
                  stats.redeems > 0
                    ? `${stats.redeems} free reward${stats.redeems === 1 ? "" : "s"} redeemed`
                    : undefined
                }
              />
            )}
            <KpiCard
              label="Customers"
              value={stats.customers}
              prevValue={prevStats.customers}
              loading={loading}
              range={range}
              sparkline={sparkline.customers}
              color="var(--color-sky-400)"
            />
          </div>

          {/* Chart */}
          {!loading && chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {chartHasData ? (
                  <ChartContainer
                    config={
                      perkMode
                        ? {
                            redeems: {
                              label: program.activityLabel,
                              color: "var(--color-amber-500)",
                            },
                          }
                        : chartConfig
                    }
                    className="h-[250px] w-full"
                  >
                    <BarChart data={chartData} accessibilityLayer>
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        tickMargin={8}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        allowDecimals={false}
                        width={30}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {/* Perk shops have no stamps — show only the free-coffee bar. */}
                      {!perkMode && (
                        <Bar
                          dataKey="stamps"
                          fill="var(--color-stamps)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={44}
                        />
                      )}
                      <Bar
                        dataKey="redeems"
                        fill="var(--color-redeems)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={44}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  // All-zero range: an empty axis grid reads as "broken", so show
                  // a friendly message instead.
                  <div className="flex h-[250px] flex-col items-center justify-center gap-1 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      No activity in this {rangeNoun} yet
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {perkMode
                        ? "Approved free rewards will appear here."
                        : "Stamps and rewards will appear here as customers check in."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top customers — lifetime view, surfaces the regulars the shop wants
          to know on sight. Hidden until at least one customer qualifies
          (top N by stamps AND has redeemed at least once). */}
          {!topLoading && topCustomers.length > 0 && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Top Customers
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {perkMode
                    ? "Lifetime · most free rewards"
                    : "Lifetime · most-stamped first"}
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">
                        {program.topColumnLabel}
                      </TableHead>
                      {!perkMode && (
                        <TableHead className="text-right">Rewards</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((c) => {
                      const displayName =
                        c.name || generateAnimalName(c.cookieId || "");
                      return (
                        <TableRow
                          key={c.id}
                          className="cursor-pointer transition-colors hover:bg-muted/40"
                          onClick={() =>
                            (window.location.href = `/dashboard/customers/${c.id}`)
                          }
                        >
                          <TableCell>
                            <RankMedal rank={c.rank} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{displayName}</span>
                              {c.email && (
                                <span className="text-xs text-muted-foreground">
                                  {c.email}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {perkMode ? c.freeRedeemed : c.totalEarned}
                          </TableCell>
                          {!perkMode && (
                            <TableCell className="text-right">
                              {c.freeRedeemed}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Check-ins</CardTitle>
              <p className="text-xs text-muted-foreground">
                Tap a row to view customer
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : checkins.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No check-ins{" "}
                  {range === "date" && selectedRange?.from
                    ? `for ${fmtRangeLabel(selectedRange)}`
                    : range === "today"
                      ? "today"
                      : `this ${range}`}
                  .
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      {hasRedeems && !perkMode && <TableHead>Type</TableHead>}
                      <TableHead>{perkMode ? "Drink" : "Stamps"}</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedCheckins.map((c) => {
                      const isRedeem = c.redeem;
                      const awarded = c.stampsAwarded || 0;
                      const customerName =
                        c.customer?.name ||
                        generateAnimalName(c.customer?.cookieId || "");

                      return (
                        <TableRow
                          key={c._id}
                          className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                            c.sameAsPrev ? "border-t-transparent" : ""
                          }`}
                          onClick={() =>
                            (window.location.href = `/dashboard/customers/${c.customer?._id}`)
                          }
                        >
                          <TableCell className="relative">
                            {/* Grouping rail: a faint vertical line ties consecutive
                            rows from the same customer together visually.
                            On the first row (with the customer name), only
                            render a small stub at the bottom so the rail
                            doesn't cross the name/email text. */}
                            {c.sameAsPrev && (
                              <span
                                className="pointer-events-none absolute left-3 w-px bg-muted-foreground/25"
                                style={{
                                  top: 0,
                                  bottom: c.sameAsNext ? 0 : "50%",
                                }}
                              />
                            )}
                            {!c.sameAsPrev && c.sameAsNext && (
                              <span
                                className="pointer-events-none absolute left-3 bottom-0 w-px bg-muted-foreground/25"
                                style={{ height: "8px" }}
                              />
                            )}
                            {c.sameAsPrev ? (
                              <span className="ml-5 text-xs text-muted-foreground">
                                ↳
                              </span>
                            ) : (
                              <div>
                                <p className="font-medium">{customerName}</p>
                                {c.customer?.email && (
                                  <p className="text-xs text-muted-foreground">
                                    {c.customer.email}
                                  </p>
                                )}
                                {(c.tags || []).length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {(c.tags || []).slice(0, 3).map((t) => (
                                      <Badge
                                        key={t}
                                        variant="outline"
                                        className="border-amber-500/50 px-1.5 py-0 text-[10px] font-normal text-amber-500"
                                      >
                                        {t}
                                      </Badge>
                                    ))}
                                    {(c.tags || []).length > 3 && (
                                      <span className="text-[10px] text-muted-foreground">
                                        +{(c.tags || []).length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          {hasRedeems && !perkMode && (
                            <TableCell>
                              {isRedeem ? (
                                <Badge
                                  variant="outline"
                                  className="border-amber-500/50 text-amber-500"
                                >
                                  Redeem
                                </Badge>
                              ) : (
                                <Badge variant="outline">Stamp</Badge>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <ActivityValue
                              status={c.status}
                              redeem={isRedeem}
                              stampsAwarded={awarded}
                              threshold={stampThreshold}
                              program={program}
                            />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatTime(c.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {!loading && (
                <Pager
                  page={page}
                  pageSize={PAGE_SIZE}
                  count={checkins.length}
                  onPage={setPage}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Podium styling for the top three regulars — gold/silver/bronze — so the
// leaderboard reads at a glance. Everyone else keeps a plain muted number.
function RankMedal({ rank }: { rank: number }) {
  const medal: Record<number, string> = {
    1: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
    2: "bg-zinc-400/15 text-zinc-300 ring-zinc-400/30",
    3: "bg-orange-700/15 text-orange-400 ring-orange-600/30",
  };
  if (rank > 3)
    return <span className="pl-2 text-muted-foreground">{rank}</span>;
  return (
    <span
      className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ring-1 ring-inset ${medal[rank]}`}
    >
      {rank}
    </span>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  prevValue: number;
  loading: boolean;
  range: Range;
  sparkline: number[];
  color: string;
  subline?: string;
}

function KpiCard({
  label,
  value,
  prevValue,
  loading,
  range,
  sparkline,
  color,
  subline,
}: KpiCardProps) {
  const delta = value - prevValue;
  const showCompare = range !== "all";
  const compareLabel =
    range === "today"
      ? "vs yesterday"
      : range === "week"
        ? "vs prev 7d"
        : range === "month"
          ? "vs prev 30d"
          : "vs prev day";

  return (
    <Card className="relative gap-2 overflow-hidden py-4">
      {/* Left accent rail in the metric's own colour — gives the row of KPIs a
          quick visual key and a bit of life without adding chrome. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color, opacity: 0.8 }}
      />
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Top row: number/delta on the left, sparkline pinned to its right.
            Anchoring the sparkline to this row (not the whole content) keeps
            it at the same vertical position on every card regardless of
            whether a subline is present. */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-3xl font-bold leading-none tracking-tight text-foreground">
              {loading ? "…" : value}
            </p>
            {!loading && showCompare && (
              <div className="flex items-center gap-1.5 text-xs">
                {delta > 0 ? (
                  <span className="flex items-center gap-0.5 text-emerald-500">
                    <ArrowUp className="h-3 w-3" />+{delta}
                    <span className="ml-1 text-muted-foreground">
                      {compareLabel}
                    </span>
                  </span>
                ) : delta < 0 ? (
                  <span className="flex items-center gap-0.5 text-red-400">
                    <ArrowDown className="h-3 w-3" />
                    {delta}
                    <span className="ml-1 text-muted-foreground">
                      {compareLabel}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {value === 0 ? "No activity yet" : `Same ${compareLabel}`}
                  </span>
                )}
              </div>
            )}
          </div>
          {!loading && sparkline.length > 0 && sparkline.some((v) => v > 0) && (
            <Sparkline data={sparkline} color={color} width={88} height={32} />
          )}
        </div>
        {subline && !loading && (
          <p className="pt-2 text-xs text-muted-foreground">{subline}</p>
        )}
      </CardContent>
    </Card>
  );
}
