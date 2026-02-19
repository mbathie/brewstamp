import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { StampRequest } from "@/models";

export async function POST(req: Request) {
  await connectDB();
  const { shopId, customerId, redeem } = await req.json();

  if (!shopId || !customerId) {
    return NextResponse.json({ error: "Missing shopId or customerId" }, { status: 400 });
  }

  // Expire any old pending requests for this customer at this shop
  await StampRequest.updateMany(
    { shop: shopId, customer: customerId, status: "pending" },
    { status: "expired" }
  );

  const request = await StampRequest.create({
    shop: shopId,
    customer: customerId,
    redeem: !!redeem,
  });

  return NextResponse.json({ request }, { status: 201 });
}
