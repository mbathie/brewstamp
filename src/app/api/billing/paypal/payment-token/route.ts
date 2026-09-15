import { NextResponse } from "next/server";
import { Subscription } from "@/models";
import { createPaymentToken, deletePaymentToken, PayPalError } from "@/lib/paypal";
import { paypalEnabled, requireOwner } from "../_shared";

// Replacing the saved card, step 2: exchange the approved setup token for a
// permanent payment token and point the subscription at it. A past-due sub
// gets its retry pulled forward so the new card is tried on the next run.
// Body: { setupTokenId }
export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  if (!paypalEnabled()) {
    return NextResponse.json({ error: "Card billing is not enabled." }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as { setupTokenId?: string; approveData?: unknown };
  const setupTokenId = body.setupTokenId;
  if (!setupTokenId) {
    console.error("[PayPal] payment-token: no setup token id in approve payload:", JSON.stringify(body.approveData));
    return NextResponse.json({ error: "Missing setupTokenId" }, { status: 400 });
  }

  const sub = await Subscription.findOne({ shop: auth.merchant.shop._id });
  if (!sub || sub.provider !== "paypal") {
    return NextResponse.json({ error: "No card-billed subscription on this shop" }, { status: 404 });
  }

  try {
    const token = await createPaymentToken(setupTokenId);
    const old = sub.paypalVaultId;
    const c = token.payment_source?.card;
    sub.paypalVaultId = token.id;
    if (token.customer?.id) sub.paypalCustomerId = token.customer.id;
    sub.card = { brand: c?.brand, last4: c?.last_digits, expiry: c?.expiry };
    if (sub.status === "past_due") sub.nextAttemptAt = new Date();
    await sub.save();
    if (old && old !== token.id) {
      deletePaymentToken(old).catch((e) => console.error("[PayPal] old token delete failed:", e));
    }
    return NextResponse.json({ ok: true, card: sub.card });
  } catch (err) {
    console.error("[PayPal] payment token failed:", err);
    return NextResponse.json({ error: err instanceof PayPalError ? err.message : "Could not save card" }, { status: 502 });
  }
}
