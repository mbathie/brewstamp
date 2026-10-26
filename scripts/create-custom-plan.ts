/**
 * Set up a private ("custom") plan for one customer and a Stripe payment link
 * for them to subscribe with. The plan is stored with custom: true and status
 * "archived", so it's never listed or sold in the app; the link carries the
 * shop id in its metadata, which Stripe copies onto the checkout session, so
 * the existing checkout.session.completed webhook attaches the subscription
 * to their shop.
 *
 *   MONGODB_URI=<prod RW> STRIPE_SECRET_KEY=<live main key> npx tsx scripts/create-custom-plan.ts \
 *     --slug custom_pedal --shop <shopId> --monthly 150 --shops 30 \
 *     --tagline "Pedal Cafe group plan" [--confirm]
 *
 * Without --confirm it only prints what it would do. Re-running reuses the
 * Stripe product and price and updates the plan; each confirmed run makes a
 * new single-use payment link.
 */
import mongoose from "mongoose";
import Stripe from "stripe";
import Plan from "../src/models/Plan";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const confirm = process.argv.includes("--confirm");
const slug = arg("slug");
const shopId = arg("shop");
const monthly = Number(arg("monthly"));
const shopLimit = Number(arg("shops") ?? 30);
const tagline = arg("tagline") ?? "Your group plan";
const APP_URL = "https://brewstamp.app";

async function main() {
  if (!slug?.startsWith("custom_") || !shopId || !(monthly > 0)) {
    throw new Error("Usage: --slug custom_<name> --shop <shopId> --monthly <USD> [--shops 30] [--tagline …] [--confirm]");
  }
  const uri = process.env.MONGODB_URI;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!uri || !key) throw new Error("MONGODB_URI and STRIPE_SECRET_KEY must be set");
  const stripe = new Stripe(key);
  const live = /^(sk|rk)_live_/.test(key);
  await mongoose.connect(uri, { dbName: "brewstamp" });
  const db = mongoose.connection.db!;

  const shop = await db.collection("shops").findOne({ _id: new mongoose.Types.ObjectId(shopId) }, { projection: { name: 1, owner: 1 } });
  if (!shop) throw new Error(`No shop ${shopId}`);
  const owner = await db.collection("users").findOne({ _id: shop.owner }, { projection: { email: 1 } });
  console.log(`Stripe ${live ? "LIVE" : "TEST"} · ${confirm ? "WRITING" : "dry run"}`);
  console.log(`Shop "${shop.name}" (${shopId}) · owner ${owner?.email}`);
  console.log(`Plan ${slug}: US$${monthly}/month, up to ${shopLimit} shops\n`);

  // Business is the template: everything it has, plus more shops and
  // dedicated support.
  const business = await Plan.findOne({ slug: "plus" }).lean<any>();
  if (!business) throw new Error("No Business (plus) plan in the catalogue");
  const amountCents = Math.round(monthly * 100);

  // ── Stripe product + price ────────────────────────────────────────────
  const tag = `brewstamp_${slug}`;
  let product: Stripe.Product | null = null;
  for await (const p of stripe.products.list({ limit: 100 })) {
    if (p.metadata?.brewstamp_slug === tag) product = p;
  }
  let price: Stripe.Price | null = null;
  if (product) {
    for await (const p of stripe.prices.list({ product: product.id, active: true, limit: 100 })) {
      if (p.unit_amount === amountCents && p.currency === "usd" && p.recurring?.interval === "month") price = p;
    }
  }
  if (!confirm) {
    console.log(`Would ${product ? `reuse product ${product.id}` : "create a Stripe product"}, ${price ? `reuse price ${price.id}` : "create the monthly price"}, upsert plan "${slug}" and create a single-use payment link.`);
    await mongoose.disconnect();
    return;
  }
  product ??= await stripe.products.create({
    name: `Brewstamp Custom — ${shop.name}`,
    metadata: { brewstamp_slug: tag },
  });
  price ??= await stripe.prices.create({
    product: product.id,
    unit_amount: amountCents,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { brewstamp_slug: tag, billing_interval: "month" },
  });
  console.log(`Stripe product ${product.id} · price ${price.id}`);

  // ── Plan catalogue ────────────────────────────────────────────────────
  const maxRank = (await Plan.find({}).select("rank").lean<any[]>()).reduce((m, p) => Math.max(m, p.rank), 0);
  const existing = await Plan.findOne({ slug }).lean<any>();
  const prices = (existing?.prices ?? []).filter((p: any) => p.stripePriceId !== price!.id);
  prices.push({ interval: "month", amountCents, currency: "usd", account: "main", stripePriceId: price.id, status: "active" });
  await Plan.updateOne(
    { slug },
    {
      $set: {
        slug,
        label: "Custom",
        tagline,
        rank: existing?.rank ?? maxRank + 1,
        status: "archived",
        custom: true,
        badge: null,
        shopLimit,
        stampLimit: "unlimited",
        staffLoginLimit: "unlimited",
        hasCsvExport: true,
        hasAnalytics: true,
        hasCrossShopReporting: true,
        hasPerkMode: business.hasPerkMode,
        hasWalletPasses: true,
        prioritySupport: true,
        dedicatedSupport: true,
        features: [
          "Everything in Business",
          `Up to ${shopLimit} shops under one account`,
          "Unlimited staff logins, per-shop access",
          "Cross-shop reporting",
          "Help setting up every shop",
          "Dedicated account support",
        ],
        prices,
      },
    },
    { upsert: true },
  );
  console.log(`Plan "${slug}" saved (custom, rank ${existing?.rank ?? maxRank + 1}).`);

  // ── Payment link ──────────────────────────────────────────────────────
  const metadata = { shopId, plan: slug, interval: "month" };
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata,
    subscription_data: { metadata, description: `Brewstamp Custom plan — ${shop.name}` },
    restrictions: { completed_sessions: { limit: 1 } },
    inactive_message: "This plan link has already been used. Email hello@brewstamp.app if you need a new one.",
    after_completion: {
      type: "redirect",
      redirect: { url: `${APP_URL}/dashboard/billing?success=1&session_id={CHECKOUT_SESSION_ID}` },
    },
  });
  const url = owner?.email ? `${link.url}?prefilled_email=${encodeURIComponent(owner.email)}` : link.url;
  console.log(`\nPayment link ${link.id}\n${url}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
