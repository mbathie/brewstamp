import mongoose from "mongoose";

// The plan catalogue: one document per plan (Free, Pro, Business, …) holding
// its copy, limits, feature flags and every price it has ever had. Read
// through getPlanCatalog() in @/lib/plan-catalog, never directly; shapes and
// the active/archived rules are documented in @/lib/plans. Seeded and changed
// with scripts/seed-plans.ts.
const priceSchema = new mongoose.Schema(
  {
    interval: { type: String, enum: ["month", "year"], required: true },
    amountCents: { type: Number, required: true },
    currency: { type: String, required: true, lowercase: true },
    // "main" = Brewstamp's own catalogue (main Stripe account, PayPal, the
    // pricing pages); "legacy" = only on the old shared Stripe account.
    account: { type: String, enum: ["main", "legacy"], required: true },
    stripePriceId: { type: String, default: null },
    status: { type: String, enum: ["active", "archived"], required: true },
  },
  { _id: false },
);

const planSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    tagline: { type: String, default: "" },
    rank: { type: Number, required: true },
    status: { type: String, enum: ["active", "archived"], required: true },
    // A private deal for one customer: never listed or sold in the app, bought
    // through a Stripe payment link (scripts/create-custom-plan.ts).
    custom: { type: Boolean, default: false },
    badge: { type: String, default: null },
    shopLimit: { type: Number, required: true },
    // A number, or "unlimited".
    stampLimit: { type: mongoose.Schema.Types.Mixed, required: true },
    staffLoginLimit: { type: mongoose.Schema.Types.Mixed, required: true },
    hasCsvExport: { type: Boolean, default: false },
    hasAnalytics: { type: Boolean, default: false },
    hasCrossShopReporting: { type: Boolean, default: false },
    hasPerkMode: { type: Boolean, default: false },
    hasWalletPasses: { type: Boolean, default: true },
    prioritySupport: { type: Boolean, default: false },
    dedicatedSupport: { type: Boolean, default: false },
    features: { type: [String], default: [] },
    prices: { type: [priceSchema], default: [] },
  },
  { timestamps: true },
);

planSchema.index({ "prices.stripePriceId": 1 });

export default mongoose.models.Plan || mongoose.model("Plan", planSchema);
