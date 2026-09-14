/**
 * Rebuild Brewstamp subscriptions in the new Stripe account, once Stripe has
 * copied the customers + payment methods across.
 *
 * A Stripe Subscription cannot be moved between accounts. The process is:
 *   1. The Dashboard's self-serve PAN copy moves Customers + PaymentMethods
 *      (old → new). Customer ids are preserved; payment-method ids are new.
 *   2. This script creates each subscription afresh in the new account,
 *      anchored to the OLD subscription's next renewal date with no proration,
 *      so the customer sees one charge per cycle and nothing extra.
 *   3. It sets the old subscription to cancel at period end, so the old
 *      account bills nothing further.
 *   4. It repoints the app's Subscription / Shop records at the new ids.
 *
 *   npx tsx scripts/stripe-migrate-subscriptions.ts                                   # dry run (identity mapping)
 *   npx tsx scripts/stripe-migrate-subscriptions.ts --mapping ~/Downloads/mapping.csv # dry run with Stripe's CSV
 *   npx tsx scripts/stripe-migrate-subscriptions.ts --mapping … --apply               # do it
 *
 * Reads ~/.config/brewstamp/stripe-live.env (old), stripe-new.env (new), and
 * stripe-migration-inventory.json (written during setup). Mongo writes need a
 * read-write MONGODB_URI in the environment; without one they're reported and
 * skipped. See docs/stripe-migration.md for the full runbook.
 */
