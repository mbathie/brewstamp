// Seed or update the plan catalogue (the `plans` collection).
//
// The definitions below are the source of truth for what gets written. To
// change pricing: add the new price as "active", set the old one to
// "archived", and re-run. Existing subscribers keep renewing at whatever price
// they're on; archived prices stay in the catalogue so their subscriptions
// still resolve to the right plan. Prices are never deleted by this script.
//
// Stripe price ids on the MAIN account are found in the Stripe account of the
// key in use (product metadata brewstamp_slug = brewstamp_<slug>, matched on
// amount, currency and interval), so the same definitions work against test
// and live. --create-stripe creates any missing ACTIVE main-account price (and
// the product, or renames it to the plan label). Legacy-account ids are fixed
// below — they only exist on the live shared account.
//
//   # dry run against .env.local (local DB + test Stripe)
//   npx tsx scripts/seed-plans.ts
//   npx tsx scripts/seed-plans.ts --confirm [--create-stripe]
//
//   # production: point at the prod DB and live main-account key
//   MONGODB_URI=… STRIPE_SECRET_KEY=rk_live_… npx tsx scripts/seed-plans.ts --confirm
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "..", ".env.local") });

import mongoose from "mongoose";
import Stripe from "stripe";
import Plan from "../src/models/Plan";
import type { PlanConfig, PlanPrice } from "../src/lib/plans";

const FREE_STAMPS = 50;

type SeedPrice = Omit<PlanPrice, "stripePriceId"> & { stripePriceId?: string | null };
type SeedPlan = Omit<PlanConfig, "prices"> & { prices: SeedPrice[] };

const usd = (interval: "month" | "year", amountCents: number, status: "active" | "archived"): SeedPrice => ({
  interval,
  amountCents,
  currency: "usd",
  account: "main",
  status,
});
const legacy = (
  interval: "month" | "year",
  amountCents: number,
  currency: string,
  stripePriceId: string,
  status: "active" | "archived",
): SeedPrice => ({ interval, amountCents, currency, account: "legacy", stripePriceId, status });

// Legacy shared-account prices. The USD ones were current there until the
// move to the main account (2026-10-12) and stay "active" for that account:
// a subscription still on it can only switch between prices that exist there.
// The AUD ones predate the 2026-07-28 switch to USD; the US$5 Pro is the
// original launch price.
const PLANS: SeedPlan[] = [
  {
    slug: "free",
    label: "Free",
    tagline: "Try it out",
    rank: 0,
    status: "active",
    badge: null,
    shopLimit: 1,
    // New shops' allowance; grandfathered shops get 100 — a shop's own limit
    // comes from freeStampLimit(shop) in @/lib/plans, never from here.
    stampLimit: FREE_STAMPS,
    staffLoginLimit: 0,
    hasCsvExport: false,
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
    prices: [],
  },
  {
    slug: "pro",
    label: "Pro",
    tagline: "For a single busy shop",
    rank: 1,
    status: "active",
    badge: null,
    shopLimit: 1,
    stampLimit: "unlimited",
    staffLoginLimit: 1,
    hasCsvExport: false,
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
    prices: [
      usd("month", 1200, "active"),
      usd("year", 12000, "active"),
      // 2026-10-12 → 2026-10-21
      usd("month", 700, "archived"),
      usd("year", 7700, "archived"),
      legacy("month", 700, "usd", "price_1TxlSoHxHWKx0vW14KWYDnNL", "active"),
      legacy("year", 7700, "usd", "price_1TxlSqHxHWKx0vW1QMagBYru", "active"),
      legacy("month", 700, "aud", "price_1TdLiFHxHWKx0vW1hxK3RRYW", "archived"),
      legacy("year", 7700, "aud", "price_1Tgb6SHxHWKx0vW11dqmu96g", "archived"),
      legacy("month", 500, "usd", "price_1T8YwDHxHWKx0vW1dC3NLD9P", "archived"),
    ],
  },
  {
    // Sold as "Business" since 2026-10-21 (was "Plus"); the slug stays so
    // existing subscriptions, discounts and Stripe metadata keep resolving.
    slug: "plus",
    label: "Business",
    tagline: "For cafes with a team",
    rank: 2,
    status: "active",
    badge: "Best for teams",
    shopLimit: 3,
    stampLimit: "unlimited",
    staffLoginLimit: "unlimited",
    hasCsvExport: true,
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
    prices: [
      usd("month", 2900, "active"),
      usd("year", 29000, "active"),
      usd("month", 1900, "archived"),
      usd("year", 20900, "archived"),
      legacy("month", 1900, "usd", "price_1TxlSpHxHWKx0vW1spV4qCjP", "active"),
      legacy("year", 20900, "usd", "price_1TxlSqHxHWKx0vW1c2a6o1Cq", "active"),
      legacy("month", 1900, "aud", "price_1TdLiHHxHWKx0vW189oSCDPX", "archived"),
      legacy("year", 20900, "aud", "price_1Tgb6THxHWKx0vW1pSsb9qQ7", "archived"),
    ],
  },
  {
    // No longer sold (2026-10-21): nobody needed more than one shop, so the
    // public plans stop at Business and larger groups contact us.
    slug: "max",
    label: "Max",
    tagline: "Multi-location chains",
    rank: 3,
    status: "archived",
    badge: null,
    shopLimit: 10,
    stampLimit: "unlimited",
    staffLoginLimit: "unlimited",
    hasCsvExport: true,
    hasAnalytics: true,
    hasCrossShopReporting: true,
    hasPerkMode: true,
    hasWalletPasses: true,
    prioritySupport: true,
    dedicatedSupport: true,
    features: ["Everything in Business", "Up to 10 shops", "Cross-shop reporting", "Priority + dedicated support"],
    prices: [
      usd("month", 2900, "archived"),
      usd("year", 31900, "archived"),
      legacy("month", 2900, "usd", "price_1TxlSpHxHWKx0vW1OXPc9PeU", "archived"),
      legacy("year", 31900, "usd", "price_1TxlSrHxHWKx0vW1KSKdVtNp", "archived"),
      legacy("month", 2900, "aud", "price_1TdLiIHxHWKx0vW1BLazXMgu", "archived"),
      legacy("year", 31900, "aud", "price_1Tgb6UHxHWKx0vW1H90R8Xhx", "archived"),
    ],
  },
];

