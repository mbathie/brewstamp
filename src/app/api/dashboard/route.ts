import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { getShopPlanLimits } from "@/lib/plan-limits";
import {
  MAX_RANGE_DAYS,
  PERIODS,
  dayNumOf,
  getDashboardStats,
  nowIn,
  type Period,
} from "@/lib/dashboard-stats";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

// The single-shop dashboard's data: GET ?period=7d|30d|90d|12m, or
// ?from=YYYY-MM-DD&to=YYYY-MM-DD (local days, inclusive). Retention and loyalty
// insights are a plan feature (hasAnalytics); without it `pro` is null and the
// dashboard shows an upgrade card in their place.
export async function GET(req: Request) {
  const merchant = await getMerchant();
  if (!merchant?.shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();

  const url = new URL(req.url);
  const today = nowIn(merchant.shop.timezone || "UTC").day;
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  let from: number;
  let to: number;
  if (fromParam && toParam && YMD.test(fromParam) && YMD.test(toParam)) {
    from = dayNumOf(fromParam);
    to = Math.min(dayNumOf(toParam), today);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) {
      return NextResponse.json({ error: "Invalid range" }, { status: 400 });
    }
    from = Math.max(from, to - MAX_RANGE_DAYS + 1);
  } else {
    const period = (url.searchParams.get("period") || "30d") as Period;
    const days = PERIODS[period] ?? PERIODS["30d"];
    to = today;
    from = today - days + 1;
  }

  const limits = await getShopPlanLimits(merchant.shop._id.toString());
  const stats = await getDashboardStats(merchant.shop, { from, to }, limits.plan.hasAnalytics);
  return NextResponse.json(stats);
}
