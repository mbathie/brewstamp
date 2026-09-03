import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "./auth";
import { getImpersonationFor } from "./impersonation";
import { connectDB } from "./mongoose";
import { Shop, ShopMembership } from "@/models";

export const CURRENT_SHOP_COOKIE = "bs_current_shop";

export type MembershipRole = "owner" | "manager" | "staff";

export interface MembershipSummary {
  membershipId: string;
  shopId: string;
  shopName: string;
  shopCode: string;
  role: MembershipRole;
}

export interface CurrentShopContext {
  userId: string;
  /**
   * Set when the platform admin is viewing this dashboard as another user.
   * `userId` above is already the impersonated user — everything downstream
   * scopes to them without needing to know. This flag exists so the UI can say
   * so, and so writes can be refused.
   */
  impersonatedUserId?: string;
  memberships: MembershipSummary[];
  // 'single' = scoped to one shop; 'all' = aggregate; 'unset' = needs picker.
  mode: "single" | "all" | "unset";
  shopId: string | null;
  shop: any | null;
  // Convenient pre-loaded shop docs for aggregate mode.
  allShops: any[];
}

export const getMembershipsForUser = cache(
  async (userId: string): Promise<MembershipSummary[]> => {
    await connectDB();
    const rows = await ShopMembership.find({ user: userId })
      .populate({ path: "shop", select: "_id name code" })
      .lean();
    return rows
      .filter((r: any) => r.shop)
      .map((r: any) => ({
        membershipId: r._id.toString(),
        shopId: r.shop._id.toString(),
        shopName: r.shop.name,
        shopCode: r.shop.code,
        role: r.role as MembershipRole,
      }));
  }
);

export async function readCurrentShopCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CURRENT_SHOP_COOKIE)?.value || null;
}

// Resolve the user's active shop context. Pages/APIs call this instead of
// reading user.shopId directly so multi-shop owners can scope cleanly.
//
// Returns `null` when there is no signed-in user. When the user has no
// memberships at all, returns mode='unset' with empty memberships — callers
// should send those users to /setup.
export const getCurrentShopContext = cache(
  async (): Promise<CurrentShopContext | null> => {
    const session = await auth();
    if (!session?.user) return null;

    // Admin "view as": resolve the whole context through the target user, so
    // every page and API that funnels through here is scoped to them with no
    // further changes. Returns null unless the real session is the admin.
    const impersonation = await getImpersonationFor(session.user.email);
    const userId = impersonation?.userId ?? (session.user.id as string);
    const impersonatedUserId = impersonation?.userId;

    const memberships = await getMembershipsForUser(userId);
    const cookieValue = await readCurrentShopCookie();

    // No memberships → caller decides (likely send to /setup).
    if (memberships.length === 0) {
      return {
        userId,
        impersonatedUserId,
        memberships,
        mode: "unset",
        shopId: null,
        shop: null,
        allShops: [],
      };
    }

    if (cookieValue === "all") {
      await connectDB();
      const allShops = await Shop.find({
        _id: { $in: memberships.map((m) => m.shopId) },
      });
      return {
        userId,
        impersonatedUserId,
        memberships,
        mode: "all",
        shopId: null,
        shop: null,
        allShops,
      };
    }

    // Single-membership user: auto-resolve to that shop even if cookie unset.
    const targetShopId =
      cookieValue && memberships.some((m) => m.shopId === cookieValue)
        ? cookieValue
        : memberships.length === 1
        ? memberships[0].shopId
        : null;

    if (!targetShopId) {
      return {
        userId,
        impersonatedUserId,
        memberships,
        mode: "unset",
        shopId: null,
        shop: null,
        allShops: [],
      };
    }

    await connectDB();
    const shop = await Shop.findById(targetShopId);
    if (!shop) {
      // Stale cookie pointing at a deleted shop — fall back to unset.
      return {
        userId,
        impersonatedUserId,
        memberships,
        mode: "unset",
        shopId: null,
        shop: null,
        allShops: [],
      };
    }

    return {
      userId,
      impersonatedUserId,
      memberships,
      mode: "single",
      shopId: targetShopId,
      shop,
      allShops: [shop],
    };
  }
);
