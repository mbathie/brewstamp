import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { Shop, Subscription } from "@/models";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant?.shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shopId = merchant.shop._id;

  const referredShops = await Shop.find({ referredBy: shopId })
    .select("name createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const referredShopIds = referredShops.map((s: any) => s._id);
  const activeSubs = await Subscription.find({
    shop: { $in: referredShopIds },
    status: "active",
  })
    .select("shop")
    .lean();

  const activeShopIds = new Set(activeSubs.map((s: any) => s.shop.toString()));

  const shops = referredShops.map((s: any) => ({
    _id: s._id,
    name: s.name,
    createdAt: s.createdAt,
    subscribed: activeShopIds.has(s._id.toString()),
  }));

  const totalReferrals = shops.length;
  const conversions = shops.filter((s: any) => s.subscribed).length;
  const rewardsEarned = conversions * 10; // $10 per conversion

  return NextResponse.json({
    referralCode: merchant.shop.code,
    totalReferrals,
    conversions,
    rewardsEarned,
    shops,
  });
}
