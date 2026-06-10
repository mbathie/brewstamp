// Provision the Brewstamp paid plans (Pro, Plus, Max) in your Stripe
// account. Idempotent — re-runs safely:
//   1. Looks for a product with the NEW metadata slug (brewstamp_pro etc.)
//      and reuses it.
//   2. If not found, looks for a product with the LEGACY slug from earlier
//      naming (brewstamp_starter / brewstamp_roast / brewstamp_reserve) and
//      RENAMES it in place (updates name, description, metadata.brewstamp_slug).
//   3. Otherwise creates a new product.
// Prices on each product are reused when the amount/currency match; the
// price IDs you've already paid against stay valid across the rename.
//
// Prints the env vars to paste into .env.local at the end.
//
// Usage (DRY RUN — prints what would be created/renamed):
//   npx ts-node --project tsconfig.server.json scripts/stripe-setup-plans.ts
//
// Usage (REAL):
//   npx ts-node --project tsconfig.server.json \
//     scripts/stripe-setup-plans.ts --confirm

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "..", ".env.local") });
config();

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Number of months waived on an annual plan. Annual amount = monthly ×
// (12 − FREE_MONTHS). Keep in sync with FREE_MONTHS in src/lib/plans.ts.
const FREE_MONTHS = 1;

interface PlanSpec {
  slug: string;        // new metadata slug
  legacySlug?: string; // old metadata slug — looked up for rename
  name: string;
  description: string;
  amount: number;          // monthly amount, in cents
  currency: string;
  envVar: string;          // env var for the monthly price ID
  envVarAnnual: string;    // env var for the annual price ID
}

const PLANS: PlanSpec[] = [
  {
    slug: "brewstamp_pro",
    legacySlug: "brewstamp_starter",
    name: "Brewstamp Pro",
    description:
      "Unlimited stamps for one shop with customer analytics and priority support.",
    amount: 700,
    currency: "aud",
    envVar: "STRIPE_PRICE_PRO",
    envVarAnnual: "STRIPE_PRICE_PRO_ANNUAL",
  },
  {
    slug: "brewstamp_plus",
    legacySlug: "brewstamp_roast",
    name: "Brewstamp Plus",
    description:
      "Up to 3 shops, unlimited staff logins, and CSV customer exports.",
    amount: 1900,
    currency: "aud",
    envVar: "STRIPE_PRICE_PLUS",
    envVarAnnual: "STRIPE_PRICE_PLUS_ANNUAL",
  },
  {
    slug: "brewstamp_max",
    legacySlug: "brewstamp_reserve",
    name: "Brewstamp Max",
    description:
      "Up to 10 shops, cross-shop reporting, and dedicated support.",
    amount: 2900,
    currency: "aud",
    envVar: "STRIPE_PRICE_MAX",
    envVarAnnual: "STRIPE_PRICE_MAX_ANNUAL",
  },
];

async function findProductBySlug(slug: string): Promise<Stripe.Product | null> {
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.products.list({
      limit: 100,
      ...(starting_after ? { starting_after } : {}),
    });
    const match = page.data.find((p) => p.metadata?.brewstamp_slug === slug);
    if (match) return match;
    if (!page.has_more) return null;
    starting_after = page.data[page.data.length - 1].id;
  }
}

async function findExistingPrice(
  productId: string,
  amount: number,
  currency: string,
  interval: Stripe.Price.Recurring.Interval
): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });
  return (
    prices.data.find(
      (p) =>
        p.unit_amount === amount &&
        p.currency === currency &&
        p.recurring?.interval === interval
    ) || null
  );
}

async function main() {
  const confirm = process.argv.includes("--confirm");

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is not set. Add it to .env.local.");
    process.exit(1);
  }

  const isLive = process.env.STRIPE_SECRET_KEY.startsWith("sk_live_");
  console.log(
    `Using ${isLive ? "LIVE 🔴" : "TEST 🟢"} Stripe key. ${
      confirm ? "Real writes." : "DRY RUN — no writes."
    }\n`
  );

  const results: Array<{ envVar: string; priceId: string }> = [];

  for (const plan of PLANS) {
    const annualAmount = plan.amount * (12 - FREE_MONTHS);
    console.log(
      `Plan: ${plan.name} — ${plan.currency.toUpperCase()} $${(plan.amount / 100).toFixed(2)}/mo, $${(annualAmount / 100).toFixed(2)}/yr`
    );

    let product = await findProductBySlug(plan.slug);

    // Migrate a legacy-slug product to the new naming, if found.
    if (!product && plan.legacySlug) {
      const legacy = await findProductBySlug(plan.legacySlug);
      if (legacy) {
        console.log(
          `  Found legacy product ${legacy.id} (slug=${plan.legacySlug}) — renaming to "${plan.name}"`
        );
        if (confirm) {
          product = await stripe.products.update(legacy.id, {
            name: plan.name,
            description: plan.description,
            metadata: { brewstamp_slug: plan.slug },
          });
        } else {
          // For dry run, fake the rename so we still report the price.
          product = legacy;
        }
      }
    }

    if (product) {
      console.log(`  Reusing existing product ${product.id}`);
    } else if (confirm) {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { brewstamp_slug: plan.slug },
      });
      console.log(`  Created product ${product.id}`);
    } else {
      console.log(`  Would create product`);
    }

    if (!product) {
      results.push({ envVar: plan.envVar, priceId: "(dry-run, not created)" });
      continue;
    }

    // Find-or-create a price for one billing interval and record its env var.
    const provisionPrice = async (
      interval: Stripe.Price.Recurring.Interval,
      amount: number,
      envVar: string
    ) => {
      let price = await findExistingPrice(
        product!.id,
        amount,
        plan.currency,
        interval
      );
      const tag = `${interval}ly`;
      if (price) {
        console.log(`  Reusing existing ${tag} price ${price.id}`);
      } else if (confirm) {
        price = await stripe.prices.create({
          product: product!.id,
          unit_amount: amount,
          currency: plan.currency,
          recurring: { interval },
          metadata: { brewstamp_slug: plan.slug, billing_interval: interval },
        });
        console.log(`  Created ${tag} price ${price.id}`);
      } else {
        console.log(`  Would create ${tag} price (${plan.currency.toUpperCase()} ${(amount / 100).toFixed(2)})`);
      }
      results.push({
        envVar,
        priceId: price?.id || "(dry-run, not created)",
      });
    };

    // Monthly, then annual (12 months charged at the cost of 12 − FREE_MONTHS).
    await provisionPrice("month", plan.amount, plan.envVar);
    await provisionPrice(
      "year",
      plan.amount * (12 - FREE_MONTHS),
      plan.envVarAnnual
    );
    console.log("");
  }

  console.log("");
  console.log(
    confirm
      ? "Add (or update) these lines in your .env.local:"
      : "DRY RUN — re-run with --confirm to actually create/rename. Resulting env vars would be:"
  );
  console.log("");
  for (const r of results) {
    console.log(`${r.envVar}=${r.priceId}`);
  }
  console.log("");
  if (confirm) {
    console.log(
      "If your .env.local still has STRIPE_PRICE_STARTER / STRIPE_PRICE_ROAST / STRIPE_PRICE_RESERVE, delete those lines — the price IDs above replace them."
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
