import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { StampCard } from "@/models";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const stampCards = await StampCard.find({ shop: merchant.shop._id })
    .populate("customer", "name cookieId email")
    .sort({ updatedAt: -1 });

  return NextResponse.json({ customers: stampCards });
}
