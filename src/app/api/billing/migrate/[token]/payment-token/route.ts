import { NextResponse } from "next/server";
import { createPaymentToken, PayPalError } from "@/lib/paypal";
import { completeMigration } from "@/lib/paypal-billing";
import { stripe } from "@/lib/stripe";
import { subForToken } from "../_shared";

// Public, token-gated: the card is approved — vault it and move the
// subscription to PayPal. Nothing is charged; the cron bills on the existing
// renewal date. The token is consumed by completeMigration.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sub = await subForToken(token);
  if (!sub) return NextResponse.json({ error: "This link is invalid or has already been used." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { setupTokenId?: string; approveData?: unknown };
  if (!body.setupTokenId) {
    console.error("[PayPal migration] no setup token id in approve payload:", JSON.stringify(body.approveData));
    return NextResponse.json({ error: "Missing setupTokenId" }, { status: 400 });
  }
  try {
    const pt = await createPaymentToken(body.setupTokenId);
    const c = pt.payment_source?.card;
    const updated = await completeMigration({
      subId: sub._id,
      vaultId: pt.id,
      customerId: pt.customer?.id,
      card: { brand: c?.brand, last4: c?.last_digits, expiry: c?.expiry },
      stripe,
    });
    return NextResponse.json({ ok: true, card: updated?.card, nextChargeAt: updated?.currentPeriodEnd ?? null });
  } catch (err) {
    console.error("[PayPal migration] payment token failed:", err);
    return NextResponse.json({ error: err instanceof PayPalError ? err.message : "Could not save card" }, { status: 502 });
  }
}
