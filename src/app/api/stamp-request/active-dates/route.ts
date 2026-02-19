import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { StampRequest } from "@/models";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const dates = await StampRequest.aggregate([
    {
      $match: {
        shop: merchant.shop._id,
        status: { $in: ["approved", "rejected"] },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return NextResponse.json({ dates: dates.map((d: any) => d._id) });
}
