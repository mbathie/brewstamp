"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats, Period, Totals } from "@/lib/dashboard-stats";
import {
  ActivityChart,
  FrequencyChart,
  Heatmap,
  NewReturningChart,
  ProgressChart,
  TodayChart,
  heatmapPeak,
} from "./charts";
import { CheckinLog, LapsedList, LatestFeed, TopCustomersList, type TopCustomer } from "./lists";
import { COLORS, ChartCard, Delta, Headline, KpiTile, Section, StatRow, fmtDay, nf, pct } from "./parts";

type Selection = { kind: "preset"; period: Period } | { kind: "custom"; from: string; to: string };

const PRESETS: { value: Period; label: string; long: string }[] = [
  { value: "7d", label: "7D", long: "Last 7 days" },
  { value: "30d", label: "30D", long: "Last 30 days" },
  { value: "90d", label: "90D", long: "Last 90 days" },
  { value: "12m", label: "12M", long: "Last 12 months" },
];

const PERIOD_KEY = "brewstamp.dashboard.period";

function readSavedPeriod(): Period {
  try {
    const v = localStorage.getItem(PERIOD_KEY);
    if (v && PRESETS.some((p) => p.value === v)) return v as Period;
  } catch {}
  return "30d";
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** A YYYY-MM-DD as a local-midnight Date, for the calendar. */
function fromIsoDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Shift a YYYY-MM-DD by whole days without timezone drift. */
function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export default function DashboardOverview({
  perkMode,
  stampThreshold,
  canManageBilling,
}: {
  perkMode: boolean;
  stampThreshold: number;
  canManageBilling: boolean;
}) {
  // The page renders a skeleton until the first fetch lands, so reading the
  // saved period during the first client render can't cause a hydration diff.
  const [selection, setSelection] = useState<Selection>(() => ({
    kind: "preset",
    period: typeof window === "undefined" ? "30d" : readSavedPeriod(),
  }));
  // The day the "Today" card shows; null follows the real today.
  const [day, setDay] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{ query: string; stats: DashboardStats } | null>(null);
  const [top, setTop] = useState<TopCustomer[] | null>(null);
  const requestId = useRef(0);

  const query =
    (selection.kind === "preset" ? `period=${selection.period}` : `from=${selection.from}&to=${selection.to}`) +
    (day ? `&day=${day}` : "");
  const data = loaded?.stats ?? null;
  // The previous period's numbers stay on screen, dimmed, while the next loads.
  const loading = loaded?.query !== query;

  const load = useCallback(() => {
    const id = ++requestId.current;
    fetch(`/api/dashboard?${query}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((stats: DashboardStats | null) => {
        // Ignore a slow response for a period the user has already left.
        if (id === requestId.current && stats) setLoaded({ query, stats });
      })
      .catch(() => {});
  }, [query]);

  const loadTop = useCallback(() => {
    fetch("/api/customers/top?limit=5")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setTop(d.customers || []))
      .catch(() => {});
  }, []);

  useEffect(load, [load]);
  useEffect(loadTop, [loadTop]);

  // A stamp approved from the header modal refreshes the numbers. Debounced so
  // a burst of approvals at the morning rush costs one reload, not ten.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const handler = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        load();
        loadTop();
      }, 1500);
    };
    window.addEventListener("stamp-approved", handler);
    return () => {
      clearTimeout(t);
      window.removeEventListener("stamp-approved", handler);
    };
  }, [load, loadTop]);

  const choosePreset = (period: Period) => {
    setSelection({ kind: "preset", period });
    try {
      localStorage.setItem(PERIOD_KEY, period);
    } catch {}
  };

  if (!data) return <DashboardSkeleton />;

  const { today, period, pro } = data;
  const weekday = fmtDay(today.date, { weekday: "long" });
  const shortDate = fmtDay(today.date, { weekday: "short", day: "numeric", month: "short" });
  const dayTitle = today.isToday
    ? "Today"
    : today.date === addDays(data.todayDate, -1)
      ? "Yesterday"
      : weekday;
  // Stepping onto today goes back to following the live day.
  const goTo = (ymd: string) => setDay(ymd >= data.todayDate ? null : ymd);
  const rangeLabel =
    selection.kind === "preset"
      ? PRESETS.find((p) => p.value === selection.period)!.long
      : `${fmtDay(period.from, { day: "numeric", month: "short" })} – ${fmtDay(period.to, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`;
  const spark = (key: "stamps" | "rewards" | "customers" | "newCustomers") => period.buckets.map((b) => b[key]);
  const peak = heatmapPeak(period.heatmap);
  const k = period.kpis;
  const p = period.prevKpis;
  // No comparison when the previous period had no activity at all — "up ∞%"
  // on a shop's first month helps no one.
  const comparable = p.visits > 0;
  const prev = (v: number | null) => (comparable ? v : null);

  return (
    <div className="space-y-8">
      {/* ── Today ─────────────────────────────────────────────────────── */}
      <Section
        title={dayTitle}
        description={
          today.isToday ? `${shortDate} · vs last ${weekday} at this time` : `${shortDate} · vs the ${weekday} before`
        }
        right={
          <div className="flex items-center gap-3">
            {today.isToday && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            )}
            <DayPicker
              date={today.date}
              todayDate={data.todayDate}
              firstDate={data.firstDate}
              onChange={goTo}
            />
          </div>
        }
      >
        <div className={`grid gap-4 transition-opacity lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
          <Card className="gap-6 lg:col-span-2">
            <CardContent className="space-y-6">
              <div className={`grid gap-4 ${perkMode ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
                {!perkMode && (
                  <TodayStat label="Stamps" k="stamps" today={today.totals} lastWeek={today.lastWeek} color={COLORS.stamps} />
                )}
                <TodayStat
                  label={perkMode ? "Free rewards" : "Rewards"}
                  k="rewards"
                  today={today.totals}
                  lastWeek={today.lastWeek}
                  color={COLORS.rewards}
                />
                <TodayStat label="Customers" k="customers" today={today.totals} lastWeek={today.lastWeek} color={COLORS.customers} />
                <TodayStat label="New" k="newCustomers" today={today.totals} lastWeek={today.lastWeek} color={COLORS.customers} />
              </div>
              <TodayChart today={today} perkMode={perkMode} weekday={weekday.slice(0, 3)} />
            </CardContent>
          </Card>
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                {today.isToday ? "Latest check-ins" : `Check-ins on ${shortDate}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LatestFeed items={data.latest.slice(0, 6)} perkMode={perkMode} />
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ── Performance ───────────────────────────────────────────────── */}
      <Section
        title="Performance"
        description={
          comparable
            ? `${rangeLabel} · changes compared with the ${period.days} days before`
            : `${rangeLabel} · no earlier activity to compare with`
        }
        right={<PeriodPicker selection={selection} onPreset={choosePreset} onCustom={(from, to) => setSelection({ kind: "custom", from, to })} />}
      >
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {perkMode ? (
              <>
                <KpiTile label="Free rewards" value={nf.format(k.rewards)} color={COLORS.rewards} spark={spark("rewards")} delta={<Delta value={k.rewards} prev={prev(p.rewards)} />} />
                <KpiTile label="Customers" value={nf.format(k.customers)} color={COLORS.customers} spark={spark("customers")} delta={<Delta value={k.customers} prev={prev(p.customers)} />} />
                <KpiTile label="New customers" value={nf.format(k.newCustomers)} color={COLORS.customers} spark={spark("newCustomers")} delta={<Delta value={k.newCustomers} prev={prev(p.newCustomers)} />} />
                <KpiTile
                  label="Visits per customer"
                  value={k.visitsPerCustomer === null ? "—" : k.visitsPerCustomer.toFixed(1)}
                  color={COLORS.returning}
                  delta={<Delta value={k.visitsPerCustomer} prev={prev(p.visitsPerCustomer)} />}
                />
              </>
            ) : (
              <>
                <KpiTile label="Stamps given" value={nf.format(k.stamps)} color={COLORS.stamps} spark={spark("stamps")} delta={<Delta value={k.stamps} prev={prev(p.stamps)} />} />
                <KpiTile label="Rewards redeemed" value={nf.format(k.rewards)} color={COLORS.rewards} spark={spark("rewards")} delta={<Delta value={k.rewards} prev={prev(p.rewards)} />} />
                <KpiTile label="Customers" value={nf.format(k.customers)} color={COLORS.customers} spark={spark("customers")} delta={<Delta value={k.customers} prev={prev(p.customers)} />} />
                <KpiTile label="New customers" value={nf.format(k.newCustomers)} color={COLORS.customers} spark={spark("newCustomers")} delta={<Delta value={k.newCustomers} prev={prev(p.newCustomers)} />} />
              </>
            )}
          </div>

          <ChartCard
            title="Activity"
            description={`${perkMode ? "Free rewards" : "Stamps given and rewards redeemed"} per ${period.grain}`}
          >
            <ActivityChart buckets={period.buckets} grain={period.grain} days={period.days} perkMode={perkMode} />
          </ChartCard>

          {pro ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard
                className="lg:col-span-2"
                title="New vs returning customers"
                description={`Customers per ${period.grain}, split by whether it was their first visit`}
                headline={<Headline value={pct(k.returningShare)} caption="returning" />}
              >
                <NewReturningChart buckets={period.buckets} grain={period.grain} days={period.days} />
              </ChartCard>
              <ChartCard title="Retention" description="How well you keep customers coming back">
                <div className="divide-y divide-border/60">
                  <StatRow
                    label="Returning customers"
                    hint="had visited before this period"
                    value={pct(k.returningShare)}
                    extra={<Delta value={k.returningShare} prev={prev(p.returningShare)} points />}
                  />
                  <StatRow
                    label="Visits per customer"
                    hint="in this period"
                    value={k.visitsPerCustomer === null ? "—" : k.visitsPerCustomer.toFixed(1)}
                    extra={<Delta value={k.visitsPerCustomer} prev={prev(p.visitsPerCustomer)} />}
                  />
                  <StatRow
                    label="Come back within 30 days"
                    hint={pro.comebackSample ? `of ${nf.format(pro.comebackSample)} first-timers · all-time` : "all-time"}
                    value={pct(pro.comebackRate)}
                  />
                  <StatRow
                    label="Typical gap between visits"
                    hint="median · all-time"
                    value={pro.medianDaysBetweenVisits === null ? "—" : `${pro.medianDaysBetweenVisits}d`}
                  />
                </div>
              </ChartCard>
            </div>
          ) : (
            <LockedInsights canManageBilling={canManageBilling} />
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="When customers come in"
              description="Visits by day and hour"
              headline={peak ? <Headline value={peak} caption="busiest hour" /> : undefined}
            >
              <Heatmap grid={period.heatmap} />
            </ChartCard>
            {pro ? (
              <ChartCard
                title="How often customers visit"
                description="Customers by number of visits · all-time"
                headline={<Headline value={pct(pro.oneTimeShare)} caption="visited once" />}
              >
                <FrequencyChart frequency={pro.frequency} />
              </ChartCard>
            ) : (
              <ChartCard title="Top customers" description="Lifetime · your most loyal regulars">
                {top ? <TopCustomersList customers={top} perkMode={perkMode} /> : <Skeleton className="h-48" />}
              </ChartCard>
            )}
          </div>

          {pro && (
            <div className={`grid gap-4 ${pro.progress ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
              {pro.progress && (
                <ChartCard title="Loyalty cards" description="Active cards by stamps collected · right now">
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <MiniFigure value={nf.format(pro.nearlyThere ?? 0)} label="within 2 stamps" />
                    <MiniFigure value={nf.format(pro.rewardsWaiting ?? 0)} label="rewards unclaimed" />
                    <MiniFigure
                      value={pct(pro.lifetimeCustomers ? pro.appleWallet / pro.lifetimeCustomers : null)}
                      label="in Apple Wallet"
                    />
                  </div>
                  <ProgressChart progress={pro.progress} threshold={stampThreshold} />
                </ChartCard>
              )}
              <ChartCard title="Top customers" description="Lifetime · your most loyal regulars">
                {top ? <TopCustomersList customers={top} perkMode={perkMode} /> : <Skeleton className="h-48" />}
              </ChartCard>
              <ChartCard
                title="Regulars you haven't seen lately"
                description="3+ visits, away 30–180 days · worth a hello"
                headline={
                  pro.lapsed.total > pro.lapsed.customers.length ? (
                    <Headline value={nf.format(pro.lapsed.total)} caption="in total" />
                  ) : undefined
                }
              >
                <LapsedList lapsed={pro.lapsed} />
              </ChartCard>
            </div>
          )}

          <ChartCard title="Check-ins" description={`Every check-in · ${rangeLabel.toLowerCase()}`}>
            <CheckinLog items={data.checkins} perkMode={perkMode} capped={data.checkins.length >= 200} />
          </ChartCard>
        </div>
      </Section>
    </div>
  );
}

function TodayStat({
  label,
  k,
  today,
  lastWeek,
  color,
}: {
  label: string;
  k: keyof Totals;
  today: Totals;
  lastWeek: Totals;
  color: string;
}) {
  const diff = today[k] - lastWeek[k];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-semibold tabular-nums leading-none text-foreground">{nf.format(today[k])}</p>
      <p className="text-xs tabular-nums text-muted-foreground">
        {diff === 0 ? (
          "same as last week"
        ) : (
          <>
            <span className={diff > 0 ? "text-emerald-400" : "text-red-400"}>
              {diff > 0 ? "+" : "−"}
              {Math.abs(diff)}
            </span>{" "}
            vs last week
          </>
        )}
      </p>
    </div>
  );
}

function MiniFigure({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2">
      <p className="text-lg font-semibold tabular-nums leading-tight text-foreground">{value}</p>
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Prev / next day arrows around a calendar for the "Today" card. Days before
 * the shop's first stamp and after today can't be picked, and the month and
 * year dropdowns only offer that same span.
 */
function DayPicker({
  date,
  todayDate,
  firstDate,
  onChange,
}: {
  date: string;
  todayDate: string;
  firstDate: string | null;
  onChange: (ymd: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const first = firstDate ?? todayDate;
  const canPrev = date > first;
  const canNext = date < todayDate;
  const firstD = fromIsoDate(first);
  const todayD = fromIsoDate(todayDate);

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
      <Button
        size="icon-xs"
        variant="ghost"
        className="cursor-pointer text-muted-foreground"
        aria-label="Previous day"
        disabled={!canPrev}
        onClick={() => onChange(addDays(date, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="xs" variant="ghost" className="cursor-pointer gap-1.5 tabular-nums" aria-label="Pick a day">
            <CalendarIcon className="h-3.5 w-3.5" />
            {date === todayDate ? "Today" : fmtDay(date, { day: "numeric", month: "short", year: "numeric" })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={fromIsoDate(date)}
            onSelect={(d) => {
              if (!d) return;
              onChange(toIsoDate(d));
              setOpen(false);
            }}
            disabled={[{ before: firstD }, { after: todayD }]}
            defaultMonth={fromIsoDate(date)}
            captionLayout="dropdown"
            startMonth={firstD}
            endMonth={todayD}
          />
        </PopoverContent>
      </Popover>
      <Button
        size="icon-xs"
        variant="ghost"
        className="cursor-pointer text-muted-foreground"
        aria-label="Next day"
        disabled={!canNext}
        onClick={() => onChange(addDays(date, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {date !== todayDate && (
        <Button size="xs" variant="secondary" className="cursor-pointer" onClick={() => onChange(todayDate)}>
          Today
        </Button>
      )}
    </div>
  );
}

function PeriodPicker({
  selection,
  onPreset,
  onCustom,
}: {
  selection: Selection;
  onPreset: (p: Period) => void;
  onCustom: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [firstActive, setFirstActive] = useState<Date | undefined>();

  // The calendar starts at the shop's first active month, fetched on first open.
  useEffect(() => {
    if (!open || firstActive) return;
    fetch("/api/stamp-request/active-dates")
      .then((r) => r.json())
      .then((d) => {
        const first = (d.dates || [])[0] as string | undefined;
        if (first) {
          const [y, m] = first.split("-").map(Number);
          setFirstActive(new Date(y, m - 1));
        }
      })
      .catch(() => {});
  }, [open, firstActive]);

  const customLabel = useMemo(() => {
    if (selection.kind !== "custom") return null;
    const f = (s: string) => fmtDay(s, { day: "numeric", month: "short" });
    return selection.from === selection.to ? f(selection.from) : `${f(selection.from)} – ${f(selection.to)}`;
  }, [selection]);

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
      {PRESETS.map((p) => {
        const active = selection.kind === "preset" && selection.period === p.value;
        return (
          <Button
            key={p.value}
            size="xs"
            variant={active ? "secondary" : "ghost"}
            aria-pressed={active}
            title={p.long}
            onClick={() => onPreset(p.value)}
            className={`cursor-pointer px-2.5 tabular-nums ${active ? "" : "text-muted-foreground"}`}
          >
            {p.label}
          </Button>
        );
      })}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="xs"
            variant={selection.kind === "custom" ? "secondary" : "ghost"}
            className={`cursor-pointer gap-1.5 ${selection.kind === "custom" ? "" : "text-muted-foreground"}`}
            aria-label="Pick dates"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {customLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelect={(r) => {
              setRange(r);
              if (r?.from && r.to) {
                onCustom(toIsoDate(r.from), toIsoDate(r.to));
                setOpen(false);
              }
            }}
            disabled={(date) => date > new Date()}
            defaultMonth={range?.from || new Date()}
            captionLayout="dropdown"
            startMonth={firstActive}
            endMonth={new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Shown in place of the retention charts on plans without analytics. */
function LockedInsights({ canManageBilling }: { canManageBilling: boolean }) {
  const bars = [38, 52, 46, 64, 58, 72, 66, 80];
  return (
    <Card className="overflow-hidden border-amber-600/30 bg-gradient-to-br from-amber-700/10 via-transparent to-transparent py-0">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
            <Lock className="h-3 w-3" /> Pro
          </span>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">See who keeps coming back</p>
            <p className="max-w-xl text-sm text-muted-foreground">
              New vs returning customers, how often people visit, who&apos;s one stamp from a free
              coffee, and the regulars you haven&apos;t seen in a while — so you know who to greet by
              name.
            </p>
          </div>
          {canManageBilling ? (
            <Link href="/dashboard/billing" className="inline-block">
              <Button size="sm" className="cursor-pointer gap-1.5 bg-amber-700 hover:bg-amber-800">
                <Sparkles className="h-3.5 w-3.5" />
                Unlock with Pro
              </Button>
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">Included with Pro — ask the shop owner to upgrade.</p>
          )}
        </div>
        {/* Illustrative only: a stylised new-vs-returning chart. */}
        <div aria-hidden className="hidden h-28 items-end gap-1.5 md:flex">
          {bars.map((h, i) => (
            <div key={i} className="flex w-5 flex-col overflow-hidden rounded-t-[3px]" style={{ height: `${h}%` }}>
              <div className="bg-sky-400/50" style={{ height: `${30 - i * 2}%` }} />
              <div className="flex-1 bg-amber-500/50" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-6 w-64" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[320px] lg:col-span-2" />
        <Skeleton className="h-[320px]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-[340px]" />
    </div>
  );
}
