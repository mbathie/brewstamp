import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { Payment, StampCard, Subscription } from "@/models";
import { subscriptionTier, type BillingInterval } from "@/lib/plans";
import { billingProvider } from "@/lib/paypal";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (merchant.role !== "owner") {
    return NextResponse.json(
      { error: "Only the shop owner can view billing." },
      { status: 403 }
    );
  }

  const shopId = merchant.shop._id;

  // Aggregate total stamps for this shop
  const [stampAgg] = await StampCard.aggregate([
    { $match: { shop: shopId } },
    { $group: { _id: null, total: { $sum: "$totalEarned" } } },
  ]);
  const totalStamps = stampAgg?.total || 0;

  // Look up active subscription
  const subscription = await Subscription.findOne({ shop: shopId });

  // Transaction history comes from our own ledger for every provider —
  // Stripe rows are backfilled + written by the invoice webhook.
  const payments = await Payment.find({ shop: shopId, status: { $ne: "failed" } })
    .sort({ paidAt: -1, createdAt: -1 })
    .limit(24)
    .lean();
  const invoices = payments.map((p: any) => ({
    id: String(p._id),
    date: Math.floor(new Date(p.paidAt ?? p.createdAt).getTime() / 1000),
    amount: p.amountCents,
    currency: p.currency,
    status: p.status,
    description: p.description,
    pdf: p.hostedUrl ?? null,
  }));

  // Resolve current plan slug from the subscription's stripePriceId so the
  // billing UI can mark the active plan in its grid. Fall back to planLabel
  // (set on seed accounts) when the price ID doesn't match a known plan.
  let currentPlanSlug: string | null = null;
  let currentInterval: BillingInterval | null = null;
  if (subscription) {
    const tier = subscriptionTier(subscription);
    if (tier) {
      currentPlanSlug = tier.slug;
      currentInterval = tier.interval;
    }
    if (!currentPlanSlug && subscription.planLabel) {
      currentPlanSlug = subscription.planLabel.toLowerCase();
    }
  }
  const isSeed = !!subscription?.stripeSubscriptionId?.startsWith("sub_seed_");
  // Which provider a NEW checkout would use, and whether the client can
  // render PayPal's card fields at all.
  const provider = billingProvider();
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || null;

  return NextResponse.json({
    totalStamps,
    limit: 100,
    provider,
    paypalClientId,
    paypalEnv: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
    subscription: subscription
      ? {
          provider: subscription.provider || "stripe",
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          planSlug: currentPlanSlug,
          interval: currentInterval,
          planLabel: subscription.planLabel || null,
          cancelAtPeriodEnd: !!subscription.cancelAtPeriodEnd,
          isSeed,
          // PayPal-only detail for the manage card.
          card: subscription.card?.last4 ? subscription.card : null,
          pendingPlanSlug: subscription.pendingPlanSlug || null,
          pendingInterval: subscription.pendingInterval || null,
          failedAttempts: subscription.failedAttempts || 0,
          nextAttemptAt: subscription.nextAttemptAt || null,
          creditCents: subscription.creditCents || 0,
          priceCents: subscription.priceCents ?? null,
          currency: subscription.currency || "usd",
        }
      : null,
    invoices,
  });
}
