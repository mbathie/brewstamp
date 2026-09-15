import { NextResponse } from "next/server";
import { PayPalError, verifyAndVaultCard } from "@/lib/paypal";
import { completeMigration } from "@/lib/paypal-billing";
import { completeStampyMigration } from "@/lib/stampy-billing";
import { stripe } from "@/lib/stripe";
import { targetForToken } from "../_shared";

// Public, token-gated: the card is approved — authorize (then void) to vault
// it, and move the subscription to PayPal. Nothing is charged; the cron
// bills on the existing renewal date. The token is consumed on completion.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const target = await targetForToken(token);
  if (!target) return NextResponse.json({ error: "This link is invalid or has already been used." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { orderId?: string };
  if (!body.orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  try {
    const { vaultId, customerId, card } = await verifyAndVaultCard(body.orderId);
    if (target.kind === "stampy") {
      const updated = await completeStampyMigration({ sub: target.sub, vaultId, customerId, card, stripe });
      return NextResponse.json({ ok: true, card: updated?.card, nextChargeAt: updated?.currentPeriodEnd ?? null });
    }
    const updated = await completeMigration({ subId: target.sub._id, vaultId, customerId, card, stripe });
    return NextResponse.json({ ok: true, card: updated?.card, nextChargeAt: updated?.currentPeriodEnd ?? null });
  } catch (err) {
    console.error("[PayPal migration] save card failed:", err);
    if (err instanceof PayPalError) {
      const issue = err.issue;
      const friendly =
        issue === "INSTRUMENT_DECLINED" ? "Your card was declined by the issuer. Please try another card."
        : issue === "PAYER_ACTION_REQUIRED" ? "Your bank needs extra verification — please try again."
        : err.message;
      return NextResponse.json({ error: friendly, issue }, { status: err.status === 402 ? 402 : 502 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
