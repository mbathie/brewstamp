/**
 * Stripe → PayPal customer migration: mint one-time links and email paying
 * customers asking them to re-enter their card (no PAN export needed).
 *
 *   npx tsx scripts/stripe-to-paypal-migration.ts --list
 *       Active Stripe-billed subs with plan, price, renewal date, and
 *       whether they've been emailed / migrated.
 *
 *   npx tsx scripts/stripe-to-paypal-migration.ts --send [--only a@b.com] [--deadline 2026-10-15]
 *       Mint a token for each un-migrated Stripe sub (keeps an existing one)
 *       and email the owner. Idempotent: subs already emailed are skipped
 *       unless --resend. Add --dry-run to print links without sending.
 *
 *   npx tsx scripts/stripe-to-paypal-migration.ts --sample you@example.com [--for owner@shop.com]
 *       Send ONE example email to `you`, built from a real subscription (the
 *       first Stripe sub, or --for's). The link works, so it migrates that
 *       sub if used — point --for at a test shop.
 *
 *   Add --stampy to any mode to work on legacy StampyStamp merchants instead
 *   (stampy db `billing_subscriptions`, StampyStamp-branded email).
 *
 * Env: MONGODB_URI (read-write), NEXT_PUBLIC_APP_URL for the link host, and
 * the EMAIL_* SMTP vars. Requires the backfill script to have run first so
 * priceCents/currency are on each subscription.
 */
import "../src/lib/load-env";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { Shop, Subscription, User } from "../src/models";
import { resolveSub } from "../src/lib/plans";
import { stripeAmount } from "../src/lib/paypal-billing";
import { sendBillingMigrationEmail } from "../src/lib/email";
import { stampyCollections } from "../src/lib/stampy-db";

const argv = process.argv.slice(2);
const flag = (f: string) => argv.includes(f);
const opt = (f: string) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const STAMPY = flag("--stampy");

// Legacy StampyStamp merchants, shaped like the Brewstamp candidates so the
// rest of the script doesn't care which product a row came from.
async function stampyCandidates() {
  const { subscriptions } = await stampyCollections();
  const subs = await subscriptions.find({ provider: { $ne: "paypal" }, status: { $in: ["active", "past_due"] } }).toArray();
  return subs.map((s) => ({
    stampy: true as const,
    sub: {
      _id: s._id,
      priceCents: s.priceCents,
      currency: s.currency,
      interval: s.interval,
      planLabel: s.planLabel,
      currentPeriodEnd: s.currentPeriodEnd,
      migrationToken: s.migrationToken,
      migrationEmailedAt: s.migrationEmailedAt,
      migratedAt: s.migratedAt,
    },
    shop: { name: s.merchantName },
    owner: { email: s.merchantEmail, name: s.merchantName },
  }));
}

async function candidates(): Promise<any[]> {
  if (STAMPY) return stampyCandidates();
  const subs = await Subscription.find({
    provider: { $ne: "paypal" },
    status: { $in: ["active", "past_due"] },
    stripeSubscriptionId: { $exists: true, $not: /^sub_seed_/ },
  }).lean() as any[];
  const out = [];
  for (const s of subs) {
    const shop = await Shop.findById(s.shop).select("name owner").lean() as any;
    const owner = shop ? await User.findById(shop.owner).select("email name").lean() as any : null;
    if (!shop || !owner?.email) continue;
    out.push({ stampy: false as const, sub: s, shop, owner });
  }
  return out;
}

const tierOf = (c: any) => (c.stampy ? { label: `StampyStamp ${c.sub.planLabel}` } : resolveSub(c.sub));
const amountOf = (c: any) =>
  c.stampy ? { amountCents: c.sub.priceCents, currency: c.sub.currency, interval: c.sub.interval } : stripeAmount(c.sub);

