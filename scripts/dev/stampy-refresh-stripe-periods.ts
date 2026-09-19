// Legacy StampyStamp merchants still billed by Stripe have no webhook feeding
// the stampy db, so after a Stripe renewal their currentPeriodEnd goes stale
// (and the admin page shows "overdue"). Pull the live period + status from
// Stripe for each un-migrated sub and upsert any new invoices. Never touches
// subs already on PayPal.
//
//   npx tsx scripts/dev/stampy-refresh-stripe-periods.ts [--apply]
import "../../src/lib/load-env";
import Stripe from "stripe";
import mongoose from "mongoose";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { stampyCollections } from "../../src/lib/stampy-db";

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
  const { subscriptions, payments } = await stampyCollections();
  const subs = await subscriptions.find({ provider: { $ne: "paypal" }, stripeSubscriptionId: { $exists: true } }).toArray();
  console.log(`${APPLY ? "APPLY" : "DRY RUN"} · ${subs.length} Stripe-billed stampy sub(s)\n`);
  for (const sub of subs) {
    const s = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId!, { expand: ["items.data.price"] });
    const item = s.items.data[0];
    const periodEnd = (item as any).current_period_end ?? (s as any).current_period_end;
    const periodStart = (item as any).current_period_start ?? (s as any).current_period_start;
    const live = ["active", "trialing", "past_due"].includes(s.status);
    const set = {
      status: (live ? (s.status === "past_due" ? "past_due" : "active") : "canceled") as "active" | "past_due" | "canceled",
      cancelAtPeriodEnd: !!s.cancel_at_period_end,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      updatedAt: new Date(),
    };
    const was = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString().slice(0, 10) : "-";
    const now = set.currentPeriodEnd ? set.currentPeriodEnd.toISOString().slice(0, 10) : "-";
    console.log(`  ${sub.merchantEmail.padEnd(36)} ${sub.merchantName.slice(0, 22).padEnd(22)} period end ${was} → ${now}  status ${sub.status} → ${set.status}`);
    if (APPLY) await subscriptions.updateOne({ _id: sub._id }, { $set: set });

    // New invoices since the last one we hold.
    const latest = await payments.find({ merchantId: sub.merchantId, provider: "stripe" }).sort({ paidAt: -1 }).limit(1).toArray();
    const since = latest[0]?.paidAt ? Math.floor(new Date(latest[0].paidAt).getTime() / 1000) + 1 : undefined;
    const invs = await stripe.invoices.list({ subscription: s.id, limit: 20, ...(since ? { created: { gte: since } } : {}) });
    for (const inv of invs.data) {
      if (!(inv.status === "paid" && inv.amount_paid > 0)) continue;
      const line = inv.lines.data[0];
      console.log(`    + invoice ${inv.id} ${inv.currency.toUpperCase()} ${(inv.amount_paid / 100).toFixed(2)} ${new Date(inv.created * 1000).toISOString().slice(0, 10)}`);
      if (!APPLY) continue;
      await payments.updateOne(
        { stripeInvoiceId: inv.id },
        {
          $set: {
            merchantId: sub.merchantId,
            subscriptionId: sub._id,
            provider: "stripe",
            stripeInvoiceId: inv.id,
            stripeChargeId: ((inv as any).charge as string | undefined) ?? null,
            hostedUrl: inv.hosted_invoice_url ?? null,
            paidAt: new Date(inv.created * 1000),
            kind: "renewal",
            status: "paid",
            amountCents: inv.amount_paid,
            currency: inv.currency,
            description: line?.description ?? `StampyStamp ${sub.planLabel}`,
            periodStart: line?.period ? new Date(line.period.start * 1000) : null,
            periodEnd: line?.period ? new Date(line.period.end * 1000) : null,
            failureReason: null,
            refundedCents: 0,
          },
          $setOnInsert: { createdAt: new Date(inv.created * 1000) },
        },
        { upsert: true }
      );
    }
  }
  if (!APPLY) console.log("\nDry run — re-run with --apply to write.");
  await mongoose.disconnect();
}
main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
