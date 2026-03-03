import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { StampCard, Subscription } from "@/models";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  return NextResponse.json({
    totalStamps,
    limit: 100,
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null,
    invoices,
  });
}
