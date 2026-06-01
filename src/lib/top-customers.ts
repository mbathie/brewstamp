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
  limit: number = TOP_CUSTOMER_LIMIT
): Promise<TopCustomerCard[]> {
  return StampCard.find({
    shop: shopId,
    totalEarned: { $gt: 0 },
    freeRedeemed: { $gte: 1 },
  })
    .sort({ totalEarned: -1, freeRedeemed: -1 })
    .limit(limit)
    .select("customer totalEarned freeRedeemed stamps updatedAt")
    .lean<TopCustomerCard[]>();
}

export async function isTopCustomer(
  shopId: string | Types.ObjectId,
  customerId: string,
  limit: number = TOP_CUSTOMER_LIMIT
): Promise<boolean> {
  const cards = await getTopCustomerCards(shopId, limit);
  return cards.some((c) => c.customer.toString() === customerId.toString());
}
