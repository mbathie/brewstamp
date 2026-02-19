import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, User } from "@/models";

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
    { $group: { _id: "$shop", totalStamps: { $sum: "$totalEarned" }, customers: { $sum: 1 } } },
  ]);

  const stampMap = new Map(
    stampCounts.map((s: any) => [s._id.toString(), { totalStamps: s.totalStamps, customers: s.customers }])
  );

  const ownerIds = shops.map((s) => s.owner);
  const owners = await User.find({ _id: { $in: ownerIds } }).lean();
  const ownerMap = new Map(owners.map((u: any) => [u._id.toString(), u.email]));

  const result = shops.map((shop: any) => ({
    _id: shop._id,
    name: shop.name,
    code: shop.code,
    ownerEmail: ownerMap.get(shop.owner.toString()) || "Unknown",
    totalStamps: stampMap.get(shop._id.toString())?.totalStamps || 0,
    customers: stampMap.get(shop._id.toString())?.customers || 0,
    createdAt: shop.createdAt,
  }));

  return NextResponse.json(result);
}
