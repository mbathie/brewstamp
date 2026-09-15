import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    hash: { type: String },
    emailVerified: { type: Date },
    phone: { type: String },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    // First-touch attribution captured at user creation. Lets us see where
    // new shop owners come from (Google search → /es, direct → /, referral,
    // etc.). Both fields are best-effort and may be empty.
    signupReferrer: { type: String },
    signupLandingPage: { type: String },
    // Referral program. A partner shares brewstamp.app/?ref=<referralCode>;
    // anyone who signs up after visiting that link is stamped with
    // referredBy and earns the partner 20% of their payments for 12 months.
    referralCode: { type: String, unique: true, sparse: true },
    referralPartner: { type: Boolean, default: false },
    referralPartnerSince: { type: Date },
    referralPayoutEmail: { type: String }, // PayPal email for payouts
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
