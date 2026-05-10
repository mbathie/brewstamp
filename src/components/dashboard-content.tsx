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
import { ArrowDown, ArrowUp, CalendarIcon, Download, Monitor, QrCode, Settings as SettingsIcon, Smartphone, UserPen } from "lucide-react";
import Link from "next/link";
import { generateAnimalName } from "@/lib/animal-names";
import { Sparkline } from "@/components/sparkline";

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

export default function DashboardContent({ shopName, shopCode, shopLogo, stampThreshold, isNewShop, hasEarnedStamps = false, hasActivity = false, needsProfileUpdate, setupComplete = false }: Props) {
  const [range, setRange] = useState<Range>("today");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState({ customers: 0, stamps: 0, redeems: 0 });
  const [prevStats, setPrevStats] = useState({ customers: 0, stamps: 0, redeems: 0 });
  const [sparkline, setSparkline] = useState<{ stamps: number[]; customers: number[]; redeems: number[] }>({
    stamps: [],
    customers: [],
    redeems: [],
  });
  const [chartRaw, setChartRaw] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [refreshKey, setRefreshKey] = useState(0);

  // Reset to first page when range/date filter changes
  useEffect(() => {
    setPage(0);
  }, [range, selectedDate]);

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
    if (range === "date" && selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      params.set("date", `${y}-${m}-${d}`);
    } else {
      params.set("range", range === "date" ? "today" : range);
    }
    fetch(`/api/stamp-request/history?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCheckins(data.requests || []);
        setStats(data.stats || { customers: 0, stamps: 0, redeems: 0 });
        setPrevStats(data.prevStats || { customers: 0, stamps: 0, redeems: 0 });
        setSparkline(data.sparkline || { stamps: [], customers: [], redeems: [] });
        setChartRaw(data.chart || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range, selectedDate, refreshKey]);

  // Listen for stamp approvals to auto-refresh
  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("stamp-approved", handler);
    return () => window.removeEventListener("stamp-approved", handler);
  }, []);

  const chartData = useMemo(() => {
    if (range === "today" || range === "date") {
      const isToday = range === "today" || (selectedDate && selectedDate.toDateString() === new Date().toDateString());
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
      const allHours = Object.values(hours).sort((a, b) => Number(a._id) - Number(b._id));
      const activeHours = allHours.filter((p) => p.stamps > 0 || p.redeems > 0);
      let startHour = 6;
      let endHour = Math.max(currentHour, 18);
      if (activeHours.length > 0) {
        startHour = Math.min(startHour, Number(activeHours[0]._id));
        endHour = Math.max(endHour, Number(activeHours[activeHours.length - 1]._id));
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
          label: d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" }),
          stamps: p.stamps,
          redeems: p.redeems,
        };
      });
    } else {
      const now = new Date();
      const days = range === "week" ? 7 : 30;
      const dateMap: Record<string, ChartPoint> = {};
      for (let i = days; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dateMap[key] = { _id: key, stamps: 0, checkins: 0, redeems: 0 };
      }
      for (const p of chartRaw) {
        const key = String(p._id);
        if (dateMap[key]) {
          dateMap[key] = p;
        }
      }
      const fmt: Intl.DateTimeFormatOptions =
        range === "month"
          ? { day: "numeric" }
          : { weekday: "short" };
      return Object.values(dateMap).map((p) => ({
        label: new Date(String(p._id)).toLocaleDateString("en-AU", fmt),
        stamps: p.stamps,
        redeems: p.redeems,
      }));
    }
  }, [chartRaw, range, selectedDate]);

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const isToday = range === "today" || (range === "date" && selectedDate && d.toDateString() === selectedDate.toDateString());
    if (isToday) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
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
  const totalPages = Math.max(1, Math.ceil(checkins.length / PAGE_SIZE));
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

  return (
    <div className="space-y-6">
      {showSetup ? (
        <div className="space-y-6">
          <Card className="border-amber-600/30 bg-amber-700/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground">
                {stuckOnActivation
                  ? "You're almost there — let's land your first stamp"
                  : "Welcome! Let's get you set up"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-sm text-muted-foreground">
                {stuckOnActivation
                  ? "Customers have started scanning your QR code but no stamps have been approved yet. Walk through step 4 below to award your first one."
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
                        <p className="font-medium text-foreground">Complete your profile</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add your name and contact info in{" "}
                        <Link href="/dashboard/settings" className="font-medium text-amber-700 hover:underline">
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
                      <p className="font-medium text-foreground">Download &amp; print your QR code</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Go to{" "}
                      <Link href="/dashboard/settings" className="font-medium text-amber-700 hover:underline">
                        Shop Setup
                      </Link>{" "}
                      to download a printable PDF with your shop&apos;s unique QR code. Print it out and place it where customers can easily scan it — at the register, on the counter, or next to the menu.
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
                      <p className="font-medium text-foreground">Stay logged in at the point of sale</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Keep this dashboard open on a device at your counter — a tablet, laptop, or phone. When a customer scans the QR code, a stamp request will pop up here for you to approve in real-time.
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
                      <p className="font-medium text-foreground">Customers scan &amp; you approve</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Customers simply point their phone camera at the QR code — no app download or account needed. You&apos;ll see a request instantly on your dashboard and can approve it with one tap.
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
                      <p className="font-medium text-foreground">Try it yourself right now</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Don&apos;t wait for a real customer — test the flow now so you know what to expect. Open the QR code from{" "}
                      <Link href="/dashboard/settings" className="font-medium text-amber-700 hover:underline">
                        Shop Setup
                      </Link>{" "}
                      on this device, point your phone&apos;s camera at the screen, complete the customer flow on your phone, then come back here and approve the stamp request when it appears. Once you&apos;ve done it once, you&apos;ll never second-guess a real one.
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
                      Add your logo and pick brand colors so the customer card matches your shop.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/settings">
                  <Button size="sm" className="cursor-pointer bg-amber-700 hover:bg-amber-800">
                    Open Shop Setup
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold text-foreground">{shopName} Dashboard</h1>
            <div className="flex gap-1 rounded-lg border p-1">
              {(["today", "week", "month", "all"] as Range[]).map((r) => (
                <Button
                  key={r}
                  variant={range === r ? "default" : "ghost"}
                  size="xs"
                  onClick={() => { setRange(r); setSelectedDate(undefined); }}
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
                    {range === "date" && selectedDate
                      ? selectedDate.toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })
                      : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setRange("date");
                        setCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => {
                      if (date > new Date()) return true;
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, "0");
                      const d = String(date.getDate()).padStart(2, "0");
                      return !activeDates.has(`${y}-${m}-${d}`);
                    }}
                    defaultMonth={selectedDate || new Date()}
                    captionLayout="dropdown"
                    startMonth={
                      activeDates.size > 0
                        ? (() => {
                            const [y, m] = [...activeDates].sort()[0].split("-").map(Number);
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
        <KpiCard
          label="Stamps Given"
          value={stats.stamps}
          prevValue={prevStats.stamps}
          loading={loading}
          range={range}
          sparkline={sparkline.stamps}
          color="var(--color-amber-500)"
          subline={
            stats.redeems > 0
              ? `${stats.redeems} free drink${stats.redeems === 1 ? "" : "s"} redeemed`
              : undefined
          }
        />
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
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
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
                <Bar
                  dataKey="stamps"
                  fill="var(--color-stamps)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="redeems"
                  fill="var(--color-redeems)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Check-ins</CardTitle>
          <p className="text-xs text-muted-foreground">Tap a row to view customer</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No check-ins{" "}
              {range === "date" && selectedDate
                ? `on ${selectedDate.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" })}`
                : range === "today"
                  ? "today"
                  : `this ${range}`}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  {hasRedeems && <TableHead>Type</TableHead>}
                  <TableHead>Stamps</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedCheckins.map((c) => {
                  const isRedeem = c.redeem;
                  const awarded = c.stampsAwarded || 0;
                  const customerName =
                    c.customer?.name || generateAnimalName(c.customer?.cookieId || "");

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
                          <span className="ml-5 text-xs text-muted-foreground">↳</span>
                        ) : (
                          <div>
                            <p className="font-medium">{customerName}</p>
                            {c.customer?.email && (
                              <p className="text-xs text-muted-foreground">
                                {c.customer.email}
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      {hasRedeems && (
                        <TableCell>
                          {isRedeem ? (
                            <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                              Redeem
                            </Badge>
                          ) : (
                            <Badge variant="outline">Stamp</Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {c.status === "approved" ? (
                          isRedeem && awarded === 0 ? (
                            <span className="text-muted-foreground">-{stampThreshold}</span>
                          ) : isRedeem && awarded > 0 ? (
                            <span>
                              <span className="text-muted-foreground">-{stampThreshold}</span>
                              {" "}
                              <span className="text-amber-500">+{awarded}</span>
                            </span>
                          ) : (
                            <span className="text-amber-500">+{awarded}</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            c.status === "approved"
                              ? "border-green-500/50 text-green-500"
                              : "border-red-400/50 text-red-400"
                          }
                        >
                          {c.status}
                        </Badge>
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
          {!loading && checkins.length > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {pageStart + 1}–{Math.min(pageEnd, checkins.length)} of {checkins.length}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
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

function KpiCard({ label, value, prevValue, loading, range, sparkline, color, subline }: KpiCardProps) {
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold leading-none text-foreground">
              {loading ? "..." : value}
            </p>
            {!loading && showCompare && (
              <div className="flex items-center gap-1.5 text-xs">
                {delta > 0 ? (
                  <span className="flex items-center gap-0.5 text-emerald-500">
                    <ArrowUp className="h-3 w-3" />+{delta}
                    <span className="ml-1 text-muted-foreground">{compareLabel}</span>
                  </span>
                ) : delta < 0 ? (
                  <span className="flex items-center gap-0.5 text-red-400">
                    <ArrowDown className="h-3 w-3" />
                    {delta}
                    <span className="ml-1 text-muted-foreground">{compareLabel}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {value === 0 ? "No activity yet" : `Same ${compareLabel}`}
                  </span>
                )}
              </div>
            )}
            {subline && !loading && (
              <p className="pt-1 text-xs text-muted-foreground">{subline}</p>
            )}
          </div>
          {!loading && sparkline.length > 0 && sparkline.some((v) => v > 0) && (
            <Sparkline data={sparkline} color={color} width={88} height={32} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
