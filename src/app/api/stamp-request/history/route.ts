import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { StampCard, StampRequest } from "@/models";

export async function GET(req: Request) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "today";
  const dateParam = url.searchParams.get("date"); // YYYY-MM-DD (legacy single)
  const fromParam = url.searchParams.get("from"); // YYYY-MM-DD
  const toParam = url.searchParams.get("to");     // YYYY-MM-DD (inclusive)

  const now = new Date();
  let since: Date | undefined;
  let until: Date | undefined;
  const isAll = range === "all" && !dateParam && !fromParam;

  if (fromParam && toParam) {
    const [fy, fm, fd] = fromParam.split("-").map(Number);
    const [ty, tm, td] = toParam.split("-").map(Number);
    since = new Date(fy, fm - 1, fd);
    until = new Date(ty, tm - 1, td + 1); // end-of-day exclusive
  } else if (dateParam) {
    const [y, m, d] = dateParam.split("-").map(Number);
    since = new Date(y, m - 1, d);
    until = new Date(y, m - 1, d + 1);
  } else if (!isAll) {
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

  // Previous comparable window (same length, ending where `since` starts).
  // No comparison for "all" since there's no prior period.
  const periodMs = since ? (until ?? now).getTime() - since.getTime() : 0;
  const prevSince = since ? new Date(since.getTime() - periodMs) : undefined;
  const prevUntil = since;

  const match: Record<string, unknown> = {
    shop: merchant.shop._id,
    status: { $in: ["approved", "rejected"] },
    ...(since
      ? { createdAt: until ? { $gte: since, $lt: until } : { $gte: since } }
      : {}),
  };

  const prevMatch: Record<string, unknown> = {
    shop: merchant.shop._id,
    status: { $in: ["approved", "rejected"] },
    ...(prevSince && prevUntil
      ? { createdAt: { $gte: prevSince, $lt: prevUntil } }
      : { _id: null }), // no-op match → empty agg
  };

  // 7-day sparkline (always last 7 calendar days regardless of range)
  const sparkSince = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const sparkMatch: Record<string, unknown> = {
    shop: merchant.shop._id,
    status: { $in: ["approved", "rejected"] },
    createdAt: { $gte: sparkSince },
  };

  const [requests, statsAgg, prevStatsAgg, chartAgg, sparkAgg] = await Promise.all([
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
          totalStamps: {
            $sum: {
              $cond: [
                { $eq: ["$status", "approved"] },
                { $ifNull: ["$stampsAwarded", 1] },
                0,
              ],
            },
          },
          uniqueCustomers: { $addToSet: "$customer" },
          redeems: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$redeem", true] }, { $eq: ["$status", "approved"] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    StampRequest.aggregate([
      { $match: prevMatch },
      {
        $group: {
          _id: null,
          totalStamps: {
            $sum: {
              $cond: [
                { $eq: ["$status", "approved"] },
                { $ifNull: ["$stampsAwarded", 1] },
                0,
              ],
            },
          },
          uniqueCustomers: { $addToSet: "$customer" },
          redeems: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$redeem", true] }, { $eq: ["$status", "approved"] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    StampRequest.aggregate([
      { $match: match },
      {
        $group: {
          _id:
            // Hour binning for single-day windows (today, legacy ?date=, or
            // from==to). Day binning otherwise — including multi-day custom
            // ranges. Month binning only for "all" with no explicit date.
            range === "today" || dateParam || (fromParam && fromParam === toParam)
              ? { $hour: "$createdAt" }
              : isAll
                ? {
                    $dateToString: {
                      format: "%Y-%m",
                      date: "$createdAt",
                    },
                  }
                : {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$createdAt",
                    },
                  },
          stamps: {
            $sum: {
              $cond: [
                { $eq: ["$status", "approved"] },
                { $ifNull: ["$stampsAwarded", 1] },
                0,
              ],
            },
          },
          checkins: { $sum: 1 },
          redeems: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$redeem", true] }, { $eq: ["$status", "approved"] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    StampRequest.aggregate([
      { $match: sparkMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          stamps: {
            $sum: {
              $cond: [
                { $eq: ["$status", "approved"] },
                { $ifNull: ["$stampsAwarded", 1] },
                0,
              ],
            },
          },
          customers: { $addToSet: "$customer" },
          redeems: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$redeem", true] }, { $eq: ["$status", "approved"] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Hydrate each request with the merchant's per-customer tags so the dashboard
  // can show them inline without a second round-trip per row.
  const customerIds = Array.from(
    new Set(
      (requests as Array<{ customer?: { _id?: unknown } }>)
        .map((r) => r.customer?._id?.toString?.())
        .filter((x): x is string => !!x),
    ),
  );
  const tagCards =
    customerIds.length > 0
      ? await StampCard.find({
          shop: merchant.shop._id,
          customer: { $in: customerIds },
        })
          .select("customer tags")
          .lean<Array<{ customer: { toString(): string }; tags?: string[] }>>()
      : [];
  const tagMap = new Map<string, string[]>();
  for (const c of tagCards) tagMap.set(c.customer.toString(), c.tags || []);
  const requestsWithTags = (requests as Array<Record<string, unknown>>).map((r) => {
    const cust = r.customer as { _id?: unknown } | undefined;
    const cid = cust?._id?.toString?.();
    return { ...r, tags: cid ? tagMap.get(cid) || [] : [] };
  });

  const stats = {
    customers: statsAgg[0]?.uniqueCustomers?.length || 0,
    stamps: statsAgg[0]?.totalStamps || 0,
    redeems: statsAgg[0]?.redeems || 0,
  };

  const prevStats = {
    customers: prevStatsAgg[0]?.uniqueCustomers?.length || 0,
    stamps: prevStatsAgg[0]?.totalStamps || 0,
    redeems: prevStatsAgg[0]?.redeems || 0,
  };

  // Build a 7-entry sparkline aligned to last 7 days
  const sparkMap = new Map<string, { stamps: number; customers: number; redeems: number }>();
  for (const row of sparkAgg as Array<{ _id: string; stamps: number; customers: unknown[]; redeems: number }>) {
    sparkMap.set(row._id, {
      stamps: row.stamps,
      customers: Array.isArray(row.customers) ? row.customers.length : 0,
      redeems: row.redeems,
    });
  }
  const sparkline: { stamps: number[]; customers: number[]; redeems: number[] } = {
    stamps: [],
    customers: [],
    redeems: [],
  };
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const entry = sparkMap.get(key) || { stamps: 0, customers: 0, redeems: 0 };
    sparkline.stamps.push(entry.stamps);
    sparkline.customers.push(entry.customers);
    sparkline.redeems.push(entry.redeems);
  }

  return NextResponse.json({
    requests: requestsWithTags,
    stats,
    prevStats,
    chart: chartAgg,
    sparkline,
  });
}
