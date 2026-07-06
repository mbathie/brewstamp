import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentShopContext, type MembershipRole } from "@/lib/shop-context";

// The platform admin. Overridable via env; falls back to the founder's email so
// existing deployments keep working. Was hardcoded + duplicated in 4 routes.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mbathie@gmail.com";

/** True when the signed-in user is the platform admin. */
export async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.email === ADMIN_EMAIL;
}

export interface Merchant {
  userId: string;
  // Every shop the user is a member of — scope resource access to this set so a
  // multi-shop owner can act on any of their shops, but not anyone else's.
  shopIds: string[];
  currentShopId: string | null;
  memberships: { shopId: string; role: MembershipRole }[];
}

/**
 * Resolve the signed-in merchant for an API route. Returns null when there's no
 * authenticated user with at least one shop membership — callers respond 401.
 * Use `merchant.shopIds` to scope any resource lookup (StampCard, StampRequest,
 * …) so a caller can only touch data belonging to their own shops.
 */
export async function requireMerchant(): Promise<Merchant | null> {
  const ctx = await getCurrentShopContext();
  if (!ctx || ctx.memberships.length === 0) return null;
  return {
    userId: ctx.userId,
    shopIds: ctx.memberships.map((m) => m.shopId),
    currentShopId: ctx.shopId,
    memberships: ctx.memberships.map((m) => ({
      shopId: m.shopId,
      role: m.role,
    })),
  };
}

/** Standard 401 response for unauthenticated API callers. */
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
