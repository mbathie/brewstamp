// Subscription engine for PayPal-billed shops. PayPal only holds the card;
// the schedule, proration, dunning and receipts live here. Used by the
// /api/billing/paypal/* routes (customer actions) and billing-cron
// (renewals).
//
// Money model: every plan is priced in USD (see @/lib/plans). Amounts are
// cents. A period is one calendar month or year from its start.

import { connectDB } from "./mongoose";
import { Payment, Shop, Subscription, User } from "../models";
import {
  getPlanBySlug,
  getPlanRank,
  planPriceCents,
  type BillingInterval,
  type PlanSlug,
} from "./plans";
import {
  captureOf,
  cardSummaryOf,
  chargeVault,
  PayPalError,
  type PayPalOrder,
} from "./paypal";
import {
  sendPaymentFailedEmail,
  sendPaymentReceiptEmail,
  sendSubscriptionDowngradedEmail,
} from "./email";

export const CURRENCY = "usd";

// Dunning: days after the due date on which we retry a declined renewal.
// Attempt 1 is the due date itself; after the last one fails the shop drops
// to Free.
export const RETRY_OFFSETS_DAYS = [0, 3, 7];
export const MAX_ATTEMPTS = RETRY_OFFSETS_DAYS.length;

type PaidSlug = Exclude<PlanSlug, "free">;

