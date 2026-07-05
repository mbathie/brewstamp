// Single source of truth for the plan catalogue. Used by:
//   - the billing page UI (cards + features)
//   - /api/billing/checkout (plan slug → Stripe price)
//   - /api/billing/switch (validating upgrades/downgrades)
//   - StampUsageIndicator (badge label)
//   - public pricing pages
//
// Stripe price IDs live in env vars so they can differ per Stripe account
// (live vs test). `null` for Free, since there is no Stripe subscription.

export type PlanSlug = "free" | "pro" | "plus" | "max";

// Paid plans bill either monthly or annually. The annual price is twelve
// months charged at the cost of eleven — one month free (see FREE_MONTHS).
export type BillingInterval = "month" | "year";

// How many months are waived on an annual subscription. Annual amount =
// monthly × (12 − FREE_MONTHS).
const FREE_MONTHS = 1;

export interface PlanConfig {
  slug: PlanSlug;
  label: string;
  tagline: string;
  priceCents: number;
  priceLabel: string;
  // Stripe price IDs live in env vars: one per billing interval. Annual is
  // null until the annual price is provisioned (run stripe-setup-plans.ts).
  stripePriceEnvVar: string | null;
  stripePriceEnvVarAnnual: string | null;
  shopLimit: number;
  stampLimit: number | "unlimited";
  hasCsvExport: boolean;
  hasStaffLogins: boolean;
  hasAnalytics: boolean;
  hasCrossShopReporting: boolean;
  // Corporate "perk mode" — employer-subsidised staff coffee. Plus & Max.
  hasPerkMode: boolean;
  // Apple & Google Wallet passes — included on every plan (shown in the billing
  // feature comparison; not a gate).
  hasWalletPasses: boolean;
  prioritySupport: boolean;
  dedicatedSupport: boolean;
  features: string[];
}

export const PLANS: PlanConfig[] = [
  {
    slug: "free",
    label: "Free",
    tagline: "Try it out",
    priceCents: 0,
    priceLabel: "$0",
    stripePriceEnvVar: null,
    stripePriceEnvVarAnnual: null,
    shopLimit: 1,
    stampLimit: 100,
    hasCsvExport: false,
    hasStaffLogins: false,
    hasAnalytics: false,
    hasCrossShopReporting: false,
    hasPerkMode: false,
    hasWalletPasses: true,
    prioritySupport: false,
    dedicatedSupport: false,
    features: [
      "Up to 100 stamps total",
      "1 shop",
      "QR codes & real-time approvals",
      "Apple & Google Wallet passes",
      "Customer dashboard",
    ],
  },
  {
    slug: "pro",
    label: "Pro",
    tagline: "For a single busy shop",
    priceCents: 700,
    priceLabel: "$7",
    stripePriceEnvVar: "STRIPE_PRICE_PRO",
    stripePriceEnvVarAnnual: "STRIPE_PRICE_PRO_ANNUAL",
    shopLimit: 1,
    stampLimit: "unlimited",
    hasCsvExport: false,
    hasStaffLogins: false,
    hasAnalytics: true,
    hasCrossShopReporting: false,
    hasPerkMode: false,
    hasWalletPasses: true,
    prioritySupport: true,
    dedicatedSupport: false,
    features: [
      "Unlimited stamps",
      "1 shop",
      "Apple & Google Wallet passes",
      "Customer insights & analytics",
      "Priority support",
    ],
  },
  {
    slug: "plus",
    label: "Plus",
    tagline: "Growing brands",
    priceCents: 1900,
    priceLabel: "$19",
    stripePriceEnvVar: "STRIPE_PRICE_PLUS",
    stripePriceEnvVarAnnual: "STRIPE_PRICE_PLUS_ANNUAL",
    shopLimit: 3,
    stampLimit: "unlimited",
    hasCsvExport: true,
    hasStaffLogins: true,
    hasAnalytics: true,
    hasCrossShopReporting: true,
    hasPerkMode: true,
    hasWalletPasses: true,
    prioritySupport: true,
    dedicatedSupport: false,
    features: [
      "Everything in Pro",
      "Up to 3 shops",
      "Unlimited staff logins",
      "CSV customer exports",
      "Cross-shop reporting",
      "Corporate perk mode (subsidised staff coffee)",
    ],
  },
  {
    slug: "max",
    label: "Max",
    tagline: "Multi-location chains",
    priceCents: 2900,
    priceLabel: "$29",
    stripePriceEnvVar: "STRIPE_PRICE_MAX",
    stripePriceEnvVarAnnual: "STRIPE_PRICE_MAX_ANNUAL",
    shopLimit: 10,
    stampLimit: "unlimited",
    hasCsvExport: true,
    hasStaffLogins: true,
    hasAnalytics: true,
    hasCrossShopReporting: true,
    hasPerkMode: true,
    hasWalletPasses: true,
    prioritySupport: true,
    dedicatedSupport: true,
    features: [
      "Everything in Plus",
      "Up to 10 shops",
      "Cross-shop reporting",
      "Priority + dedicated support",
    ],
  },
];

