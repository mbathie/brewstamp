import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { Shop } from "@/models";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = merchant.shop;

  // Create or retrieve Stripe customer
  let customerId = shop.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: merchant.user.email,
      metadata: { shopId: shop._id.toString() },
    });
    customerId = customer.id;
    await Shop.findByIdAndUpdate(shop._id, { stripeCustomerId: customerId });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Apply referral coupon if this shop was referred
  const discounts: { coupon: string }[] = [];
  if (shop.referredBy && process.env.STRIPE_REFERRAL_COUPON_ID) {
    discounts.push({ coupon: process.env.STRIPE_REFERRAL_COUPON_ID });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    ...(discounts.length > 0 ? { discounts } : {}),
    success_url: `${appUrl}/dashboard/billing?success=1`,
    cancel_url: `${appUrl}/dashboard/billing`,
    metadata: { shopId: shop._id.toString() },
  });

  return NextResponse.json({ url: session.url });
}
