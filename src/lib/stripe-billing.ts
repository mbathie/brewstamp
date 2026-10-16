// Mirroring Stripe subscriptions and their paid invoices into our own
// Subscription and Payment docs. Shared by the webhook and the checkout return
// (/api/billing/checkout/confirm), so a plan shows as active the moment the
// owner lands back on the billing page, even if the webhook hasn't arrived
// yet. Every path is an idempotent upsert, so the order events arrive in
// doesn't matter.
import type Stripe from "stripe";
import { Subscription, Shop, User, Payment } from "@/models";
import { getIntervalByPriceId, getPlanByPriceId } from "@/lib/plans";
import { stripe as stripeMain, stripeLegacy, type StripeAccount } from "@/lib/stripe";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { recordReferralEarning } from "@/lib/referrals";

export function getPeriodDates(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return {
    currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
    currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
  };
}

/**
 * Activate the subscription a completed Checkout Session created. Returns the
 * shop id it activated, or null when the session isn't a finished
 * subscription checkout.
 */
export async function activateCheckoutSession(
  session: Stripe.Checkout.Session,
  account: StripeAccount
): Promise<string | null> {
  if (session.mode !== "subscription" || !session.subscription) return null;
  if (session.status !== "complete") return null;
  const shopId = session.metadata?.shopId;
  if (!shopId) return null;

  const stripe = account === "main" ? stripeMain : stripeLegacy;
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const sub = await stripe.subscriptions.retrieve(subId);
  const period = getPeriodDates(sub);
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  const price = sub.items.data[0]?.price;
  const priceId = price?.id;
  const plan = priceId ? getPlanByPriceId(priceId) : undefined;

  // One subscription doc per shop: a new checkout replaces whatever was
  // there (an ended PayPal or legacy-Stripe plan). Set provider and clear
  // the PayPal-only fields explicitly — a doc left on provider "paypal"
  // would also be charged by the PayPal renewal cron.
  const existing = await Subscription.findOne({ shop: shopId }).select("provider status stripeSubscriptionId").lean<any>();
  if (
    existing?.provider === "paypal" &&
    ["active", "past_due"].includes(existing.status)
  ) {
    console.warn(`[Stripe] shop ${shopId} checked out on Stripe while its PayPal plan was ${existing.status}; the PayPal plan stops renewing`);
  }
  await Subscription.findOneAndUpdate(
    { shop: shopId },
    {
      $set: {
        shop: shopId,
        provider: "stripe",
        stripeAccount: account,
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        ...(plan ? { planLabel: plan.label, planSlug: plan.slug } : {}),
        interval: price?.recurring?.interval === "year" ? "year" : "month",
        ...(price?.unit_amount != null ? { priceCents: price.unit_amount } : {}),
        currency: price?.currency ?? "usd",
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        status: sub.status === "past_due" ? "past_due" : "active",
        creditCents: 0,
        failedAttempts: 0,
        ...period,
      },
      $unset: {
        paypalVaultId: 1,
        paypalCustomerId: 1,
        card: 1,
        pendingPlanSlug: 1,
        pendingInterval: 1,
        migrationToken: 1,
        migrationEmailedAt: 1,
        migratedAt: 1,
        migratedFromStripeSubscriptionId: 1,
        nextAttemptAt: 1,
        lastPaymentAt: 1,
      },
    },
    { upsert: true }
  );

  // Keep the shop's customer id for this account, so the next checkout
  // reuses it.
  if (customerId) {
    await Shop.findByIdAndUpdate(shopId, {
      [account === "main" ? "stripeMainCustomerId" : "stripeCustomerId"]: customerId,
    });
  }
  if (existing?.stripeSubscriptionId !== sub.id) {
    console.log(`[Stripe] ${account} subscription ${sub.id} active for shop ${shopId} (${plan?.slug ?? priceId})`);
  }

  // The first invoice is usually paid before this runs, and its invoice.paid
  // webhook can land before the Subscription doc above existed — in which
  // case it couldn't be tied to a shop. Record it here too.
  const invoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice?.id;
  if (invoiceId) {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    if (invoice.status === "paid") await recordPaidInvoice(invoice, sub);
  }
  return shopId;
}

/**
 * Record a paid invoice in our ledger (billing history and finance read from
 * here, not from Stripe) and roll the subscription's period. Upserts on the
 * invoice id — Stripe redelivers, and the checkout return records the first
 * invoice too — and only the call that creates the row emails the receipt and
 * books any referral commission. Returns false when the subscription isn't
 * ours (yet).
 */
export async function recordPaidInvoice(invoice: Stripe.Invoice, sub: Stripe.Subscription): Promise<boolean> {
  const period = getPeriodDates(sub);
  const localSub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: sub.id, provider: { $ne: "paypal" } },
    { status: "active", ...period },
    { returnDocument: "after" }
  );
  if (!localSub) return false;
  if (invoice.amount_paid <= 0) return true;

  const line = invoice.lines.data[0];
  const priceId = sub.items.data[0]?.price.id;
  const plan = priceId ? getPlanByPriceId(priceId) : undefined;
  const priorPaid = await Payment.countDocuments({ subscription: localSub._id, status: "paid", stripeInvoiceId: { $ne: invoice.id } });
  // The unique index on stripeInvoiceId settles a race between the webhook
  // and the checkout return: the loser gets a duplicate-key error.
  const res = await Payment.updateOne(
    { stripeInvoiceId: invoice.id },
    {
      $set: {
        shop: localSub.shop,
        subscription: localSub._id,
        provider: "stripe",
        stripeInvoiceId: invoice.id,
        stripeChargeId: ((invoice as any).charge as string | undefined) ?? undefined,
        hostedUrl: invoice.hosted_invoice_url ?? undefined,
        paidAt: new Date(invoice.created * 1000),
        kind: priorPaid === 0 ? "initial" : line && (line as any).proration ? "upgrade" : "renewal",
        status: "paid",
        amountCents: invoice.amount_paid,
        currency: invoice.currency,
        planSlug: plan?.slug,
        interval: priceId ? getIntervalByPriceId(priceId) : undefined,
        description: line?.description ?? plan?.label ?? "Brewstamp",
        periodStart: line?.period ? new Date(line.period.start * 1000) : undefined,
        periodEnd: line?.period ? new Date(line.period.end * 1000) : undefined,
      },
    },
    { upsert: true }
  ).catch((err) => {
    if ((err as { code?: number }).code === 11000) return null;
    throw err;
  });
  if (!res?.upsertedCount) return true; // already recorded by the other path

  const row = await Payment.findOne({ stripeInvoiceId: invoice.id }).select("_id").lean<any>();
  if (row) await recordReferralEarning(row._id).catch((e) => console.error("[Stripe] referral earning failed:", e));
  try {
    const shop = await Shop.findById(localSub.shop);
    const owner = shop ? await User.findById(shop.owner) : null;
    if (owner?.email && shop) {
      await sendPaymentReceiptEmail({
        to: owner.email,
        merchantName: owner.name || "there",
        shopName: shop.name,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        invoiceDate: new Date(invoice.created * 1000),
        periodEnd: period.currentPeriodEnd || new Date(),
      });
    }
  } catch (emailErr) {
    console.error("[Stripe] Failed to send receipt email:", emailErr);
  }
  return true;
}
