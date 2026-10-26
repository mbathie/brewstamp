import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getCurrentShopContext } from "@/lib/shop-context";
import { PERIODS, type Period } from "@/lib/dashboard-stats";
import { getGroupStats, type GroupShop } from "@/lib/group-stats";
import { Shop } from "@/models";

// The "All shops" dashboard's data: GET ?period=7d|30d|90d|12m, across every
// shop the signed-in user belongs to.
export async function GET(req: Request) {
  const ctx = await getCurrentShopContext();
  if (!ctx || ctx.memberships.length === 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();

  const period = (new URL(req.url).searchParams.get("period") || "30d") as Period;
  const days = PERIODS[period] ?? PERIODS["30d"];

  // Not ctx.allShops: that loads whole shop docs, logos included.
  const shops = await Shop.find({ _id: { $in: ctx.memberships.map((m) => m.shopId) } })
    .select("name timezone perkMode")
    .lean<GroupShop[]>();

  return NextResponse.json(await getGroupStats(shops, days));
}
