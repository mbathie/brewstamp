// The "All shops" dashboard for owners of more than one shop: combined
// today/period KPIs, stamps by shop over the period, customers shared between
// shops, and a per-shop comparison. Same row model as dashboard-stats.ts —
// each shop's history is read in its own timezone, and the period is anchored
// on the group's most common timezone so every shop shares the same dates.

import { Types } from "mongoose";
import { StampRequest } from "@/models";
import {
  type Grain,
  type PeriodKpis,
  type Row,
  type Totals,
  dayNumOf,
  grainFor,
  monthStartOf,
  nowIn,
  totalsFor,
  weekStartOf,
  ymdOf,
} from "@/lib/dashboard-stats";

export interface GroupShop {
  _id: Types.ObjectId;
  name: string;
  timezone?: string;
  perkMode?: boolean;
}

export interface GroupBucket {
  start: string;
  stamps: number;
  rewards: number;
  /** Stamps per shop id. */
  byShop: Record<string, number>;
}

export interface GroupShopRow {
  shopId: string;
  name: string;
  perkMode: boolean;
  today: Totals;
  kpis: PeriodKpis;
  prevKpis: PeriodKpis;
  /** Stamps per period bucket, for the row's sparkline. */
  spark: number[];
  lifetimeStamps: number;
  lifetimeCustomers: number;
  /** Local date of the shop's last approved stamp, or null. */
  lastActivity: string | null;
}

export interface GroupStats {
  todayDate: string;
  hour: number;
  today: { totals: Totals; lastWeek: Totals };
  period: {
    from: string;
    to: string;
    days: number;
    grain: Grain;
    /** Customers are counted once across the group, however many shops they visit. */
    kpis: PeriodKpis;
    prevKpis: PeriodKpis;
    buckets: GroupBucket[];
  };
  crossShop: {
    /** Customers who have ever been stamped at 2+ of the shops. */
    lifetime: number;
    lifetimeCustomers: number;
    /** Customers stamped at 2+ of the shops within the period. */
    period: number;
  };
  shops: GroupShopRow[];
}

type ShopRow = Row & { shop: string };

function firstDays(rows: Row[]): Map<string, number> {
  const first = new Map<string, number>();
  for (const r of rows) {
    const f = first.get(r.c);
    if (f === undefined || r.d < f) first.set(r.c, r.d);
  }
  return first;
}

const strip = (k: PeriodKpis): Totals => ({
  stamps: k.stamps,
  rewards: k.rewards,
  customers: k.customers,
  newCustomers: k.newCustomers,
  visits: k.visits,
});

