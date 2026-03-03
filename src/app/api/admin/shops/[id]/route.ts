import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, StampRequest, User } from "@/models";
import Customer from "@/models/Customer";

const ADMIN_EMAIL = "mbathie@gmail.com";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await connectDB();

  const shop = await Shop.findById(id).populate("owner", "name email phone").lean();
  if (!shop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get all stamp cards with customer info (only those with stamps)
  const stampCards = await StampCard.find({ shop: id, totalEarned: { $gt: 0 } })
    .populate("customer", "name email cookieId")
    .sort({ updatedAt: -1 })
    .lean();

  // Get stamp request stats
  const [requestStats] = await StampRequest.aggregate([
    { $match: { shop: shop._id } },
    {
      $group: {
        _id: null,
        totalApproved: {
          $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
        },
        totalRejected: {
          $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
        },
        totalRedeems: {
          $sum: { $cond: [{ $eq: ["$redeem", true] }, 1, 0] },
        },
        totalStampsAwarded: {
          $sum: { $ifNull: ["$stampsAwarded", 0] },
        },
        firstActivity: { $min: "$createdAt" },
        lastActivity: { $max: "$createdAt" },
      },
    },
  ]);

  // Get recent stamp requests (last 50)
  const recentRequests = await StampRequest.find({ shop: id })
    .populate("customer", "name email cookieId")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Activity by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyActivity = await StampRequest.aggregate([
    {
      $match: {
        shop: shop._id,
        status: "approved",
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        stamps: { $sum: { $ifNull: ["$stampsAwarded", 1] } },
        visits: { $sum: 1 },
        redeems: { $sum: { $cond: [{ $eq: ["$redeem", true] }, 1, 0] } },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  return NextResponse.json({
    shop: {
      _id: (shop as any)._id,
      name: (shop as any).name,
      code: (shop as any).code,
      stampThreshold: (shop as any).stampThreshold,
      bgColor: (shop as any).bgColor,
      fgColor: (shop as any).fgColor,
      bgPattern: (shop as any).bgPattern,
      logo: !!(shop as any).logo,
      createdAt: (shop as any).createdAt,
      dripDay3Sent: (shop as any).dripDay3Sent,
      dripDay7Sent: (shop as any).dripDay7Sent,
      owner: (shop as any).owner,
    },
    customers: stampCards.map((sc: any) => ({
      name: sc.customer?.name || null,
      email: sc.customer?.email || null,
      cookieId: sc.customer?.cookieId || null,
      stamps: sc.stamps,
      totalEarned: sc.totalEarned,
      freeRedeemed: sc.freeRedeemed,
      lastVisit: sc.updatedAt,
    })),
    stats: {
      totalCustomers: stampCards.length,
      totalApproved: requestStats?.totalApproved || 0,
      totalRejected: requestStats?.totalRejected || 0,
      totalRedeems: requestStats?.totalRedeems || 0,
      totalStampsAwarded: requestStats?.totalStampsAwarded || 0,
      firstActivity: requestStats?.firstActivity || null,
      lastActivity: requestStats?.lastActivity || null,
    },
    dailyActivity,
    recentRequests: recentRequests.map((r: any) => ({
      status: r.status,
      stampsAwarded: r.stampsAwarded,
      redeem: r.redeem,
      customerName: r.customer?.name || null,
      customerEmail: r.customer?.email || null,
      createdAt: r.createdAt,
    })),
  });
}
