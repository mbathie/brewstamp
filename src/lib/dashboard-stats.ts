// Everything the single-shop dashboard shows, computed in one pass: today's
// live numbers, the selected period's KPIs and charts, and (on plans with
// analytics) the retention and loyalty insights. Served by /api/dashboard.
// Server-only — touches Mongoose models.
//
// Definitions used throughout:
// - Days and hours are the shop's local time (Shop.timezone), handled as whole
//   day numbers (days since 1970-01-01) so window maths is immune to DST.
// - A "visit" is a distinct (customer, local day) with an approved request, so
//   a stamp plus a redeem in one sitting, or a double scan, counts once.
// - A customer is "new" in the bucket/period holding their first-ever visit.
//
// Shops are small (the busiest has ~4k approved requests), so this loads the
// shop's approved history as compact rows and aggregates in memory.

import { Types } from "mongoose";
import { Customer, StampCard, StampRequest, WalletPass } from "@/models";

export type Period = "7d" | "30d" | "90d" | "12m";
export const PERIODS: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
/** Longest custom range accepted, in days. */
export const MAX_RANGE_DAYS = 400;

export type Grain = "day" | "week" | "month";

export interface Totals {
  stamps: number;
  rewards: number;
  customers: number;
  newCustomers: number;
  visits: number;
}

export interface PeriodKpis extends Totals {
  /** Share (0–1) of the period's customers who had visited before it. */
  returningShare: number | null;
  visitsPerCustomer: number | null;
}

export interface Bucket {
  /** First local day of the bucket, YYYY-MM-DD. */
  start: string;
  stamps: number;
  rewards: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
}

export interface CheckIn {
  id: string;
  customerId: string | null;
  name: string | null;
  email: string | null;
  cookieId: string;
  tags: string[];
  status: string;
  redeem: boolean;
  stampsAwarded: number;
  createdAt: string;
}

export interface ProInsights {
  /** Share (0–1) of first-time customers who returned within 30 days. */
  comebackRate: number | null;
  comebackSample: number;
  /** Median days between visits, across customers with 2+ visits. */
  medianDaysBetweenVisits: number | null;
  lifetimeCustomers: number;
  /** Share (0–1) of all customers who have only ever visited once. */
  oneTimeShare: number | null;
  frequency: { label: string; customers: number }[];
  /** Stamp shops only: cards active in 90 days, by stamps on the card now. */
  progress: { stamps: number; cards: number }[] | null;
  rewardsWaiting: number | null;
  nearlyThere: number | null;
  /** Customers with the card installed in Apple Wallet (a registered device). */
  appleWallet: number;
  lapsed: {
    total: number;
    customers: {
      id: string;
      name: string | null;
      email: string | null;
      cookieId: string;
      visits: number;
      daysAway: number;
    }[];
  };
}

export interface DashboardStats {
  /**
   * The selected day (today unless the merchant has stepped back). Named
   * `today` for its default; `isToday` says which it is.
   */
  today: {
    date: string;
    isToday: boolean;
    /** Current local hour, 0–23, when the day is today; 23 for a past day. */
    hour: number;
    totals: Totals;
    /**
     * Same weekday a week earlier — up to the same hour when the day is
     * today (a like-for-like pace), the whole day otherwise.
     */
    lastWeek: Totals;
    hourly: { hour: number; stamps: number; rewards: number; lastWeekStamps: number; lastWeekRewards: number }[];
  };
  /** The shop's local date today, and of its first approved stamp (null if none). */
  todayDate: string;
  firstDate: string | null;
  /** Most recent check-ins: overall for today, or the selected day's. */
  latest: CheckIn[];
  period: {
    from: string;
    to: string;
    days: number;
    grain: Grain;
    kpis: PeriodKpis;
    prevKpis: PeriodKpis;
    buckets: Bucket[];
    /** Visits by local weekday (0 = Monday) × hour. */
    heatmap: number[][];
  };
  checkins: CheckIn[];
  /** Null on plans without analytics. */
  pro: ProInsights | null;
}

