import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, User } from "@/models";
import { CURRENT_SHOP_COOKIE } from "@/lib/shop-context";
import {
  IMPERSONATE_COOKIE,
  IMPERSONATE_MAX_AGE,
  encodeImpersonation,
  getImpersonationFor,
  isAdminEmail,
} from "@/lib/impersonation";

/**
 * Start / stop admin "view as".
 *
 * Both handlers authorise on the REAL session email — never on `requireAdmin()`,
 * which deliberately returns false while impersonating. Stop has to keep working
 * once you're already wearing someone else's identity.
 */
async function realEmail(): Promise<string | null | undefined> {
  return (await auth())?.user?.email;
}

const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

// POST { shopId } → view the dashboard as that shop's owner.
export async function POST(req: Request) {
  if (!isAdminEmail(await realEmail())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { shopId } = await req.json().catch(() => ({}) as { shopId?: string });
  if (!shopId) {
    return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
  }

  await connectDB();
  const shop: any = await Shop.findById(shopId).select("_id name owner").lean();
  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const owner: any = await User.findById(shop.owner).select("_id email").lean();
  if (!owner) {
    return NextResponse.json(
      { error: "That shop has no owner account to view as." },
      { status: 404 },
    );
  }

  const jar = await cookies();
  jar.set(
    IMPERSONATE_COOKIE,
    encodeImpersonation({
      userId: String(owner._id),
      shopId: String(shop._id),
      // Remember where the admin was, so exiting puts them back.
      prevShopCookie: jar.get(CURRENT_SHOP_COOKIE)?.value,
    }),
    { ...COOKIE_OPTS, maxAge: IMPERSONATE_MAX_AGE },
  );
  // Land directly on the target's shop rather than their shop picker.
  jar.set(CURRENT_SHOP_COOKIE, String(shop._id), {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({
    ok: true,
    viewingAs: { email: owner.email, shopName: shop.name },
  });
}

// DELETE → stop impersonating and restore the admin's own context.
export async function DELETE() {
  const email = await realEmail();
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const current = await getImpersonationFor(email);
  const jar = await cookies();
  jar.delete(IMPERSONATE_COOKIE);

  // Put the admin back on whatever shop they were looking at before.
  if (current?.prevShopCookie) {
    jar.set(CURRENT_SHOP_COOKIE, current.prevShopCookie, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    jar.delete(CURRENT_SHOP_COOKIE);
  }

  return NextResponse.json({ ok: true });
}
