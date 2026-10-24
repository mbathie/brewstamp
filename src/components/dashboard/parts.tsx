"use client";

// Small building blocks shared by the dashboard sections: section headers,
// chart cards, KPI tiles and the formatting helpers they use.

import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkline } from "@/components/sparkline";
import type { Grain } from "@/lib/dashboard-stats";

// One meaning per colour, everywhere on the dashboard. Stamps keep the amber
// the product uses for them; rewards a green that reads as "earned"; new
// customers the sky used for "customers" since the first dashboard.
export const COLORS = {
  stamps: "var(--color-amber-500)",
  rewards: "var(--color-emerald-500)",
  customers: "var(--color-sky-400)",
  returning: "var(--color-amber-500)",
  muted: "var(--color-zinc-500)",
};

export const nf = new Intl.NumberFormat();

export function pct(x: number | null | undefined): string {
  return x === null || x === undefined ? "—" : `${Math.round(x * 100)}%`;
}

/** Format a YYYY-MM-DD local day without any timezone shifting. */
export function fmtDay(ymd: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString(undefined, { timeZone: "UTC", ...opts });
}

export function fmtHour(h: number): string {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

/** Axis label for a bucket starting on `ymd`. */
export function bucketTick(ymd: string, grain: Grain, days: number): string {
  if (grain === "month") return fmtDay(ymd, { month: "short" });
  if (grain === "day" && days <= 7) return fmtDay(ymd, { weekday: "short" });
  return fmtDay(ymd, { day: "numeric", month: "short" });
}

/** Tooltip label for a bucket starting on `ymd`. */
export function bucketLabel(ymd: string, grain: Grain): string {
  if (grain === "month") return fmtDay(ymd, { month: "long", year: "numeric" });
  if (grain === "week") return `Week of ${fmtDay(ymd, { day: "numeric", month: "short" })}`;
  return fmtDay(ymd, { weekday: "short", day: "numeric", month: "short" });
}

export function Section({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** A card with a title, a one-line explanation, and an optional headline figure. */
export function ChartCard({
  title,
  description,
  headline,
  className,
  children,
}: {
  title: string;
  description?: string;
  headline?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`gap-4 ${className ?? ""}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {headline && <div className="shrink-0 text-right">{headline}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Big figure + caption, for a ChartCard headline. */
export function Headline({ value, caption }: { value: string; caption: string }) {
  return (
    <>
      <p className="text-xl font-semibold tabular-nums leading-none text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{caption}</p>
    </>
  );
}

export function EmptyState({ title, hint, height = 220 }: { title: string; hint?: string; height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center" style={{ height }}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

/**
 * Change vs a comparison value. Counts compare as a percentage; shares
 * (`points`) as percentage points. Nothing is shown without a baseline.
 */
export function Delta({
  value,
  prev,
  points = false,
  suffix,
}: {
  value: number | null;
  prev: number | null;
  points?: boolean;
  suffix?: string;
}) {
  if (value === null || prev === null) return null;
  let text: string;
  let dir: number;
  if (points) {
    const d = Math.round((value - prev) * 100);
    if (d === 0) return <span className="text-xs text-muted-foreground">No change{suffix ? ` ${suffix}` : ""}</span>;
    text = `${Math.abs(d)} pts`;
    dir = d;
  } else {
    if (prev === 0) return null;
    const d = Math.round(((value - prev) / prev) * 100);
    if (d === 0) return <span className="text-xs text-muted-foreground">No change{suffix ? ` ${suffix}` : ""}</span>;
    text = `${Math.abs(d)}%`;
    dir = d;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium ${
          dir > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}
      >
        {dir > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {text}
      </span>
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </span>
  );
}

export function KpiTile({
  label,
  value,
  delta,
  spark,
  color,
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
  spark?: number[];
  color: string;
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">{value}</p>
            <div className="min-h-5">{delta}</div>
          </div>
          {spark && spark.length > 1 && spark.some((v) => v > 0) && (
            <Sparkline data={spark} color={color} width={96} height={36} className="mb-1 shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Label/value row for compact stat lists inside a card. */
export function StatRow({
  label,
  hint,
  value,
  extra,
}: {
  label: string;
  hint?: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="space-y-0.5">
        <p className="text-sm text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-lg font-semibold tabular-nums leading-none text-foreground">{value}</p>
        {extra}
      </div>
    </div>
  );
}
