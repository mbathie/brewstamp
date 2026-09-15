import { NextResponse } from "next/server";
import { Subscription } from "@/models";
import { deletePaymentToken, PayPalError, verifyAndVaultCard } from "@/lib/paypal";
import { paypalEnabled, requireOwner } from "../_shared";

// Replacing the saved card, step 2: authorize (then void) the verify order
// to vault the card and point the subscription at it. A past-due sub gets
// its retry pulled forward so the new card is tried on the next run.
// Body: { orderId }
export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  if (!paypalEnabled()) {
    return NextResponse.json({ error: "Card billing is not enabled." }, { status: 400 });
  }
  const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: string };
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const sub = await Subscription.findOne({ shop: auth.merchant.shop._id });
  if (!sub || sub.provider !== "paypal") {
    return NextResponse.json({ error: "No card-billed subscription on this shop" }, { status: 404 });
  }

  try {
    const { vaultId, customerId, card } = await verifyAndVaultCard(orderId);
    const old = sub.paypalVaultId;
    sub.paypalVaultId = vaultId;
    if (customerId) sub.paypalCustomerId = customerId;
    sub.card = card;
    if (sub.status === "past_due") sub.nextAttemptAt = new Date();
    await sub.save();
    if (old && old !== vaultId) {
      deletePaymentToken(old).catch((e) => console.error("[PayPal] old token delete failed:", e));
    }
    return NextResponse.json({ ok: true, card: sub.card });
  } catch (err) {
    console.error("[PayPal] save card failed:", err);
    if (err instanceof PayPalError) {
      const friendly = err.issue === "INSTRUMENT_DECLINED" ? "Your card was declined by the issuer. Please try another card." : err.message;
      return NextResponse.json({ error: friendly }, { status: err.status === 402 ? 402 : 502 });
    }
    return NextResponse.json({ error: "Could not save card" }, { status: 500 });
  }
}
