import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, StampRequest, User, Subscription } from "@/models";

const ADMIN_EMAIL = "mbathie@gmail.com";

// Single Stripe Pro price. Update here if the listed price ever changes — it
// drives the MRR figure on the admin dashboard.
const PRO_PRICE_USD = 5;

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await connectDB();

  const shops = await Shop.find().sort({ createdAt: -1 }).lean();

  const shopIds = shops.map((s) => s._id);
  const stampCounts = await StampCard.aggregate([
    { $match: { shop: { $in: shopIds } } },
    {
      $group: {
        _id: "$shop",
        totalStamps: { $sum: "$totalEarned" },
        customers: {
          $sum: { $cond: [{ $gt: ["$totalEarned", 0] }, 1, 0] },
        },
      },
    },
  ]);

  const stampMap = new Map(
    stampCounts.map((s: any) => [s._id.toString(), { totalStamps: s.totalStamps, customers: s.customers }])
  );

  // Last activity per shop (most recent approved stamp request)
  const lastActivity = await StampRequest.aggregate([
    { $match: { status: "approved", shop: { $in: shopIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$shop", lastActive: { $first: "$createdAt" } } },
  ]);
  const lastActiveMap = new Map(
    lastActivity.map((s: any) => [s._id.toString(), s.lastActive])
  );

  const ownerIds = shops.map((s) => s.owner);
  const owners = await User.find({ _id: { $in: ownerIds } }).lean();
  const ownerMap = new Map(owners.map((u: any) => [u._id.toString(), u.email]));

  // Check which shops have active subscriptions
  const activeSubs = await Subscription.find({ shop: { $in: shopIds }, status: "active" }).lean();
  const proShopIds = new Set(activeSubs.map((s: any) => s.shop.toString()));

  const result = shops.map((shop: any) => ({
    _id: shop._id,
    name: shop.name,
    code: shop.code,
    ownerEmail: ownerMap.get(shop.owner.toString()) || "Unknown",
    totalStamps: stampMap.get(shop._id.toString())?.totalStamps || 0,
    customers: stampMap.get(shop._id.toString())?.customers || 0,
    createdAt: shop.createdAt,
    lastActive: lastActiveMap.get(shop._id.toString()) || null,
    isPro: proShopIds.has(shop._id.toString()),
  }));

  // Growth charts: pull 90 days so client-side can compute weekly/monthly
  // aggregations and 7-day deltas without re-fetching.
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
      { $match: { totalEarned: { $gt: 0 }, createdAt: { $gte: ninetyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          customers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Shop signups by date (entire history — gives us a long signup curve)
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

  // Subscription upgrades by date (active subs only — captures genuine
  // conversions, not cancelled trials).
  const allActiveSubsByDate: Record<string, number> = {};
  for (const sub of activeSubs) {
    const d = new Date((sub as { createdAt: Date }).createdAt)
      .toISOString()
      .slice(0, 10);
    allActiveSubsByDate[d] = (allActiveSubsByDate[d] || 0) + 1;
  }
  const dailyUpgrades = Object.entries(allActiveSubsByDate)
    .map(([date, count]) => ({ _id: date, upgrades: count }))
    .sort((a, b) => a._id.localeCompare(b._id));

  return NextResponse.json({
    shops: result,
    proCount: proShopIds.size,
    mrrUsd: proShopIds.size * PRO_PRICE_USD,
    charts: {
      dailyStamps,
      dailyCustomers,
      dailyShops,
      dailyUpgrades,
    },
  });
}
