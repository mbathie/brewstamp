// Billing for legacy StampyStamp merchants, run by Brewstamp's cron. Same
// engine as paypal-billing (vault charge, idempotency, [0,3,7]-day dunning)
// over stampy's own `billing_subscriptions` / `billing_payments` collections,
// with StampyStamp-branded emails. Stampy has no billing UI: card updates go
// through the same token-gated page as the migration (/billing/migrate/<t>).

import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import {
  ensureStampyBillingIndexes,
  stampyCollections,
  type StampySubscription,
} from "./stampy-db";
import { addInterval, MAX_ATTEMPTS, RETRY_OFFSETS_DAYS } from "./paypal-billing";
import { captureOf, chargeVault, PayPalError, type PayPalOrder } from "./paypal";
import {
  sendPaymentFailedEmail,
  sendPaymentReceiptEmail,
  sendSubscriptionDowngradedEmail,
} from "./email";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app";

export const newToken = () => randomBytes(32).toString("hex");

export async function stampySubForToken(token: string): Promise<StampySubscription | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const { subscriptions } = await stampyCollections();
  return subscriptions.findOne({ migrationToken: token });
}

// The migration / update-card page saved a card: point the sub at the new
// vault token. First time (still on Stripe) this is the migration — price,
// currency and renewal date carry over and the Stripe sub is set to cancel
// at period end. Later uses are plain card replacements.
export async function completeStampyMigration(opts: {
  sub: StampySubscription;
  vaultId: string;
  customerId?: string;
  card: { brand?: string; last4?: string; expiry?: string };
  stripe: Pick<Stripe, "subscriptions">;
}) {
  const { subscriptions } = await stampyCollections();
  const now = new Date();
  const wasStripe = opts.sub.provider !== "paypal";
  await subscriptions.updateOne(
    { _id: opts.sub._id },
    {
      $set: {
        provider: "paypal",
        paypalVaultId: opts.vaultId,
        ...(opts.customerId ? { paypalCustomerId: opts.customerId } : {}),
        card: opts.card,
        status: opts.sub.status === "canceled" ? "canceled" : "active",
        failedAttempts: 0,
        nextAttemptAt: opts.sub.status === "past_due" ? now : null,
        migrationToken: null,
        ...(wasStripe ? { migratedAt: now } : {}),
        updatedAt: now,
      },
    }
  );
  if (wasStripe && opts.sub.stripeSubscriptionId) {
    try {
      await opts.stripe.subscriptions.update(opts.sub.stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: { migrated_to: "paypal", migrated_at: now.toISOString() },
      });
    } catch (err) {
      console.error(`[Stampy billing] could not set Stripe sub ${opts.sub.stripeSubscriptionId} to cancel at period end:`, err);
    }
  }
  return subscriptions.findOne({ _id: opts.sub._id });
}

export interface StampyRunSummary {
  due: number;
  renewed: number;
  failed: number;
  canceled: number;
  skipped: number;
}

