// Customer insights for one shop: who's new, who comes back, how often, when,
// and who has drifted away. Powers the insights half of the dashboard
// (/api/insights). Server-only — touches Mongoose models.
//
// A "visit" is a distinct (customer, local day) with at least one approved
// request — so a stamp and a redeem in the same sitting, or a double scan,
// count once. Days are computed in the shop's timezone and handled as whole
// day numbers (days since 1970-01-01), which keeps window maths free of DST.
//
// Shops are small (the busiest has ~4k approved requests), so everything is
// derived from one per-customer rollup of the shop's full history rather than
// maintained incrementally.

import { Types } from "mongoose";
import { Customer, StampCard, StampRequest, WalletPass } from "@/models";

/** The reporting window for the headline numbers, in days. */
export const INSIGHT_WINDOW_DAYS = 30;
const TREND_WEEKS = 12;
const HEATMAP_DAYS = 90;
/** A regular is "lapsed" once unseen this long, and dropped after the cap. */
const LAPSED_AFTER_DAYS = 30;
const LAPSED_CAP_DAYS = 180;
const REGULAR_MIN_VISITS = 3;
const LAPSED_LIST_LIMIT = 8;

export interface InsightKpis {
  activeCustomers: number;
  newCustomers: number;
  /** Share (0–1) of this window's customers who had visited before it. */
  returningShare: number | null;
  visitsPerCustomer: number | null;
}

export interface ShopInsights {
  windowDays: number;
  kpis: InsightKpis;
  prevKpis: InsightKpis;
  /** Share (0–1) of first-time customers who came back within 30 days. */
  comebackRate: number | null;
  /** How many first-timers the comeback rate is measured over. */
  comebackSample: number;
  /** Median days between visits, across customers with 2+ visits. */
  medianDaysBetweenVisits: number | null;
  lifetimeCustomers: number;
  /** Customers per ISO week (Monday start), oldest first. */
  weekly: { weekStart: string; newCustomers: number; returningCustomers: number }[];
  /** Lifetime visit-count distribution. */
  frequency: { label: string; customers: number }[];
  /** Visits by local weekday (0 = Monday) × hour, last 90 days. */
  heatmap: number[][];
  heatmapDays: number;
  /** Stamp shops only: active cards by stamps currently on the card. */
  progress: { stamps: number; cards: number }[] | null;
  /** Cards holding enough stamps for a reward that hasn't been claimed. */
  rewardsWaiting: number | null;
  /** Active cards within two stamps of a reward. */
  nearlyThere: number | null;
  /**
   * Customers with the card installed in Apple Wallet. WalletPass rows for both
   * providers are created as soon as a card page loads, so a row alone means
   * nothing; a registered Apple device does. Google doesn't report saves back.
   */
  appleWallet: number;
  lapsed: {
    total: number;
    customers: {
      id: string;
      name: string | null;
      email: string | null;
      cookieId: string;
      visits: number;
      lastVisit: string;
      daysAway: number;
    }[];
  };
}

const DAY_MS = 86_400_000;

