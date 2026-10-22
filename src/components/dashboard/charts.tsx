"use client";

import { Bar, BarChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Bucket, DashboardStats, Grain } from "@/lib/dashboard-stats";
import { COLORS, EmptyState, bucketLabel, bucketTick, fmtHour } from "./parts";

// Shared axis styling: no axis lines or ticks, light horizontal gridlines only,
// so the bars carry the eye and every chart reads the same way.
const X_AXIS = { tickLine: false, axisLine: false, fontSize: 11, tickMargin: 8 } as const;
const Y_AXIS = { tickLine: false, axisLine: false, fontSize: 11, width: 32, allowDecimals: false, tickCount: 4 } as const;
const GRID = <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.25} />;

/**
 * Today by the hour, against the same weekday last week (dashed line) — so a
 * quiet morning reads as "quiet for a Thursday" or "unusually quiet".
 */
export function TodayChart({
  today,
  perkMode,
  weekday,
}: {
  today: DashboardStats["today"];
  perkMode: boolean;
  weekday: string;
}) {
  const key = perkMode ? "rewards" : "stamps";
  const lwKey = perkMode ? "lastWeekRewards" : "lastWeekStamps";
  const config = {
    [key]: { label: "Today", color: perkMode ? COLORS.rewards : COLORS.stamps },
    [lwKey]: { label: `Last ${weekday}`, color: COLORS.muted },
  } satisfies ChartConfig;

  const rows = today.hourly;
  const active = rows.filter((r) => r[key] > 0 || r[lwKey] > 0).map((r) => r.hour);
  if (!active.length) {
    return (
      <EmptyState
        height={200}
        title="Nothing yet today"
        hint={`${perkMode ? "Free rewards" : "Stamps"} will appear here by the hour as customers check in.`}
      />
    );
  }
  // Trading band: never narrower than 6am–6pm, widened to any activity and to now.
  const start = Math.min(6, ...active);
  const end = Math.max(18, today.hour, ...active);
  const data = rows
    .filter((r) => r.hour >= start && r.hour <= end)
    .map((r) => ({
      label: fmtHour(r.hour),
      // Hours still to come today are left blank rather than drawn as zero.
      [key]: r.hour <= today.hour ? r[key] : null,
      [lwKey]: r[lwKey],
    }));

  return (
    <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
      <ComposedChart data={data} accessibilityLayer>
        {GRID}
        <XAxis dataKey="label" {...X_AXIS} interval={1} />
        <YAxis {...Y_AXIS} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey={key} fill={`var(--color-${key})`} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Line
          dataKey={lwKey}
          type="monotone"
          stroke={`var(--color-${lwKey})`}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

/** Stamps and rewards per bucket across the selected period. */
export function ActivityChart({
  buckets,
  grain,
  days,
  perkMode,
}: {
  buckets: Bucket[];
  grain: Grain;
  days: number;
  perkMode: boolean;
}) {
  const config: ChartConfig = perkMode
    ? { rewards: { label: "Free rewards", color: COLORS.rewards } }
    : {
        stamps: { label: "Stamps", color: COLORS.stamps },
        rewards: { label: "Rewards redeemed", color: COLORS.rewards },
      };
  if (!buckets.some((b) => b.stamps > 0 || b.rewards > 0)) {
    return <EmptyState height={260} title="No activity in this period" hint="Pick a longer period above." />;
  }
  const data = buckets.map((b) => ({ ...b, label: bucketTick(b.start, grain, days) }));
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={data} accessibilityLayer barGap={2}>
        {GRID}
        <XAxis dataKey="label" {...X_AXIS} minTickGap={16} />
        <YAxis {...Y_AXIS} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(_, p) => bucketLabel(p?.[0]?.payload?.start, grain)} />}
        />
        {!perkMode && <ChartLegend content={<ChartLegendContent />} />}
        {!perkMode && <Bar dataKey="stamps" fill="var(--color-stamps)" radius={[3, 3, 0, 0]} maxBarSize={32} />}
        <Bar dataKey="rewards" fill="var(--color-rewards)" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ChartContainer>
  );
}

const newReturningConfig = {
  returningCustomers: { label: "Returning", color: COLORS.returning },
  newCustomers: { label: "New", color: COLORS.customers },
} satisfies ChartConfig;

