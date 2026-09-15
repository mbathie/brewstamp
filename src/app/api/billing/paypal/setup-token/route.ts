import { NextResponse } from "next/server";
import { Subscription } from "@/models";
import { createSetupToken, PayPalError } from "@/lib/paypal";
import { paypalEnabled, requireOwner } from "../_shared";

// Replacing the saved card, step 1: a setup token for the Card Fields to
// fill in. No charge. Attached to the existing PayPal customer so the old
// and new cards live under the same record.
export async function POST() {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  if (!paypalEnabled()) {
    return NextResponse.json({ error: "Card billing is not enabled." }, { status: 400 });
  }
  const sub = await Subscription.findOne({ shop: auth.merchant.shop._id });
  try {
    const token = await createSetupToken({ customerId: sub?.paypalCustomerId || undefined });
    return NextResponse.json({ setupTokenId: token.id });
  } catch (err) {
    console.error("[PayPal] setup token failed:", err);
    return NextResponse.json({ error: err instanceof PayPalError ? err.message : "Could not start card update" }, { status: 502 });
  }
}
