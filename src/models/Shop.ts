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
  },
  { timestamps: true }
);

const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);
export default Shop;
