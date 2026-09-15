import { NextResponse } from "next/server";
import { createSetupToken, PayPalError } from "@/lib/paypal";
import { subForToken } from "../_shared";

// Public, token-gated: start saving a card for a migrating subscriber.
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sub = await subForToken(token);
  if (!sub) return NextResponse.json({ error: "This link is invalid or has already been used." }, { status: 404 });
  try {
    const t = await createSetupToken({ customerId: sub.paypalCustomerId || undefined });
    return NextResponse.json({ setupTokenId: t.id });
  } catch (err) {
    console.error("[PayPal migration] setup token failed:", err);
    return NextResponse.json({ error: err instanceof PayPalError ? err.message : "Could not start" }, { status: 502 });
  }
}
