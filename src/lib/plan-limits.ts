// Resolves the user's "effective plan" from their subscriptions and
// reports their current shop-limit headroom. Server-only because it
// touches Mongoose models.

import { connectDB } from "./mongoose";
import { Shop, ShopMembership, Subscription } from "@/models";
import {
  PLANS,
  getPlanBySlug,
  getPlanByPriceId,
  getPlanRank,
  type PlanConfig,
  type PlanSlug,
} from "./plans";

export interface UserPlanLimits {
  planSlug: PlanSlug;
  plan: PlanConfig;
  ownedShopCount: number;
  shopLimit: number;
  atShopLimit: boolean;
}

// A user holds ONE effective plan across all their shops, derived as the
// highest-tier active subscription on any shop they own. Free is the
// fallback when no active sub exists.
//
// Phase-3 work might move to a user-level Subscription, at which point
// this helper collapses to a single Subscription lookup — for now we
// roll up across per-shop subs.
export async function getUserPlanLimits(
  userId: string
): Promise<UserPlanLimits> {
  await connectDB();

  const ownedMemberships = await ShopMembership.find({
    user: userId,
    role: "owner",
  });
  const ownedShopIds = ownedMemberships.map((m) => m.shop);

  const subs = await Subscription.find({
    shop: { $in: ownedShopIds },
    status: "active",
  });

  let highest: PlanSlug = "free";
  for (const sub of subs) {
    let slug: PlanSlug = "free";
    if (sub.stripePriceId) {
      const p = getPlanByPriceId(sub.stripePriceId);
      if (p) slug = p.slug;
    }
    if (slug === "free" && sub.planLabel) {
      const fallback = String(sub.planLabel).toLowerCase();
      if (PLANS.some((p) => p.slug === fallback)) {
        slug = fallback as PlanSlug;
      }
    }
    if (getPlanRank(slug) > getPlanRank(highest)) {
      highest = slug;
    }
  }

  const plan = getPlanBySlug(highest)!;
  return {
    planSlug: highest,
    plan,
    ownedShopCount: ownedMemberships.length,
    shopLimit: plan.shopLimit,
    atShopLimit: ownedMemberships.length >= plan.shopLimit,
  };
}

// The plan that applies to a given SHOP — i.e. the shop owner's effective
// plan. This is the canonical resolver for per-shop feature gates (team
// logins, CSV export) so a paid plan covers every shop the owner has, not
// just the one carrying the Stripe subscription. A staff/manager viewing the
// shop sees the same plan the owner pays for, rather than their own.
//
// Falls back to Free when the shop has no owner (shouldn't happen post
// migration) or the shop can't be found.
export async function getShopPlanLimits(
  shopId: string
): Promise<UserPlanLimits> {
  await connectDB();
  const shop = await Shop.findById(shopId).select("owner");
  if (!shop?.owner) {
    const free = getPlanBySlug("free")!;
    return {
      planSlug: "free",
      plan: free,
      ownedShopCount: 0,
      shopLimit: free.shopLimit,
      atShopLimit: true,
    };
  }
  return getUserPlanLimits(shop.owner.toString());
}
