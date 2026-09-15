import mongoose from "mongoose";

// One row per charge attempt on a PayPal-billed subscription — the
// equivalent of a Stripe invoice. Drives the billing page's transaction
// history, receipt resends, the admin shop view and the finance page.
const paymentSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", index: true },
    provider: { type: String, enum: ["paypal"], default: "paypal" },
    // PayPal order id and capture id (capture is what refunds reference).
    orderId: { type: String },
    captureId: { type: String, index: true },
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
