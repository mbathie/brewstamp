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
    notes: { type: String, default: "" },
    tags: { type: [String], default: [] },
    // Per-shop disable: a disabled customer can't earn stamps or claim perks at
    // this shop (e.g. a spoofed/ex-staff perk account). Scoped to the card so
    // the same person stays active at other shops. Works in both modes.
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

stampCardSchema.index({ shop: 1, customer: 1 }, { unique: true });

const StampCard =
  mongoose.models.StampCard || mongoose.model("StampCard", stampCardSchema);
export default StampCard;
