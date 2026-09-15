import { NextResponse } from "next/server";
import { Subscription } from "@/models";
import { createVerifyOrder, PayPalError } from "@/lib/paypal";
import { paypalEnabled, requireOwner } from "../_shared";

// Replacing the saved card, step 1: an AUTHORIZE order the Card Fields
// attach to. Nothing is captured — the hold is voided once the card vaults.
export async function POST() {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  if (!paypalEnabled()) {
    return NextResponse.json({ error: "Card billing is not enabled." }, { status: 400 });
  }
  const sub = await Subscription.findOne({ shop: auth.merchant.shop._id });
  try {
    const order = await createVerifyOrder({
      currency: sub?.currency || "usd",
      customId: `${auth.merchant.shop._id}:verify`,
      description: `Card verification — ${auth.merchant.shop.name}`,
    });
    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error("[PayPal] verify order failed:", err);
    return NextResponse.json({ error: err instanceof PayPalError ? err.message : "Could not start card update" }, { status: 502 });
  }
}
