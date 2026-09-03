"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** One local day of approved activity, from the server aggregation. */
export interface CadenceDay {
  day: string; // YYYY-MM-DD in the shop's timezone
  stamps: number;
  rewards: number;
}

type Grain = "day" | "week" | "month";

const GRAINS: { value: Grain; label: string; buckets: number }[] = [
  { value: "day", label: "Daily", buckets: 30 },
  { value: "week", label: "Weekly", buckets: 12 },
  { value: "month", label: "Monthly", buckets: 12 },
];

// Stamps keep the amber the rest of the product uses for them; rewards take a
// green that reads as "earned". Validated as a categorical pair on the dark
// dashboard surface: CVD ΔE 13.0 (protan), normal-vision ΔE 27.5, both ≥3:1
// against the surface. Position within each group is a second cue on top of hue.
const STAMP_COLOR = "#f59e0b";
const REWARD_COLOR = "#059669";

interface Bucket {
  key: string;
  label: string;
  sublabel: string;
  stamps: number;
  rewards: number;
}

/** Parse a YYYY-MM-DD bucket key as a LOCAL date (never UTC-shifted). */
function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  // Week starts Monday — matches how cafes read a trading week.
  const dow = (out.getDay() + 6) % 7;
  out.setDate(out.getDate() - dow);
  out.setHours(0, 0, 0, 0);
  return out;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * Roll the daily rows up to the requested grain and return the most recent
 * `count` buckets, oldest first — including empty ones, so gaps in attendance
 * stay visible rather than collapsing the axis.
 */
function bucketise(rows: CadenceDay[], grain: Grain, count: number): Bucket[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: Bucket[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (grain === "day") {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const row = byDay.get(key);
      out.push({
        key,
        label: i === 0 ? "today" : String(d.getDate()),
        sublabel: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
        stamps: row?.stamps || 0,
        rewards: row?.rewards || 0,
      });
    }
    return out;
  }

  if (grain === "week") {
    const thisWeek = startOfWeek(today);
    for (let i = count - 1; i >= 0; i--) {
      const start = new Date(thisWeek);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      let stamps = 0;
      let rewards = 0;
      for (const r of rows) {
        const d = parseDay(r.day);
        if (d >= start && d <= end) {
          stamps += r.stamps;
          rewards += r.rewards;
        }
      }
      out.push({
        key: start.toISOString(),
        label: i === 0 ? "now" : `${i}w`,
        sublabel: `week of ${start.getDate()} ${MONTHS[start.getMonth()]}`,
        stamps,
        rewards,
      });
    }
    return out;
  }

  for (let i = count - 1; i >= 0; i--) {
    const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
    let stamps = 0;
    let rewards = 0;
    for (const r of rows) {
      const d = parseDay(r.day);
      if (d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth()) {
        stamps += r.stamps;
        rewards += r.rewards;
      }
    }
    out.push({
      key: `${m.getFullYear()}-${m.getMonth()}`,
      label: MONTHS[m.getMonth()],
      sublabel: `${MONTHS[m.getMonth()]} ${m.getFullYear()}`,
      stamps,
      rewards,
    });
  }
  return out;
}

export default function VisitCadence({
  cadence,
  perkMode = false,
}: {
  cadence: CadenceDay[];
  perkMode?: boolean;
}) {
  const [grain, setGrain] = useState<Grain>("week");
  const config = GRAINS.find((g) => g.value === grain)!;

  const buckets = useMemo(
    () => bucketise(cadence, grain, config.buckets),
    [cadence, grain, config.buckets],
  );

  // A perk shop never accrues stamps, so it gets a single series rather than an
  // always-empty one beside it.
  const showStamps = !perkMode;
  const max = Math.max(
    1,
    ...buckets.map((b) => Math.max(showStamps ? b.stamps : 0, b.rewards)),
  );
  const totalStamps = buckets.reduce((s, b) => s + b.stamps, 0);
  const totalRewards = buckets.reduce((s, b) => s + b.rewards, 0);

  // Label every bucket when there's room; otherwise thin them so they can't collide.
  const labelEvery = grain === "day" ? 5 : 1;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <CardTitle className="text-base">Activity</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {showStamps && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2.5 rounded-[2px]"
                  style={{ backgroundColor: STAMP_COLOR }}
                />
                Stamps
                <span className="tabular-nums text-foreground">
                  {totalStamps}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-[2px]"
                style={{ backgroundColor: REWARD_COLOR }}
              />
              Rewards
              <span className="tabular-nums text-foreground">
                {totalRewards}
              </span>
            </span>
          </div>
        </div>
        <div className="flex rounded-md border border-border p-0.5">
          {GRAINS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGrain(g.value)}
              className={`cursor-pointer rounded px-2.5 py-1 text-xs transition-colors ${
                grain === g.value
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5">
          {buckets.map((b, i) => {
            const empty = b.stamps === 0 && b.rewards === 0;
            return (
              <div key={b.key} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-20 w-full items-end justify-center gap-[2px]">
                  {empty ? (
                    <div className="h-[3px] w-full rounded-sm bg-muted" />
                  ) : (
                    <>
                      {showStamps && (
                        <Bar
                          value={b.stamps}
                          max={max}
                          color={STAMP_COLOR}
                          title={`${b.sublabel} — ${b.stamps} stamp${b.stamps === 1 ? "" : "s"}`}
                        />
                      )}
                      <Bar
                        value={b.rewards}
                        max={max}
                        color={REWARD_COLOR}
                        title={`${b.sublabel} — ${b.rewards} reward${b.rewards === 1 ? "" : "s"}`}
                      />
                    </>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {i % labelEvery === 0 || i === buckets.length - 1
                    ? b.label
                    : " "}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/** One bar. Zero renders as a hairline so the slot stays legible as "none". */
function Bar({
  value,
  max,
  color,
  title,
}: {
  value: number;
  max: number;
  color: string;
  title: string;
}) {
  const pct = (value / max) * 100;
  return (
    <div className="flex h-full flex-1 items-end" title={title}>
      <div
        className="w-full rounded-sm transition-all"
        style={{
          height: value > 0 ? `${Math.max(6, pct)}%` : "2px",
          backgroundColor: value > 0 ? color : "var(--muted)",
        }}
      />
    </div>
  );
}
