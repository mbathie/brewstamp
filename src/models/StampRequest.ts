import mongoose from "mongoose";

const stampRequestSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },
    // Denormalised work email for perk-mode requests. The daily cap is counted
    // by email (not the device cookie), so the same person can't reset their
    // limit by switching phones/browsers.
    email: { type: String },
    stampsAwarded: { type: Number },
    redeem: { type: Boolean, default: false },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
    },
  },
  { timestamps: true }
);

stampRequestSchema.index({ shop: 1, status: 1 });
stampRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const StampRequest =
  mongoose.models.StampRequest ||
  mongoose.model("StampRequest", stampRequestSchema);
export default StampRequest;
