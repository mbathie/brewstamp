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
// months charged at the cost of ten — two months free (see FREE_MONTHS).
export type BillingInterval = "month" | "year";

// How many months are waived on an annual subscription. Annual amount =
// monthly × (12 − FREE_MONTHS).
export const FREE_MONTHS = 2;

// ── Free trial tiers ──────────────────────────────────────────────────────
// The Free plan comes in two allowances. Shops created from 2026-09-30 get
// free_50; every shop that existed before then is grandfathered on free_100
// (Shop.freeTier, set by scripts/migrate-free-tier.ts). A shop with no
// freeTier is treated as grandfathered, so the limit never drops for an
// existing shop even before that migration has run.
export type FreeTier = "free_50" | "free_100";

export interface FreeTierConfig {
  tier: FreeTier;
  stampLimit: number;
  /** Shown in the dashboard and billing page. */
  label: string;
  grandfathered: boolean;
}

export const FREE_TIERS: Record<FreeTier, FreeTierConfig> = {
  free_50: { tier: "free_50", stampLimit: 50, label: "Free trial", grandfathered: false },
  free_100: { tier: "free_100", stampLimit: 100, label: "Free trial", grandfathered: true },
};

/** The tier every new shop starts on. */
export const DEFAULT_FREE_TIER: FreeTier = "free_50";

/** The Free allowance new shops get — the number marketing copy advertises. */
export const FREE_STAMPS = FREE_TIERS[DEFAULT_FREE_TIER].stampLimit;

/** When the 50-stamp allowance started; shops created before keep 100. */
export const FREE_TIER_CHANGED_AT = "2026-09-30";

export function freeTierOf(shop: { freeTier?: string | null } | null | undefined): FreeTierConfig {
  const t = shop?.freeTier;
  return t === "free_50" || t === "free_100" ? FREE_TIERS[t] : FREE_TIERS.free_100;
}

