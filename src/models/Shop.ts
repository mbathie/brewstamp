import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stampThreshold: { type: Number, default: 8 },
    code: { type: String, required: true, unique: true },
    logo: { type: String },
    bgColor: { type: String, default: "stone-800" },
    fgColor: { type: String, default: "amber-600" },
    bgPattern: { type: String, default: "none" },
    stripeCustomerId: { type: String },
    dripDay1Sent: { type: Boolean, default: false },
    dripDay3Sent: { type: Boolean, default: false },
    dripDay7Sent: { type: Boolean, default: false },
    dripDay14Sent: { type: Boolean, default: false },
    firstCustomerEmailSent: { type: Boolean, default: false },
    upgradeNudgeSent: { type: Boolean, default: false },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    referralRewardApplied: { type: Boolean, default: false },
    referralCouponId: { type: String },
  },
  { timestamps: true }
);

const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);
export default Shop;
