/**
 * Backfill from Stripe so reporting no longer depends on the Stripe API
 * (which we're retiring in favour of PayPal):
 *   1. `payments`      — one row per Brewstamp invoice (transaction history)
 *   2. `subscriptions` — plan info per customer: planSlug, interval,
 *                        priceCents and currency from the live Stripe price,
 *                        so grandfathered amounts (US$5 Pro, AUD tiers) are
 *                        exact and survive the move off Stripe.
 *
 *   npx tsx scripts/backfill-stripe-payments.ts            # dry run
 *   npx tsx scripts/backfill-stripe-payments.ts --apply    # write rows
 *
 * Env: MONGODB_URI (target DB — read-write for --apply) and STRIPE_SECRET_KEY
 * (the account that holds the history; falls back to the shared live key in
 * ~/.config/brewstamp/stripe-live.env). Read-only against Stripe.
 *
 * Brewstamp shares the old Stripe account with other apps, so invoices are
 * filtered to Brewstamp products (same rule as lib/finance.ts). Each invoice
 * becomes one Payment row keyed by stripeInvoiceId — re-runnable; existing
 * rows are updated, not duplicated.
 */
import "../src/lib/load-env";
import Stripe from "stripe";
import mongoose from "mongoose";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { Payment, Shop, Subscription, User } from "../src/models";
import { getIntervalByPriceId, getPlanByPriceId, getPlanBySlug } from "../src/lib/plans";

const APPLY = process.argv.includes("--apply");

