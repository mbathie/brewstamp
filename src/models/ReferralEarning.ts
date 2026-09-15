import mongoose from "mongoose";

// One row per commissionable payment: when a referred shop pays, the partner
// who referred its owner earns a share. Written alongside the Payment row by
// lib/referrals.ts, keyed by payment so re-processing never double-credits.
const referralEarningSchema = new mongoose.Schema(
  {
    partner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true, unique: true },
    paymentAmountCents: { type: Number, required: true },
    currency: { type: String, required: true },
    ratePercent: { type: Number, required: true },
    amountCents: { type: Number, required: true },
    earnedAt: { type: Date, required: true, index: true },
    // Set when the admin pays the partner (PayPal); null = owed.
    paidOutAt: { type: Date },
    payoutNote: { type: String },
  },
  { timestamps: true }
);

referralEarningSchema.index({ partner: 1, paidOutAt: 1 });

const ReferralEarning =
  mongoose.models.ReferralEarning || mongoose.model("ReferralEarning", referralEarningSchema);
export default ReferralEarning;
