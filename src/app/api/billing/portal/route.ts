import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { Subscription } from "@/models";

export async function POST() {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (merchant.role !== "owner") {
    return NextResponse.json(
      { error: "Only the shop owner can manage billing." },
      { status: 403 }
    );
  }

  const sub = await Subscription.findOne({ shop: merchant.shop._id });
  if (sub?.provider === "paypal") {
    return NextResponse.json(
      { error: "Card-billed subscriptions are managed on the billing page." },
      { status: 400 }
    );
  }

  const customerId = merchant.shop.stripeCustomerId;
  if (!customerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