/** Distinct customers per bucket, split into first-timers and returners. */
export function NewReturningChart({ buckets, grain, days }: { buckets: Bucket[]; grain: Grain; days: number }) {
  if (!buckets.some((b) => b.customers > 0)) {
    return <EmptyState title="No customers in this period" />;
  }
  const data = buckets.map((b) => ({ ...b, label: bucketTick(b.start, grain, days) }));
  return (
    <ChartContainer config={newReturningConfig} className="h-[220px] w-full">
      <BarChart data={data} accessibilityLayer>
        {GRID}
        <XAxis dataKey="label" {...X_AXIS} minTickGap={16} />
        <YAxis {...Y_AXIS} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(_, p) => bucketLabel(p?.[0]?.payload?.start, grain)} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="returningCustomers" stackId="c" fill="var(--color-returningCustomers)" maxBarSize={32} />
        <Bar
          dataKey="newCustomers"
          stackId="c"
          fill="var(--color-newCustomers)"
          radius={[3, 3, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ChartContainer>
  );
}

const frequencyConfig = {
  customers: { label: "Customers", color: COLORS.returning },
} satisfies ChartConfig;

export function FrequencyChart({ frequency }: { frequency: { label: string; customers: number }[] }) {
  return (
    <ChartContainer config={frequencyConfig} className="h-[220px] w-full">
      <BarChart data={frequency} accessibilityLayer>
        {GRID}
        <XAxis dataKey="label" {...X_AXIS} />
        <YAxis {...Y_AXIS} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(l) => `${l} visit${l === "1" ? "" : "s"}`} />}
        />
        <Bar dataKey="customers" fill="var(--color-customers)" radius={[3, 3, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ChartContainer>
  );
}

const progressConfig = {
  cards: { label: "Cards", color: COLORS.stamps },
} satisfies ChartConfig;

export function ProgressChart({
  progress,
  threshold,
}: {
  progress: { stamps: number; cards: number }[];
  threshold: number;
}) {
  if (!progress.some((p) => p.cards > 0)) {
    return <EmptyState height={160} title="No active cards" />;
  }
  return (
    <ChartContainer config={progressConfig} className="h-[200px] w-full">
      <BarChart data={progress} accessibilityLayer>
        {GRID}
        <XAxis
          dataKey="stamps"
          {...X_AXIS}
          tickFormatter={(s: number) => (s >= progress.length - 1 ? "Full" : String(s))}
        />
        <YAxis {...Y_AXIS} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, p) => {
                const s = Number(p?.[0]?.payload?.stamps ?? 0);
                return s >= progress.length - 1 ? "Reward ready to claim" : `${s} of ${threshold} stamps`;
              }}
            />
          }
        />
        <Bar dataKey="cards" fill="var(--color-cards)" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOW_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** The busiest day × hour slot, e.g. "Friday 8–9am". */
export function heatmapPeak(grid: number[][]): string | null {
  let best = { d: 0, h: 0, n: 0 };
  grid.forEach((row, d) => row.forEach((n, h) => n > best.n && (best = { d, h, n })));
  if (!best.n) return null;
  const h = best.h % 12 || 12;
  return `${DOW_LONG[best.d]} ${h}${best.h < 12 ? "am" : "pm"}`;
}

/**
 * Day × hour grid, amber intensity by visit count. Hours are trimmed to the
 * shop's trading band (never narrower than 6am–6pm), with weekday and hour
 * totals on the edges so "busiest day" and "busiest hour" stay one glance away.
 */
export function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(0, ...grid.flat());
  if (max === 0) return <EmptyState title="No visits in this period" />;

  const active = Array.from({ length: 24 }, (_, h) => grid.some((row) => row[h] > 0));
  const start = Math.max(0, Math.min(6, active.indexOf(true)));
  const end = Math.min(23, Math.max(18, active.lastIndexOf(true)));
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const dayTotals = grid.map((row) => row.reduce((a, b) => a + b, 0));
  const maxDay = Math.max(...dayTotals, 1);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[480px] items-center gap-[3px] text-[10px] text-muted-foreground"
        style={{ gridTemplateColumns: `2.25rem repeat(${hours.length}, minmax(0, 1fr)) 3.5rem` }}
      >
        <span />
        {hours.map((h) => (
          <span key={h} className="text-center">
            {(h - start) % 3 === 0 ? fmtHour(h) : ""}
          </span>
        ))}
        <span />
        {grid.map((row, d) => (
          <HeatRow key={d} d={d} row={row} hours={hours} max={max} total={dayTotals[d]} maxDay={maxDay} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Fewer</span>
        {[0.15, 0.4, 0.65, 0.9].map((o) => (
          <span key={o} className="h-2.5 w-4 rounded-[3px]" style={{ backgroundColor: COLORS.stamps, opacity: o }} />
        ))}
        <span>More visits</span>
      </div>
    </div>
  );
}

function HeatRow({
  d,
  row,
  hours,
  max,
  total,
  maxDay,
}: {
  d: number;
  row: number[];
  hours: number[];
  max: number;
  total: number;
  maxDay: number;
}) {
  return (
    <>
      <span>{DOW[d]}</span>
      {hours.map((h) => {
        const n = row[h];
        return (
          <span
            key={h}
            className="relative h-6 rounded-[3px] bg-muted/40"
            title={`${DOW_LONG[d]} ${fmtHour(h)}: ${n} visit${n === 1 ? "" : "s"}`}
          >
            {n > 0 && (
              <span
                className="absolute inset-0 rounded-[3px]"
                style={{ backgroundColor: COLORS.stamps, opacity: 0.15 + 0.85 * (n / max) }}
              />
            )}
          </span>
        );
      })}
      {/* Weekday total as a small bar, so the busiest day reads at a glance. */}
      <span className="flex items-center gap-1.5 pl-1.5" title={`${DOW_LONG[d]}: ${total} visits`}>
        <span className="h-1.5 rounded-full bg-amber-500/60" style={{ width: `${(total / maxDay) * 100}%` }} />
      </span>
    </>
  );
}
