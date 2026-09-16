import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Subscription, Shop, User, Payment } from "@/models";
import { stripe } from "@/lib/stripe";
import { getIntervalByPriceId, getPlanByPriceId } from "@/lib/plans";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { recordReferralEarning, reverseReferralEarning } from "@/lib/referrals";
import type Stripe from "stripe";

function getPeriodDates(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return {
    currentPeriodStart: item
      ? new Date(item.current_period_start * 1000)
      : undefined,
    currentPeriodEnd: item
      ? new Date(item.current_period_end * 1000)
      : undefined,
  };
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    console.error("Secret present:", !!process.env.STRIPE_WEBHOOK_SECRET);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) break;

      const shopId = session.metadata?.shopId;
      if (!shopId) break;

      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const period = getPeriodDates(sub);

      const priceId = sub.items.data[0]?.price.id;
      const planLabel = priceId ? getPlanByPriceId(priceId)?.label : undefined;

      await Subscription.findOneAndUpdate(
        { shop: shopId },
        {
          shop: shopId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          ...(planLabel ? { planLabel } : {}),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          status: "active",
          ...period,
        },
        { upsert: true }
      );

      // Ensure shop has stripeCustomerId
      await Shop.findByIdAndUpdate(shopId, {
        stripeCustomerId: session.customer as string,
      });
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        invoice.parent?.subscription_details?.subscription;
      if (!subId || typeof subId !== "string") break;

      const sub = await stripe.subscriptions.retrieve(subId);
      const period = getPeriodDates(sub);

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id, provider: { $ne: "paypal" } },
        { status: "active", ...period }
      );

      // Record the payment in our own ledger (transaction history + finance
      // read from here, not from Stripe). Upsert on invoice id: Stripe may
      // redeliver, and the backfill script may have written it already.
      const localSub = await Subscription.findOne({ stripeSubscriptionId: sub.id, provider: { $ne: "paypal" } });
      if (localSub && invoice.amount_paid > 0) {
        const line = invoice.lines.data[0];
        const priceId = sub.items.data[0]?.price.id;
        const plan = priceId ? getPlanByPriceId(priceId) : undefined;
        const priorPaid = await Payment.countDocuments({ subscription: localSub._id, status: "paid" });
        await Payment.updateOne(
          { stripeInvoiceId: invoice.id },
          {
            $set: {
              shop: localSub.shop,
              subscription: localSub._id,
              provider: "stripe",
              stripeInvoiceId: invoice.id,
              stripeChargeId: ((invoice as any).charge as string | undefined) ?? undefined,
              hostedUrl: invoice.hosted_invoice_url ?? undefined,
              paidAt: new Date(invoice.created * 1000),
              kind: priorPaid === 0 ? "initial" : line && (line as any).proration ? "upgrade" : "renewal",
              status: "paid",
              amountCents: invoice.amount_paid,
              currency: invoice.currency,
              planSlug: plan?.slug,
              interval: priceId ? getIntervalByPriceId(priceId) : undefined,
              description: line?.description ?? plan?.label ?? "Brewstamp",
              periodStart: line?.period ? new Date(line.period.start * 1000) : undefined,
              periodEnd: line?.period ? new Date(line.period.end * 1000) : undefined,
            },
          },
          { upsert: true }
        );
        const row = await Payment.findOne({ stripeInvoiceId: invoice.id }).select("_id").lean<any>();
        if (row) await recordReferralEarning(row._id).catch((e) => console.error("[Webhook] referral earning failed:", e));
      }

      // Send payment receipt email
      try {
        if (localSub) {
          const shop = await Shop.findById(localSub.shop);
          const owner = shop ? await User.findById(shop.owner) : null;
          if (owner?.email && shop) {
            await sendPaymentReceiptEmail({
              to: owner.email,
              merchantName: owner.name || "there",
              shopName: shop.name,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              invoiceDate: new Date(invoice.created * 1000),
              periodEnd: period.currentPeriodEnd || new Date(),
            });
          }
        }
      } catch (emailErr) {
        console.error("[Webhook] Failed to send receipt email:", emailErr);
      }

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
      // Subscription.updated fires on plan changes — keep priceId + label in
      // sync so the top-bar badge follows the live tier.
      const priceId = sub.items.data[0]?.price.id;
      const planLabel = priceId ? getPlanByPriceId(priceId)?.label : undefined;

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id, provider: { $ne: "paypal" } },
        {
          status: mappedStatus,
          ...(priceId ? { stripePriceId: priceId } : {}),
          ...(planLabel ? { planLabel } : {}),
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
        { new: true }
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
