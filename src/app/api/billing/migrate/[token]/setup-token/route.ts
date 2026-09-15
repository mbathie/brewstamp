import { NextResponse } from "next/server";
import { createVerifyOrder, PayPalError } from "@/lib/paypal";
import { targetForToken } from "../_shared";

// Public, token-gated: start saving a card for a migrating subscriber
// (Brewstamp shop or legacy StampyStamp merchant). Returns an AUTHORIZE
// order the card fields attach to; nothing is captured.
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const target = await targetForToken(token);
  if (!target) return NextResponse.json({ error: "This link is invalid or has already been used." }, { status: 404 });
  const currency = (target.sub.currency || "usd") as string;
  const name = target.kind === "stampy" ? target.sub.merchantName : "Brewstamp";
  try {
    const order = await createVerifyOrder({
      currency,
      customId: `${target.kind}:${String(target.sub._id)}:verify`,
      description: `Card verification — ${name}`,
    });
    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error("[PayPal migration] verify order failed:", err);
    return NextResponse.json({ error: err instanceof PayPalError ? err.message : "Could not start" }, { status: 502 });
  }
}
