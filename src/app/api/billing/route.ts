import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { Payment, Shop, ShopMembership, StampCard, Subscription } from "@/models";
import { LIVE_SUB_STATUSES, freeTierOf, FREE_TIER_CHANGED_AT, type BillingInterval } from "@/lib/plans";
import { getPlanCatalog } from "@/lib/plan-catalog";
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
  const freeTier = freeTierOf(merchant.shop);

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
  const catalog = await getPlanCatalog();
  let currentPlanSlug: string | null = null;
  let currentInterval: BillingInterval | null = null;
  if (subscription) {
    const tier = catalog.subscriptionTier(subscription);
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

  const ownedMemberships = await ShopMembership.find({ user: merchant.user._id, role: "owner" }).select("shop").lean();
  const ownedShops = ownedMemberships.length;

  // No live plan here but a paid sub on another of the owner's shops: that
  // plan covers this shop too (see getShopPlanLimits), so the page shows it
  // rather than the Free trial. The highest plan wins, as it does there.
  let coveredBy: { shopId: string; shopName: string; planLabel: string } | null = null;
  if (!subscription || !(LIVE_SUB_STATUSES as readonly string[]).includes(subscription.status)) {
    const others = await Subscription.find({
      shop: { $in: ownedMemberships.map((m: any) => m.shop), $ne: shopId },
      status: { $in: LIVE_SUB_STATUSES },
    }).lean<any[]>();
    let best: { sub: any; rank: number; label: string } | null = null;
    for (const s of others) {
      const plan = catalog.resolveSub(s);
      const rank = catalog.rank(plan.slug);
      if (!best || rank > best.rank) best = { sub: s, rank, label: plan.label };
    }
    if (best && best.rank > catalog.rank("free")) {
      const payer = await Shop.findById(best.sub.shop).select("name").lean<any>();
      coveredBy = { shopId: String(best.sub.shop), shopName: payer?.name ?? "your other shop", planLabel: best.label };
    }
  }

  return NextResponse.json({
    totalStamps,
    // This shop's Free trial tier: 50 stamps, or 100 if it was created before
    // the 2026-09-30 change (grandfathered).
    limit: freeTier.stampLimit,
    freeTier: {
      tier: freeTier.tier,
      label: freeTier.label,
      stampLimit: freeTier.stampLimit,
      grandfathered: freeTier.grandfathered,
      changedAt: FREE_TIER_CHANGED_AT,
    },
    ownedShops,
    coveredBy,
    // The whole catalogue (archived plans and prices included) — the page
    // shows active plans plus the shop's own plan if it's been archived.
    // Another customer's custom deal is never sent.
    plans: catalog.plans.filter((p) => !p.custom || p.slug === currentPlanSlug),
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
