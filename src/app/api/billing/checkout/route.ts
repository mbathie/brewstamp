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
  if (!plan || plan.slug === "free" || plan.hidden) {
    return NextResponse.json(
      { error: "Plan must be a paid tier (pro or plus)" },
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

  // Create or retrieve the shop's customer on the main Stripe account (new
  // checkouts never go to the legacy account, whose customer stays in
  // shop.stripeCustomerId). Skip a seed placeholder so we never feed Stripe a
  // fake customer.
  let customerId = shop.stripeMainCustomerId;
  if (!customerId || customerId.startsWith("cus_seed_")) {
    const customer = await stripe.customers.create({
      email: merchant.user.email,
      name: shop.name,
      metadata: { shopId: shop._id.toString() },
    });
    customerId = customer.id;
    await Shop.findByIdAndUpdate(shop._id, { stripeMainCustomerId: customerId });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // Show Stripe's hosted "Add promotion code" field so customers can redeem
    // discount codes created in the admin Discounts page. Stripe validates the
    // code (expiry, plan restriction, redemption cap) against this cart.
    allow_promotion_codes: true,
    // {CHECKOUT_SESSION_ID} is filled in by Stripe; the billing page confirms
    // the session on return (/api/billing/checkout/confirm).
    success_url: `${appUrl}/dashboard/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/billing`,
    metadata: { shopId: shop._id.toString(), plan: plan.slug, interval },
    // Brewstamp look on Stripe's hosted page: the dashboard's dark stone
    // background, amber buttons and the wordmark logo (white text, so it needs
    // the dark background). Assets come from the live site — Stripe fetches
    // them, so a localhost URL wouldn't load.
    branding_settings: {
      background_color: "#1c1917",
      button_color: "#b45309",
      border_style: "rounded",
      font_family: "inter",
      logo: { type: "url", url: "https://brewstamp.app/email-logo.png" },
      icon: { type: "url", url: "https://brewstamp.app/apple-touch-icon.png" },
    },
  });

  return NextResponse.json({ url: session.url });
}
