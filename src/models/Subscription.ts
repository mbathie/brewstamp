import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      unique: true,
    },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    stripePriceId: { type: String },
    // Display label for the plan ("Pro", "Plus", "Max"). Resolved from
    // stripePriceId via the env-var lookup in @/lib/plans, with this field
    // as the fallback for seed accounts that have no real Stripe price.
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

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
