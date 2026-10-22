"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, Lock, Sparkles, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateAnimalName } from "@/lib/animal-names";
import { AppleMark } from "@/components/wallet-badges";
import type { InsightKpis, ShopInsights } from "@/lib/insights";

type Response =
  | { locked: true; planLabel: string }
  | { locked: false; insights: ShopInsights };

// New customers take the sky the dashboard already uses for "Customers";
// returning ones the amber used for stamps — the loyalty the product is for.
const NEW_COLOR = "var(--color-sky-400)";
const RETURNING_COLOR = "var(--color-amber-500)";

const weeklyConfig = {
  returningCustomers: { label: "Returning", color: RETURNING_COLOR },
  newCustomers: { label: "New", color: NEW_COLOR },
} satisfies ChartConfig;

const frequencyConfig = {
  customers: { label: "Customers", color: RETURNING_COLOR },
} satisfies ChartConfig;

const progressConfig = {
  cards: { label: "Cards", color: RETURNING_COLOR },
} satisfies ChartConfig;

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pct(x: number | null): string {
  return x === null ? "—" : `${Math.round(x * 100)}%`;
}

function fmtHour(h: number): string {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

/** "6 Oct" from a YYYY-MM-DD week start, without any timezone shifting. */
function fmtWeek(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export default function InsightsSection({
  perkMode,
  stampThreshold,
  canManageBilling,
}: {
  perkMode: boolean;
  stampThreshold: number;
  canManageBilling: boolean;
}) {
  const [data, setData] = useState<Response | null>(null);

  // Loaded once per visit: these are 30–90 day trends, so unlike the activity
  // above they don't refetch on every approved stamp.
  useEffect(() => {
    fetch("/api/insights")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;
  if (data.locked) return <LockedInsights canManageBilling={canManageBilling} />;
  return <Insights insights={data.insights} perkMode={perkMode} stampThreshold={stampThreshold} />;
}

function Insights({
  insights: ins,
  perkMode,
  stampThreshold,
}: {
  insights: ShopInsights;
  perkMode: boolean;
  stampThreshold: number;
}) {
  const weekly = useMemo(
    () => ins.weekly.map((w) => ({ ...w, label: fmtWeek(w.weekStart) })),
    [ins.weekly],
  );
  const totalCustomers = ins.frequency.reduce((a, b) => a + b.customers, 0);
  const oneTimers = ins.frequency[0]?.customers ?? 0;
  const weeklyHasData = weekly.some((w) => w.newCustomers + w.returningCustomers > 0);

  if (ins.lifetimeCustomers === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Customer insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Insights fill in once customers start checking in — new vs returning, how often they
            come back, your busiest times and who you haven&apos;t seen lately.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Customer insights</h2>
        <p className="text-xs text-muted-foreground">
          Last {ins.windowDays} days vs the {ins.windowDays} before · a visit is one customer, one day
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightKpi
          label="New customers"
          value={String(ins.kpis.newCustomers)}
          delta={ins.kpis.newCustomers - ins.prevKpis.newCustomers}
          deltaText={(d) => `${d > 0 ? "+" : ""}${d}`}
          hint={`${ins.kpis.activeCustomers} customers visited in total`}
        />
        <InsightKpi
          label="Returning customers"
          value={pct(ins.kpis.returningShare)}
          delta={pointsDelta(ins.kpis, ins.prevKpis)}
          deltaText={(d) => `${d > 0 ? "+" : ""}${d} pts`}
          hint="of this period's customers had been before"
        />
        <InsightKpi
          label="Visits per customer"
          value={ins.kpis.visitsPerCustomer === null ? "—" : ins.kpis.visitsPerCustomer.toFixed(1)}
          delta={
            ins.kpis.visitsPerCustomer !== null && ins.prevKpis.visitsPerCustomer !== null
              ? Math.round((ins.kpis.visitsPerCustomer - ins.prevKpis.visitsPerCustomer) * 10) / 10
              : null
          }
          deltaText={(d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}`}
          hint={`in the last ${ins.windowDays} days`}
        />
        <InsightKpi
          label="Come back within 30 days"
          value={pct(ins.comebackRate)}
          hint={
            ins.comebackSample
              ? `of ${ins.comebackSample} first-time customers`
              : "Needs customers from 30+ days ago"
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat
          label="Typical gap between visits"
          value={
            ins.medianDaysBetweenVisits === null
              ? "—"
              : `${ins.medianDaysBetweenVisits} day${ins.medianDaysBetweenVisits === 1 ? "" : "s"}`
          }
          hint="median, customers with 2+ visits"
        />
        <MiniStat
          label="Customers all-time"
          value={String(ins.lifetimeCustomers)}
          hint={
            totalCustomers
              ? `${Math.round((oneTimers / totalCustomers) * 100)}% have visited once`
              : undefined
          }
        />
        <MiniStat
          label={
            <span className="inline-flex items-center gap-1">
              <AppleMark className="h-3 w-3" /> In Apple Wallet
            </span>
          }
          value={pct(ins.appleWallet / ins.lifetimeCustomers)}
          hint={`${ins.appleWallet} of ${ins.lifetimeCustomers} customers`}
        />
        {perkMode ? (
          <MiniStat
            label="Lapsed regulars"
            value={String(ins.lapsed.total)}
            hint="3+ visits, not seen in 30+ days"
          />
        ) : (
          <MiniStat
            label="Close to a free reward"
            value={String(ins.nearlyThere ?? 0)}
            hint={
              ins.rewardsWaiting
                ? `within 2 stamps · ${ins.rewardsWaiting} reward${ins.rewardsWaiting === 1 ? "" : "s"} unclaimed`
                : "within 2 stamps of a reward"
            }
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New vs returning customers</CardTitle>
            <p className="text-xs text-muted-foreground">Customers per week, last 12 weeks</p>
          </CardHeader>
          <CardContent>
            {weeklyHasData ? (
              <ChartContainer config={weeklyConfig} className="h-[220px] w-full">
                <BarChart data={weekly} accessibilityLayer>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickMargin={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => `Week of ${l}`} />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="returningCustomers" stackId="c" fill="var(--color-returningCustomers)" maxBarSize={36} />
                  <Bar
                    dataKey="newCustomers"
                    stackId="c"
                    fill="var(--color-newCustomers)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChart text="No visits in the last 12 weeks." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How often customers visit</CardTitle>
            <p className="text-xs text-muted-foreground">Customers by number of visits, all-time</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={frequencyConfig} className="h-[220px] w-full">
              <BarChart data={ins.frequency} accessibilityLayer>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} width={30} />
                <ChartTooltip
                  content={<ChartTooltipContent labelFormatter={(l) => `${l} visit${l === "1" ? "" : "s"}`} />}
                />
                <Bar dataKey="customers" fill="var(--color-customers)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className={perkMode ? "lg:col-span-2" : undefined}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">When customers come in</CardTitle>
            <p className="text-xs text-muted-foreground">Visits by day and hour, last {ins.heatmapDays} days</p>
          </CardHeader>
          <CardContent>
            <Heatmap grid={ins.heatmap} />
          </CardContent>
        </Card>

        {!perkMode && ins.progress && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Where cards are at</CardTitle>
              <p className="text-xs text-muted-foreground">
                Stamps on each active card (visited in 90 days), out of {stampThreshold}
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={progressConfig} className="h-[220px] w-full">
                <BarChart data={ins.progress} accessibilityLayer>
                  <XAxis
                    dataKey="stamps"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickMargin={8}
                    tickFormatter={(s: number) => (s >= stampThreshold ? `${s}+` : String(s))}
                  />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} width={30} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, p) => {
                          const s = Number(p?.[0]?.payload?.stamps ?? 0);
                          return s >= stampThreshold
                            ? "Reward ready to claim"
                            : `${s} stamp${s === 1 ? "" : "s"}`;
                        }}
                      />
                    }
                  />
                  <Bar dataKey="cards" fill="var(--color-cards)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <LapsedRegulars lapsed={ins.lapsed} />
    </section>
  );
}

/** Change in returning share, in whole percentage points. */
function pointsDelta(now: InsightKpis, prev: InsightKpis): number | null {
  if (now.returningShare === null || prev.returningShare === null) return null;
  return Math.round((now.returningShare - prev.returningShare) * 100);
}

function InsightKpi({
  label,
  value,
  delta = null,
  deltaText,
  hint,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaText?: (d: number) => string;
  hint?: string;
}) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold leading-none tracking-tight text-foreground">{value}</p>
          {delta !== null && delta !== 0 && deltaText && (
            <span
              className={`flex items-center gap-0.5 text-xs ${delta > 0 ? "text-emerald-500" : "text-red-400"}`}
              title="vs the previous period"
            >
              {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {deltaText(delta)}
            </span>
          )}
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, hint }: { label: React.ReactNode; value: string; hint?: React.ReactNode }) {
  return (
    <div className="rounded-xl border px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">{text}</div>
  );
}

/**
 * Day × hour grid, amber intensity by visit count. Hours are trimmed to the
 * band the shop actually trades in (never narrower than 6am–6pm) so a cafe
 * doesn't get a grid that's two-thirds empty night.
 */
function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(0, ...grid.flat());
  if (max === 0) return <EmptyChart text={`No visits in this period.`} />;

  const active = Array.from({ length: 24 }, (_, h) => grid.some((row) => row[h] > 0));
  let start = Math.min(6, active.indexOf(true));
  let end = Math.max(18, active.lastIndexOf(true));
  start = Math.max(0, start);
  end = Math.min(23, end);
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[420px] gap-[3px] text-[10px] text-muted-foreground"
        style={{ gridTemplateColumns: `2.25rem repeat(${hours.length}, minmax(0, 1fr))` }}
      >
        <span />
        {hours.map((h) => (
          <span key={h} className="text-center">
            {(h - start) % 2 === 0 ? fmtHour(h) : ""}
          </span>
        ))}
        {grid.map((row, d) => (
          <Row key={d} day={DOW[d]} row={row} hours={hours} max={max} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
        <span>Quiet</span>
        {[0.15, 0.4, 0.65, 0.9].map((o) => (
          <span key={o} className="h-3 w-5 rounded-sm" style={{ backgroundColor: RETURNING_COLOR, opacity: o }} />
        ))}
        <span>Busy</span>
      </div>
    </div>
  );
}

function Row({ day, row, hours, max }: { day: string; row: number[]; hours: number[]; max: number }) {
  return (
    <>
      <span className="flex items-center">{day}</span>
      {hours.map((h) => {
        const n = row[h];
        return (
          <span
            key={h}
            className="relative h-6 rounded-sm bg-muted/40"
            title={`${day} ${fmtHour(h)}: ${n} visit${n === 1 ? "" : "s"}`}
          >
            {n > 0 && (
              <span
                className="absolute inset-0 rounded-sm"
                style={{ backgroundColor: RETURNING_COLOR, opacity: 0.15 + 0.85 * (n / max) }}
              />
            )}
          </span>
        );
      })}
    </>
  );
}

function LapsedRegulars({ lapsed }: { lapsed: ShopInsights["lapsed"] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserX className="h-4 w-4 text-amber-500" />
            Regulars you haven&apos;t seen lately
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            3+ visits, last seen 30–180 days ago. Worth a hello next time they&apos;re in.
          </p>
        </div>
        {lapsed.total > lapsed.customers.length && (
          <p className="shrink-0 text-xs text-muted-foreground">
            Top {lapsed.customers.length} of {lapsed.total}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {lapsed.customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None right now — every regular has been in within the last month.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lapsed.customers.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer transition-colors hover:bg-muted/40"
                  onClick={() => (window.location.href = `/dashboard/customers/${c.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{c.name || generateAnimalName(c.cookieId)}</span>
                      {c.email && <span className="text-xs text-muted-foreground">{c.email}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{c.visits}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{c.daysAway} days ago</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/** Shown on plans without analytics: what's there, and the way to it. */
function LockedInsights({ canManageBilling }: { canManageBilling: boolean }) {
  return (
    <Card className="border-amber-600/30 bg-amber-700/5">
      <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-700/15">
            <Lock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Customer insights</p>
            <p className="text-sm text-muted-foreground">
              See how many customers come back, how often, your busiest hours of the week, which
              cards are close to a reward, and the regulars you haven&apos;t seen lately.
            </p>
          </div>
        </div>
        {canManageBilling ? (
          <Link href="/dashboard/billing" className="shrink-0">
            <Button size="sm" className="cursor-pointer gap-1.5 bg-amber-700 hover:bg-amber-800">
              <Sparkles className="h-3.5 w-3.5" />
              Unlock with Pro
            </Button>
          </Link>
        ) : (
          <p className="shrink-0 text-xs text-muted-foreground">Included with Pro — ask the shop owner.</p>
        )}
      </CardContent>
    </Card>
  );
}
