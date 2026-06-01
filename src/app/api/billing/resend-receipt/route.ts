import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { Subscription } from "@/models";
import { stripe } from "@/lib/stripe";
import { sendPaymentReceiptEmail } from "@/lib/email";

export async function POST(req: Request) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (merchant.role !== "owner") {
    return NextResponse.json(
      { error: "Only the shop owner can access billing receipts." },
      { status: 403 }
    );
  }

  const { invoiceId } = await req.json();
  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
  }

  const subscription = await Subscription.findOne({ shop: merchant.shop._id });
  if (!subscription) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  // Verify the invoice belongs to this customer
  const invoice = await stripe.invoices.retrieve(invoiceId);
  if (invoice.customer !== subscription.stripeCustomerId) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const sub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
  const item = sub.items.data[0];

  await sendPaymentReceiptEmail({
    to: merchant.user.email,
    merchantName: merchant.user.name || "there",
    shopName: merchant.shop.name,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    invoiceDate: new Date(invoice.created * 1000),
    periodEnd: item
      ? new Date(item.current_period_end * 1000)
      : new Date(),
  });

  return NextResponse.json({ success: true });
}