const confirm = process.argv.includes("--confirm");
const createStripe = process.argv.includes("--create-stripe");
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

const samePrice = (a: SeedPrice | PlanPrice, b: SeedPrice | PlanPrice) =>
  a.account === b.account && a.interval === b.interval && a.amountCents === b.amountCents && a.currency === b.currency;

async function findProduct(slug: string): Promise<Stripe.Product | null> {
  for await (const p of stripe!.products.list({ limit: 100 })) {
    if (p.metadata?.brewstamp_slug === `brewstamp_${slug}`) return p;
  }
  return null;
}

// Resolve (or create) the main-account Stripe price ids for one plan.
async function resolveStripeIds(plan: SeedPlan): Promise<void> {
  const mainPrices = plan.prices.filter((p) => p.account === "main");
  if (!stripe || !mainPrices.length) return;
  let product = await findProduct(plan.slug);
  if (!product && createStripe && confirm) {
    product = await stripe.products.create({
      name: `Brewstamp ${plan.label}`,
      metadata: { brewstamp_slug: `brewstamp_${plan.slug}` },
    });
    console.log(`  created Stripe product ${product.id}`);
  } else if (product && product.name !== `Brewstamp ${plan.label}` && createStripe) {
    console.log(`  ${confirm ? "renaming" : "would rename"} Stripe product "${product.name}" → "Brewstamp ${plan.label}"`);
    if (confirm) await stripe.products.update(product.id, { name: `Brewstamp ${plan.label}` });
  }
  if (!product) {
    console.log(`  no Stripe product for ${plan.slug} — main-account prices left without ids`);
    return;
  }
  const existing: Stripe.Price[] = [];
  for await (const p of stripe.prices.list({ product: product.id, limit: 100 })) existing.push(p);
  for (const price of mainPrices) {
    const hit = existing.find(
      (s) => s.unit_amount === price.amountCents && s.currency === price.currency && s.recurring?.interval === price.interval,
    );
    if (hit) {
      price.stripePriceId = hit.id;
    } else if (price.status === "active" && createStripe && confirm) {
      const created = await stripe.prices.create({
        product: product.id,
        unit_amount: price.amountCents,
        currency: price.currency,
        recurring: { interval: price.interval },
        metadata: { brewstamp_slug: `brewstamp_${plan.slug}`, billing_interval: price.interval },
      });
      price.stripePriceId = created.id;
      console.log(`  created Stripe price ${created.id} (${price.currency} ${price.amountCents / 100}/${price.interval})`);
    } else {
      console.log(
        `  no Stripe price for ${price.currency} ${price.amountCents / 100}/${price.interval} (${price.status})${price.status === "active" ? " — use --create-stripe" : ""}`,
      );
    }
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  const live = !!stripeKey && /^(sk|rk)_live_/.test(stripeKey);
  console.log(
    `DB ${new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "http://")).hostname} · Stripe ${stripeKey ? (live ? "LIVE" : "TEST") : "none"} · ${confirm ? "WRITING" : "dry run"}\n`,
  );
  await mongoose.connect(uri, { dbName: "brewstamp" });

  for (const plan of PLANS) {
    console.log(`${plan.label} (${plan.slug}, ${plan.status})`);
    await resolveStripeIds(plan);

    // Keep every price already stored; seeded prices update their match (or
    // are added). Nothing is removed, so an old price can't vanish from
    // under a subscriber.
    const doc = await Plan.findOne({ slug: plan.slug }).lean<any>();
    const prices: PlanPrice[] = (doc?.prices ?? []).map((p: any) => ({ ...p }));
    for (const seed of plan.prices) {
      const i = prices.findIndex((p) => samePrice(p, seed));
      const next: PlanPrice = { ...seed, stripePriceId: seed.stripePriceId ?? (i >= 0 ? prices[i].stripePriceId : null) };
      if (i >= 0) prices[i] = next;
      else prices.push(next);
    }
    for (const p of prices) {
      console.log(
        `  ${p.status.padEnd(8)} ${p.account.padEnd(6)} ${p.interval.padEnd(5)} ${p.currency} ${String(p.amountCents / 100).padStart(6)}  ${p.stripePriceId ?? "-"}`,
      );
    }
    const actives = new Set<string>();
    for (const p of prices.filter((p) => p.status === "active")) {
      const key = `${p.account}/${p.interval}`;
      if (actives.has(key)) throw new Error(`${plan.slug}: two active ${key} prices`);
      actives.add(key);
    }
    if (confirm) {
      const { prices: _seedPrices, ...fields } = plan;
      await Plan.updateOne({ slug: plan.slug }, { $set: { ...fields, prices } }, { upsert: true });
    }
    console.log("");
  }
  console.log(confirm ? "Catalogue written. Running servers pick it up within a minute." : "Dry run — re-run with --confirm to write.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