const DAY_MS = 86_400_000;
const LAPSED_AFTER_DAYS = 30;
const LAPSED_CAP_DAYS = 180;
const REGULAR_MIN_VISITS = 3;
const ACTIVE_CARD_DAYS = 90;

// ── Local-time helpers ──────────────────────────────────────────────────────

export function dayNumOf(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function ymdOf(dayNum: number): string {
  return new Date(dayNum * DAY_MS).toISOString().slice(0, 10);
}

function localParts(tz: string, at: Date): { day: number; hour: number; minute: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(at);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
    return {
      day: dayNumOf(`${get("year")}-${get("month")}-${get("day")}`),
      hour: Number(get("hour")) % 24,
      minute: Number(get("minute")),
    };
  } catch {
    return { day: Math.floor(at.getTime() / DAY_MS), hour: at.getUTCHours(), minute: at.getUTCMinutes() };
  }
}

/** Today's local day number and hour in the shop's timezone. */
export function nowIn(tz: string): { day: number; hour: number } {
  const { day, hour } = localParts(tz, new Date());
  return { day, hour };
}

/** The UTC instant of local midnight starting the given local day. */
export function localMidnight(tz: string, dayNum: number): Date {
  // Guess the offset at UTC midnight of that date, then correct once — enough
  // for any real timezone, DST transitions included.
  let guess = dayNum * DAY_MS;
  for (let i = 0; i < 2; i++) {
    const { day, hour, minute } = localParts(tz, new Date(guess));
    const localMs = day * DAY_MS + hour * 3_600_000 + minute * 60_000;
    guess -= localMs - dayNum * DAY_MS;
  }
  return new Date(guess);
}

/** Monday on or before the given day. Day 0 (1970-01-01) was a Thursday. */
export function weekStartOf(dayNum: number): number {
  return dayNum - ((dayNum + 3) % 7);
}

export function monthStartOf(dayNum: number): number {
  return dayNumOf(ymdOf(dayNum).slice(0, 8) + "01");
}

export function grainFor(days: number): Grain {
  if (days <= 31) return "day";
  if (days <= 180) return "week";
  return "month";
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const FREQUENCY_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "1", min: 1, max: 1 },
  { label: "2", min: 2, max: 2 },
  { label: "3–5", min: 3, max: 5 },
  { label: "6–10", min: 6, max: 10 },
  { label: "11–20", min: 11, max: 20 },
  { label: "21+", min: 21, max: Infinity },
];

// ── Rows ─────────────────────────────────────────────────────────────────────

export interface Row {
  c: string; // customer id
  d: number; // local day number
  h: number; // local hour
  s: number; // stamps awarded
  r: boolean; // redeemed a reward
}

function emptyTotals(): Totals {
  return { stamps: 0, rewards: 0, customers: 0, newCustomers: 0, visits: 0 };
}

/** Totals for rows in [from, to] (day numbers), optionally only before an hour on `to`. */
export function totalsFor(
  rows: Row[],
  firstDay: Map<string, number>,
  from: number,
  to: number,
  beforeHour = 24,
): PeriodKpis {
  const t = emptyTotals();
  const customers = new Set<string>();
  const visits = new Set<string>();
  for (const row of rows) {
    if (row.d < from || row.d > to || (row.d === to && row.h >= beforeHour)) continue;
    t.stamps += row.s;
    if (row.r) t.rewards++;
    customers.add(row.c);
    visits.add(`${row.c}|${row.d}`);
  }
  let returning = 0;
  for (const c of customers) {
    if ((firstDay.get(c) ?? from) >= from) t.newCustomers++;
    else returning++;
  }
  t.customers = customers.size;
  t.visits = visits.size;
  return {
    ...t,
    returningShare: t.customers ? returning / t.customers : null,
    visitsPerCustomer: t.customers ? t.visits / t.customers : null,
  };
}

type RawCheckIn = {
  _id: Types.ObjectId;
  customer?: { _id: Types.ObjectId; name?: string; email?: string; cookieId?: string } | null;
  status: string;
  redeem?: boolean;
  stampsAwarded?: number;
  createdAt: Date;
};

