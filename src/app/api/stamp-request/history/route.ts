import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { StampRequest } from "@/models";

export async function GET(req: Request) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "today";
  const dateParam = url.searchParams.get("date"); // YYYY-MM-DD

  const now = new Date();
  let since: Date;
  let until: Date | undefined;

  if (dateParam) {
    // Specific date mode
    const [y, m, d] = dateParam.split("-").map(Number);
    since = new Date(y, m - 1, d);
    until = new Date(y, m - 1, d + 1);
  } else {
    switch (range) {
      case "week":
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case "month":
        since = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      default: // today
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }
  }

  const match: any = {
    shop: merchant.shop._id,
    status: { $in: ["approved", "rejected"] },
    createdAt: until ? { $gte: since, $lt: until } : { $gte: since },
  };

  const [requests, statsAgg, chartAgg] = await Promise.all([
    StampRequest.find(match)
      .populate("customer", "name email cookieId")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    StampRequest.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalStamps: { $sum: { $ifNull: ["$stampsAwarded", 1] } },
          uniqueCustomers: { $addToSet: "$customer" },
          redeems: {
            $sum: { $cond: [{ $eq: ["$redeem", true] }, 1, 0] },
          },
        },
      },
    ]),
    // Group by date for chart
    StampRequest.aggregate([
      { $match: match },
      {
        $group: {
          _id:
            range === "today" || dateParam
              ? { $hour: "$createdAt" }
              : {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                  },
                },
          stamps: { $sum: { $ifNull: ["$stampsAwarded", 1] } },
          checkins: { $sum: 1 },
          redeems: {
            $sum: { $cond: [{ $eq: ["$redeem", true] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const stats = {
    customers: statsAgg[0]?.uniqueCustomers?.length || 0,
    stamps: statsAgg[0]?.totalStamps || 0,
    redeems: statsAgg[0]?.redeems || 0,
  };

  return NextResponse.json({ requests, stats, chart: chartAgg });
}
