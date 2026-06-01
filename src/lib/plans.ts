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

export interface PlanConfig {
  slug: PlanSlug;
  label: string;
  tagline: string;
  priceCents: number;
  priceLabel: string;
  stripePriceEnvVar: string | null;
  shopLimit: number;
  stampLimit: number | "unlimited";
  hasCsvExport: boolean;
  hasStaffLogins: boolean;
  hasAnalytics: boolean;
  hasCrossShopReporting: boolean;
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
    shopLimit: 1,
    stampLimit: 100,
    hasCsvExport: false,
    hasStaffLogins: false,
    hasAnalytics: false,
    hasCrossShopReporting: false,
    prioritySupport: false,
    dedicatedSupport: false,
    features: [
      "Up to 100 stamps total",
      "1 shop",
      "QR codes & real-time approvals",
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
    shopLimit: 1,
    stampLimit: "unlimited",
    hasCsvExport: false,
    hasStaffLogins: false,
    hasAnalytics: true,
    hasCrossShopReporting: false,
    prioritySupport: true,
    dedicatedSupport: false,
    features: [
      "Unlimited stamps",
      "1 shop",
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
    shopLimit: 3,
    stampLimit: "unlimited",
    hasCsvExport: true,
    hasStaffLogins: true,
    hasAnalytics: true,
    hasCrossShopReporting: true,
    prioritySupport: true,
    dedicatedSupport: false,
    features: [
      "Everything in Pro",
      "Up to 3 shops",
      "Unlimited staff logins",
      "CSV customer exports",
      "Cross-shop reporting",
    ],
  },
  {
    slug: "max",
    label: "Max",
    tagline: "Multi-location chains",
    priceCents: 2900,
    priceLabel: "$29",
    stripePriceEnvVar: "STRIPE_PRICE_MAX",
    shopLimit: 10,
    stampLimit: "unlimited",
    hasCsvExport: true,
    hasStaffLogins: true,
    hasAnalytics: true,
    hasCrossShopReporting: true,
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

// Resolve the active price ID for a paid plan from env. Returns null for
// Free or if the env var isn't set (caller should surface a configuration
// error in that case).
export function resolvePlanPriceId(slug: PlanSlug): string | null {
  const plan = getPlanBySlug(slug);
  if (!plan || !plan.stripePriceEnvVar) return null;
  return process.env[plan.stripePriceEnvVar] || null;
}

// Match a Stripe price ID back to a plan slug. Used by the billing page
// to identify the user's current plan from their Subscription doc.
export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  for (const p of PLANS) {
    if (p.stripePriceEnvVar && process.env[p.stripePriceEnvVar] === priceId) {
      return p;
    }
  }
  return undefined;
}
