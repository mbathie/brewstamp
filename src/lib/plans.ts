// Plan catalogue types and the pure lookups over it. The catalogue itself —
// every plan, its limits, copy and prices — lives in the `plans` collection
// (src/models/Plan.ts). Server code loads it with getPlanCatalog() from
// @/lib/plan-catalog; client components get the plans as props or from an
// API response and wrap them in `new PlanCatalog(plans)`. Nothing here touches
// the database, so it's safe to import anywhere.
//
// Statuses do the grandfathering:
//   - a plan is "active" (offered) or "archived" (not offered; shops already
//     on it keep it and its features);
//   - each price is "active" (what new subscriptions pay) or "archived" (an
//     old price existing subscribers still renew at).
// Changing a price = add the new price as active, archive the old one
// (scripts/seed-plans.ts). Nobody's existing price changes.

export type PlanSlug = string;
export type BillingInterval = "month" | "year";

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

// ── Catalogue shapes (mirrors src/models/Plan.ts) ──────────────────────────

export type CatalogStatus = "active" | "archived";

/**
 * Which Stripe account a price belongs to. "main" is Brewstamp's own catalogue
 * — what Stripe checkouts on the main account, PayPal billing and the pricing
 * pages use. "legacy" prices exist only on the old shared Stripe account and
 * are what subscriptions still on that account renew at or switch between.
 */
export type PriceAccount = "main" | "legacy";

export interface PlanPrice {
  interval: BillingInterval;
  amountCents: number;
  currency: string;
  account: PriceAccount;
  /** Stripe price id on that account. Null for a price only PayPal bills. */
  stripePriceId: string | null;
  status: CatalogStatus;
}

export interface PlanConfig {
  slug: PlanSlug;
  label: string;
  tagline: string;
  /** Tier order: higher = higher tier. Decides upgrade vs downgrade. */
  rank: number;
  status: CatalogStatus;
  /**
   * A private deal for one customer: never listed or sold in the app, bought
   * through a Stripe payment link, shown on that customer's billing page as
   * their plan.
   */
  custom: boolean;
  /** Optional ribbon on the pricing card, e.g. "Best for teams". */
  badge: string | null;
  shopLimit: number;
  stampLimit: number | "unlimited";
  /** Staff/manager logins besides the owner (memberships + pending invites). */
  staffLoginLimit: number | "unlimited";
  hasCsvExport: boolean;
  hasAnalytics: boolean;
  hasCrossShopReporting: boolean;
  hasPerkMode: boolean;
  hasWalletPasses: boolean;
  prioritySupport: boolean;
  dedicatedSupport: boolean;
  /** Bullet points on the pricing cards. */
  features: string[];
  prices: PlanPrice[];
}

/** Subscription statuses that keep a paid plan's entitlements (see billing). */
export const LIVE_SUB_STATUSES = ["active", "past_due"] as const;

// Stripe subscriptions whose price id isn't in the catalogue at all (seed
// accounts, very early test subs) are treated as the original US$5 Pro.
export const LEGACY_PRO_CENTS = 500;

export function hasStaffLogins(plan: Pick<PlanConfig, "staffLoginLimit">): boolean {
  return plan.staffLoginLimit === "unlimited" || plan.staffLoginLimit > 0;
}

// The "Custom" card shown after the public plans on /pricing and billing. Not
// a catalogue plan: it can't be bought online, its CTA opens the contact form.
export const CUSTOM_PLAN_CONTACT_HREF = "/contact?plan=custom";

export function isCustomPlan(plan: Pick<PlanConfig, "custom"> | null | undefined): boolean {
  return !!plan?.custom;
}

export function customPlanCard(maxPublicShops: number) {
  return {
    label: "Custom",
    tagline: "For groups and chains",
    features: [
      "Everything in Business",
      `${maxPublicShops + 1}+ shops under one account`,
      "Volume pricing per shop",
      "Help setting up every shop",
      "Dedicated account support",
    ],
  };
}

/** "$12" for whole dollars, "$6.42" otherwise. */
export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

type SubLike = {
  stripePriceId?: string | null;
  planSlug?: string | null;
  planLabel?: string | null;
  interval?: string | null;
  priceCents?: number | null;
};

/**
 * The catalogue plus every lookup billing needs. Construct it from the plans
 * the server loaded (getPlanCatalog) or that a page received as props.
 */
