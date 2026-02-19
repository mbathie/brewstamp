import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { Customer, StampCard } from "@/models";

export async function POST(req: Request) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await connectDB();

  const cookieId = `manual-${randomUUID()}`;
  const customer = await Customer.create({
    cookieId,
    name: name.trim(),
    email: email?.trim() || undefined,
  });

  await StampCard.create({
    shop: merchant.shop._id,
    customer: customer._id,
  });

  return NextResponse.json({ customerId: customer._id });
}