function toCheckIn(r: RawCheckIn, tags: Map<string, string[]>): CheckIn {
  const id = r.customer?._id?.toString() ?? null;
  return {
    id: r._id.toString(),
    customerId: id,
    name: r.customer?.name ?? null,
    email: r.customer?.email ?? null,
    cookieId: r.customer?.cookieId ?? "",
    tags: id ? (tags.get(id) ?? []) : [],
    status: r.status,
    redeem: !!r.redeem,
    stampsAwarded: r.stampsAwarded ?? 0,
    createdAt: r.createdAt.toISOString(),
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

export async function getDashboardStats(
  shop: {
    _id: Types.ObjectId;
    timezone?: string;
    perkMode?: boolean;
    stampThreshold?: number;
  },
  range: { from: number; to: number },
  withPro: boolean,
  selectedDay?: number,
): Promise<DashboardStats> {
  const tz = shop.timezone || "UTC";
  const now = nowIn(tz);
  const { from, to } = range;
  const days = to - from + 1;
  const threshold = Math.max(1, shop.stampThreshold || 8);
  const day = Math.min(selectedDay ?? now.day, now.day);
  const isToday = day === now.day;

  const [rawRows, latestRaw, periodRaw, dayRaw] = await Promise.all([
    StampRequest.aggregate<{ c: Types.ObjectId; d: string; h: number; s: number; r?: boolean }>([
      { $match: { shop: shop._id, status: "approved" } },
      {
        $project: {
          _id: 0,
          c: "$customer",
          d: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } },
          h: { $hour: { date: "$createdAt", timezone: tz } },
          s: { $ifNull: ["$stampsAwarded", 1] },
          r: "$redeem",
        },
      },
    ]),
    StampRequest.find({ shop: shop._id, status: { $in: ["approved", "rejected"] } })
      .populate("customer", "name email cookieId")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean<RawCheckIn[]>(),
    StampRequest.find({
      shop: shop._id,
      status: { $in: ["approved", "rejected"] },
      createdAt: { $gte: localMidnight(tz, from), $lt: localMidnight(tz, to + 1) },
    })
      .populate("customer", "name email cookieId")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean<RawCheckIn[]>(),
    isToday
      ? Promise.resolve([] as RawCheckIn[])
      : StampRequest.find({
          shop: shop._id,
          status: { $in: ["approved", "rejected"] },
          createdAt: { $gte: localMidnight(tz, day), $lt: localMidnight(tz, day + 1) },
        })
          .populate("customer", "name email cookieId")
          .sort({ createdAt: -1 })
          .limit(8)
          .lean<RawCheckIn[]>(),
  ]);

  const rows: Row[] = rawRows
    .filter((r) => r.c)
    .map((r) => ({ c: r.c.toString(), d: dayNumOf(r.d), h: r.h, s: r.s, r: !!r.r }));

  // Each customer's sorted distinct visit days.
  const daysByCustomer = new Map<string, Set<number>>();
  for (const row of rows) {
    let set = daysByCustomer.get(row.c);
    if (!set) daysByCustomer.set(row.c, (set = new Set()));
    set.add(row.d);
  }
  const visitDays = new Map<string, number[]>();
  for (const [c, set] of daysByCustomer) visitDays.set(c, [...set].sort((a, b) => a - b));
  const firstDay = new Map<string, number>();
  for (const [c, ds] of visitDays) firstDay.set(c, ds[0]);

  // ── Today ──────────────────────────────────────────────────────────────
  const strip = (k: PeriodKpis): Totals => ({
    stamps: k.stamps,
    rewards: k.rewards,
    customers: k.customers,
    newCustomers: k.newCustomers,
    visits: k.visits,
  });
  const todayTotals = strip(totalsFor(rows, firstDay, day, day));
  const lastWeekTotals = strip(totalsFor(rows, firstDay, day - 7, day - 7, isToday ? now.hour + 1 : 24));
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    stamps: 0,
    rewards: 0,
    lastWeekStamps: 0,
    lastWeekRewards: 0,
  }));
  for (const row of rows) {
    if (row.d === day) {
      hourly[row.h].stamps += row.s;
      if (row.r) hourly[row.h].rewards++;
    } else if (row.d === day - 7) {
      hourly[row.h].lastWeekStamps += row.s;
      if (row.r) hourly[row.h].lastWeekRewards++;
    }
  }

  // ── Period ─────────────────────────────────────────────────────────────
  const grain = grainFor(days);
  const bucketOf = (d: number) =>
    grain === "day" ? d : grain === "week" ? Math.max(from, weekStartOf(d)) : Math.max(from, monthStartOf(d));
  const bucketStarts: number[] = [];
  for (let d = from; d <= to; d++) {
    const b = bucketOf(d);
    if (bucketStarts[bucketStarts.length - 1] !== b) bucketStarts.push(b);
  }
  const buckets = new Map<number, Bucket & { seen: Set<string> }>(
    bucketStarts.map((b) => [
      b,
      { start: ymdOf(b), stamps: 0, rewards: 0, customers: 0, newCustomers: 0, returningCustomers: 0, seen: new Set() },
    ]),
  );
  const heatSeen = new Map<string, number>(); // customer|day → earliest hour
  for (const row of rows) {
    if (row.d < from || row.d > to) continue;
    const b = buckets.get(bucketOf(row.d))!;
    b.stamps += row.s;
    if (row.r) b.rewards++;
    if (!b.seen.has(row.c)) {
      b.seen.add(row.c);
      b.customers++;
      if (bucketOf(firstDay.get(row.c)!) === bucketOf(row.d) && firstDay.get(row.c)! >= from) b.newCustomers++;
      else b.returningCustomers++;
    }
    const key = `${row.c}|${row.d}`;
    const prev = heatSeen.get(key);
    if (prev === undefined || row.h < prev) heatSeen.set(key, row.h);
  }
  const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const [key, hour] of heatSeen) {
    const d = Number(key.slice(key.indexOf("|") + 1));
    heatmap[(d + 3) % 7][hour]++;
  }

  // Tags for the check-in rows, so the log can show them inline.
  const listedIds = [
    ...new Set(
      [...latestRaw, ...periodRaw, ...dayRaw].map((r) => r.customer?._id?.toString()).filter((x): x is string => !!x),
    ),
  ];
  const tagCards = listedIds.length
    ? await StampCard.find({ shop: shop._id, customer: { $in: listedIds } })
        .select("customer tags")
        .lean<{ customer: Types.ObjectId; tags?: string[] }[]>()
    : [];
  const tags = new Map(tagCards.map((c) => [c.customer.toString(), c.tags ?? []]));

  const stats: DashboardStats = {
    today: {
      date: ymdOf(day),
      isToday,
      hour: isToday ? now.hour : 23,
      totals: todayTotals,
      lastWeek: lastWeekTotals,
      hourly,
    },
    todayDate: ymdOf(now.day),
    firstDate: rows.length ? ymdOf(Math.min(...rows.map((r) => r.d))) : null,
    latest: (isToday ? latestRaw : dayRaw).map((r) => toCheckIn(r, tags)),
    period: {
      from: ymdOf(from),
      to: ymdOf(to),
      days,
      grain,
      kpis: totalsFor(rows, firstDay, from, to),
      prevKpis: totalsFor(rows, firstDay, from - days, from - 1),
      buckets: [...buckets.values()].map((b) => ({
        start: b.start,
        stamps: b.stamps,
        rewards: b.rewards,
        customers: b.customers,
        newCustomers: b.newCustomers,
        returningCustomers: b.returningCustomers,
      })),
      heatmap,
    },
    checkins: periodRaw.map((r) => toCheckIn(r, tags)),
    pro: null,
  };

  if (withPro) stats.pro = await proInsights(shop, visitDays, now.day, threshold);
  return stats;
}

