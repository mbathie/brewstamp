import { NextResponse } from "next/server";
import { PayPalError, verifyAndVaultCard } from "@/lib/paypal";
import { completeMigration } from "@/lib/paypal-billing";
import { stripe } from "@/lib/stripe";
import { paypalEnabled, requireOwner } from "../../_shared";
import { migratableStripeSub } from "../_sub";

// Step 2: authorize (then void) to vault the card, and move the subscription
// to PayPal — same as the emailed migration link. Price, currency and renewal
// date carry over; a cancel-at-period-end is lifted (saving a card is how a
// Stripe subscriber keeps their plan) and the Stripe sub is set to end so
// nothing is double-billed. Nothing is charged today. Body: { orderId }
export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  if (!paypalEnabled()) {
    return NextResponse.json({ error: "Card billing is not enabled." }, { status: 400 });
  }
  const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: string };
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const sub = await migratableStripeSub(auth.merchant.shop._id);
  if (!sub) {
    return NextResponse.json({ error: "There's no subscription on this shop to move." }, { status: 404 });
  }
  try {
    const { vaultId, customerId, card } = await verifyAndVaultCard(orderId);
    const updated = await completeMigration({ subId: sub._id, vaultId, customerId, card, stripe });
    return NextResponse.json({ ok: true, card: updated?.card, nextChargeAt: updated?.currentPeriodEnd ?? null });
  } catch (err) {
    console.error("[PayPal migration] save card failed:", err);
    if (err instanceof PayPalError) {
      const friendly =
        err.issue === "INSTRUMENT_DECLINED" ? "Your card was declined by the issuer. Please try another card."
        : err.issue === "PAYER_ACTION_REQUIRED" ? "Your bank needs extra verification — please try again."
        : err.message;
      return NextResponse.json({ error: friendly, issue: err.issue }, { status: err.status === 402 ? 402 : 502 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
