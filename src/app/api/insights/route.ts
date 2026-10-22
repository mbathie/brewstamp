import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { getShopPlanLimits } from "@/lib/plan-limits";
import { getShopInsights } from "@/lib/insights";

// Customer insights for the current shop. A plan feature (hasAnalytics): shops
// on a plan without it get `locked` and the dashboard shows an upgrade card
// instead — the numbers aren't computed at all.
export async function GET() {
  const merchant = await getMerchant();
  if (!merchant?.shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const limits = await getShopPlanLimits(merchant.shop._id.toString());
  if (!limits.plan.hasAnalytics) {
    return NextResponse.json({ locked: true, planLabel: limits.plan.label });
  }

  const insights = await getShopInsights(merchant.shop);
  return NextResponse.json({ locked: false, insights });
}
