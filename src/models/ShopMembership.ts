import mongoose from "mongoose";

const shopMembershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "manager", "staff"],
      required: true,
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

shopMembershipSchema.index({ user: 1, shop: 1 }, { unique: true });
shopMembershipSchema.index({ shop: 1 });

const ShopMembership =
  mongoose.models.ShopMembership ||
  mongoose.model("ShopMembership", shopMembershipSchema);
export default ShopMembership;