export async function runStampyRenewals(now = new Date()): Promise<StampyRunSummary> {
  await ensureStampyBillingIndexes();
  const { subscriptions, payments } = await stampyCollections();
  const summary: StampyRunSummary = { due: 0, renewed: 0, failed: 0, canceled: 0, skipped: 0 };

  const due = await subscriptions
    .find({ provider: "paypal", status: { $in: ["active", "past_due"] }, currentPeriodEnd: { $lte: now } })
    .toArray();

  for (const sub of due) {
    summary.due++;
    const tag = `${sub.merchantName} <${sub.merchantEmail}>`;
    try {
      if (sub.status === "past_due" && sub.nextAttemptAt && sub.nextAttemptAt > now) {
        summary.skipped++;
        continue;
      }
      if (sub.cancelAtPeriodEnd) {
        await subscriptions.updateOne({ _id: sub._id }, { $set: { status: "canceled", cancelAtPeriodEnd: false, updatedAt: now } });
        summary.canceled++;
        console.log(`[Stampy billing] ${tag}: canceled at period end`);
        continue;
      }

      const periodStart = sub.currentPeriodEnd as Date;
      const periodEnd = addInterval(periodStart, sub.interval);
      const attempt = (sub.failedAttempts || 0) + 1;
      const amount = sub.priceCents;
      const description = `StampyStamp ${sub.planLabel} (${sub.interval === "year" ? "annual" : "monthly"}) — ${sub.merchantName}`;

      let order: PayPalOrder | null = null;
      let failure: string | null = null;
      if (!sub.paypalVaultId) failure = "NO_SAVED_CARD";
      else {
        try {
          order = await chargeVault({
            vaultId: sub.paypalVaultId,
            amountCents: amount,
            currency: sub.currency,
            description,
            customId: `stampy:${sub.merchantId}:renewal`,
            requestId: `stampy-renewal-${sub._id}-${periodStart.getTime()}-${attempt}`,
          });
          const cap = captureOf(order);
          if (!cap || cap.status !== "COMPLETED") failure = cap?.status || order.status || "NOT_COMPLETED";
        } catch (err) {
          failure = err instanceof PayPalError ? err.issue || err.message : (err as Error).message;
        }
      }

      if (!failure && order) {
        await subscriptions.updateOne(
          { _id: sub._id },
          { $set: { currentPeriodStart: periodStart, currentPeriodEnd: periodEnd, status: "active", failedAttempts: 0, nextAttemptAt: null, lastPaymentAt: now, updatedAt: now } }
        );
        await payments.insertOne({
          merchantId: sub.merchantId,
          subscriptionId: sub._id,
          provider: "paypal",
          orderId: order.id,
          captureId: captureOf(order)!.id,
          paidAt: now,
          kind: "renewal",
          status: "paid",
          amountCents: amount,
          currency: sub.currency,
          description: `${sub.planLabel} (${sub.interval}) renewal`,
          periodStart,
          periodEnd,
          refundedCents: 0,
          createdAt: now,
        });
        summary.renewed++;
        console.log(`[Stampy billing] ${tag}: renewed ${sub.currency.toUpperCase()} ${(amount / 100).toFixed(2)} → next ${periodEnd.toISOString().slice(0, 10)}`);
        await sendPaymentReceiptEmail({
          brand: "stampystamp",
          to: sub.merchantEmail,
          merchantName: sub.merchantName || "there",
          shopName: sub.merchantName,
          amount,
          currency: sub.currency,
          invoiceDate: now,
          periodEnd,
        }).catch((e) => console.error("[Stampy billing] receipt email failed:", e));
        continue;
      }

      // Declined.
      await payments.insertOne({
        merchantId: sub.merchantId,
        subscriptionId: sub._id,
        provider: "paypal",
        orderId: order?.id ?? null,
        paidAt: now,
        kind: "renewal",
        status: "failed",
        amountCents: amount,
        currency: sub.currency,
        description: `${sub.planLabel} (${sub.interval}) renewal — attempt ${attempt}`,
        periodStart,
        periodEnd,
        failureReason: failure,
        refundedCents: 0,
        createdAt: now,
      });

      if (attempt >= MAX_ATTEMPTS) {
        await subscriptions.updateOne({ _id: sub._id }, { $set: { status: "canceled", failedAttempts: attempt, nextAttemptAt: null, updatedAt: now } });
        summary.canceled++;
        console.log(`[Stampy billing] ${tag}: ${attempt} failed attempts (${failure}) — canceled`);
        await sendSubscriptionDowngradedEmail({
          brand: "stampystamp",
          to: sub.merchantEmail,
          merchantName: sub.merchantName || "there",
          shopName: sub.merchantName,
          daysOverdue: Math.floor((now.getTime() - periodStart.getTime()) / 86_400_000),
        }).catch((e) => console.error("[Stampy billing] downgrade email failed:", e));
        continue;
      }

      let nextAttemptAt = new Date(periodStart.getTime() + RETRY_OFFSETS_DAYS[attempt] * 86_400_000);
      if (nextAttemptAt <= now) nextAttemptAt = new Date(now.getTime() + 86_400_000);
      // Fresh one-time link so the owner can replace the card (stampy has no
      // billing page of its own).
      const token = newToken();
      await subscriptions.updateOne(
        { _id: sub._id },
        { $set: { status: "past_due", failedAttempts: attempt, nextAttemptAt, migrationToken: token, updatedAt: now } }
      );
      summary.failed++;
      console.log(`[Stampy billing] ${tag}: attempt ${attempt} failed (${failure}); next ${nextAttemptAt.toISOString().slice(0, 10)}`);
      await sendPaymentFailedEmail({
        brand: "stampystamp",
        to: sub.merchantEmail,
        merchantName: sub.merchantName || "there",
        shopName: sub.merchantName,
        amountCents: amount,
        currency: sub.currency,
        nextAttemptAt,
        finalAttempt: attempt === MAX_ATTEMPTS - 1,
        updateUrl: `${APP_URL()}/billing/migrate/${token}`,
      }).catch((e) => console.error("[Stampy billing] payment-failed email failed:", e));
    } catch (err) {
      console.error(`[Stampy billing] Failed to process ${tag}:`, err);
      summary.skipped++;
    }
  }

  console.log(
    `[Stampy billing] Renewal run complete. Due: ${summary.due}, renewed: ${summary.renewed}, failed: ${summary.failed}, canceled: ${summary.canceled}, skipped: ${summary.skipped}.`
  );
  return summary;
}
