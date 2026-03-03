import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Subscription, Shop, User } from "@/models";
import { stripe } from "@/lib/stripe";
import { sendPaymentReceiptEmail } from "@/lib/email";
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

      await Subscription.findOneAndUpdate(
        { shop: shopId },
        {
          shop: shopId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id,
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
        { stripeSubscriptionId: sub.id },
        { status: "active", ...period }
      );

      // Send payment receipt email
      try {
        const localSub = await Subscription.findOne({ stripeSubscriptionId: sub.id });
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

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        { status: mappedStatus, ...period }
      );
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        { status: "canceled" }
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