export class PlanCatalog {
  readonly plans: PlanConfig[];
  private readonly byPrice = new Map<string, { plan: PlanConfig; price: PlanPrice }>();

  constructor(plans: PlanConfig[]) {
    this.plans = [...plans].sort((a, b) => a.rank - b.rank);
    for (const plan of this.plans) {
      for (const price of plan.prices) {
        if (price.stripePriceId) this.byPrice.set(price.stripePriceId, { plan, price });
      }
    }
  }

  /** Plans offered to new customers, cheapest first. */
  get publicPlans(): PlanConfig[] {
    return this.plans.filter((p) => this.isOnSale(p));
  }

  /** Can be bought or switched to in the app: active and not a custom deal. */
  isOnSale(plan: PlanConfig): boolean {
    return plan.status === "active" && !plan.custom;
  }

  get free(): PlanConfig {
    const free = this.bySlug("free");
    if (!free) throw new Error("Plan catalogue has no free plan — run scripts/seed-plans.ts");
    return free;
  }

  bySlug(slug: string | null | undefined): PlanConfig | undefined {
    return slug ? this.plans.find((p) => p.slug === slug) : undefined;
  }

  rank(slug: string): number {
    return this.bySlug(slug)?.rank ?? 0;
  }

  /** The price new subscriptions to this plan pay, on the given account. */
  activePrice(slug: string, interval: BillingInterval, account: PriceAccount = "main"): PlanPrice | undefined {
    return this.bySlug(slug)?.prices.find(
      (p) => p.interval === interval && p.account === account && p.status === "active",
    );
  }

  /** What a plan costs on the main catalogue for an interval; 0 for Free. */
  priceCents(plan: PlanConfig, interval: BillingInterval): number {
    return this.activePrice(plan.slug, interval)?.amountCents ?? 0;
  }

  /** Whole months an annual plan saves over twelve monthly payments. */
  monthsFree(plan: PlanConfig): number {
    const month = this.priceCents(plan, "month");
    const year = this.priceCents(plan, "year");
    return month > 0 && year > 0 ? Math.max(0, Math.round(12 - year / month)) : 0;
  }

  /** Any price ever in the catalogue (active or archived) by Stripe id. */
  byPriceId(priceId: string | null | undefined): { plan: PlanConfig; price: PlanPrice } | undefined {
    return priceId ? this.byPrice.get(priceId) : undefined;
  }

  /**
   * The paid tier + interval a Subscription doc is on, whichever provider it
   * bills through. PayPal subs store planSlug/interval explicitly; Stripe subs
   * derive them from stripePriceId. Null when neither resolves (legacy $5 Pro,
   * seed accounts) — callers fall back to planLabel or "legacy Pro".
   */
  subscriptionTier(sub: SubLike): { slug: PlanSlug; interval: BillingInterval } | null {
    const bySlug = this.bySlug(sub.planSlug);
    if (bySlug && bySlug.slug !== "free") {
      return { slug: bySlug.slug, interval: sub.interval === "year" ? "year" : "month" };
    }
    const hit = this.byPriceId(sub.stripePriceId);
    if (hit && hit.plan.slug !== "free") {
      return { slug: hit.plan.slug, interval: hit.price.interval };
    }
    return null;
  }

  /**
   * A subscription's tier and true monthly revenue. Annual plans are converted
   * to a monthly equivalent so MRR is apples-to-apples. `legacy` is true when
   * the subscriber pays something other than today's price for their plan.
   */
  resolveSub(sub: SubLike): { slug: PlanSlug; label: string; monthlyCents: number; legacy: boolean } {
    const tier = this.subscriptionTier(sub);
    if (tier) {
      const plan = this.bySlug(tier.slug)!;
      const catalogue = this.priceCents(plan, tier.interval);
      // What they pay: the stored amount, else the (possibly archived) price
      // their Stripe price id points at, else today's price.
      const paid = sub.priceCents ?? this.byPriceId(sub.stripePriceId)?.price.amountCents ?? catalogue;
      const monthlyCents = tier.interval === "year" ? Math.round(paid / 12) : paid;
      return { slug: plan.slug, label: plan.label, monthlyCents, legacy: paid !== catalogue };
    }
    // Price id isn't in the catalogue → grandfathered legacy Pro.
    return { slug: "pro", label: sub.planLabel || "Pro", monthlyCents: LEGACY_PRO_CENTS, legacy: true };
  }
}
