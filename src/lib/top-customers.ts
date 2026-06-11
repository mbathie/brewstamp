import { Types } from "mongoose";
import { StampCard } from "@/models";

// A "top customer" is someone the shop owner should recognize — they earn
// more stamps than peers AND have stuck around long enough to actually
// redeem at least one reward. The redemption gate filters out one-time
// curious scanners who racked up stamps but never came back to claim.
export const TOP_CUSTOMER_LIMIT = 10;

export interface TopCustomerCard {
  customer: Types.ObjectId;
  totalEarned: number;
  freeRedeemed: number;
  stamps: number;
  updatedAt: Date;
}

export async function getTopCustomerCards(
  shopId: string | Types.ObjectId,
  limit: number = TOP_CUSTOMER_LIMIT,
  // Perk shops earn no stamps, so rank by free coffees redeemed instead of
  // stamps earned, and drop the "earned a stamp" gate.
  perkMode = false,
): Promise<TopCustomerCard[]> {
  const filter = perkMode
    ? { shop: shopId, freeRedeemed: { $gte: 1 } }
    : { shop: shopId, totalEarned: { $gt: 0 }, freeRedeemed: { $gte: 1 } };
  const sort: Record<string, 1 | -1> = perkMode
    ? { freeRedeemed: -1, updatedAt: -1 }
    : { totalEarned: -1, freeRedeemed: -1 };
  return StampCard.find(filter)
    .sort(sort)
    .limit(limit)
    .select("customer totalEarned freeRedeemed stamps updatedAt")
    .lean<TopCustomerCard[]>();
}

export async function isTopCustomer(
  shopId: string | Types.ObjectId,
  customerId: string,
  limit: number = TOP_CUSTOMER_LIMIT,
  perkMode = false,
): Promise<boolean> {
  const cards = await getTopCustomerCards(shopId, limit, perkMode);
  return cards.some((c) => c.customer.toString() === customerId.toString());
}
