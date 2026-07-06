import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, ShopMembership } from "@/models";
import { CURRENT_SHOP_COOKIE } from "@/lib/shop-context";
import { getUserPlanLimits } from "@/lib/plan-limits";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

// POST /api/shops — create an additional shop owned by the current user.
// Mints a ShopMembership(role=owner) so the new shop appears in the picker
// + switcher immediately, and sets bs_current_shop so the dashboard lands
// scoped to the new shop after redirect.
//
// Enforces the active plan's shopLimit (Free/Pro=1, Plus=3, Max=10).
// Hitting the limit returns 402 with a `limitReached` flag so clients can
// route the user to the billing page.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { name, language, stampThreshold } = await req.json().catch(() => ({}));

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
  }

  const userId = session.user.id as string;

  const limits = await getUserPlanLimits(userId);
  if (limits.atShopLimit) {
    return NextResponse.json(
      {
        error: `You've reached the ${limits.shopLimit}-shop limit on the ${limits.plan.label} plan. Upgrade to add more shops.`,
        limitReached: true,
        currentPlan: limits.planSlug,
        shopLimit: limits.shopLimit,
        ownedShopCount: limits.ownedShopCount,
      },
      { status: 402 }
    );
  }

  // Unique 8-char shop code, same alphabet as /api/setup.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from(
      { length: 8 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (await Shop.findOne({ code }));

  const shop = await Shop.create({
    name: name.trim(),
    owner: userId,
    code,
    language: language || "en",
    stampThreshold: stampThreshold || 8,
  });

  await ShopMembership.create({
    user: userId,
    shop: shop._id,
    role: "owner",
    acceptedAt: new Date(),
  });

  const res = NextResponse.json(
    { success: true, shopId: shop._id.toString() },
    { status: 201 }
  );
  res.cookies.set(CURRENT_SHOP_COOKIE, shop._id.toString(), COOKIE_OPTS);
  return res;
}
