import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ shop: merchant.shop });
}

export async function PATCH(req: Request) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { name, stampThreshold, logo, bgColor, fgColor, bgPattern } = await req.json();

  if (name) merchant.shop.name = name;
  if (stampThreshold) merchant.shop.stampThreshold = stampThreshold;
  if (logo !== undefined) merchant.shop.logo = logo || null;
  if (bgColor !== undefined) merchant.shop.bgColor = bgColor;
  if (fgColor !== undefined) merchant.shop.fgColor = fgColor;
  if (bgPattern !== undefined) merchant.shop.bgPattern = bgPattern;

  await merchant.shop.save();
  return NextResponse.json({ shop: merchant.shop });
}
