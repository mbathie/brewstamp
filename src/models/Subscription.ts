import mongoose from "mongoose";

// One subscription per shop. Two billing providers coexist:
//   - "stripe": the original integration, again the default for new
//     checkouts since 2026-10-12 (on Brewstamp's own account, see
//     stripeAccount). Stripe owns the schedule, dunning
//     and invoices; webhooks mirror state into this doc.
//   - "paypal": cards are vaulted with PayPal (Advanced Card Payments) and
//     WE own the schedule — billing-cron charges the vault when
//     currentPeriodEnd passes, records a Payment, and rolls the period.
const subscriptionSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      unique: true,
    },
    provider: { type: String, enum: ["stripe", "paypal"], default: "stripe" },

    // ── Stripe ────────────────────────────────────────────────────────────
    // Which Stripe account the subscription lives on (see @/lib/stripe).
    // Missing = "legacy": every Stripe sub created before 2026-10-12.
    stripeAccount: { type: String, enum: ["main", "legacy"] },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    stripePriceId: { type: String },

    // ── PayPal ────────────────────────────────────────────────────────────
    // Vault payment-token id (the saved card) and PayPal's customer id for
    // it, so a replacement card can be attached to the same customer.
    paypalVaultId: { type: String },
    paypalCustomerId: { type: String },
    // Display-only card summary from the last vaulting.
    card: {
      brand: { type: String },
      last4: { type: String },
      expiry: { type: String }, // "2028-05"
    },
    // Plan the shop is on — stored per subscription for both providers (the
    // backfill script fills it for Stripe subs; stripePriceId remains the
    // fallback for resolution, see PlanCatalog.subscriptionTier). Any paid
    // plan slug in the `plans` collection.
    planSlug: { type: String },
    interval: { type: String, enum: ["month", "year"] },
    currency: { type: String, default: "usd" },
    // A downgrade (lower tier, or annual → monthly) takes effect at the next
    // renewal. Stored here until the cron applies it.
    pendingPlanSlug: { type: String },
    pendingInterval: { type: String, enum: ["month", "year"] },
    // What this subscription pays per period, in `currency`. Set from the
    // catalogue on PayPal checkout, from the live Stripe price for Stripe subs
    // (backfill script), and carried across a migration unchanged — so legacy
    // US$5 Pro and AUD-tier subscribers keep their price until they change
    // plan (a switch re-prices from the catalogue).
    priceCents: { type: Number },
    // Unused time credited on an upgrade that exceeded the new charge; applied
    // to the next renewal.
    creditCents: { type: Number, default: 0 },
    // Stripe → PayPal migration: a non-guessable link emailed to the owner
    // that lets them save a card without logging in. Cleared once used.
    migrationToken: { type: String, unique: true, sparse: true },
    migrationEmailedAt: { type: Date },
    migratedAt: { type: Date },
    migratedFromStripeSubscriptionId: { type: String },
    // Dunning: consecutive failed renewal attempts and when to try again.
    failedAttempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date },
    lastPaymentAt: { type: Date },

    // ── Shared ────────────────────────────────────────────────────────────
    // Display label for the plan ("Pro", "Business"). Resolved from the plan
    // catalogue (planSlug, or stripePriceId), with this field as the fallback
    // for seed accounts that have no real Stripe price.
    planLabel: { type: String },
    // True when the subscription is set to cancel at the end of the current
    // period (a downgrade-to-Free that hasn't taken effect yet). Mirrors
    // Stripe's cancel_at_period_end so the billing UI can show "cancels on…".
    cancelAtPeriodEnd: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "past_due", "canceled", "unpaid"],
      required: true,
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
  },
  { timestamps: true }
);

subscriptionSchema.index({ provider: 1, status: 1, currentPeriodEnd: 1 });

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