/** Retention and loyalty state — all-time or "right now", not period-bound. */
async function proInsights(
  shop: { _id: Types.ObjectId; perkMode?: boolean },
  visitDays: Map<string, number[]>,
  today: number,
  threshold: number,
): Promise<ProInsights> {
  const [cards, walletCustomers] = await Promise.all([
    shop.perkMode
      ? Promise.resolve([])
      : StampCard.find({ shop: shop._id, disabled: { $ne: true } })
          .select("customer stamps")
          .lean<{ customer: Types.ObjectId; stamps: number }[]>(),
    // WalletPass rows for both providers exist as soon as a card page loads, so
    // a row means nothing; a registered Apple device means it's installed.
    // Google doesn't report saves back.
    WalletPass.distinct("customer", {
      shop: shop._id,
      provider: "apple",
      "registrations.0": { $exists: true },
    }) as Promise<Types.ObjectId[]>,
  ]);

  const customers = [...visitDays.entries()];
  let comebackSample = 0;
  let cameBack = 0;
  const gaps: number[] = [];
  for (const [, ds] of customers) {
    if (ds[0] <= today - 30) {
      comebackSample++;
      if (ds.length > 1 && ds[1] - ds[0] <= 30) cameBack++;
    }
    if (ds.length > 1) gaps.push((ds[ds.length - 1] - ds[0]) / (ds.length - 1));
  }
  const gap = median(gaps);

  let progress: ProInsights["progress"] = null;
  let rewardsWaiting: number | null = null;
  let nearlyThere: number | null = null;
  if (!shop.perkMode) {
    const counts = Array(threshold + 1).fill(0) as number[];
    rewardsWaiting = 0;
    nearlyThere = 0;
    for (const card of cards) {
      const ds = visitDays.get(card.customer?.toString());
      if (!ds || ds[ds.length - 1] < today - ACTIVE_CARD_DAYS) continue;
      const stamps = Math.max(0, card.stamps || 0);
      if (stamps >= threshold) rewardsWaiting++;
      else if (stamps >= threshold - 2) nearlyThere++;
      counts[Math.min(stamps, threshold)]++;
    }
    progress = counts.map((n, stamps) => ({ stamps, cards: n }));
  }

  const lapsedAll = customers
    .filter(([, ds]) => {
      const away = today - ds[ds.length - 1];
      return ds.length >= REGULAR_MIN_VISITS && away >= LAPSED_AFTER_DAYS && away <= LAPSED_CAP_DAYS;
    })
    .sort((a, b) => b[1].length - a[1].length);
  const lapsedTop = lapsedAll.slice(0, 6);
  const people = lapsedTop.length
    ? await Customer.find({ _id: { $in: lapsedTop.map(([c]) => c) } })
        .select("name email cookieId")
        .lean<{ _id: Types.ObjectId; name?: string; email?: string; cookieId: string }[]>()
    : [];
  const personById = new Map(people.map((p) => [p._id.toString(), p]));

  const oneTimers = customers.filter(([, ds]) => ds.length === 1).length;

  return {
    comebackRate: comebackSample ? cameBack / comebackSample : null,
    comebackSample,
    medianDaysBetweenVisits: gap === null ? null : Math.round(gap * 10) / 10,
    lifetimeCustomers: customers.length,
    oneTimeShare: customers.length ? oneTimers / customers.length : null,
    frequency: FREQUENCY_BUCKETS.map((b) => ({
      label: b.label,
      customers: customers.filter(([, ds]) => ds.length >= b.min && ds.length <= b.max).length,
    })),
    progress,
    rewardsWaiting,
    nearlyThere,
    appleWallet: walletCustomers.filter((id) => visitDays.has(id.toString())).length,
    lapsed: {
      total: lapsedAll.length,
      customers: lapsedTop.map(([c, ds]) => {
        const p = personById.get(c);
        return {
          id: c,
          name: p?.name ?? null,
          email: p?.email ?? null,
          cookieId: p?.cookieId ?? "",
          visits: ds.length,
          daysAway: today - ds[ds.length - 1],
        };
      }),
    },
  };
}