export function addInterval(from: Date, interval: BillingInterval): Date {
  const d = new Date(from);
  if (interval === "year") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

export function priceFor(slug: PaidSlug, interval: BillingInterval): number {
  return planPriceCents(getPlanBySlug(slug)!, interval);
}

export function describe(slug: PaidSlug, interval: BillingInterval, shopName: string) {
  return `Brewstamp ${getPlanBySlug(slug)!.label} (${interval === "year" ? "annual" : "monthly"}) — ${shopName}`;
}

// Fraction of the current period still unused, 0..1.
export function remainingFraction(sub: { currentPeriodStart?: Date; currentPeriodEnd?: Date }, now = new Date()) {
  if (!sub.currentPeriodStart || !sub.currentPeriodEnd) return 0;
  const total = sub.currentPeriodEnd.getTime() - sub.currentPeriodStart.getTime();
  const left = sub.currentPeriodEnd.getTime() - now.getTime();
  if (total <= 0 || left <= 0) return 0;
  return Math.min(1, left / total);
}

// Is moving current → target an immediate (charge now) change or a deferred
// one (apply at renewal)? Higher tier, or monthly → annual, is immediate.
export function isImmediateChange(
  current: { slug: PaidSlug; interval: BillingInterval },
  target: { slug: PaidSlug; interval: BillingInterval }
): boolean {
  const rankDelta = getPlanRank(target.slug) - getPlanRank(current.slug);
  if (rankDelta > 0) return true;
  if (rankDelta < 0) return false;
  return current.interval === "month" && target.interval === "year";
}

async function ownerOf(shopId: unknown) {
  const shop = await Shop.findById(shopId);
  const owner = shop ? await User.findById(shop.owner) : null;
  return { shop, owner };
}

async function emailReceipt(sub: { shop: unknown; currentPeriodEnd?: Date }, amountCents: number, when: Date) {
  try {
    const { shop, owner } = await ownerOf(sub.shop);
    if (owner?.email && shop) {
      await sendPaymentReceiptEmail({
        to: owner.email,
        merchantName: owner.name || "there",
        shopName: shop.name,
        amount: amountCents,
        currency: CURRENCY,
        invoiceDate: when,
        periodEnd: sub.currentPeriodEnd || when,
      });
    }
  } catch (err) {
    console.error("[PayPal billing] receipt email failed:", err);
  }
}

// ── Starting a subscription (first charge captured by the billing page) ──

// Called after the SDK's onApprove → server capture. The capture response
// carries the vault id and card summary; we persist the subscription and the
// first Payment. Idempotent on order id so a double-submit can't create two.
export async function activateFromCapture(opts: {
  shopId: string;
  order: PayPalOrder;
  slug: PaidSlug;
  interval: BillingInterval;
  amountCents: number;
}) {
  await connectDB();
  const { order, slug, interval } = opts;
  const capture = captureOf(order);
  if (!capture || capture.status !== "COMPLETED") {
    throw new Error(`Capture not completed (order ${order.id}: ${capture?.status ?? order.status})`);
  }
  const vault = order.payment_source?.card?.attributes?.vault;
  if (!vault?.id) {
    // Money moved but the card didn't vault — refund path is manual; surface
    // loudly rather than creating a subscription we can never renew.
    throw new Error(`Order ${order.id} captured but no vault id returned`);
  }

  const existing = await Payment.findOne({ orderId: order.id });
  if (existing) return Subscription.findOne({ shop: opts.shopId });

  const now = new Date();
  const periodEnd = addInterval(now, interval);
  const card = cardSummaryOf(order);
  const plan = getPlanBySlug(slug)!;

  const sub = await Subscription.findOneAndUpdate(
    { shop: opts.shopId },
    {
      shop: opts.shopId,
      provider: "paypal",
      paypalVaultId: vault.id,
      paypalCustomerId: vault.customer?.id,
      card,
      planSlug: slug,
      interval,
      currency: CURRENCY,
      planLabel: plan.label,
      status: "active",
      cancelAtPeriodEnd: false,
      pendingPlanSlug: null,
      pendingInterval: null,
      creditCents: 0,
      failedAttempts: 0,
      nextAttemptAt: null,
      lastPaymentAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      // Clear Stripe linkage if this shop once billed there.
      stripeSubscriptionId: null,
      stripePriceId: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Payment.create({
    shop: opts.shopId,
    subscription: sub._id,
    orderId: order.id,
    captureId: capture.id,
    kind: "initial",
    status: "paid",
    amountCents: opts.amountCents,
    currency: CURRENCY,
    planSlug: slug,
    interval,
    description: `${plan.label} (${interval})`,
    periodStart: now,
    periodEnd,
  });

  await emailReceipt(sub, opts.amountCents, now);
  return sub;
}

// ── Plan changes ──────────────────────────────────────────────────────────

export type SwitchResult =
  | { kind: "immediate"; chargedCents: number; creditCents: number }
  | { kind: "scheduled"; effectiveAt: Date }
  | { kind: "cancel_scheduled"; effectiveAt: Date }
  | { kind: "resumed" };

export async function switchPaypalPlan(
  subId: unknown,
  target: { slug: PlanSlug; interval: BillingInterval },
  shopName: string
): Promise<SwitchResult> {
  await connectDB();
  const sub = await Subscription.findById(subId);
  if (!sub || sub.provider !== "paypal") throw new Error("Not a PayPal subscription");
  if (!sub.planSlug || !sub.interval) throw new Error("Subscription has no plan");
  const current = { slug: sub.planSlug as PaidSlug, interval: sub.interval as BillingInterval };

  // Cancel → Free at period end.
  if (target.slug === "free") {
    sub.cancelAtPeriodEnd = true;
    sub.pendingPlanSlug = undefined;
    sub.pendingInterval = undefined;
    await sub.save();
    return { kind: "cancel_scheduled", effectiveAt: sub.currentPeriodEnd };
  }
  const tgt = { slug: target.slug as PaidSlug, interval: target.interval };

  // Same plan: clear a pending cancel/downgrade ("resume").
  if (tgt.slug === current.slug && tgt.interval === current.interval) {
    sub.cancelAtPeriodEnd = false;
    sub.pendingPlanSlug = undefined;
    sub.pendingInterval = undefined;
    await sub.save();
    return { kind: "resumed" };
  }

  if (!isImmediateChange(current, tgt)) {
    // Downgrade: keep what they paid for, switch at renewal.
    sub.pendingPlanSlug = tgt.slug;
    sub.pendingInterval = tgt.interval;
    sub.cancelAtPeriodEnd = false;
    await sub.save();
    return { kind: "scheduled", effectiveAt: sub.currentPeriodEnd };
  }

  // Upgrade: credit the unused part of the current period against the new
  // price, charge the difference now, and start a fresh period today.
  if (!sub.paypalVaultId) throw new Error("No saved card on this subscription");
  const now = new Date();
  const credit = Math.round(priceFor(current.slug, current.interval) * remainingFraction(sub, now)) + (sub.creditCents || 0);
  const newPrice = priceFor(tgt.slug, tgt.interval);
  const charge = Math.max(0, newPrice - credit);
  const carry = Math.max(0, credit - newPrice);

  let order: PayPalOrder | null = null;
  if (charge > 0) {
    order = await chargeVault({
      vaultId: sub.paypalVaultId,
      amountCents: charge,
      currency: CURRENCY,
      description: describe(tgt.slug, tgt.interval, shopName),
      customId: `${sub.shop}:${tgt.slug}:${tgt.interval}:upgrade`,
      requestId: `upgrade-${sub._id}-${now.getTime()}`,
    });
    const cap = captureOf(order);
    if (!cap || cap.status !== "COMPLETED") {
      throw new PayPalError("Upgrade charge was not completed", 402, order);
    }
  }

  const periodEnd = addInterval(now, tgt.interval);
  const plan = getPlanBySlug(tgt.slug)!;
  sub.planSlug = tgt.slug;
  sub.interval = tgt.interval;
  sub.planLabel = plan.label;
  sub.pendingPlanSlug = undefined;
  sub.pendingInterval = undefined;
  sub.cancelAtPeriodEnd = false;
  sub.creditCents = carry;
  sub.currentPeriodStart = now;
  sub.currentPeriodEnd = periodEnd;
  sub.status = "active";
  sub.failedAttempts = 0;
  sub.nextAttemptAt = undefined;
  if (order) sub.lastPaymentAt = now;
  await sub.save();

  if (order) {
    const cap = captureOf(order)!;
    await Payment.create({
      shop: sub.shop,
      subscription: sub._id,
      orderId: order.id,
      captureId: cap.id,
      kind: "upgrade",
      status: "paid",
      amountCents: charge,
      currency: CURRENCY,
      planSlug: tgt.slug,
      interval: tgt.interval,
      description: `Upgrade to ${plan.label} (${tgt.interval}) — ${(credit / 100).toFixed(2)} credit applied`,
      periodStart: now,
      periodEnd,
    });
    await emailReceipt(sub, charge, now);
  }
  return { kind: "immediate", chargedCents: charge, creditCents: carry };
}

// ── Renewals (cron) ───────────────────────────────────────────────────────

export interface RenewalRunSummary {
  due: number;
  renewed: number;
  failed: number;
  canceled: number;
  skipped: number;
}

// Charge every PayPal subscription whose period has ended (or whose retry
// is due). Safe to run repeatedly: each attempt uses an idempotency key
// derived from the period it's paying for.
export async function runPaypalRenewals(now = new Date()): Promise<RenewalRunSummary> {
  await connectDB();
  const summary: RenewalRunSummary = { due: 0, renewed: 0, failed: 0, canceled: 0, skipped: 0 };

  const subs = await Subscription.find({
    provider: "paypal",
    status: { $in: ["active", "past_due"] },
    currentPeriodEnd: { $lte: now },
  });

  for (const sub of subs) {
    summary.due++;
    try {
      // A retry that isn't due yet.
      if (sub.status === "past_due" && sub.nextAttemptAt && sub.nextAttemptAt > now) {
        summary.skipped++;
        continue;
      }

      const shop = await Shop.findById(sub.shop);
      const shopName = shop?.name ?? "your shop";

      // Scheduled cancel → Free.
      if (sub.cancelAtPeriodEnd) {
        sub.status = "canceled";
        sub.cancelAtPeriodEnd = false;
        await sub.save();
        summary.canceled++;
        console.log(`[PayPal billing] ${shopName}: canceled at period end`);
        continue;
      }

      // Apply a scheduled downgrade before pricing this renewal.
      if (sub.pendingPlanSlug) {
        sub.planSlug = sub.pendingPlanSlug;
        sub.interval = sub.pendingInterval || sub.interval;
        sub.planLabel = getPlanBySlug(sub.planSlug)!.label;
        sub.pendingPlanSlug = undefined;
        sub.pendingInterval = undefined;
      }
      const slug = sub.planSlug as PaidSlug;
      const interval = (sub.interval || "month") as BillingInterval;
      const price = priceFor(slug, interval);
      const amount = Math.max(0, price - (sub.creditCents || 0));
      const periodStart = sub.currentPeriodEnd as Date;
      const periodEnd = addInterval(periodStart, interval);
      const attempt = (sub.failedAttempts || 0) + 1;

      let order: PayPalOrder | null = null;
      let failure: string | null = null;
      if (amount === 0) {
        // Fully covered by credit — no charge, just roll the period.
      } else if (!sub.paypalVaultId) {
        failure = "NO_SAVED_CARD";
      } else {
        try {
          order = await chargeVault({
            vaultId: sub.paypalVaultId,
            amountCents: amount,
            currency: CURRENCY,
            description: describe(slug, interval, shopName),
            customId: `${sub.shop}:${slug}:${interval}:renewal`,
            requestId: `renewal-${sub._id}-${periodStart.getTime()}-${attempt}`,
          });
          const cap = captureOf(order);
          if (!cap || cap.status !== "COMPLETED") failure = cap?.status || order.status || "NOT_COMPLETED";
        } catch (err) {
          failure = err instanceof PayPalError ? err.issue || err.message : (err as Error).message;
        }
      }

      if (!failure) {
        sub.creditCents = Math.max(0, (sub.creditCents || 0) - price);
        sub.currentPeriodStart = periodStart;
        sub.currentPeriodEnd = periodEnd;
        sub.status = "active";
        sub.failedAttempts = 0;
        sub.nextAttemptAt = undefined;
        if (order) sub.lastPaymentAt = now;
        await sub.save();
        if (order) {
          await Payment.create({
            shop: sub.shop,
            subscription: sub._id,
            orderId: order.id,
            captureId: captureOf(order)!.id,
            kind: "renewal",
            status: "paid",
            amountCents: amount,
            currency: CURRENCY,
            planSlug: slug,
            interval,
            description: `${getPlanBySlug(slug)!.label} (${interval}) renewal`,
            periodStart,
            periodEnd,
          });
          await emailReceipt(sub, amount, now);
        }
        summary.renewed++;
        console.log(`[PayPal billing] ${shopName}: renewed ${slug}/${interval} $${(amount / 100).toFixed(2)} → next ${periodEnd.toISOString().slice(0, 10)}`);
        continue;
      }

      // Declined. Record it, schedule the next attempt or give up.
      await Payment.create({
        shop: sub.shop,
        subscription: sub._id,
        orderId: order?.id,
        kind: "renewal",
        status: "failed",
        amountCents: amount,
        currency: CURRENCY,
        planSlug: slug,
        interval,
        description: `${getPlanBySlug(slug)!.label} (${interval}) renewal — attempt ${attempt}`,
        periodStart,
        periodEnd,
        failureReason: failure,
      });
      sub.failedAttempts = attempt;
      sub.status = "past_due";
      const owner = shop ? await User.findById(shop.owner) : null;

      if (attempt >= MAX_ATTEMPTS) {
        sub.status = "canceled";
        sub.nextAttemptAt = undefined;
        await sub.save();
        summary.canceled++;
        console.log(`[PayPal billing] ${shopName}: ${attempt} failed attempts (${failure}) — downgraded to Free`);
        if (owner?.email && shop) {
          try {
            await sendSubscriptionDowngradedEmail({
              to: owner.email,
              merchantName: owner.name || "there",
              shopName: shop.name,
              daysOverdue: Math.floor((now.getTime() - periodStart.getTime()) / 86_400_000),
            });
          } catch (e) {
            console.error("[PayPal billing] downgrade email failed:", e);
          }
        }
        continue;
      }

      const nextOffset = RETRY_OFFSETS_DAYS[attempt]; // days after the due date
      sub.nextAttemptAt = new Date(periodStart.getTime() + nextOffset * 86_400_000);
      // If we're already past that (cron was down), retry on the next run.
      if (sub.nextAttemptAt <= now) sub.nextAttemptAt = new Date(now.getTime() + 86_400_000);
      await sub.save();
      summary.failed++;
      console.log(`[PayPal billing] ${shopName}: attempt ${attempt} failed (${failure}); next ${sub.nextAttemptAt.toISOString().slice(0, 10)}`);
      if (owner?.email && shop) {
        try {
          await sendPaymentFailedEmail({
            to: owner.email,
            merchantName: owner.name || "there",
            shopName: shop.name,
            amountCents: amount,
            currency: CURRENCY,
            nextAttemptAt: sub.nextAttemptAt,
            finalAttempt: attempt === MAX_ATTEMPTS - 1,
          });
        } catch (e) {
          console.error("[PayPal billing] payment-failed email failed:", e);
        }
      }
    } catch (err) {
      console.error(`[PayPal billing] Failed to process subscription ${sub._id}:`, err);
      summary.skipped++;
    }
  }

  console.log(
    `[PayPal billing] Renewal run complete. Due: ${summary.due}, renewed: ${summary.renewed}, failed: ${summary.failed}, canceled: ${summary.canceled}, skipped: ${summary.skipped}.`
  );
  return summary;
}