/** Stamps a shop may award while it has no paid plan. */
export function freeStampLimit(shop: { freeTier?: string | null } | null | undefined): number {
  return freeTierOf(shop).stampLimit;
}

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
  /** Staff/manager logins a shop may have besides the owner (memberships plus
   *  pending invites). */
  staffLoginLimit: number | "unlimited";
  hasAnalytics: boolean;
  hasCrossShopReporting: boolean;
  // Corporate "perk mode" — employer-subsidised staff coffee. Business (plus) & Max.
  hasPerkMode: boolean;
  // Apple & Google Wallet passes — included on every plan (shown in the billing
  // feature comparison; not a gate).
  hasWalletPasses: boolean;
  prioritySupport: boolean;
  dedicatedSupport: boolean;
  /** Kept for existing subscribers and price lookups, but not offered on the
   *  pricing or billing pages. */
  hidden?: boolean;
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
    // New shops' allowance; grandfathered shops get 100 — resolve a specific
    // shop's limit with freeStampLimit(shop), never from here.
    stampLimit: FREE_STAMPS,
    hasCsvExport: false,
    hasStaffLogins: false,
    staffLoginLimit: 0,
    hasAnalytics: false,
    hasCrossShopReporting: false,
    hasPerkMode: false,
    hasWalletPasses: true,
    prioritySupport: false,
    dedicatedSupport: false,
    features: [
      `Up to ${FREE_STAMPS} stamps total`,
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
    priceCents: 1200,
    priceLabel: "$12",
    stripePriceEnvVar: "STRIPE_PRICE_PRO",
    stripePriceEnvVarAnnual: "STRIPE_PRICE_PRO_ANNUAL",
    shopLimit: 1,
    stampLimit: "unlimited",
    hasCsvExport: false,
    hasStaffLogins: true,
    staffLoginLimit: 1,
    hasAnalytics: true,
    hasCrossShopReporting: false,
    hasPerkMode: false,
    hasWalletPasses: true,
    prioritySupport: true,
    dedicatedSupport: false,
    features: [
      "Unlimited stamps",
      "1 shop",
      "1 staff login",
      "Apple & Google Wallet passes",
      "Customer insights & analytics",
      "Priority support",
    ],
  },
  {
    slug: "plus",
    // Sold as "Business" since 2026-10-21; the slug stays "plus" so existing
    // subscriptions, discounts and Stripe metadata keep resolving.
    label: "Business",
    tagline: "For cafes with a team",
    priceCents: 2900,
    priceLabel: "$29",
    stripePriceEnvVar: "STRIPE_PRICE_PLUS",
    stripePriceEnvVarAnnual: "STRIPE_PRICE_PLUS_ANNUAL",
    shopLimit: 3,
    stampLimit: "unlimited",
    hasCsvExport: true,
    hasStaffLogins: true,
    staffLoginLimit: "unlimited",
    hasAnalytics: true,
    hasCrossShopReporting: true,
    hasPerkMode: true,
    hasWalletPasses: true,
    prioritySupport: true,
    dedicatedSupport: false,
    features: [
      "Everything in Pro",
      "Unlimited staff logins",
      "Up to 3 shops",
      "CSV customer exports",
      "Cross-shop reporting",
      "Corporate perk mode (subsidised staff coffee)",
    ],
  },
  {
    slug: "max",
    // No longer sold (2026-10-21): nobody needed more than one shop, so the
    // public plans stop at Business and larger groups contact us. Kept so a
    // Max price id or planSlug still resolves.
    hidden: true,
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
    staffLoginLimit: "unlimited",
    hasAnalytics: true,
    hasCrossShopReporting: true,
    hasPerkMode: true,
    hasWalletPasses: true,
    prioritySupport: true,
    dedicatedSupport: true,
    features: [
      "Everything in Business",
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

/** The plans offered to new customers, in display order. */
export const PUBLIC_PLANS: PlanConfig[] = PLANS.filter((p) => !p.hidden);

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

// The USD plan prices on the legacy shared Stripe account — current until
// Brewstamp moved to its own account on 2026-10-12 (STRIPE_PRICE_* now point
// there). Subscriptions still on the legacy account renew on these.
const LEGACY_ACCOUNT_PRICES: Record<Exclude<PlanSlug, "free">, Record<BillingInterval, string>> = {
  pro: { month: "price_1TxlSoHxHWKx0vW14KWYDnNL", year: "price_1TxlSqHxHWKx0vW1QMagBYru" }, // US$7 / US$77
  plus: { month: "price_1TxlSpHxHWKx0vW1spV4qCjP", year: "price_1TxlSqHxHWKx0vW1c2a6o1Cq" }, // US$19 / US$209
  max: { month: "price_1TxlSpHxHWKx0vW1OXPc9PeU", year: "price_1TxlSrHxHWKx0vW1KSKdVtNp" }, // US$29 / US$319
};

// Match a Stripe price ID back to a plan slug, regardless of interval. Used
// by the billing page to identify the user's current plan tier from their
// Subscription doc.
// Historical AUD price IDs from before the 2026-07-28 switch to USD pricing.
// Existing subscriptions still carry these, and they no longer match the
// current STRIPE_PRICE_* env vars (now USD), so without this map every legacy
// sub would fall through to "legacy Pro" — mis-reporting MRR and mis-labelling
// tiers. Map each to its plan + interval so classification keeps working
// without re-pricing anyone. (The US$5 STRIPE_PRICE_ID Pro is intentionally
// absent — it stays a genuine legacy $5 sub.) The legacy account's USD prices
// are mapped the same way, since STRIPE_PRICE_* now name the main account's.
const LEGACY_PRICE_IDS: Record<
  string,
  { slug: PlanSlug; interval: BillingInterval }
> = {
  price_1TdLiFHxHWKx0vW1hxK3RRYW: { slug: "pro", interval: "month" }, // Pro A$7/mo
  price_1Tgb6SHxHWKx0vW11dqmu96g: { slug: "pro", interval: "year" }, // Pro A$77/yr
  price_1TdLiHHxHWKx0vW189oSCDPX: { slug: "plus", interval: "month" }, // Plus A$19/mo
  price_1Tgb6THxHWKx0vW1pSsb9qQ7: { slug: "plus", interval: "year" }, // Plus A$209/yr
  price_1TdLiIHxHWKx0vW1BLazXMgu: { slug: "max", interval: "month" }, // Max A$29/mo
  price_1Tgb6UHxHWKx0vW1H90R8Xhx: { slug: "max", interval: "year" }, // Max A$319/yr
  // Main-account prices current 2026-10-12 → 2026-10-21, before Pro went to
  // $12, Plus became Business at $29 and annual went to two months free.
  // Subscribers on them keep paying these amounts.
  price_1UPWMKK5tILQfL0kllsN36r9: { slug: "pro", interval: "month" }, // Pro US$7/mo
  price_1UPWMLK5tILQfL0k0ptyoydT: { slug: "pro", interval: "year" }, // Pro US$77/yr
  price_1UPWMMK5tILQfL0kKTWdJd0T: { slug: "plus", interval: "month" }, // Plus US$19/mo
  price_1UPWMNK5tILQfL0kzS79Ftz0: { slug: "plus", interval: "year" }, // Plus US$209/yr
  price_1UPWMOK5tILQfL0k4vBVAhNg: { slug: "max", interval: "month" }, // Max US$29/mo
  price_1UPWMPK5tILQfL0kBsDxPUPX: { slug: "max", interval: "year" }, // Max US$319/yr
  ...Object.fromEntries(
    Object.entries(LEGACY_ACCOUNT_PRICES).flatMap(([slug, byInterval]) =>
      Object.entries(byInterval).map(([interval, id]) => [id, { slug: slug as PlanSlug, interval: interval as BillingInterval }])
    )
  ),
};

// Plan prices on a subscription's own Stripe account. Subscriptions on the
// legacy account can only move to prices that exist there; everything else
// (new checkouts, main-account subs) uses the STRIPE_PRICE_* env vars.
export function resolvePlanPriceIdFor(
  account: "main" | "legacy",
  slug: PlanSlug,
  interval: BillingInterval
): string | null {
  if (account === "main") return resolvePlanPriceId(slug, interval);
  if (slug === "free") return null;
  return LEGACY_ACCOUNT_PRICES[slug]?.[interval] ?? null;
}

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
  const legacy = LEGACY_PRICE_IDS[priceId];
  if (legacy) return getPlanBySlug(legacy.slug);
  return undefined;
}

// Legacy subscriptions predate the current Stripe price IDs and are
// grandfathered at the old $5/mo Pro rate — used when a price id doesn't map
// to a current plan.
export const LEGACY_PRO_CENTS = 500;

/**
 * Subscription statuses that keep a paid plan's entitlements. past_due means
 * a renewal failed and is being retried (Stripe smart retries, or our PayPal
 * dunning): the shop keeps its plan until the provider gives up and the
 * status becomes canceled/unpaid. Treating past_due as Free would block a
 * paying shop's stamping the moment one charge fails.
 */
export const LIVE_SUB_STATUSES = ["active", "past_due"] as const;

// The paid tier + interval a Subscription doc is on, whichever provider it
// bills through. PayPal subs store planSlug/interval explicitly; Stripe subs
// derive them from stripePriceId. Null when neither resolves (legacy $5 Pro,
// seed accounts) — callers fall back to planLabel or "legacy Pro".
export function subscriptionTier(sub: {
  stripePriceId?: string;
  planSlug?: string;
  interval?: string;
}): { slug: PlanSlug; interval: BillingInterval } | null {
  if (sub.planSlug && sub.planSlug !== "free" && getPlanBySlug(sub.planSlug)) {
    return {
      slug: sub.planSlug as PlanSlug,
      interval: sub.interval === "year" ? "year" : "month",
    };
  }
  if (sub.stripePriceId) {
    const plan = getPlanByPriceId(sub.stripePriceId);
    if (plan && plan.slug !== "free") {
      return {
        slug: plan.slug,
        interval: getIntervalByPriceId(sub.stripePriceId) ?? "month",
      };
    }
  }
  return null;
}

// Resolve a subscription's tier + true monthly revenue. Annual plans are
// converted to a monthly-equivalent so MRR is apples-to-apples. Shared by the
// admin shops list and detail endpoints so they report the same tier.
export function resolveSub(sub: {
  stripePriceId?: string;
  planLabel?: string;
  planSlug?: string;
  interval?: string;
  priceCents?: number | null;
}): {
  slug: PlanSlug;
  label: string;
  monthlyCents: number;
  legacy: boolean;
} {
  const tier = subscriptionTier(sub);
  if (tier) {
    const plan = getPlanBySlug(tier.slug)!;
    const catalogueMonthly =
      tier.interval === "year"
        ? Math.round(annualPriceCents(plan) / 12)
        : plan.priceCents;
    // The stored price is what the customer actually pays — grandfathered
    // amounts (US$5 Pro, AUD tiers) differ from today's catalogue.
    const monthlyCents =
      sub.priceCents != null
        ? tier.interval === "year" ? Math.round(sub.priceCents / 12) : sub.priceCents
        : catalogueMonthly;
    const legacy = sub.priceCents != null && sub.priceCents !== (tier.interval === "year" ? annualPriceCents(plan) : plan.priceCents);
    return { slug: plan.slug, label: plan.label, monthlyCents, legacy };
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
  const legacy = LEGACY_PRICE_IDS[priceId];
  if (legacy) return legacy.interval;
  return undefined;
}
