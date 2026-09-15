import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { billingProvider } from "@/lib/paypal";

// Every customer-facing PayPal billing route: owner only, PayPal must be the
// active provider (or the shop already bills through it).
export async function requireOwner() {
  const merchant = await getMerchant();
  if (!merchant) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (merchant.role !== "owner") {
    return {
      error: NextResponse.json({ error: "Only the shop owner can manage billing." }, { status: 403 }),
    };
  }
  return { merchant };
}

export function paypalEnabled(): boolean {
  return billingProvider() === "paypal" && !!process.env.PAYPAL_CLIENT_ID;
}
