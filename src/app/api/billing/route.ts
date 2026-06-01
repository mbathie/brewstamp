import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { StampCard, Subscription } from "@/models";
import { stripe } from "@/lib/stripe";
import { getPlanByPriceId } from "@/lib/plans";

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

  let invoices: any[] = [];
  if (subscription && subscription.stripeCustomerId) {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 10,
      });
      invoices = stripeInvoices.data.map((inv) => ({
        id: inv.id,
        date: inv.created,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        pdf: inv.invoice_pdf,
      }));
    } catch {
      // If Stripe call fails, return empty invoices
    }
  }

  // Resolve current plan slug from the subscription's stripePriceId so the
  // billing UI can mark the active plan in its grid. Fall back to planLabel
  // (set on seed accounts) when the price ID doesn't match a known plan.
  let currentPlanSlug: string | null = null;
  if (subscription) {
    if (subscription.stripePriceId) {
      const plan = getPlanByPriceId(subscription.stripePriceId);
      if (plan) currentPlanSlug = plan.slug;
    }
    if (!currentPlanSlug && subscription.planLabel) {
      currentPlanSlug = subscription.planLabel.toLowerCase();
    }
  }
  const isSeed = !!subscription?.stripeSubscriptionId?.startsWith("sub_seed_");

  return NextResponse.json({
    totalStamps,
    limit: 100,
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          planSlug: currentPlanSlug,
          planLabel: subscription.planLabel || null,
          cancelAtPeriodEnd: !!subscription.cancelAtPeriodEnd,
          isSeed,
        }
      : null,
    invoices,
  });
}
