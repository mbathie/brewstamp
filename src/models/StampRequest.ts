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
    stampsAwarded: { type: Number },
    redeem: { type: Boolean, default: false },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000),
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
