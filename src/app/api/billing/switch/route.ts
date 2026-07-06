import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { Subscription, Shop } from "@/models";
import { stripe } from "@/lib/stripe";
import {
  getPlanBySlug,
  resolvePlanPriceId,
  type PlanSlug,
  type BillingInterval,
} from "@/lib/plans";

// Switch the active subscription to a different paid plan, or schedule a
// cancellation when the target is "free". Stripe handles the prorated
// credit for the unused portion of the current period automatically when
// proration_behavior='create_prorations' — the difference is applied as a
// negative line on the next invoice (or as an immediate invoice on
// upgrades, depending on Stripe billing settings).
//
// Body: { plan: 'free' | 'pro' | 'plus' | 'max' }
//
// Free → Paid is not handled here — clients should POST to
// /api/billing/checkout instead since there's no existing subscription to
// mutate. This route 400s in that case.
export async function POST(req: Request) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (merchant.role !== "owner") {
    return NextResponse.json(
      { error: "Only the shop owner can change the plan." },
      { status: 403 }
    );
  }

  let body: { plan?: string; interval?: string } = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const interval: BillingInterval = body.interval === "year" ? "year" : "month";
  const targetSlug = body.plan as PlanSlug | undefined;
  const targetPlan = targetSlug ? getPlanBySlug(targetSlug) : null;
  if (!targetPlan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const sub = await Subscription.findOne({ shop: merchant.shop._id });
  if (!sub) {
    return NextResponse.json(
      { error: "No existing subscription — start with checkout instead" },
      { status: 400 }
    );
  }

  // Guard against attempting to call live Stripe with seed-fake IDs.
  if (sub.stripeSubscriptionId.startsWith("sub_seed_")) {
    return NextResponse.json(
      {
        error:
          "Seed subscription — plan switching is only available on real Stripe-backed accounts.",
      },
      { status: 400 }
    );
  }

  // Downgrade to Free = cancel at period end. Subscription doc keeps its
  // current state until Stripe fires the canceled webhook.
  if (targetPlan.slug === "free") {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    // Mirror locally so the UI shows "cancels on…" immediately, ahead of the
    // subscription.updated webhook.
    sub.cancelAtPeriodEnd = true;
    await sub.save();
    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: true,
    });
  }

  const newPriceId = resolvePlanPriceId(targetPlan.slug, interval);
  if (!newPriceId) {
    const envVar =
      interval === "year"
        ? targetPlan.stripePriceEnvVarAnnual
        : targetPlan.stripePriceEnvVar;
    return NextResponse.json(
      {
        error: `Stripe price for plan "${targetPlan.slug}" (${interval}ly) is not configured. Set ${envVar} in env.`,
      },
      { status: 500 }
    );
  }

  // Need the existing subscription item ID to swap the price on it.
  const stripeSub = await stripe.subscriptions.retrieve(
    sub.stripeSubscriptionId
  );
  const itemId = stripeSub.items.data[0]?.id;
  if (!itemId) {
    return NextResponse.json(
      { error: "Subscription has no items — cannot switch" },
      { status: 500 }
    );
  }

  const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    items: [{ id: itemId, price: newPriceId }],
    // Prorate the unused portion of the current price against the new one.
    // The credit applied is automatic — Stripe computes (days_remaining /
    // period_length) * old_price and credits it on the next invoice.
    proration_behavior: "create_prorations",
    // Clear any pending cancel_at_period_end on upgrades — the user clearly
    // wants to stay subscribed.
    cancel_at_period_end: false,
  });

  // Mirror new plan state locally so the UI reflects it immediately. The
  // canonical state still comes from Stripe webhooks.
  sub.stripePriceId = newPriceId;
  sub.planLabel = targetPlan.label;
  sub.status = updated.status;
  sub.cancelAtPeriodEnd = updated.cancel_at_period_end;
  await sub.save();

  return NextResponse.json({
    ok: true,
    plan: targetPlan.slug,
    planLabel: targetPlan.label,
  });
}
