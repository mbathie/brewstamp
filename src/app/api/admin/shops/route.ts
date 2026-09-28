import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, StampRequest, User, Subscription, WalletPass } from "@/models";
import { getPlanBySlug, resolveSub, type PlanSlug } from "@/lib/plans";
import { getMrrSnapshot } from "@/lib/finance";
import { combineAtRate } from "@/lib/finance-math";
import { scoreFreeShop, DEFAULT_BG_COLOR, type Likelihood } from "@/lib/conversion-score";

const FREE_STAMP_LIMIT = getPlanBySlug("free")!.stampLimit as number;
const DAY_MS = 86_400_000;

// A customer counts as "active" if they've engaged within this window. The
// admin views hide everyone older so the numbers reflect a live business, not
// a lifetime tally inflated by one-time scanners.
const ACTIVE_DAYS = 90;

// Performance notes (2026-09-28): this endpoint used to load full Shop docs,
// and Shop.logo is a base64 data URI (up to ~160 KB each, ~5.4 MB across all
// shops) — that transfer dominated the response time. Shops are now read with
// a projection that reduces the logo to a boolean inside Mongo, owners to their
// email, and every query below runs in parallel. None of the aggregations
// filter by shop id: every shop is included, so a whole-collection group is
// the same result without shipping 200+ ids to the server in an $in.
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await connectDB();

  const now = Date.now();
  const activeWindow = new Date(now - ACTIVE_DAYS * DAY_MS);
  const since14 = new Date(now - 14 * DAY_MS);
  const since30 = new Date(now - 30 * DAY_MS);
  const since90 = new Date(now - 90 * DAY_MS);
  const engaged = { $or: [{ $gt: ["$totalEarned", 0] }, { $gt: ["$freeRedeemed", 0] }] };
  const dayOf = (field: string) => ({ $dateToString: { format: "%Y-%m-%d", date: field } });

  const [
    shops,
    cardStats,
    activity,
    passAgg,
    liveSubs,
    dailyStamps,
    dailyCustomers,
    mrrSnap,
  ] = await Promise.all([
    Shop.aggregate<{
      _id: unknown;
      name: string;
      owner: unknown;
      perkMode?: boolean;
      bgColor?: string;
      upgradeNudgeSent?: boolean;
      createdAt: Date;
      hasLogo: boolean;
    }>([
      { $sort: { createdAt: -1 } },
      {
        $project: {
          name: 1,
          owner: 1,
          perkMode: 1,
          bgColor: 1,
          upgradeNudgeSent: 1,
          createdAt: 1,
          // Never ship the data URI itself — only whether one is set.
          hasLogo: { $gt: [{ $strLenBytes: { $ifNull: ["$logo", ""] } }, 0] },
        },
      },
    ]),

    // Per-shop totals. "active" customers are engaged (earned a stamp OR
    // redeemed a reward) AND seen within the active window.
    StampCard.aggregate([
      {
        $group: {
          _id: "$shop",
          totalStamps: { $sum: "$totalEarned" },
          freeRedeemed: { $sum: "$freeRedeemed" },
          customers: { $sum: { $cond: [engaged, 1, 0] } },
          activeCustomers: {
            $sum: { $cond: [{ $and: [engaged, { $gte: ["$updatedAt", activeWindow] }] }, 1, 0] },
          },
        },
      },
    ]),

    // Per-shop stamping activity; feeds the upgrade likelihood score (same
    // inputs as scripts/pipeline-report.ts).
    StampRequest.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$shop",
          lastActive: { $max: "$createdAt" },
          stampsAwarded: { $sum: { $ifNull: ["$stampsAwarded", 0] } },
          days: { $addToSet: dayOf("$createdAt") },
          last14: { $sum: { $cond: [{ $gte: ["$createdAt", since14] }, 1, 0] } },
          stamps30: {
            $sum: { $cond: [{ $gte: ["$createdAt", since30] }, { $ifNull: ["$stampsAwarded", 0] }, 0] },
          },
        },
      },
      { $project: { lastActive: 1, stampsAwarded: 1, last14: 1, stamps30: 1, activeDays: { $size: "$days" } } },
    ]),

    WalletPass.aggregate([{ $group: { _id: "$shop", n: { $sum: 1 } } }]),

    // Live subscriptions. past_due is still live (the card is being retried),
    // matching the finance lib; the row is flagged so it shows as at risk.
    Subscription.find({ status: { $in: ["active", "past_due"] } })
      .select("shop status cancelAtPeriodEnd createdAt stripePriceId planLabel planSlug priceCents interval")
      .lean(),

    // Growth charts — 90 days of daily series, aggregated client-side.
    StampRequest.aggregate([
      { $match: { status: "approved", createdAt: { $gte: since90 } } },
      { $group: { _id: dayOf("$createdAt"), stamps: { $sum: { $ifNull: ["$stampsAwarded", 1] } } } },
      { $sort: { _id: 1 } },
    ]),
    StampCard.aggregate([
      {
        $match: {
          $or: [{ totalEarned: { $gt: 0 } }, { freeRedeemed: { $gt: 0 } }],
          createdAt: { $gte: since90 },
        },
      },
      { $group: { _id: dayOf("$createdAt"), customers: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    // MRR from the finance lib so this page, /dashboard/admin/finance and the
    // pipeline report agree (stored per-sub prices, past_due counted, AUD and
    // USD combined at par). The snapshot skips the revenue history.
    getMrrSnapshot(),
  ]);

  // Owners depend on the shops query; email is the only field used.
  const owners = await User.find({ _id: { $in: shops.map((s) => s.owner) } })
    .select("email")
    .lean();

  const key = (id: unknown) => String(id);
  const ownerMap = new Map(owners.map((u: any) => [key(u._id), u.email as string]));
  const statMap = new Map(cardStats.map((s: any) => [key(s._id), s]));
  const activityMap = new Map(activity.map((a: any) => [key(a._id), a]));
  const passMap = new Map(passAgg.map((p: any) => [key(p._id), p.n as number]));

  const shopOwner = new Map(shops.map((s) => [key(s._id), key(s.owner)]));
  // Ignore subs whose shop has since been deleted (the query isn't scoped).
  const subs = (liveSubs as any[]).filter((s) => shopOwner.has(key(s.shop)));
  const subMap = new Map(
    subs.map((s: any) => [
      key(s.shop),
      { ...resolveSub(s), status: s.status as "active" | "past_due", cancelAtPeriodEnd: !!s.cancelAtPeriodEnd },
    ]),
  );
  // A paid plan covers every shop the owner has (see getShopPlanLimits), so
  // a sub-less shop whose owner pays elsewhere is not an upgrade lead.
  const payingOwners = new Map<string, string>();
  for (const s of subs) {
    const owner = shopOwner.get(key(s.shop));
    if (owner) payingOwners.set(owner, resolveSub(s).label);
  }

  const planCounts: Record<PlanSlug, number> = { free: 0, pro: 0, plus: 0, max: 0 };
  let totalFreeCoffees = 0;

  const result = shops.map((shop) => {
    const id = key(shop._id);
    const stat = statMap.get(id);
    const sub = subMap.get(id);
    const act = activityMap.get(id);
    const coveredBy = !sub ? payingOwners.get(key(shop.owner)) ?? null : null;
    const planSlug = (sub?.slug ?? "free") as PlanSlug;
    planCounts[planSlug]++;
    totalFreeCoffees += stat?.freeRedeemed || 0;

    // Only a free, uncovered stamp shop is an upgrade lead. Perk shops run on
    // a different commercial model and are excluded.
    const conversion =
      !sub && !coveredBy && !shop.perkMode
        ? scoreFreeShop(
            {
              stamps: act?.stampsAwarded ?? 0,
              engaged: stat?.customers ?? 0,
              activeDays: act?.activeDays ?? 0,
              lastStampAt: act?.lastActive ?? null,
              hasLogo: shop.hasLogo,
              hasCustomColor: !!shop.bgColor && shop.bgColor !== DEFAULT_BG_COLOR,
              walletPasses: passMap.get(id) ?? 0,
            },
            now,
          )
        : null;

    return {
      _id: id,
      name: shop.name,
      ownerEmail: ownerMap.get(key(shop.owner)) || "Unknown",
      perkMode: !!shop.perkMode,
      planSlug,
      planLabel: sub?.label ?? "Free",
      monthlyCents: sub?.monthlyCents ?? 0,
      subStatus: sub?.status ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      coveredBy,
      totalStamps: stat?.totalStamps || 0,
      freeCoffees: stat?.freeRedeemed || 0,
      customers: stat?.activeCustomers || 0,
      engagedCustomers: stat?.customers || 0,
      activeDays: act?.activeDays ?? 0,
      requests14d: act?.last14 ?? 0,
      stamps30d: act?.stamps30 ?? 0,
      walletPasses: passMap.get(id) ?? 0,
      // Free shops stop stamping at the cap; null when the cap doesn't apply.
      freeCapUsed: !sub && !coveredBy ? Math.min(1, (stat?.totalStamps || 0) / FREE_STAMP_LIMIT) : null,
      upgradeNudgeSent: !!shop.upgradeNudgeSent,
      likelihood: (conversion?.likelihood ?? null) as Likelihood | null,
      conversionScore: conversion?.score ?? null,
      conversionWhy: conversion?.why ?? null,
      createdAt: shop.createdAt,
      lastActive: act?.lastActive || null,
    };
  });

  // Some legacy rows have a null/invalid createdAt — Date.toISOString() throws
  // "Invalid time value" on those. Skip any row we can't bucket to a valid day.
  const isoDay = (v: unknown): string | null => {
    const d = new Date(v as string | number | Date);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };
  const countByDay = (dates: unknown[], field: string) => {
    const by: Record<string, number> = {};
    for (const v of dates) {
      const d = isoDay(v);
      if (d) by[d] = (by[d] || 0) + 1;
    }
    return Object.entries(by)
      .map(([date, n]) => ({ _id: date, [field]: n }))
      .sort((a, b) => a._id.localeCompare(b._id));
  };

  return NextResponse.json(
    {
      shops: result,
      mrrUsd: Math.round(combineAtRate(mrrSnap.mrr)) / 100,
      mrrMonthAgoUsd: Math.round(combineAtRate(mrrSnap.mrrMonthAgo)) / 100,
      mrrMovement: mrrSnap.mrrMovement,
      paidCount: subMap.size,
      pastDueCount: subs.filter((s) => s.status === "past_due").length,
      freeStampLimit: FREE_STAMP_LIMIT,
      planCounts,
      totalFreeCoffees,
      charts: {
        dailyStamps,
        dailyCustomers,
        dailyShops: countByDay(shops.map((s) => s.createdAt), "shops"),
        dailyUpgrades: countByDay(subs.map((s) => s.createdAt), "upgrades"),
      },
    },
    // Admin-only and personalised: never cache in a shared cache.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