export async function getGroupStats(shops: GroupShop[], days: number): Promise<GroupStats> {
  // Anchor "today" on the timezone most of the shops share.
  const tzCount = new Map<string, number>();
  for (const s of shops) {
    const tz = s.timezone || "UTC";
    tzCount.set(tz, (tzCount.get(tz) ?? 0) + 1);
  }
  const refTz = [...tzCount].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "UTC";
  const now = nowIn(refTz);
  const to = now.day;
  const from = to - days + 1;

  // One aggregate per timezone, each shop's days and hours in its own time.
  const byTz = new Map<string, Types.ObjectId[]>();
  for (const s of shops) {
    const tz = s.timezone || "UTC";
    byTz.set(tz, [...(byTz.get(tz) ?? []), s._id]);
  }
  const raw = await Promise.all(
    [...byTz].map(([tz, ids]) =>
      StampRequest.aggregate<{ shop: Types.ObjectId; c: Types.ObjectId; d: string; h: number; s: number; r?: boolean }>([
        { $match: { shop: { $in: ids }, status: "approved" } },
        {
          $project: {
            _id: 0,
            shop: 1,
            c: "$customer",
            d: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } },
            h: { $hour: { date: "$createdAt", timezone: tz } },
            s: { $ifNull: ["$stampsAwarded", 1] },
            r: "$redeem",
          },
        },
      ]),
    ),
  );
  const rows: ShopRow[] = raw
    .flat()
    .filter((r) => r.c)
    .map((r) => ({ shop: r.shop.toString(), c: r.c.toString(), d: dayNumOf(r.d), h: r.h, s: r.s, r: !!r.r }));

  // ── Combined ───────────────────────────────────────────────────────────
  const groupFirst = firstDays(rows);
  const todayTotals = strip(totalsFor(rows, groupFirst, to, to));
  const lastWeek = strip(totalsFor(rows, groupFirst, to - 7, to - 7, now.hour + 1));

  const grain = grainFor(days);
  const bucketOf = (d: number) =>
    grain === "day" ? d : grain === "week" ? Math.max(from, weekStartOf(d)) : Math.max(from, monthStartOf(d));
  const bucketStarts: number[] = [];
  for (let d = from; d <= to; d++) {
    const b = bucketOf(d);
    if (bucketStarts[bucketStarts.length - 1] !== b) bucketStarts.push(b);
  }
  const bucketIndex = new Map(bucketStarts.map((b, i) => [b, i]));
  const buckets: GroupBucket[] = bucketStarts.map((b) => ({ start: ymdOf(b), stamps: 0, rewards: 0, byShop: {} }));
  const sparks = new Map(shops.map((s) => [s._id.toString(), Array(bucketStarts.length).fill(0) as number[]]));

  // Which shops each customer has visited, lifetime and within the period.
  const shopsEver = new Map<string, Set<string>>();
  const shopsInPeriod = new Map<string, Set<string>>();
  const addTo = (m: Map<string, Set<string>>, c: string, shop: string) => {
    let set = m.get(c);
    if (!set) m.set(c, (set = new Set()));
    set.add(shop);
  };

  for (const row of rows) {
    addTo(shopsEver, row.c, row.shop);
    if (row.d < from || row.d > to) continue;
    addTo(shopsInPeriod, row.c, row.shop);
    const i = bucketIndex.get(bucketOf(row.d))!;
    const b = buckets[i];
    b.stamps += row.s;
    if (row.r) b.rewards++;
    b.byShop[row.shop] = (b.byShop[row.shop] ?? 0) + row.s;
    sparks.get(row.shop)![i] += row.s;
  }
  const multi = (m: Map<string, Set<string>>) => [...m.values()].filter((s) => s.size > 1).length;

  // ── Per shop ───────────────────────────────────────────────────────────
  const rowsByShop = new Map<string, ShopRow[]>(shops.map((s) => [s._id.toString(), []]));
  for (const row of rows) rowsByShop.get(row.shop)?.push(row);

  const shopRows: GroupShopRow[] = shops.map((s) => {
    const id = s._id.toString();
    const own = rowsByShop.get(id) ?? [];
    // "New" at a shop means new to that shop, even if they'd visited another.
    const first = firstDays(own);
    let lifetimeStamps = 0;
    let last = -Infinity;
    for (const r of own) {
      lifetimeStamps += r.s;
      if (r.d > last) last = r.d;
    }
    return {
      shopId: id,
      name: s.name,
      perkMode: !!s.perkMode,
      today: strip(totalsFor(own, first, to, to)),
      kpis: totalsFor(own, first, from, to),
      prevKpis: totalsFor(own, first, from - days, from - 1),
      spark: sparks.get(id)!,
      lifetimeStamps,
      lifetimeCustomers: first.size,
      lastActivity: own.length ? ymdOf(last) : null,
    };
  });
  shopRows.sort((a, b) => b.kpis.stamps - a.kpis.stamps || b.lifetimeStamps - a.lifetimeStamps);

  return {
    todayDate: ymdOf(to),
    hour: now.hour,
    today: { totals: todayTotals, lastWeek },
    period: {
      from: ymdOf(from),
      to: ymdOf(to),
      days,
      grain,
      kpis: totalsFor(rows, groupFirst, from, to),
      prevKpis: totalsFor(rows, groupFirst, from - days, from - 1),
      buckets,
    },
    crossShop: {
      lifetime: multi(shopsEver),
      lifetimeCustomers: shopsEver.size,
      period: multi(shopsInPeriod),
    },
    shops: shopRows,
  };
}
