/**
 * Move one shop's Stripe subscription from the legacy shared account to
 * Brewstamp's main account, after its customer and card have been copied
 * across with Stripe's Dashboard data copy (which keeps the cus_ id; card
 * numbers can't move through the API).
 *
 *   MONGODB_URI=<prod RW> STRIPE_SECRET_KEY=<main key> STRIPE_LEGACY_SECRET_KEY=<legacy key> \
 *     npx tsx scripts/migrate-legacy-subscription.ts --shop <shopId> [--confirm]
 *
 * Without --confirm it only checks and prints the plan. With it:
 * 1. finds (or creates) a main-account price for what they pay today;
 * 2. creates the subscription on the main account with the copied card,
 *    anchored to the old renewal date with no proration — it's active
 *    straight away and the first charge is on that date, at the same price;
 * 3. points our Subscription doc and Shop at the new ids;
 * 4. cancels the legacy subscription with no proration or final invoice.
 * The doc is repointed before the cancel, so the legacy
 * customer.subscription.deleted webhook matches nothing.
 */
import mongoose, { Types } from "mongoose";
import Stripe from "stripe";

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const confirm = process.argv.includes("--confirm");
const shopId = arg("shop");

async function main() {
  const { MONGODB_URI, STRIPE_SECRET_KEY, STRIPE_LEGACY_SECRET_KEY } = process.env;
  if (!shopId || !MONGODB_URI || !STRIPE_SECRET_KEY || !STRIPE_LEGACY_SECRET_KEY) {
    throw new Error("Usage: --shop <shopId> [--confirm], with MONGODB_URI, STRIPE_SECRET_KEY, STRIPE_LEGACY_SECRET_KEY set");
  }
  const main = new Stripe(STRIPE_SECRET_KEY);
  const legacy = new Stripe(STRIPE_LEGACY_SECRET_KEY);
  await mongoose.connect(MONGODB_URI, { dbName: "brewstamp" });
  const db = mongoose.connection.db!;

  const shop = await db.collection("shops").findOne({ _id: new Types.ObjectId(shopId) }, { projection: { name: 1 } });
  const doc = await db.collection("subscriptions").findOne({ shop: new Types.ObjectId(shopId) });
  if (!shop || !doc) throw new Error(`No shop or subscription for ${shopId}`);
  if (doc.provider === "paypal" || doc.stripeAccount === "main") throw new Error(`Not a legacy Stripe subscription (${doc.provider}/${doc.stripeAccount})`);
  console.log(`${confirm ? "WRITING" : "dry run"} · "${shop.name}" · legacy ${doc.stripeSubscriptionId}`);

  // ── Legacy side ───────────────────────────────────────────────────────
  const old = await legacy.subscriptions.retrieve(doc.stripeSubscriptionId, { expand: ["default_payment_method"] });
  if (!["active", "past_due"].includes(old.status)) throw new Error(`Legacy subscription is ${old.status}`);
  const item = old.items.data[0];
  const oldPrice = item.price;
  const periodEnd = item.current_period_end;
  const oldPm = old.default_payment_method as Stripe.PaymentMethod | null;
  const customerId = typeof old.customer === "string" ? old.customer : old.customer.id;
  console.log(
    `  pays ${oldPrice.currency.toUpperCase()} ${(oldPrice.unit_amount ?? 0) / 100}/${oldPrice.recurring?.interval} · renews ${new Date(periodEnd * 1000).toISOString().slice(0, 10)} · card ${oldPm?.card?.brand} ${oldPm?.card?.last4} ${oldPm?.card?.exp_month}/${oldPm?.card?.exp_year}`,
  );

  // ── Main side: the copied customer and card ──────────────────────────
  const customer = await main.customers.retrieve(customerId).catch(() => null);
  if (!customer || customer.deleted) {
    console.log(`  ✗ ${customerId} isn't on the main account yet — run the Dashboard data copy first.`);
    await mongoose.disconnect();
    return;
  }
  const pms = (await main.paymentMethods.list({ customer: customerId, type: "card" })).data;
  const pm =
    pms.find(
      (p) => p.card?.last4 === oldPm?.card?.last4 && p.card?.exp_month === oldPm?.card?.exp_month && p.card?.exp_year === oldPm?.card?.exp_year,
    ) ?? (pms.length === 1 ? pms[0] : undefined);
  if (!pm) throw new Error(`No matching copied card on ${customerId} (found ${pms.length})`);
  console.log(`  ✓ copied customer and card ${pm.id} (${pm.card?.brand} ${pm.card?.last4})`);

  // A main-account price for exactly what they pay, under the plan's product.
  const slug = doc.planSlug ?? "pro";
  let product: Stripe.Product | undefined;
  for await (const p of main.products.list({ limit: 100 })) if (p.metadata?.brewstamp_slug === `brewstamp_${slug}`) product = p;
  if (!product) throw new Error(`No main-account product for brewstamp_${slug}`);
  let price: Stripe.Price | undefined;
  for await (const p of main.prices.list({ product: product.id, active: true, limit: 100 })) {
    if (p.unit_amount === oldPrice.unit_amount && p.currency === oldPrice.currency && p.recurring?.interval === oldPrice.recurring?.interval) price = p;
  }
  console.log(`  ${price ? `✓ price ${price.id}` : "+ would create"} ${product.name} ${oldPrice.currency.toUpperCase()} ${(oldPrice.unit_amount ?? 0) / 100}/${oldPrice.recurring?.interval}`);

  if (!confirm) {
    console.log("\nDry run — re-run with --confirm to move it.");
    await mongoose.disconnect();
    return;
  }

  price ??= await main.prices.create({
    product: product.id,
    unit_amount: oldPrice.unit_amount!,
    currency: oldPrice.currency,
    recurring: { interval: oldPrice.recurring!.interval },
    nickname: "Grandfathered (moved from the legacy account)",
    metadata: { brewstamp_slug: `brewstamp_${slug}`, billing_interval: oldPrice.recurring!.interval, grandfathered: "true" },
  });

  await main.customers.update(customerId, {
    invoice_settings: { default_payment_method: pm.id },
    metadata: { shopId },
  });
  const sub = await main.subscriptions.create(
    {
      customer: customerId,
      items: [{ price: price.id }],
      default_payment_method: pm.id,
      billing_cycle_anchor: periodEnd,
      proration_behavior: "none",
      metadata: { shopId, plan: slug, migratedFrom: old.id },
    },
    { idempotencyKey: `migrate-legacy-${old.id}` },
  );
  console.log(`  ✓ main subscription ${sub.id} (${sub.status}), first charge ${new Date(periodEnd * 1000).toISOString().slice(0, 10)}`);

  await db.collection("subscriptions").updateOne(
    { _id: doc._id },
    {
      $set: {
        stripeAccount: "main",
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        stripePriceId: price.id,
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(periodEnd * 1000),
        migratedFromStripeSubscriptionId: old.id,
        migratedAt: new Date(),
      },
    },
  );
  await db.collection("shops").updateOne({ _id: shop._id }, { $set: { stripeMainCustomerId: customerId } });
  console.log("  ✓ Subscription doc and shop now point at the main account");

  await legacy.subscriptions.cancel(old.id, { prorate: false, invoice_now: false });
  console.log(`  ✓ legacy ${old.id} cancelled (no proration, no final invoice)`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
