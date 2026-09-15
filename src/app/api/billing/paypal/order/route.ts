import { NextResponse } from "next/server";
import { Subscription } from "@/models";
import { getPlanBySlug, type BillingInterval, type PlanSlug } from "@/lib/plans";
import { createCardOrder, PayPalError } from "@/lib/paypal";
import { describe, priceFor, CURRENCY } from "@/lib/paypal-billing";
import { paypalEnabled, requireOwner } from "../_shared";

// Step 1 of a new subscription: create the PayPal order the Card Fields will
// attach the card to. Nothing is charged until /capture.
// Body: { plan: 'pro'|'plus'|'max', interval: 'month'|'year' }
export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  if (!paypalEnabled()) {
    return NextResponse.json({ error: "Card billing is not enabled." }, { status: 400 });
  }
  const { merchant } = auth;

  const body = (await req.json().catch(() => ({}))) as { plan?: string; interval?: string };
  const plan = getPlanBySlug(body.plan || "");
  if (!plan || plan.slug === "free") {
    return NextResponse.json({ error: "Plan must be a paid tier (pro, plus, max)" }, { status: 400 });
  }
  const slug = plan.slug as Exclude<PlanSlug, "free">;
  const interval: BillingInterval = body.interval === "year" ? "year" : "month";

  // A live subscription changes plan via /api/billing/switch, not a new charge.
  const existing = await Subscription.findOne({ shop: merchant.shop._id });
  if (existing && ["active", "past_due"].includes(existing.status) && existing.provider === "paypal" && existing.paypalVaultId) {
    return NextResponse.json({ error: "You already have an active subscription — switch plans instead." }, { status: 400 });
  }

  const amountCents = priceFor(slug, interval);
  try {
    const order = await createCardOrder({
      amountCents,
      currency: CURRENCY,
      description: describe(slug, interval, merchant.shop.name),
      customId: `${merchant.shop._id}:${slug}:${interval}:initial`,
      vault: true,
    });
    return NextResponse.json({ orderId: order.id, amountCents, currency: CURRENCY });
  } catch (err) {
    console.error("[PayPal] create order failed:", err);
    const msg = err instanceof PayPalError ? err.message : "Could not start checkout";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
