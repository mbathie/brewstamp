import Stripe from "stripe";

// Brewstamp bills through two Stripe accounts:
//
//   main    Brewstamp's own account (acct_1UPW9T…, from 2026-10-12). Every new
//           checkout, the customer portal for its subscriptions, and discount
//           codes. Env: STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET (plan prices live in the `plans` collection).
//   legacy  The account shared with TippyTip and StampyStamp, which Brewstamp
//           used before. Subscriptions created there keep renewing there; we
//           only mirror and manage them. Env: STRIPE_LEGACY_SECRET_KEY /
//           STRIPE_LEGACY_WEBHOOK_SECRET.
//
// Subscription.stripeAccount says which one a subscription lives on; a missing
// value means legacy (every Stripe sub that predates the second account).
// Without the legacy env vars (dev), legacy falls back to the main client.

export type StripeAccount = "main" | "legacy";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const stripeLegacy = process.env.STRIPE_LEGACY_SECRET_KEY
  ? new Stripe(process.env.STRIPE_LEGACY_SECRET_KEY)
  : stripe;

export function stripeAccountOf(sub: { stripeAccount?: string | null } | null | undefined): StripeAccount {
  return sub?.stripeAccount === "main" ? "main" : "legacy";
}

/** The client for the Stripe account a subscription lives on. */
export function stripeFor(sub: { stripeAccount?: string | null } | null | undefined): Stripe {
  return stripeAccountOf(sub) === "main" ? stripe : stripeLegacy;
}