// Rank by tier order — higher rank = higher tier. Used to decide whether a
// switch is an upgrade (positive delta) or downgrade (negative).
const PLAN_RANK: Record<PlanSlug, number> = {
  free: 0,
  pro: 1,
  plus: 2,
  max: 3,
};

export function getPlanBySlug(slug: string): PlanConfig | undefined {
  return PLANS.find((p) => p.slug === slug);
}

export function getPlanRank(slug: PlanSlug): number {
  return PLAN_RANK[slug];
}

// The amount (in cents) a plan costs for a full year: twelve months billed
// at the cost of (12 − FREE_MONTHS). Free stays $0.
export function annualPriceCents(plan: PlanConfig): number {
  return plan.priceCents * (12 - FREE_MONTHS);
}

// The amount a plan costs for the given billing interval, in cents.
export function planPriceCents(
  plan: PlanConfig,
  interval: BillingInterval
): number {
  return interval === "year" ? annualPriceCents(plan) : plan.priceCents;
}

// Resolve the active price ID for a paid plan + interval from env. Returns
// null for Free or if the env var isn't set (caller should surface a
// configuration error in that case).
export function resolvePlanPriceId(
  slug: PlanSlug,
  interval: BillingInterval = "month"
): string | null {
  const plan = getPlanBySlug(slug);
  if (!plan) return null;
  const envVar =
    interval === "year" ? plan.stripePriceEnvVarAnnual : plan.stripePriceEnvVar;
  if (!envVar) return null;
  return process.env[envVar] || null;
}

// Match a Stripe price ID back to a plan slug, regardless of interval. Used
// by the billing page to identify the user's current plan tier from their
// Subscription doc.
export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  for (const p of PLANS) {
    if (
      (p.stripePriceEnvVar && process.env[p.stripePriceEnvVar] === priceId) ||
      (p.stripePriceEnvVarAnnual &&
        process.env[p.stripePriceEnvVarAnnual] === priceId)
    ) {
      return p;
    }
  }
  return undefined;
}

// Legacy subscriptions predate the current Stripe price IDs and are
// grandfathered at the old $5/mo Pro rate — used when a price id doesn't map
// to a current plan.
export const LEGACY_PRO_CENTS = 500;

// Resolve a subscription's tier + true monthly revenue. Annual plans are
// converted to a monthly-equivalent so MRR is apples-to-apples. Shared by the
// admin shops list and detail endpoints so they report the same tier.
export function resolveSub(sub: {
  stripePriceId?: string;
  planLabel?: string;
}): {
  slug: PlanSlug;
  label: string;
  monthlyCents: number;
  legacy: boolean;
} {
  if (sub.stripePriceId) {
    const plan = getPlanByPriceId(sub.stripePriceId);
    if (plan) {
      const interval = getIntervalByPriceId(sub.stripePriceId) ?? "month";
      const monthlyCents =
        interval === "year"
          ? Math.round(annualPriceCents(plan) / 12)
          : plan.priceCents;
      return { slug: plan.slug, label: plan.label, monthlyCents, legacy: false };
    }
  }
  // Price id doesn't map to a current plan → grandfathered legacy Pro.
  return {
    slug: "pro",
    label: sub.planLabel || "Pro",
    monthlyCents: LEGACY_PRO_CENTS,
    legacy: true,
  };
}

// Identify whether a Stripe price ID is the monthly or annual variant. Used
// by the billing UI to highlight the active interval. Returns undefined if
// the price ID isn't recognised.
export function getIntervalByPriceId(
  priceId: string
): BillingInterval | undefined {
  for (const p of PLANS) {
    if (p.stripePriceEnvVar && process.env[p.stripePriceEnvVar] === priceId) {
      return "month";
    }
    if (
      p.stripePriceEnvVarAnnual &&
      process.env[p.stripePriceEnvVarAnnual] === priceId
    ) {
      return "year";
    }
  }
  return undefined;
}
