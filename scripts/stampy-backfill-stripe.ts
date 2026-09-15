/**
 * Backfill legacy StampyStamp billing from Stripe into the stampy db:
 *   billing_subscriptions — every stampy merchant with a live (or past)
 *                           subscription on the shared Stripe account
 *   billing_payments      — every invoice for those merchants
 *
 *   npx tsx scripts/stampy-backfill-stripe.ts            # dry run
 *   npx tsx scripts/stampy-backfill-stripe.ts --apply
 *
 * Env: STAMPY_MONGODB_URI (read-write) or MONGODB_URI whose user can reach
 * the `stampy` db; STRIPE_SECRET_KEY / ~/.config/brewstamp/stripe-live.env
 * (read-only against Stripe). Brewstamp products are excluded; merchants
 * match by the customer id stored on the merchant, then by email.
 */
import "../src/lib/load-env";
import Stripe from "stripe";
import mongoose from "mongoose";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { ensureStampyBillingIndexes, stampyCollections, type StampySubscription } from "../src/lib/stampy-db";

const APPLY = process.argv.includes("--apply");

function stripeKey(): string {
  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live")) return process.env.STRIPE_SECRET_KEY;
  const f = `${homedir()}/.config/brewstamp/stripe-live.env`;
  if (existsSync(f)) {
    const m = readFileSync(f, "utf8").match(/^STRIPE_SECRET_KEY=(.*)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("No live Stripe key");
}

async function main() {
  const stripe = new Stripe(stripeKey());
  const acct = await stripe.accounts.retrieve();
  const { merchants, subscriptions, payments } = await stampyCollections();
  if (APPLY) await ensureStampyBillingIndexes();
  console.log(`${APPLY ? "APPLY" : "DRY RUN"} · Stripe ${acct.id} → stampy db\n`);

  const products = new Map<string, string>();
  for await (const p of stripe.products.list({ limit: 100 })) products.set(p.id, p.name);
  const isStampyProduct = (id: string | undefined) => !!id && products.has(id) && !/brewstamp/i.test(products.get(id)!);

  // Merchant lookup: by stored Stripe customer id, then by email.
  const all = await merchants.find({ deleted: null }).project({ email: 1, name: 1, stripe: 1 }).toArray();
  const byCustomer = new Map<string, any>();
  const byEmail = new Map<string, any>();
  for (const m of all) {
    if (m.stripe?.customer?.id) byCustomer.set(m.stripe.customer.id, m);
    byEmail.set(m.email.toLowerCase(), m);
  }
  const resolve = (customerId: string | undefined, email: string | null | undefined) =>
    (customerId && byCustomer.get(customerId)) || (email && byEmail.get(email.toLowerCase())) || null;

  // ---- Subscriptions (all statuses, so history has a parent row) ----
  const subByMerchant = new Map<string, StampySubscription>();
  let unmatched: string[] = [];
  for await (const s of stripe.subscriptions.list({ status: "all", limit: 100, expand: ["data.customer", "data.items.data.price"] })) {
    const item = s.items.data[0];
    if (!item || !isStampyProduct(item.price.product as string)) continue;
    const cust = s.customer as Stripe.Customer;
    const m = resolve(cust.id, cust.email);
    if (!m) { unmatched.push(`${s.id} ${cust.email ?? cust.id} ${s.status}`); continue; }
    const live = ["active", "trialing", "past_due"].includes(s.status);
    const existing = subByMerchant.get(m._id);
    // Prefer the live sub for a merchant; otherwise the most recent.
    if (existing && (existing.status !== "canceled" || !live) && (existing.createdAt.getTime() > s.created * 1000)) continue;
    const periodEnd = (item as any).current_period_end ?? (s as any).current_period_end;
    const periodStart = (item as any).current_period_start ?? (s as any).current_period_start;
    subByMerchant.set(m._id, {
      merchantId: m._id,
      merchantEmail: m.email,
      merchantName: m.name || m.email,
      provider: "stripe",
      stripeCustomerId: cust.id,
      stripeSubscriptionId: s.id,
      stripePriceId: item.price.id,
      planLabel: products.get(item.price.product as string) || "Bean",
      interval: item.price.recurring?.interval === "year" ? "year" : "month",
      priceCents: (item.price.unit_amount ?? 0) * (item.quantity ?? 1),
      currency: item.price.currency,
      status: live ? (s.status === "past_due" ? "past_due" : "active") : "canceled",
      cancelAtPeriodEnd: !!s.cancel_at_period_end,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      failedAttempts: 0,
      createdAt: new Date(s.created * 1000),
      updatedAt: new Date(),
    });
  }
  for (const sub of subByMerchant.values()) {
    console.log(`  ${sub.status.padEnd(9)} ${sub.merchantEmail.padEnd(36)} ${sub.merchantName.slice(0, 22).padEnd(22)} ${sub.planLabel} ${sub.currency.toUpperCase()} ${(sub.priceCents / 100).toFixed(2)}/${sub.interval === "year" ? "yr" : "mo"}  next ${sub.currentPeriodEnd?.toISOString().slice(0, 10) ?? "-"}`);
    if (APPLY) {
      const { createdAt, ...rest } = sub;
      await subscriptions.updateOne(
        { merchantId: sub.merchantId },
        { $set: rest, $setOnInsert: { createdAt } },
        { upsert: true }
      );
    }
  }
  console.log(`\nSubscriptions: ${subByMerchant.size} matched to merchants${unmatched.length ? ` · ${unmatched.length} unmatched: ${unmatched.join("; ")}` : ""}`);

  // ---- Payments: every invoice on those customers, stampy products only ----
  const subIds = new Map<string, any>();
  if (APPLY) for (const d of await subscriptions.find({}).project({ merchantId: 1 }).toArray()) subIds.set(d.merchantId, d._id);
  const seenSub = new Set<string>();
  const invoices: Stripe.Invoice[] = [];
  for await (const inv of stripe.invoices.list({ limit: 100, expand: ["data.lines.data"] })) invoices.push(inv);
  invoices.sort((a, b) => a.created - b.created);
  let scanned = 0, written = 0;
  const totals: Record<string, number> = {};
  for (const inv of invoices) {
    const line = inv.lines.data[0];
    const prod = (line as any)?.pricing?.price_details?.product as string | undefined;
    if (!isStampyProduct(prod)) continue;
    const custId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
    const m = resolve(custId, inv.customer_email);
    if (!m) continue;
    let status: "paid" | "failed" | "refunded";
    if (inv.status === "paid" && inv.amount_paid > 0) status = "paid";
    else if (inv.status === "uncollectible" || (inv.status === "open" && (inv.attempt_count ?? 0) > 0)) status = "failed";
    else continue;
    scanned++;
    const subId = (inv.parent?.subscription_details?.subscription as string | undefined) ?? null;
    const kind = subId && !seenSub.has(subId) ? "initial" : "renewal";
    if (subId) seenSub.add(subId);
    const chargeId = ((inv as any).charge as string | undefined) ?? undefined;
    let refundedCents = 0;
    if (status === "paid" && chargeId) {
      try { const ch = await stripe.charges.retrieve(chargeId); refundedCents = ch.amount_refunded ?? 0; if (refundedCents > 0) status = "refunded"; } catch { /* best effort */ }
    }
    if (status !== "failed") totals[inv.currency] = (totals[inv.currency] ?? 0) + inv.amount_paid;
    const row = {
      merchantId: m._id,
      subscriptionId: subIds.get(m._id) ?? null,
      provider: "stripe" as const,
      stripeInvoiceId: inv.id,
      stripeChargeId: chargeId ?? null,
      hostedUrl: inv.hosted_invoice_url ?? null,
      paidAt: new Date(inv.created * 1000),
      kind: kind as "initial" | "renewal",
      status,
      amountCents: status === "failed" ? inv.amount_due : inv.amount_paid,
      currency: inv.currency,
      description: line?.description ?? products.get(prod!) ?? "StampyStamp",
      periodStart: line?.period ? new Date(line.period.start * 1000) : null,
      periodEnd: line?.period ? new Date(line.period.end * 1000) : null,
      failureReason: status === "failed" ? `stripe:${inv.status}` : null,
      refundedCents,
    };
    if (APPLY) {
      await payments.updateOne({ stripeInvoiceId: inv.id }, { $set: row, $setOnInsert: { createdAt: new Date(inv.created * 1000) } }, { upsert: true });
      written++;
    }
  }
  console.log(`Payments: ${scanned} stampy invoices${APPLY ? ` · ${written} rows written` : ""} · collected ${Object.entries(totals).map(([c, v]) => `${c.toUpperCase()} ${(v / 100).toFixed(2)}`).join(" + ")}`);
  if (!APPLY) console.log("\nDry run — re-run with --apply to write.");
  await mongoose.disconnect();
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
