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
import { CalendarIcon, Download, Monitor, QrCode } from "lucide-react";
import Link from "next/link";
import { generateAnimalName } from "@/lib/animal-names";

type Range = "today" | "week" | "month" | "date";

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

export default function DashboardContent({ shopName, shopCode, shopLogo, stampThreshold, isNewShop }: Props) {
  const [range, setRange] = useState<Range>("today");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState({ customers: 0, stamps: 0, redeems: 0 });
  const [chartRaw, setChartRaw] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);

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
      // Fill all hours from 0 to current hour (or 23 for past dates)
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
      return Object.values(hours).map((p) => ({
        label: `${String(p._id).padStart(2, "0")}:00`,
        stamps: p.stamps,
        redeems: p.redeems,
      }));
    } else {
      // Fill all dates in range
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
      return Object.values(dateMap).map((p) => ({
        label: new Date(String(p._id)).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        }),
        stamps: p.stamps,
        redeems: p.redeems,
      }));
    }
  }, [chartRaw, range]);

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const showSetup = isNewShop;

  return (
    <div className="space-y-6">
      {showSetup ? (
        <div className="space-y-6">
          <Card className="border-amber-600/30 bg-amber-600/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground">
                Welcome! Let&apos;s get you set up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-sm text-muted-foreground">
                Follow these three steps to start collecting stamps from your customers.
              </p>
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-amber-600" />
                      <p className="font-medium text-foreground">Download &amp; print your QR code</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Go to{" "}
                      <Link href="/dashboard/settings" className="font-medium text-amber-600 hover:underline">
                        Settings
                      </Link>{" "}
                      to download a printable PDF with your shop&apos;s unique QR code. Print it out and place it where customers can easily scan it — at the register, on the counter, or next to the menu.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-amber-600" />
                      <p className="font-medium text-foreground">Stay logged in at the point of sale</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Keep this dashboard open on a device at your counter — a tablet, laptop, or phone. When a customer scans the QR code, a stamp request will pop up here for you to approve in real-time.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-amber-600" />
                      <p className="font-medium text-foreground">Customers scan &amp; you approve</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Customers simply point their phone camera at the QR code — no app download or account needed. You&apos;ll see a request instantly on your dashboard and can approve it with one tap.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/dashboard/settings">
                  <Button className="cursor-pointer bg-amber-600 hover:bg-amber-700">
                    <Download className="mr-2 h-4 w-4" />
                    Go to Settings to download your QR code
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">{shopName} Dashboard</h1>
            <div className="flex gap-1 rounded-lg border p-1">
              {(["today", "week", "month"] as Range[]).map((r) => (
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
                      ? selectedDate.toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
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

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {loading ? "..." : stats.customers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Stamps Given
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {loading ? "..." : stats.stamps}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Redeemed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {loading ? "..." : stats.redeems}
            </p>
          </CardContent>
        </Card>
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
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No check-ins{" "}
              {range === "date" && selectedDate
                ? `on ${selectedDate.toLocaleDateString()}`
                : range === "today"
                  ? "today"
                  : `this ${range}`}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stamps</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkins.map((c) => {
                  const isRedeem = c.redeem;
                  const awarded = c.stampsAwarded || 0;

                  return (
                    <TableRow key={c._id}>
                      <TableCell>
                        <Link href={`/dashboard/customers/${c.customer?._id}`} className="hover:underline">
                          <p className="font-medium">
                            {c.customer?.name || generateAnimalName(c.customer?.cookieId || "")}
                          </p>
                          {c.customer?.email && (
                            <p className="text-xs text-muted-foreground">
                              {c.customer.email}
                            </p>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {isRedeem ? (
                          <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                            Redeem
                          </Badge>
                        ) : (
                          <Badge variant="outline">Stamp</Badge>
                        )}
                      </TableCell>
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
                          variant={c.status === "approved" ? "default" : "destructive"}
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
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
