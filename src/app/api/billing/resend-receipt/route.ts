import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { Payment, Subscription } from "@/models";
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

  const { invoiceId } = await req.json().catch(() => ({}));
  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
  }

  const subscription = await Subscription.findOne({ shop: merchant.shop._id });
  if (!subscription) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  // The "invoice" is one of our Payment rows (any provider).
  const payment = await Payment.findOne({ _id: invoiceId, shop: merchant.shop._id, status: { $in: ["paid", "refunded"] } });
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }
  await sendPaymentReceiptEmail({
    to: merchant.user.email,
    merchantName: merchant.user.name || "there",
    shopName: merchant.shop.name,
    amount: payment.amountCents,
    currency: payment.currency,
    invoiceDate: payment.paidAt || payment.createdAt,
    periodEnd: payment.periodEnd || subscription.currentPeriodEnd || new Date(),
  });

  return NextResponse.json({ success: true });
}
