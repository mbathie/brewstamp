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
    // Corporate "perk" mode: instead of collecting stamps toward a reward,
    // every approved scan is itself a free drink, gated to a set of email
    // domains and capped per person per day. Built for employer-subsidised
    // coffee programs (e.g. an office paying for staff coffee at the cafe
    // downstairs). When false the shop behaves as a normal stamp card.
    perkMode: { type: Boolean, default: false },
    // Lowercased bare domains (e.g. "miovision.com") allowed to participate.
    // Empty array with perkMode on = closed to everyone, so the UI requires
    // at least one before perk mode does anything.
    allowedEmailDomains: { type: [String], default: [] },
    // Max free drinks one person can redeem per local day.
    dailyDrinkLimit: { type: Number, default: 2 },
    // IANA timezone used to decide when "today" resets for the daily cap.
    // Empty = unset; the settings UI then defaults the picker to the merchant's
    // browser timezone, and server-side perk logic falls back to UTC.
    timezone: { type: String, default: "" },
    logo: { type: String },
    // Public Spaces URL mirror of `logo` (which is stored as a data: URI).
    // Wallet providers fetch logos by URL, so this is what they use.
    logoUrl: { type: String },
    bgColor: { type: String, default: "stone-800" },
    fgColor: { type: String, default: "amber-600" },
    bgPattern: { type: String, default: "none" },
    language: { type: String, default: "en" },
    // When on, customers can add their card to Apple/Google Wallet (the browser
    // card always stays available as the default/fallback). Plan-gated in the UI.
    walletPasses: { type: Boolean, default: false },
    stripeCustomerId: { type: String },
    firstCustomerEmailSent: { type: Boolean, default: false },
    upgradeNudgeSent: { type: Boolean, default: false },
    goLiveNudgeSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);
export default Shop;
