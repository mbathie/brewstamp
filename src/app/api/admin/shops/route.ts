import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, StampRequest, User, Subscription } from "@/models";
import { resolveSub, type PlanSlug } from "@/lib/plans";

const ADMIN_EMAIL = "mbathie@gmail.com";

// A customer counts as "active" if they've engaged within this window. The
// admin views hide everyone older so the numbers reflect a live business, not
// a lifetime tally inflated by one-time scanners.
const ACTIVE_DAYS = 90;

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
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

  // Last activity per shop (most recent approved request)
  const lastActivity = await StampRequest.aggregate([
    { $match: { status: "approved", shop: { $in: shopIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$shop", lastActive: { $first: "$createdAt" } } },
  ]);
  const lastActiveMap = new Map(
    lastActivity.map((s: any) => [s._id.toString(), s.lastActive]),
  );

  const owners = await User.find({
    _id: { $in: shops.map((s) => s.owner) },
  }).lean();
  const ownerMap = new Map(owners.map((u: any) => [u._id.toString(), u.email]));

  // Active subscriptions → tier + monthly revenue, keyed by shop.
  const activeSubs = await Subscription.find({
    shop: { $in: shopIds },
    status: "active",
  }).lean();
  const subMap = new Map(
    activeSubs.map((s: any) => [s.shop.toString(), resolveSub(s)]),
  );

  const result = shops.map((shop: any) => {
    const stat = statMap.get(shop._id.toString());
    const sub = subMap.get(shop._id.toString());
    return {
      _id: shop._id,
      name: shop.name,
      ownerEmail: ownerMap.get(shop.owner.toString()) || "Unknown",
      perkMode: !!shop.perkMode,
      planSlug: (sub?.slug ?? "free") as PlanSlug,
      planLabel: sub?.label ?? "Free",
      monthlyCents: sub?.monthlyCents ?? 0,
      legacy: sub?.legacy ?? false,
      totalStamps: stat?.totalStamps || 0,
      freeCoffees: stat?.freeRedeemed || 0,
      customers: stat?.activeCustomers || 0,
      createdAt: shop.createdAt,
      lastActive: lastActiveMap.get(shop._id.toString()) || null,
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
  const mrrUsd =
    [...subMap.values()].reduce((sum, s) => sum + s.monthlyCents, 0) / 100;
  const paidCount = subMap.size;
  const perkShopCount = result.filter((r) => r.perkMode).length;
  const totalFreeCoffees = result
    .filter((r) => r.perkMode)
    .reduce((sum, r) => sum + r.freeCoffees, 0);

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
  for (const shop of shops) {
    const d = new Date((shop as { createdAt: Date }).createdAt)
      .toISOString()
      .slice(0, 10);
    shopsByDate[d] = (shopsByDate[d] || 0) + 1;
  }
  const dailyShops = Object.entries(shopsByDate)
    .map(([date, count]) => ({ _id: date, shops: count }))
    .sort((a, b) => a._id.localeCompare(b._id));

  const upgradesByDate: Record<string, number> = {};
  for (const sub of activeSubs) {
    const d = new Date((sub as { createdAt: Date }).createdAt)
      .toISOString()
      .slice(0, 10);
    upgradesByDate[d] = (upgradesByDate[d] || 0) + 1;
  }
  const dailyUpgrades = Object.entries(upgradesByDate)
    .map(([date, count]) => ({ _id: date, upgrades: count }))
    .sort((a, b) => a._id.localeCompare(b._id));

  return NextResponse.json({
    shops: result,
    mrrUsd,
    paidCount,
    planCounts,
    perkShopCount,
    totalFreeCoffees,
    charts: { dailyStamps, dailyCustomers, dailyShops, dailyUpgrades },
  });
}
