import { NextResponse } from "next/server";
import { createVerifyOrder, PayPalError, scaFor } from "@/lib/paypal";
import { paypalEnabled, requireOwner } from "../../_shared";
import { migratableStripeSub } from "../_sub";

// Owner moving their Stripe subscription to a card saved with PayPal, step 1:
// an AUTHORIZE order the Card Fields attach to. Nothing is captured.
export async function POST() {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  if (!paypalEnabled()) {
    return NextResponse.json({ error: "Card billing is not enabled." }, { status: 400 });
  }
  const sub = await migratableStripeSub(auth.merchant.shop._id);
  if (!sub) {
    return NextResponse.json({ error: "There's no subscription on this shop to move." }, { status: 404 });
  }
  try {
    const order = await createVerifyOrder({
      currency: sub.currency || "usd",
      customId: `brewstamp:${String(sub._id)}:verify`,
      description: `Card verification — ${auth.merchant.shop.name}`,
      sca: scaFor(auth.merchant.shop.timezone),
    });
    console.log(`[Migration] setup (signed in): verify order=${order.id} shop=${auth.merchant.shop._id} sca=${scaFor(auth.merchant.shop.timezone)}`);
    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error("[PayPal migration] verify order failed:", err);
    return NextResponse.json({ error: err instanceof PayPalError ? err.message : "Could not start" }, { status: 502 });
  }
}
