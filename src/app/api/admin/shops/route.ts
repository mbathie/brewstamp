import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, StampRequest, User, Subscription, WalletPass } from "@/models";
import { getPlanBySlug, resolveSub, type PlanSlug } from "@/lib/plans";
import { getBrewstampFinance } from "@/lib/finance";
import { combineAtRate } from "@/lib/finance-math";
import { scoreFreeShop, DEFAULT_BG_COLOR, type Likelihood } from "@/lib/conversion-score";

const FREE_STAMP_LIMIT = getPlanBySlug("free")!.stampLimit as number;
const DAY_MS = 86_400_000;

// A customer counts as "active" if they've engaged within this window. The
// admin views hide everyone older so the numbers reflect a live business, not
// a lifetime tally inflated by one-time scanners.
const ACTIVE_DAYS = 90;

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await connectDB();

  const shops = await Shop.find().sort({ createdAt: -1 }).lean();
  const shopIds = shops.map((s) => s._id);

  const activeWindow = new Date();
  activeWindow.setDate(activeWindow.getDate() - ACTIVE_DAYS);

  // Per-shop totals. "active" customers are engaged (earned a stamp OR redeemed
  // a free coffee) AND seen within the active window. freeCoffees is the perk
  // redemption count (StampCard.freeRedeemed doubles as rewards for stamp
  // shops, so it's only surfaced as "free coffees" for perk shops in the UI).
  const stampAgg = await StampCard.aggregate([
    { $match: { shop: { $in: shopIds } } },
    {
      $group: {
        _id: "$shop",
        totalStamps: { $sum: "$totalEarned" },
        freeRedeemed: { $sum: "$freeRedeemed" },
        customers: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $gt: ["$totalEarned", 0] },
                  { $gt: ["$freeRedeemed", 0] },
                ],
              },
              1,
              0,
            ],
          },
        },
        activeCustomers: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $or: [
                      { $gt: ["$totalEarned", 0] },
                      { $gt: ["$freeRedeemed", 0] },
                    ],
                  },
                  { $gte: ["$updatedAt", activeWindow] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const statMap = new Map(stampAgg.map((s: any) => [s._id.toString(), s]));

  // Per-shop stamping activity: last approved request, distinct active days,
  // stamps awarded, and requests in the last 14 days. These feed the upgrade
  // likelihood score (same inputs as scripts/pipeline-report.ts).
  const since14 = new Date(Date.now() - 14 * DAY_MS);
  const since30 = new Date(Date.now() - 30 * DAY_MS);
  const activity = await StampRequest.aggregate([
    { $match: { status: "approved", shop: { $in: shopIds } } },
    {
      $group: {
        _id: "$shop",
        lastActive: { $max: "$createdAt" },
        stampsAwarded: { $sum: { $ifNull: ["$stampsAwarded", 0] } },
        days: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
        last14: { $sum: { $cond: [{ $gte: ["$createdAt", since14] }, 1, 0] } },
        stamps30: {
          $sum: { $cond: [{ $gte: ["$createdAt", since30] }, { $ifNull: ["$stampsAwarded", 0] }, 0] },
        },
      },
    },
    {
      $project: { lastActive: 1, stampsAwarded: 1, last14: 1, stamps30: 1, activeDays: { $size: "$days" } },
    },
  ]);
  const activityMap = new Map(activity.map((a: any) => [a._id.toString(), a]));

  const passAgg = await WalletPass.aggregate([
    { $match: { shop: { $in: shopIds } } },
    { $group: { _id: "$shop", n: { $sum: 1 } } },
  ]);
  const passMap = new Map(passAgg.map((p: any) => [p._id.toString(), p.n as number]));

  const owners = await User.find({
    _id: { $in: shops.map((s) => s.owner) },
  }).lean();
  const ownerMap = new Map(owners.map((u: any) => [u._id.toString(), u.email]));

  // Live subscriptions → tier + monthly revenue, keyed by shop. past_due is
  // still live (the card is being retried), matching getBrewstampFinance; the
  // row is flagged so it shows as at risk.
  const liveSubs = await Subscription.find({
    shop: { $in: shopIds },
    status: { $in: ["active", "past_due"] },
  }).lean();
  const subMap = new Map(
    liveSubs.map((s: any) => [
      s.shop.toString(),
      { ...resolveSub(s), status: s.status as string, cancelAtPeriodEnd: !!s.cancelAtPeriodEnd },
    ]),
  );

  // A paid plan covers every shop the owner has (see getShopPlanLimits), so
  // a sub-less shop whose owner pays elsewhere is not an upgrade lead.
  const shopOwner = new Map(shops.map((s: any) => [s._id.toString(), s.owner?.toString()]));
  const payingOwners = new Map<string, string>();
  for (const s of liveSubs) {
    const owner = shopOwner.get(s.shop.toString());
    if (owner) payingOwners.set(owner, resolveSub(s).label);
  }

  const now = Date.now();
  const result = shops.map((shop: any) => {
    const id = shop._id.toString();
    const stat = statMap.get(id);
    const sub = subMap.get(id);
    const act = activityMap.get(id);
    const coveredBy = !sub ? payingOwners.get(shop.owner?.toString()) ?? null : null;
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
              hasLogo: !!shop.logo,
              hasCustomColor: !!shop.bgColor && shop.bgColor !== DEFAULT_BG_COLOR,
              walletPasses: passMap.get(id) ?? 0,
            },
            now,
          )
        : null;
    return {
      _id: shop._id,
      name: shop.name,
      ownerEmail: ownerMap.get(shop.owner.toString()) || "Unknown",
      perkMode: !!shop.perkMode,
      planSlug: (sub?.slug ?? "free") as PlanSlug,
      planLabel: sub?.label ?? "Free",
      monthlyCents: sub?.monthlyCents ?? 0,
      legacy: sub?.legacy ?? false,
      subStatus: (sub?.status ?? null) as "active" | "past_due" | null,
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

  // Headline aggregates.
  const planCounts: Record<PlanSlug, number> = {
    free: 0,
    pro: 0,
    plus: 0,
    max: 0,
  };
  for (const r of result) planCounts[r.planSlug]++;
  // MRR from the finance lib, so this page, /dashboard/admin/finance and the
  // pipeline report agree (stored per-sub prices, past_due counted, AUD and
  // USD combined at par), plus the figure 30 days ago and the movement.
  const fin = await getBrewstampFinance({});
  const mrrUsd = Math.round(combineAtRate(fin.mrr)) / 100;
  const mrrMonthAgoUsd = Math.round(combineAtRate(fin.mrrMonthAgo)) / 100;
  const paidCount = subMap.size;
  const pastDueCount = liveSubs.filter((s: any) => s.status === "past_due").length;
  const perkShopCount = result.filter((r) => r.perkMode).length;
  // Total free rewards redeemed across ALL shops (stamp reward redemptions +
  // perk redemptions) — a platform-wide figure, not just perk shops.
  const totalFreeCoffees = result.reduce((sum, r) => sum + r.freeCoffees, 0);

  // Growth charts — 90 days of daily series for client-side aggregation.
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [dailyStamps, dailyCustomers] = await Promise.all([
    StampRequest.aggregate([
      { $match: { status: "approved", createdAt: { $gte: ninetyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          stamps: { $sum: { $ifNull: ["$stampsAwarded", 1] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    StampCard.aggregate([
      {
        $match: {
          $or: [{ totalEarned: { $gt: 0 } }, { freeRedeemed: { $gt: 0 } }],
          createdAt: { $gte: ninetyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          customers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const shopsByDate: Record<string, number> = {};
  // Some legacy rows have a null/invalid createdAt — Date.toISOString() throws
  // "Invalid time value" on those, which 500s the whole stats endpoint. Skip
  // any row we can't bucket to a valid day rather than blowing up the report.
  const isoDay = (v: unknown): string | null => {
    const d = new Date(v as string | number | Date);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };
  for (const shop of shops) {
    const d = isoDay((shop as { createdAt?: Date }).createdAt);
    if (!d) continue;
    shopsByDate[d] = (shopsByDate[d] || 0) + 1;
  }
  const dailyShops = Object.entries(shopsByDate)
    .map(([date, count]) => ({ _id: date, shops: count }))
    .sort((a, b) => a._id.localeCompare(b._id));

  const upgradesByDate: Record<string, number> = {};
  for (const sub of liveSubs) {
    const d = isoDay((sub as { createdAt?: Date }).createdAt);
    if (!d) continue;
    upgradesByDate[d] = (upgradesByDate[d] || 0) + 1;
  }
  const dailyUpgrades = Object.entries(upgradesByDate)
    .map(([date, count]) => ({ _id: date, upgrades: count }))
    .sort((a, b) => a._id.localeCompare(b._id));

  return NextResponse.json({
    shops: result,
    mrrUsd,
    paidCount,
    pastDueCount,
    mrrMonthAgoUsd,
    mrrMovement: fin.mrrMovement,
    freeStampLimit: FREE_STAMP_LIMIT,
    planCounts,
    perkShopCount,
    totalFreeCoffees,
    charts: { dailyStamps, dailyCustomers, dailyShops, dailyUpgrades },
  });
}
