import cron from "node-cron";
import { connectDB } from "./mongoose";
import Subscription from "../models/Subscription";
import Shop from "../models/Shop";
import User from "../models/User";
import { stripe } from "./stripe";
import { sendSubscriptionDowngradedEmail } from "./email";

// How long a subscription may stay unpaid (past_due / unpaid) before we cancel
// it in Stripe and drop the shop back to the Free plan.
const GRACE_DAYS = 7;

export function startBillingCron() {
  // Daily at 9am AEDT — an hour after the drip run so they don't overlap.
  cron.schedule("0 9 * * *", () => runOverdueDowngrades(), {
    timezone: "Australia/Sydney",
  });
  console.log("[Billing] Cron scheduled: daily 9am AEDT");
}

// Cancel and downgrade any subscription that has been unpaid for >= GRACE_DAYS.
// Exported so it can be invoked manually (e.g. a one-off script) as well as
// from the daily schedule.
export async function runOverdueDowngrades() {
  await connectDB();
  const cutoffMs = Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000;

  // The webhook flips local status to past_due / unpaid when Stripe reports a
  // failed renewal, so these are our candidates. (active subs are never here.)
  const candidates = await Subscription.find({
    status: { $in: ["past_due", "unpaid"] },
  });

  let downgraded = 0;
  for (const sub of candidates) {
    try {
      // "Outstanding since" = the oldest still-open (finalized but unpaid)
      // invoice on the subscription. Fall back to the local period end if
      // Stripe returns none.
      let outstandingSinceMs: number | null = null;
      const open = await stripe.invoices.list({
        subscription: sub.stripeSubscriptionId,
        status: "open",
        limit: 100,
      });
      if (open.data.length > 0) {
        outstandingSinceMs = Math.min(...open.data.map((i) => i.created)) * 1000;
      } else if (sub.currentPeriodEnd) {
        outstandingSinceMs = new Date(sub.currentPeriodEnd).getTime();
      }

      // Can't age it (no open invoice and no period end) — likely recovered;
      // leave it for the webhook to reconcile.
      if (outstandingSinceMs === null) continue;
      if (outstandingSinceMs > cutoffMs) continue; // still within grace window

      // Cancel in Stripe (stops further dunning/retries), then mark the local
      // record canceled so getUserPlanLimits resolves the shop to Free. The
      // customer.subscription.deleted webhook will also set canceled — doing it
      // here makes the downgrade immediate and self-contained.
      try {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      } catch (err: unknown) {
        // Already gone in Stripe — fine, we still reconcile locally below.
        if ((err as { code?: string })?.code !== "resource_missing") throw err;
      }
      await Subscription.updateOne(
        { _id: sub._id },
        { status: "canceled", cancelAtPeriodEnd: false }
      );
      downgraded++;

      const daysOverdue = Math.floor(
        (Date.now() - outstandingSinceMs) / 86_400_000
      );
      console.log(
        `[Billing] Downgraded shop ${sub.shop} to Free — ${daysOverdue}d overdue (sub ${sub.stripeSubscriptionId}).`
      );

      // Notify the owner so paid features aren't cut silently.
      try {
        const shop = await Shop.findById(sub.shop);
        const owner = shop ? await User.findById(shop.owner) : null;
        if (owner?.email && shop) {
          await sendSubscriptionDowngradedEmail({
            to: owner.email,
            merchantName: owner.name || "there",
            shopName: shop.name,
            daysOverdue,
          });
        }
      } catch (emailErr) {
        console.error("[Billing] Failed to send downgrade email:", emailErr);
      }
    } catch (err) {
      console.error(
        `[Billing] Failed to process subscription ${sub.stripeSubscriptionId}:`,
        err
      );
    }
  }

  console.log(
    `[Billing] Overdue downgrade run complete. Candidates: ${candidates.length}, downgraded: ${downgraded}.`
  );
}
