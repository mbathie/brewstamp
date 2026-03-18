import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, StampRequest, User, Subscription } from "@/models";

const ADMIN_EMAIL = "mbathie@gmail.com";

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

  // Growth charts: daily stamps, new customers, shop signups
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dailyStamps, dailyCustomers] = await Promise.all([
    // Daily stamps (approved requests)
    StampRequest.aggregate([
      { $match: { status: "approved", createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          stamps: { $sum: { $ifNull: ["$stampsAwarded", 1] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Daily new customers (stamp cards created with activity)
    StampCard.aggregate([
      { $match: { totalEarned: { $gt: 0 }, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          customers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Shop signups by date (from shops array, no extra query needed)
  const shopsByDate: Record<string, number> = {};
  for (const shop of shops) {
    const d = new Date((shop as any).createdAt).toISOString().slice(0, 10);
    shopsByDate[d] = (shopsByDate[d] || 0) + 1;
  }
  const dailyShops = Object.entries(shopsByDate)
    .map(([date, count]) => ({ _id: date, shops: count }))
    .sort((a, b) => a._id.localeCompare(b._id));

  return NextResponse.json({
    shops: result,
    charts: {
      dailyStamps,
      dailyCustomers,
      dailyShops,
    },
  });
}
