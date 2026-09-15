import { NextResponse } from "next/server";
import { createSetupToken, PayPalError } from "@/lib/paypal";
import { targetForToken } from "../_shared";

// Public, token-gated: start saving a card for a migrating subscriber
// (Brewstamp shop or legacy StampyStamp merchant).
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const target = await targetForToken(token);
  if (!target) return NextResponse.json({ error: "This link is invalid or has already been used." }, { status: 404 });
  try {
    const t = await createSetupToken({ customerId: target.sub.paypalCustomerId || undefined });
    return NextResponse.json({ setupTokenId: t.id });
  } catch (err) {
    console.error("[PayPal migration] setup token failed:", err);
    return NextResponse.json({ error: err instanceof PayPalError ? err.message : "Could not start" }, { status: 502 });
  }
}