function stripeKey(): string {
  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live")) return process.env.STRIPE_SECRET_KEY;
  const f = `${homedir()}/.config/brewstamp/stripe-live.env`;
  if (existsSync(f)) {
    const m = readFileSync(f, "utf8").match(/^STRIPE_SECRET_KEY=(.*)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY;
  throw new Error("No Stripe key: set STRIPE_SECRET_KEY or ~/.config/brewstamp/stripe-live.env");
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  const stripe = new Stripe(stripeKey());
  const acct = await stripe.accounts.retrieve();
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`${APPLY ? "APPLY" : "DRY RUN"} · Stripe ${acct.id} → ${mongoose.connection.db!.databaseName}\n`);

  // Brewstamp products only (shared account).
  const brewProducts = new Map<string, string>();
  for await (const p of stripe.products.list({ limit: 100 })) {
    if (/brewstamp/i.test(p.name)) brewProducts.set(p.id, p.name);
  }

  // Customer → shop. Subscription docs are authoritative; Shop.stripeCustomerId
  // catches shops that checked out but whose sub doc was later replaced.
  const shopByCustomer = new Map<string, { shop: string; sub: string | null }>();
  for (const s of await Subscription.find({ stripeCustomerId: { $exists: true } }).lean() as any[]) {
    shopByCustomer.set(s.stripeCustomerId, { shop: String(s.shop), sub: String(s._id) });
  }
  for (const sh of await Shop.find({ stripeCustomerId: { $exists: true } }).select("stripeCustomerId").lean() as any[]) {
    if (!shopByCustomer.has(sh.stripeCustomerId)) shopByCustomer.set(sh.stripeCustomerId, { shop: String(sh._id), sub: null });
  }
  // Last resort: invoice email → owner → their shop.
  async function shopByEmail(email: string | null | undefined) {
    if (!email) return null;
    const u = await User.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).select("_id").lean() as any;
    if (!u) return null;
    const sh = await Shop.findOne({ owner: u._id }).select("_id").lean() as any;
    return sh ? String(sh._id) : null;
  }

  // Track per-subscription order so the first paid invoice is "initial".
  const seenSub = new Set<string>();
  let scanned = 0, matched = 0, unmatched = 0, written = 0;
  const unmatchedRows: string[] = [];

  // Oldest first so "initial" lands on the first invoice of each sub.
  const invoices: Stripe.Invoice[] = [];
  for await (const inv of stripe.invoices.list({ limit: 100, expand: ["data.lines.data"] })) invoices.push(inv);
  invoices.sort((a, b) => a.created - b.created);

  for (const inv of invoices) {
    const lines = inv.lines.data;
    const prodIds = lines.map((l) => (l as any)?.pricing?.price_details?.product as string | undefined);
    const brewProd = prodIds.find((p) => p && brewProducts.has(p));
    if (!brewProd) continue; // not Brewstamp
    scanned++;

    // Skip drafts and zero-amount invoices (100% coupon months, $0 prorations)
    // unless they represent a failed collection.
    const status = inv.status;
    let ourStatus: "paid" | "failed" | "refunded" | null = null;
    if (status === "paid" && inv.amount_paid > 0) ourStatus = "paid";
    else if (status === "uncollectible" || (status === "open" && inv.attempt_count > 0)) ourStatus = "failed";
    else continue;

    const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
    let target = customerId ? shopByCustomer.get(customerId) : undefined;
    if (!target) {
      const shop = await shopByEmail(inv.customer_email);
      if (shop) target = { shop, sub: null };
    }
    if (!target) {
      unmatched++;
      unmatchedRows.push(`${new Date(inv.created * 1000).toISOString().slice(0, 10)} ${inv.customer_email ?? customerId} ${inv.currency.toUpperCase()} ${(inv.amount_paid / 100).toFixed(2)}`);
      continue;
    }
    matched++;

    const priceId = (lines[0] as any)?.pricing?.price_details?.price as string | undefined;
    const plan = priceId ? getPlanByPriceId(priceId) : undefined;
    const interval = priceId ? getIntervalByPriceId(priceId) : undefined;
    const subId = (inv.parent?.subscription_details?.subscription as string | undefined) ?? null;
    const isProration = lines.some((l) => (l as any).proration);
    let kind: "initial" | "renewal" | "upgrade" = "renewal";
    if (isProration) kind = "upgrade";
    else if (subId && !seenSub.has(subId)) kind = "initial";
    if (subId) seenSub.add(subId);

    // Refunds: a paid invoice whose charge was refunded.
    let refundedCents = 0;
    const chargeId = (inv as any).charge as string | undefined ?? (inv.payments?.data?.[0]?.payment?.charge as string | undefined);
    if (ourStatus === "paid" && chargeId) {
      try {
        const ch = await stripe.charges.retrieve(chargeId);
        refundedCents = ch.amount_refunded ?? 0;
        if (refundedCents > 0) ourStatus = "refunded";
      } catch { /* charge lookup is best-effort */ }
    }

    const period = lines[0]?.period;
    const row = {
      shop: target.shop,
      subscription: target.sub,
      provider: "stripe",
      stripeInvoiceId: inv.id,
      stripeChargeId: chargeId ?? undefined,
      hostedUrl: inv.hosted_invoice_url ?? undefined,
      paidAt: new Date(inv.created * 1000),
      kind,
      status: ourStatus,
      amountCents: ourStatus === "failed" ? inv.amount_due : inv.amount_paid,
      currency: inv.currency,
      planSlug: plan?.slug,
      interval,
      description: lines[0]?.description ?? brewProducts.get(brewProd) ?? "Brewstamp",
      periodStart: period ? new Date(period.start * 1000) : undefined,
      periodEnd: period ? new Date(period.end * 1000) : undefined,
      failureReason: ourStatus === "failed" ? `stripe:${status}` : undefined,
      refundedCents,
    };

    if (APPLY) {
      await Payment.updateOne({ stripeInvoiceId: inv.id }, { $set: row, $setOnInsert: { createdAt: new Date(inv.created * 1000) } }, { upsert: true, timestamps: false });
      written++;
    }
  }

  // ---- 2. Plan info per subscription, from the live Stripe subscription ----
  let subsUpdated = 0, subsSkipped = 0;
  const subDocs = await Subscription.find({ stripeSubscriptionId: { $exists: true, $ne: null } }).lean() as any[];
  for (const doc of subDocs) {
    if (String(doc.stripeSubscriptionId).startsWith("sub_seed_")) continue;
    let ss: Stripe.Subscription;
    try {
      ss = await stripe.subscriptions.retrieve(doc.stripeSubscriptionId, { expand: ["items.data.price"] });
    } catch {
      subsSkipped++;
      continue;
    }
    const item = ss.items.data[0];
    const price = item?.price;
    if (!price?.unit_amount) { subsSkipped++; continue; }
    const interval = price.recurring?.interval === "year" ? "year" : "month";
    // Env price ids may be test-mode locally; the product name is the
    // reliable tier signal ("Brewstamp Plus" → plus). Legacy $5 Pro → pro.
    const prodId = typeof price.product === "string" ? price.product : price.product.id;
    const prodName = brewProducts.get(prodId) ?? "";
    const fromName = (/\bmax\b/i.test(prodName) ? "max" : /\bplus\b/i.test(prodName) ? "plus" : "pro") as "pro" | "plus" | "max";
    const plan = getPlanByPriceId(price.id) ?? getPlanBySlug(fromName);
    const slug = plan?.slug ?? fromName;
    const set = {
      provider: doc.provider ?? "stripe",
      planSlug: slug,
      interval,
      priceCents: price.unit_amount * (item.quantity ?? 1),
      currency: price.currency,
      planLabel: plan?.label ?? "Pro",
      stripePriceId: price.id,
    };
    console.log(`  sub ${String(doc.shop).slice(-6)} ${ss.status.padEnd(9)} ${slug}/${interval} ${price.currency.toUpperCase()} ${(set.priceCents / 100).toFixed(2)}  ${prodName}`);
    if (APPLY) {
      await Subscription.updateOne({ _id: doc._id }, { $set: set });
      subsUpdated++;
    }
  }
  console.log(`\nSubscriptions: ${subDocs.length} with a Stripe id · ${APPLY ? `${subsUpdated} updated` : "would update"} · ${subsSkipped} skipped (not found in Stripe / no price)`);

  console.log(`Brewstamp invoices scanned: ${scanned} · matched to a shop: ${matched} · unmatched: ${unmatched}${APPLY ? ` · rows written: ${written}` : ""}`);
  if (unmatchedRows.length) {
    console.log("\nUnmatched (no shop for the Stripe customer/email):");
    for (const r of unmatchedRows) console.log("  " + r);
  }
  if (!APPLY) console.log("\nDry run — re-run with --apply to write.");
  await mongoose.disconnect();
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
