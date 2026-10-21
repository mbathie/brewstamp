import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Subscription, Shop, User, Payment } from "@/models";
import { stripe as stripeMain, stripeLegacy, type StripeAccount } from "@/lib/stripe";
import { getPlanCatalog } from "@/lib/plan-catalog";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { recordReferralEarning, reverseReferralEarning } from "@/lib/referrals";
import { activateCheckoutSession, getPeriodDates, recordPaidInvoice } from "@/lib/stripe-billing";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Both Stripe accounts post here (see @/lib/stripe). The signing secret
  // that verifies the event tells us which account sent it, and so which
  // client to use for follow-up reads.
  const secrets: [StripeAccount, string | undefined][] = [
    ["main", process.env.STRIPE_WEBHOOK_SECRET],
    ["legacy", process.env.STRIPE_LEGACY_WEBHOOK_SECRET],
  ];
  let event: Stripe.Event | null = null;
  let account: StripeAccount = "main";
  for (const [acct, secret] of secrets) {
    if (!secret) continue;
    try {
      event = stripeMain.webhooks.constructEvent(body, signature, secret);
      account = acct;
      break;
    } catch {
      // Try the other account's secret.
    }
  }
  if (!event) {
    console.error(
      `Webhook signature verification failed (main secret: ${!!process.env.STRIPE_WEBHOOK_SECRET}, legacy secret: ${!!process.env.STRIPE_LEGACY_WEBHOOK_SECRET})`
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const stripe = account === "main" ? stripeMain : stripeLegacy;

  await connectDB();

  console.log(`[Stripe webhook] ${account} ${event.type} event=${event.id} object=${(event.data.object as { id?: string }).id ?? "-"}`);
  switch (event.type) {
    case "checkout.session.completed": {
      await activateCheckoutSession(event.data.object as Stripe.Checkout.Session, account);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        invoice.parent?.subscription_details?.subscription;
      if (!subId || typeof subId !== "string") break;

      const sub = await stripe.subscriptions.retrieve(subId);
      // A first invoice can arrive before checkout.session.completed has
      // created the Subscription doc; that path records the invoice itself.
      await recordPaidInvoice(invoice, sub);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const statusMap: Record<string, string> = {
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        unpaid: "unpaid",
      };
      const mappedStatus = statusMap[sub.status] || sub.status;
      const period = getPeriodDates(sub);
      // Subscription.updated fires on plan changes — keep the price, tier and
      // amount in sync so the top-bar badge and billing page follow the live
      // plan (planSlug wins over stripePriceId in subscriptionTier).
      const price = sub.items.data[0]?.price;
      const priceId = price?.id;
      const hit = (await getPlanCatalog()).byPriceId(priceId);
      const plan = hit?.plan;

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id, provider: { $ne: "paypal" } },
        {
          status: mappedStatus,
          ...(priceId ? { stripePriceId: priceId } : {}),
          ...(plan ? { planLabel: plan.label, planSlug: plan.slug, interval: hit!.price.interval } : {}),
          ...(price?.unit_amount != null ? { priceCents: price.unit_amount, currency: price.currency } : {}),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          ...period,
        }
      );
      break;
    }

    // Refunds and disputes void any referral commission on the payment.
    case "charge.refunded":
    case "charge.dispute.created": {
      const obj = event.data.object as Stripe.Charge | Stripe.Dispute;
      const chargeId = event.type === "charge.refunded" ? (obj as Stripe.Charge).id : ((obj as Stripe.Dispute).charge as string);
      const p = await Payment.findOneAndUpdate(
        { stripeChargeId: chargeId },
        { $set: { status: event.type === "charge.refunded" ? "refunded" : "disputed" } },
        { returnDocument: "after" }
      );
      if (p) await reverseReferralEarning(p._id, event.type === "charge.refunded" ? "refunded" : "disputed");
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id, provider: { $ne: "paypal" } },
        { status: "canceled" }
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
