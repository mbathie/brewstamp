import mongoose from "mongoose";

// One row per charge attempt, whichever provider took the money. This is
// the system of record for transaction history — the billing page, receipt
// resends, the admin shop view and the finance page all read from here and
// never call Stripe/PayPal. PayPal rows are written by paypal-billing; Stripe
// rows by the invoice webhook and scripts/backfill-stripe-payments.ts.
const paymentSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", index: true },
    provider: { type: String, enum: ["paypal", "stripe"], default: "paypal" },
    // PayPal order id and capture id (capture is what refunds reference).
    orderId: { type: String },
    captureId: { type: String, index: true },
    // Stripe invoice + charge ids, and the hosted invoice page for the
    // customer to download a PDF.
    stripeInvoiceId: { type: String, unique: true, sparse: true },
    stripeChargeId: { type: String },
    hostedUrl: { type: String },
    // When the money actually moved (Stripe: invoice created; PayPal: now).
    // createdAt is when the row was written, which differs for backfills.
    paidAt: { type: Date, index: true },
    kind: {
      type: String,
      enum: ["initial", "renewal", "upgrade"],
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "failed", "refunded", "disputed"],
      required: true,
    },
    amountCents: { type: Number, required: true },
    currency: { type: String, required: true },
    planSlug: { type: String },
    interval: { type: String },
    description: { type: String },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    // Processor-reported failure reason (declines), when status = failed.
    failureReason: { type: String },
    refundedCents: { type: Number, default: 0 },
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, createdAt: -1 });

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;