function summarise(c: any) {
  const tier = tierOf(c);
  const { amountCents, currency, interval } = amountOf(c);
  const next = c.sub.currentPeriodEnd ? new Date(c.sub.currentPeriodEnd).toISOString().slice(0, 10) : "-";
  const state = c.sub.migratedAt ? "MIGRATED" : c.sub.migrationEmailedAt ? `emailed ${new Date(c.sub.migrationEmailedAt).toISOString().slice(0, 10)}` : "not emailed";
  return `${c.owner.email.padEnd(36)} ${c.shop.name.slice(0, 22).padEnd(22)} ${tier.label.padEnd(5)} ${currency.toUpperCase()} ${(amountCents / 100).toFixed(2).padStart(6)}/${interval === "year" ? "yr" : "mo"}  next ${next}  ${state}`;
}

async function sendFor(c: any, to: string, deadline: Date | null, dryRun: boolean) {
  if (!c.sub.migrationToken) {
    c.sub.migrationToken = randomBytes(32).toString("hex");
    if (c.stampy) {
      const { subscriptions } = await stampyCollections();
      await subscriptions.updateOne({ _id: c.sub._id }, { $set: { migrationToken: c.sub.migrationToken, updatedAt: new Date() } });
    } else {
      await Subscription.updateOne({ _id: c.sub._id }, { $set: { migrationToken: c.sub.migrationToken } });
    }
  }
  const tier = tierOf(c);
  const { amountCents, currency, interval } = amountOf(c);
  const link = `${APP_URL}/billing/migrate/${c.sub.migrationToken}`;
  if (dryRun) {
    console.log(`  would email ${to}: ${link}`);
    return true;
  }
  const r = await sendBillingMigrationEmail({
    brand: c.stampy ? "stampystamp" : "brewstamp",
    to,
    merchantName: c.owner.name || "there",
    shopName: c.shop.name,
    planLabel: tier.label,
    interval,
    amountCents,
    currency,
    nextChargeAt: c.sub.currentPeriodEnd ? new Date(c.sub.currentPeriodEnd) : null,
    link,
    deadline,
  });
  if (r.success) console.log(`  sent → ${to}  (${link})`);
  else console.log(`  FAILED → ${to}: ${(r as any).error}`);
  return r.success;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const list = await candidates();

  if (flag("--list") || argv.length === 0) {
    console.log(`${list.length} ${STAMPY ? "StampyStamp" : "Brewstamp"} Stripe-billed active subscription(s):\n`);
    for (const c of list) console.log(summarise(c));
    await mongoose.disconnect();
    return;
  }

  if (flag("--sample")) {
    const to = opt("--sample")!;
    const forEmail = opt("--for");
    const c = forEmail ? list.find((x) => x.owner.email.toLowerCase() === forEmail.toLowerCase()) : list[0];
    if (!c) throw new Error("no matching subscription for the sample");
    console.log(`Sample from: ${summarise(c)}`);
    await sendFor(c, to, null, flag("--dry-run"));
    await mongoose.disconnect();
    return;
  }

  if (flag("--send")) {
    const only = opt("--only")?.toLowerCase();
    const deadline = opt("--deadline") ? new Date(opt("--deadline")!) : null;
    const dry = flag("--dry-run");
    let n = 0;
    for (const c of list) {
      if (c.sub.migratedAt) continue;
      if (only && c.owner.email.toLowerCase() !== only) continue;
      if (c.sub.migrationEmailedAt && !flag("--resend")) { console.log(`  skip (already emailed) ${c.owner.email}`); continue; }
      console.log(summarise(c));
      const ok = await sendFor(c, c.owner.email, deadline, dry);
      if (ok && !dry) {
        if (c.stampy) {
          const { subscriptions } = await stampyCollections();
          await subscriptions.updateOne({ _id: c.sub._id }, { $set: { migrationEmailedAt: new Date(), updatedAt: new Date() } });
        } else {
          await Subscription.updateOne({ _id: c.sub._id }, { $set: { migrationEmailedAt: new Date() } });
        }
      }
      n++;
    }
    console.log(`\n${dry ? "would send" : "sent"} ${n} email(s)`);
    await mongoose.disconnect();
    return;
  }
  console.log("usage: --list | --send [--only email] [--deadline YYYY-MM-DD] [--resend] [--dry-run] | --sample you@x.com [--for owner@x.com]");
  await mongoose.disconnect();
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