function dayNumOf(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

function ymdOf(dayNum: number): string {
  return new Date(dayNum * DAY_MS).toISOString().slice(0, 10);
}

/** Today's date in the given timezone, as a day number. */
function todayIn(tz: string): number {
  let ymd: string;
  try {
    ymd = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  } catch {
    ymd = new Date().toISOString().slice(0, 10);
  }
  return dayNumOf(ymd);
}

/** Monday on or before the given day. Day 0 (1970-01-01) was a Thursday. */
function weekStartOf(dayNum: number): number {
  return dayNum - ((dayNum + 3) % 7);
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

interface CustomerDays {
  id: Types.ObjectId;
  days: number[]; // sorted ascending, distinct
}

function kpisFor(customers: CustomerDays[], from: number, to: number): InsightKpis {
  let active = 0;
  let fresh = 0;
  let returning = 0;
  let visits = 0;
  for (const c of customers) {
    const inWindow = c.days.filter((d) => d >= from && d <= to).length;
    if (!inWindow) continue;
    active++;
    visits += inWindow;
    if (c.days[0] >= from) fresh++;
    else returning++;
  }
  return {
    activeCustomers: active,
    newCustomers: fresh,
    returningShare: active ? returning / active : null,
    visitsPerCustomer: active ? visits / active : null,
  };
}

export async function getShopInsights(shop: {
  _id: Types.ObjectId;
  timezone?: string;
  perkMode?: boolean;
  stampThreshold?: number;
}): Promise<ShopInsights> {
  const tz = shop.timezone || "UTC";
  const today = todayIn(tz);
  const threshold = Math.max(1, shop.stampThreshold || 8);
  const heatmapFrom = new Date(Date.now() - HEATMAP_DAYS * DAY_MS);

  const [rollup, heatAgg, cards, walletCustomers] = await Promise.all([
    StampRequest.aggregate<{ _id: Types.ObjectId; days: string[] }>([
      { $match: { shop: shop._id, status: "approved" } },
      {
        $group: {
          _id: "$customer",
          days: {
            $addToSet: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz },
            },
          },
        },
      },
    ]),
    // Heatmap counts visits too: one per customer per local day, placed at the
    // hour of that day's first approved request.
    StampRequest.aggregate<{ _id: { dow: number; hour: number }; n: number }>([
      { $match: { shop: shop._id, status: "approved", createdAt: { $gte: heatmapFrom } } },
      {
        $group: {
          _id: {
            customer: "$customer",
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } },
          },
          first: { $min: "$createdAt" },
        },
      },
      {
        $group: {
          _id: {
            dow: { $dayOfWeek: { date: "$first", timezone: tz } },
            hour: { $hour: { date: "$first", timezone: tz } },
          },
          n: { $sum: 1 },
        },
      },
    ]),
    StampCard.find({ shop: shop._id, disabled: { $ne: true } })
      .select("customer stamps")
      .lean<{ customer: Types.ObjectId; stamps: number }[]>(),
    WalletPass.distinct("customer", {
      shop: shop._id,
      provider: "apple",
      "registrations.0": { $exists: true },
    }),
  ]);

  const customers: CustomerDays[] = rollup
    .filter((r) => r._id)
    .map((r) => ({ id: r._id, days: r.days.map(dayNumOf).sort((a, b) => a - b) }));

  // ── Headline numbers: this window vs the one before it ──────────────────
  const winFrom = today - INSIGHT_WINDOW_DAYS + 1;
  const kpis = kpisFor(customers, winFrom, today);
  const prevKpis = kpisFor(customers, winFrom - INSIGHT_WINDOW_DAYS, winFrom - 1);

  // ── Retention ───────────────────────────────────────────────────────────
  // Comeback rate only counts first-timers who've had a full 30 days to return.
  let comebackSample = 0;
  let cameBack = 0;
  const gaps: number[] = [];
  for (const c of customers) {
    const first = c.days[0];
    if (first <= today - 30) {
      comebackSample++;
      if (c.days.length > 1 && c.days[1] - first <= 30) cameBack++;
    }
    if (c.days.length > 1) {
      gaps.push((c.days[c.days.length - 1] - first) / (c.days.length - 1));
    }
  }
  const medianGap = median(gaps);

  // ── New vs returning, by week ───────────────────────────────────────────
  const thisWeek = weekStartOf(today);
  const firstWeek = thisWeek - (TREND_WEEKS - 1) * 7;
  const weekly = Array.from({ length: TREND_WEEKS }, (_, i) => ({
    weekStart: ymdOf(firstWeek + i * 7),
    newCustomers: 0,
    returningCustomers: 0,
  }));
  for (const c of customers) {
    const firstVisitWeek = weekStartOf(c.days[0]);
    const seen = new Set<number>();
    for (const d of c.days) {
      const w = weekStartOf(d);
      if (w < firstWeek || seen.has(w)) continue;
      seen.add(w);
      const row = weekly[(w - firstWeek) / 7];
      if (!row) continue;
      if (w === firstVisitWeek) row.newCustomers++;
      else row.returningCustomers++;
    }
  }

  // ── Visit frequency ─────────────────────────────────────────────────────
  const frequency = FREQUENCY_BUCKETS.map((b) => ({
    label: b.label,
    customers: customers.filter((c) => c.days.length >= b.min && c.days.length <= b.max).length,
  }));

  // ── Heatmap, Monday-first ($dayOfWeek is 1 = Sunday … 7 = Saturday) ─────
  const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const row of heatAgg) {
    heatmap[(row._id.dow + 5) % 7][row._id.hour] += row.n;
  }

  // ── Card progress (stamp shops) ─────────────────────────────────────────
  // Only cards whose holder visited in the last 90 days — a card abandoned a
  // year ago at 3/8 isn't a customer about to earn a reward.
  const lastVisit = new Map(customers.map((c) => [c.id.toString(), c.days[c.days.length - 1]]));
  let progress: ShopInsights["progress"] = null;
  let rewardsWaiting: number | null = null;
  let nearlyThere: number | null = null;
  if (!shop.perkMode) {
    const counts = Array(threshold + 1).fill(0) as number[];
    rewardsWaiting = 0;
    nearlyThere = 0;
    for (const card of cards) {
      const last = lastVisit.get(card.customer?.toString());
      if (last === undefined || last < today - HEATMAP_DAYS) continue;
      const stamps = Math.max(0, card.stamps || 0);
      if (stamps >= threshold) rewardsWaiting++;
      else if (stamps >= threshold - 2) nearlyThere++;
      counts[Math.min(stamps, threshold)]++;
    }
    progress = counts.map((n, stamps) => ({ stamps, cards: n }));
  }

  // ── Lapsed regulars ─────────────────────────────────────────────────────
  const lapsedAll = customers
    .filter((c) => {
      const away = today - c.days[c.days.length - 1];
      return (
        c.days.length >= REGULAR_MIN_VISITS && away >= LAPSED_AFTER_DAYS && away <= LAPSED_CAP_DAYS
      );
    })
    .sort((a, b) => b.days.length - a.days.length);
  const lapsedTop = lapsedAll.slice(0, LAPSED_LIST_LIMIT);
  const people = lapsedTop.length
    ? await Customer.find({ _id: { $in: lapsedTop.map((c) => c.id) } })
        .select("name email cookieId")
        .lean<{ _id: Types.ObjectId; name?: string; email?: string; cookieId: string }[]>()
    : [];
  const personById = new Map(people.map((p) => [p._id.toString(), p]));

  return {
    windowDays: INSIGHT_WINDOW_DAYS,
    kpis,
    prevKpis,
    comebackRate: comebackSample ? cameBack / comebackSample : null,
    comebackSample,
    medianDaysBetweenVisits: medianGap === null ? null : Math.round(medianGap * 10) / 10,
    lifetimeCustomers: customers.length,
    weekly,
    frequency,
    heatmap,
    heatmapDays: HEATMAP_DAYS,
    progress,
    rewardsWaiting,
    nearlyThere,
    // Counted against customers who've visited, not raw cards — most cards
    // are one-off scans that never earned a stamp.
    appleWallet: (walletCustomers as Types.ObjectId[]).filter((id) =>
      lastVisit.has(id.toString()),
    ).length,
    lapsed: {
      total: lapsedAll.length,
      customers: lapsedTop.map((c) => {
        const p = personById.get(c.id.toString());
        const last = c.days[c.days.length - 1];
        return {
          id: c.id.toString(),
          name: p?.name ?? null,
          email: p?.email ?? null,
          cookieId: p?.cookieId ?? "",
          visits: c.days.length,
          lastVisit: ymdOf(last),
          daysAway: today - last,
        };
      }),
    },
  };
}
