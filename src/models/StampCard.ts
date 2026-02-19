import mongoose from "mongoose";

const stampCardSchema = new mongoose.Schema(
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
    stamps: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    freeRedeemed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

stampCardSchema.index({ shop: 1, customer: 1 }, { unique: true });

const StampCard =
  mongoose.models.StampCard || mongoose.model("StampCard", stampCardSchema);
export default StampCard;
