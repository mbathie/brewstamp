import { NextResponse } from "next/server";
import { createVerifyOrder, PayPalError } from "@/lib/paypal";
import { targetForToken, who } from "../_shared";

// Public, token-gated: start saving a card for a migrating subscriber
// (Brewstamp shop or legacy StampyStamp merchant). Returns an AUTHORIZE
// order the card fields attach to; nothing is captured.
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const target = await targetForToken(token);
  if (!target) {
    console.warn(`[Migration] setup: unknown or used link token=${token.slice(0, 6)}…`);
    return NextResponse.json({ error: "This link is invalid or has already been used." }, { status: 404 });
  }
  const currency = (target.sub.currency || "usd") as string;
  const name = target.kind === "stampy" ? target.sub.merchantName : "Brewstamp";
  try {
    const order = await createVerifyOrder({
      currency,
      customId: `${target.kind}:${String(target.sub._id)}:verify`,
      description: `Card verification — ${name}`,
    });
    console.log(`[Migration] setup: verify order=${order.id} ${who(target)} currency=${currency}`);
    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error(`[Migration] setup FAILED ${who(target)}:`, err instanceof PayPalError ? `${err.status} issue=${err.issue} ${err.message}` : err);
    return NextResponse.json({ error: err instanceof PayPalError ? err.message : "Could not start" }, { status: 502 });
  }
}