import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const cfg = `${homedir()}/.config/brewstamp`;
const env = (f: string, k: string) =>
  readFileSync(`${cfg}/${f}`, "utf8").match(new RegExp(`^${k}=(.*)$`, "m"))![1].trim().replace(/^["']|["']$/g, "");
const arg = (name: string) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; };
const APPLY = process.argv.includes("--apply");

interface InvSub {
  sub: string; customer: string; email: string; price: string; product: string;
  currency: string; unit_amount: number; interval: string; quantity: number;
  current_period_end: number; coupon: string | null; pm_type: string | null;
}
interface Inventory {
  oldAccount: string; newAccount: string; subscriptions: InvSub[]; priceMap: Record<string, string>;
}

/**
 * Stripe's PAN-copy mapping CSV (Dashboard → Documents on the recipient
 * account). Headers: customer_id_old, source_id_old, customer_id_new,
 * source_id_new. Customer ids are preserved by the copy — only payment-method
 * ids change — so the map is normally identity; we read it anyway so a
 * customer Stripe *didn't* copy is skipped rather than assumed.
 */
function readMapping(path: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split(",").map((c) => c.trim().replace(/^"|"$/g, "").toLowerCase());
  let iOld = header.indexOf("customer_id_old"), iNew = header.indexOf("customer_id_new");
  const hasHeader = iOld >= 0 && iNew >= 0;
  if (!hasHeader) { iOld = 0; iNew = 1; }
  for (const line of hasHeader ? lines.slice(1) : lines) {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const o = cells[iOld], n = cells[iNew] || cells[iOld];
    if (o?.startsWith("cus_") && n?.startsWith("cus_")) map.set(o, n);
  }
  return map;
}

async function main() {
  const mappingPath = arg("--mapping");
  const inv = JSON.parse(readFileSync(`${cfg}/stripe-migration-inventory.json`, "utf8")) as Inventory;
  // Without a CSV, assume identity (customer ids survive the copy); every
  // customer is still verified to exist in the new account before use.
  const mapping = mappingPath ? readMapping(mappingPath) : new Map(inv.subscriptions.map((s) => [s.customer, s.customer]));
  if (!mappingPath) console.log("no --mapping given: assuming customer ids are unchanged (Stripe preserves them on copy)\n");
  const oldS = new Stripe(env("stripe-live.env", "STRIPE_SECRET_KEY"));
  const newS = new Stripe(env("stripe-new.env", "STRIPE_SECRET_KEY_NEW"));

  // Refuse to run against the wrong accounts.
  const [oa, na] = await Promise.all([oldS.accounts.retrieve(), newS.accounts.retrieve()]);
  if (oa.id !== inv.oldAccount || na.id !== inv.newAccount) throw new Error(`account mismatch: old ${oa.id} new ${na.id}`);

  const mongoUri = process.env.MONGODB_URI;
  let mongoose: typeof import("mongoose") | null = null;
  if (mongoUri) {
    mongoose = await import("mongoose");
    await mongoose.connect(mongoUri);
  }

  console.log(`${APPLY ? "APPLYING" : "DRY RUN"} · ${inv.subscriptions.length} subscriptions · ${mapping.size} customers in mapping\n`);
  const now = Math.floor(Date.now() / 1000);
  let ok = 0, skipped = 0;

  for (const s of inv.subscriptions) {
    const tag = `${s.email.padEnd(34)} ${s.product.padEnd(14)} ${s.currency.toUpperCase()} ${s.unit_amount / 100}/${s.interval}`;

    // Re-read the OLD subscription: it may have renewed since the inventory.
    const oldSub = await oldS.subscriptions.retrieve(s.sub);
    if (!["active", "trialing", "past_due"].includes(oldSub.status)) { console.log(`SKIP ${tag}\n     old sub is ${oldSub.status}`); skipped++; continue; }
    if (oldSub.cancel_at_period_end && (oldSub.metadata as any)?.migrated_to) { console.log(`DONE ${tag}\n     already migrated → ${(oldSub.metadata as any).migrated_to}`); ok++; continue; }
    const periodEnd = (oldSub as any).current_period_end ?? (oldSub.items.data[0] as any).current_period_end;

    const newCust = mapping.get(s.customer);
    if (!newCust) { console.log(`SKIP ${tag}\n     ${s.customer} not in mapping`); skipped++; continue; }
    const newPrice = inv.priceMap[s.price];
    if (!newPrice) { console.log(`SKIP ${tag}\n     no new price for ${s.price}`); skipped++; continue; }

    // The copied customer must exist in the new account and have a usable
    // payment method. A bad mapping row skips this one, not the whole run.
    let cust: Stripe.Customer;
    let pms: Stripe.ApiList<Stripe.PaymentMethod>;
    try {
      cust = await newS.customers.retrieve(newCust) as Stripe.Customer;
      if ((cust as any).deleted) throw new Error("deleted");
      pms = await newS.paymentMethods.list({ customer: newCust, limit: 10 });
    } catch (e: any) {
      console.log(`SKIP ${tag}\n     ${newCust} not usable in the new account (${e.message})`); skipped++; continue;
    }
    const defaultPm = cust.invoice_settings?.default_payment_method as string | null;
    const pm = pms.data.find((p) => p.id === defaultPm) ?? pms.data[0];
    if (!pm) { console.log(`SKIP ${tag}\n     ${newCust} has NO payment method in the new account (was ${s.pm_type}) — customer must re-add`); skipped++; continue; }
    if (periodEnd <= now) { console.log(`SKIP ${tag}\n     old period already ended (${new Date(periodEnd * 1000).toISOString()}); handle by hand`); skipped++; continue; }

    console.log(`${APPLY ? "MIGRATE" : "WOULD"} ${tag}`);
    console.log(`     ${s.customer} → ${newCust} · ${s.price} → ${newPrice} · pm ${pm.type}${pm.card ? " •" + pm.card.last4 : ""} · first charge ${new Date(periodEnd * 1000).toISOString().slice(0, 10)}${s.coupon ? " · coupon " + s.coupon : ""}`);
    if (!APPLY) { ok++; continue; }

    // 1. New subscription: anchored to the old renewal date, no proration, so
    //    nothing is charged now and the first invoice lands exactly when the
    //    old one would have.
    const created = await newS.subscriptions.create({
      customer: newCust,
      items: [{ price: newPrice, quantity: s.quantity }],
      default_payment_method: pm.id,
      billing_cycle_anchor: periodEnd,
      proration_behavior: "none",
      ...(s.coupon ? { discounts: [{ coupon: s.coupon }] } : {}),
      metadata: { migrated_from_subscription: s.sub, migrated_from_customer: s.customer, migrated_from_account: inv.oldAccount },
    });
    // 2. Old subscription: stop at the end of the paid period.
    await oldS.subscriptions.update(s.sub, { cancel_at_period_end: true, metadata: { migrated_to: created.id, migrated_to_account: inv.newAccount } });
    console.log(`     created ${created.id} (${created.status}) · old ${s.sub} cancels at period end`);

    // 3. App records.
    if (mongoose) {
      const db = mongoose.connection.db!;
      const r = await db.collection("subscriptions").updateOne(
        { stripeSubscriptionId: s.sub },
        { $set: { stripeCustomerId: newCust, stripeSubscriptionId: created.id, stripePriceId: newPrice, cancelAtPeriodEnd: false } },
      );
      const shopDoc = await db.collection("subscriptions").findOne({ stripeSubscriptionId: created.id });
      if (shopDoc) await db.collection("shops").updateOne({ _id: shopDoc.shop }, { $set: { stripeCustomerId: newCust } });
      console.log(`     mongo: subscription doc ${r.matchedCount ? "repointed" : "NOT FOUND"}${shopDoc ? ", shop repointed" : ""}`);
    } else {
      console.log(`     mongo: SKIPPED (no MONGODB_URI) — repoint ${s.sub} → ${created.id} by hand`);
    }
    ok++;
  }

  console.log(`\n${ok} ${APPLY ? "migrated" : "ready"} · ${skipped} skipped`);
  if (mongoose) await mongoose.disconnect();
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
