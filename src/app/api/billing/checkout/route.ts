import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { Shop } from "@/models";
import { stripe } from "@/lib/stripe";
import {
  getPlanBySlug,
  resolvePlanPriceId,
  type PlanSlug,
  type BillingInterval,
} from "@/lib/plans";

// Start a Stripe Checkout session for a paid plan. Accepts an optional
// `plan` slug in the body — defaults to "pro" for back-compat with
// the old single-plan checkout button (and falls back to the legacy
// STRIPE_PRICE_ID env if no plan-specific env is configured yet).
export async function POST(req: Request) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (merchant.role !== "owner") {
    return NextResponse.json(
      { error: "Only the shop owner can start a subscription." },
      { status: 403 }
    );
  }

  let body: { plan?: string; interval?: string } = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const slug = (body.plan as PlanSlug) || "pro";
  const plan = getPlanBySlug(slug);
  if (!plan || plan.slug === "free") {
    return NextResponse.json(
      { error: "Plan must be a paid tier (pro, plus, max)" },
      { status: 400 }
    );
  }

  const interval: BillingInterval = body.interval === "year" ? "year" : "month";

  const priceId =
    resolvePlanPriceId(plan.slug, interval) ||
    // Back-compat: legacy single-plan setups stored the monthly Pro price as
    // STRIPE_PRICE_ID. Use it if the plan-specific var isn't set yet.
    (plan.slug === "pro" && interval === "month"
      ? process.env.STRIPE_PRICE_ID
      : null);

  if (!priceId) {
    const envVar =
      interval === "year"
        ? plan.stripePriceEnvVarAnnual
        : plan.stripePriceEnvVar;
    return NextResponse.json(
      {
        error: `Stripe price for plan "${plan.slug}" (${interval}ly) is not configured. Set ${envVar} in env, then run scripts/stripe-setup-plans.ts.`,
      },
      { status: 500 }
    );
  }

  const shop = merchant.shop;

  // Create or retrieve Stripe customer. Skip when the existing ID is a
  // seed placeholder so we never feed Stripe a fake customer.
  let customerId = shop.stripeCustomerId;
  if (!customerId || customerId.startsWith("cus_seed_")) {
    const customer = await stripe.customers.create({
      email: merchant.user.email,
      metadata: { shopId: shop._id.toString() },
    });
    customerId = customer.id;
    await Shop.findByIdAndUpdate(shop._id, { stripeCustomerId: customerId });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const discounts: { coupon: string }[] = [];
  if (shop.referredBy && process.env.STRIPE_REFERRAL_COUPON_ID) {
    discounts.push({ coupon: process.env.STRIPE_REFERRAL_COUPON_ID });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(discounts.length > 0 ? { discounts } : {}),
    success_url: `${appUrl}/dashboard/billing?success=1`,
    cancel_url: `${appUrl}/dashboard/billing`,
    metadata: { shopId: shop._id.toString(), plan: plan.slug, interval },
  });

  return NextResponse.json({ url: session.url });
}
