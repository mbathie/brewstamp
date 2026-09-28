// The one billing message a shop's dashboard shows at the top, if any. Server
// only. Covers every state where the owner has to act, most urgent first:
//
//   payment_failed  renewal failed and is being retried (plan still works)
//   ended_capped    plan ended and the shop is over the Free cap — stamping paused
//   cap_reached     never paid, used the whole Free allowance — stamping paused
//   ending          plan set to cancel at period end
//   save_card       Stripe-billed plan that still needs a card saved with PayPal
//   ended           plan ended in the last 30 days (shop is under the cap)
//
// Actions point at /dashboard/billing, where "Save card" / "Keep plan" open the
// right card form for the subscription's provider.

import { Subscription } from "@/models";
import { getPlanBySlug, resolveSub } from "@/lib/plans";
import { billingProvider } from "@/lib/paypal";

export type BillingNoticeKind =
  | "payment_failed"
  | "ended_capped"
  | "cap_reached"
  | "ending"
  | "save_card"
  | "ended";

export interface BillingNotice {
  kind: BillingNoticeKind;
  tone: "danger" | "warning";
  title: string;
  body: string;
  action: { label: string; href: string } | null;
}

const FREE_LIMIT = getPlanBySlug("free")!.stampLimit as number;
const DAY_MS = 86_400_000;

const fmt = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : null;

export async function getBillingNotice(opts: {
  shopId: unknown;
  /** Stamps earned across the shop's cards (what the Free cap counts). */
  totalStamps: number;
  /** Owner's plan covers this shop (own sub, or a paid sub on another shop). */
  hasPaidPlan: boolean;
  /** Only owners can fix billing; staff get the message without the button. */
  canManageBilling: boolean;
}): Promise<BillingNotice | null> {
  const sub: any = await Subscription.findOne({ shop: opts.shopId })
    .select(
      "status provider cancelAtPeriodEnd currentPeriodEnd nextAttemptAt updatedAt migratedAt migrationToken stripePriceId planLabel planSlug interval priceCents card",
    )
    .lean();

  const label = sub ? resolveSub(sub).label : "Pro";
  const overCap = opts.totalStamps >= FREE_LIMIT;
  // Stripe-billed plans move to a card saved with PayPal — only offered when
  // PayPal card billing is switched on.
  const paypalOn = billingProvider() === "paypal" && !!process.env.PAYPAL_CLIENT_ID;
  const needsPaypalCard =
    paypalOn && !!sub && sub.provider !== "paypal" && !sub.migratedAt && ["active", "past_due"].includes(sub.status);
  const billing = (actionLabel: string) =>
    opts.canManageBilling ? { label: actionLabel, href: "/dashboard/billing" } : null;
  const staffHint = opts.canManageBilling ? "" : " Ask the shop owner to sort out billing.";

  const make = (n: Omit<BillingNotice, "body"> & { body: string }): BillingNotice => ({
    ...n,
    body: n.body + staffHint,
  });

  if (sub?.status === "past_due") {
    const retry = sub.provider === "paypal" && sub.nextAttemptAt ? ` We'll try again on ${fmt(sub.nextAttemptAt)}.` : "";
    const ending = sub.cancelAtPeriodEnd ? ` Your plan is also set to end on ${fmt(sub.currentPeriodEnd)}.` : "";
    return make({
      kind: "payment_failed",
      tone: "danger",
      title: `Your ${label} payment didn't go through`,
      body: `Update your card to keep ${label}. Stamping keeps working while we retry.${retry}${ending}`,
      action: billing("Update card"),
    });
  }

  if (!opts.hasPaidPlan) {
    const ended = sub && ["canceled", "unpaid"].includes(sub.status) ? sub : null;
    const endedAt = ended ? ended.currentPeriodEnd ?? ended.updatedAt : null;
    if (ended && overCap) {
      return make({
        kind: "ended_capped",
        tone: "danger",
        title: `Your ${label} plan has ended — stamping is paused`,
        body: `You're back on Free, and this shop has used ${opts.totalStamps.toLocaleString()} stamps against the ${FREE_LIMIT}-stamp Free limit. Choose a plan to keep approving stamps.`,
        action: billing("Choose a plan"),
      });
    }
    if (!ended && overCap) {
      return make({
        kind: "cap_reached",
        tone: "danger",
        title: `You've used all ${FREE_LIMIT} free stamps`,
        body: "Stamping is paused until you pick a plan. Your customers' cards and stamps are safe.",
        action: billing("Choose a plan"),
      });
    }
    if (ended && endedAt && Date.now() - new Date(endedAt).getTime() < 30 * DAY_MS) {
      return make({
        kind: "ended",
        tone: "warning",
        title: `Your ${label} plan ended on ${fmt(endedAt)}`,
        body: `You're on Free now: ${opts.totalStamps} of ${FREE_LIMIT} stamps used. Stamping pauses at ${FREE_LIMIT}.`,
        action: billing("Choose a plan"),
      });
    }
    return null;
  }

  if (sub?.cancelAtPeriodEnd && sub.status === "active") {
    const after = overCap
      ? ` After that this shop moves to Free, which is capped at ${FREE_LIMIT} stamps, so stamping will pause.`
      : ` After that this shop moves to Free (${opts.totalStamps} of ${FREE_LIMIT} stamps used).`;
    return make({
      kind: "ending",
      tone: "warning",
      title: `Your ${label} plan ends on ${fmt(sub.currentPeriodEnd)}`,
      body: `${after.trim()}${needsPaypalCard ? " Save a card to keep your plan — nothing is charged today." : ""}`,
      action: billing(needsPaypalCard ? "Save card" : `Keep ${label}`),
    });
  }

  if (needsPaypalCard) {
    return make({
      kind: "save_card",
      tone: "warning",
      title: "Action needed: save your card",
      body: `We've moved card payments to PayPal. Save your card before ${label} renews on ${fmt(sub.currentPeriodEnd)} so it continues without interruption. Nothing is charged today.`,
      action: billing("Save card"),
    });
  }

  return null;
}
