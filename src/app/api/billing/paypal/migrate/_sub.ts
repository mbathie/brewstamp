import { Subscription } from "@/models";
import { LIVE_SUB_STATUSES } from "@/lib/plans";

// The signed-in owner's Stripe-billed subscription that can move to a card
// saved with PayPal: still live (active, or past_due while Stripe retries) and
// not yet migrated. The logged-in counterpart of /api/billing/migrate/<token>,
// so an owner can do it from the billing page without the emailed link.
export async function migratableStripeSub(shopId: unknown) {
  return Subscription.findOne({
    shop: shopId,
    provider: { $ne: "paypal" },
    status: { $in: LIVE_SUB_STATUSES },
    migratedAt: null,
  });
}
