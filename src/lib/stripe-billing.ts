// Mirroring Stripe subscriptions into our Subscription doc. Shared by the
// webhook and the checkout return (/api/billing/checkout/confirm), so a plan
// shows as active the moment the owner lands back on the billing page, even
// if the webhook hasn't arrived yet. Both paths are idempotent upserts.
import type Stripe from "stripe";
import { Subscription, Shop } from "@/models";
import { getPlanByPriceId } from "@/lib/plans";
import { stripe as stripeMain, stripeLegacy, type StripeAccount } from "@/lib/stripe";

export function getPeriodDates(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return {
    currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
    currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
  };
}

/**
 * Activate the subscription a completed Checkout Session created. Returns the
 * shop id it activated, or null when the session isn't a finished
 * subscription checkout.
 */
export async function activateCheckoutSession(
  session: Stripe.Checkout.Session,
  account: StripeAccount
): Promise<string | null> {
  if (session.mode !== "subscription" || !session.subscription) return null;
  if (session.status !== "complete") return null;
  const shopId = session.metadata?.shopId;
  if (!shopId) return null;

  const stripe = account === "main" ? stripeMain : stripeLegacy;
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const sub = await stripe.subscriptions.retrieve(subId);
  const period = getPeriodDates(sub);
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  const price = sub.items.data[0]?.price;
  const priceId = price?.id;
  const plan = priceId ? getPlanByPriceId(priceId) : undefined;

  // One subscription doc per shop: a new checkout replaces whatever was
  // there (an ended PayPal or legacy-Stripe plan). Set provider and clear
  // the PayPal-only fields explicitly — a doc left on provider "paypal"
  // would also be charged by the PayPal renewal cron.
  const existing = await Subscription.findOne({ shop: shopId }).select("provider status stripeSubscriptionId").lean<any>();
  if (
    existing?.provider === "paypal" &&
    ["active", "past_due"].includes(existing.status)
  ) {
    console.warn(`[Stripe] shop ${shopId} checked out on Stripe while its PayPal plan was ${existing.status}; the PayPal plan stops renewing`);
  }
  await Subscription.findOneAndUpdate(
    { shop: shopId },
    {
      $set: {
        shop: shopId,
        provider: "stripe",
        stripeAccount: account,
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        ...(plan ? { planLabel: plan.label, planSlug: plan.slug } : {}),
        interval: price?.recurring?.interval === "year" ? "year" : "month",
        ...(price?.unit_amount != null ? { priceCents: price.unit_amount } : {}),
        currency: price?.currency ?? "usd",
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        status: sub.status === "past_due" ? "past_due" : "active",
        creditCents: 0,
        failedAttempts: 0,
        ...period,
      },
      $unset: {
        paypalVaultId: 1,
        paypalCustomerId: 1,
        card: 1,
        pendingPlanSlug: 1,
        pendingInterval: 1,
        migrationToken: 1,
        migrationEmailedAt: 1,
        migratedAt: 1,
        migratedFromStripeSubscriptionId: 1,
        nextAttemptAt: 1,
        lastPaymentAt: 1,
      },
    },
    { upsert: true }
  );

  // Keep the shop's customer id for this account, so the next checkout
  // reuses it.
  if (customerId) {
    await Shop.findByIdAndUpdate(shopId, {
      [account === "main" ? "stripeMainCustomerId" : "stripeCustomerId"]: customerId,
    });
  }
  if (existing?.stripeSubscriptionId !== sub.id) {
    console.log(`[Stripe] ${account} subscription ${sub.id} active for shop ${shopId} (${plan?.slug ?? priceId})`);
  }
  return shopId;
}
