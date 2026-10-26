// Schema.org offers for Brewstamp's plans, built from the plan catalogue so
// search engines and AI answers see today's prices (not a hard-coded "$0").
//
// Pages write `offers: PLAN_OFFERS` in their JSON-LD and render it through
// withPlanOffers(jsonLd, catalog), which swaps the placeholder for the real
// list. A page using it must load the catalogue (getPlanCatalog) and set
// `revalidate` so a price change shows without a deploy.

import { SITE_URL } from "@/lib/site";
import type { PlanCatalog } from "@/lib/plans";

/** Placeholder for a SoftwareApplication's `offers`; see withPlanOffers. */
export const PLAN_OFFERS = Object.freeze({ __planOffers: true });

const AVAILABLE = "https://schema.org/InStock";

/** The pricing-page anchor for a plan card, e.g. /pricing#business. */
export function planAnchor(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const dollars = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, "");

/** Every public plan as an Offer (monthly and annual), wrapped in an AggregateOffer. */
export function planOffersLd(catalog: PlanCatalog) {
  const offers: Record<string, unknown>[] = [];
  for (const plan of catalog.publicPlans) {
    const url = `${SITE_URL}/pricing#${planAnchor(plan.label)}`;
    if (plan.slug === "free") {
      offers.push({
        "@type": "Offer",
        name: plan.label,
        price: "0",
        priceCurrency: "USD",
        description: plan.features.slice(0, 3).join(". "),
        url,
        availability: AVAILABLE,
      });
      continue;
    }
    for (const interval of ["month", "year"] as const) {
      const price = catalog.activePrice(plan.slug, interval, "main");
      if (!price) continue;
      const amount = dollars(price.amountCents);
      const currency = price.currency.toUpperCase();
      offers.push({
        "@type": "Offer",
        name: `${plan.label} (${interval === "month" ? "monthly" : "annual"})`,
        description: `${plan.tagline}. ${plan.features.slice(0, 4).join(". ")}.`,
        price: amount,
        priceCurrency: currency,
        url,
        availability: AVAILABLE,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: amount,
          priceCurrency: currency,
          billingDuration: interval === "month" ? "P1M" : "P1Y",
          unitCode: interval === "month" ? "MON" : "ANN",
        },
      });
    }
  }
  const prices = offers.map((o) => Number(o.price));
  return {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: dollars(Math.min(...prices) * 100),
    highPrice: dollars(Math.max(...prices) * 100),
    offerCount: offers.length,
    offers,
  };
}

/** A copy of `ld` with every PLAN_OFFERS placeholder replaced by the live offers. */
export function withPlanOffers<T>(ld: T, catalog: PlanCatalog): T {
  const offers = planOffersLd(catalog);
  const fill = (v: unknown): unknown =>
    v === PLAN_OFFERS
      ? offers
      : Array.isArray(v)
        ? v.map(fill)
        : v && typeof v === "object"
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
          : v;
  return fill(ld) as T;
}
