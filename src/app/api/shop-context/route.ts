import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  CURRENT_SHOP_COOKIE,
  getMembershipsForUser,
} from "@/lib/shop-context";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

// POST: switch the active shop context. Body { target: "<shopId>" | "all" }.
// Used by the top-bar shop switcher (client component) and the picker page.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  let body: { target?: string } = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const target = body.target;
  if (!target) {
    return NextResponse.json({ error: "Missing target" }, { status: 400 });
  }

  const memberships = await getMembershipsForUser(userId);
  if (target === "all") {
    if (memberships.length < 2) {
      return NextResponse.json(
        { error: "All-shops view requires 2+ shops" },
        { status: 400 }
      );
    }
  } else {
    const hasAccess = memberships.some((m) => m.shopId === target);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const res = NextResponse.json({ ok: true, target });
  res.cookies.set(CURRENT_SHOP_COOKIE, target, COOKIE_OPTS);
  return res;
}

// GET handles two link-friendly cases:
//   ?auto=1            → resolve a single-membership user to their one shop
//   ?switch=<shopId>   → switch to a specific shop the user has access to
// Both set the cookie and redirect into /dashboard, so they can be used from
// plain <a> tags (e.g. the "go to this shop" arrow in the aggregate table).
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const userId = session.user.id as string;
  const memberships = await getMembershipsForUser(userId);

  const switchTo = req.nextUrl.searchParams.get("switch");
  if (switchTo) {
    const target = switchTo === "all" ? "all" : switchTo;
    if (target === "all" && memberships.length < 2) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (target !== "all" && !memberships.some((m) => m.shopId === target)) {
      return NextResponse.redirect(new URL("/select-shop", req.url));
    }
    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    res.cookies.set(CURRENT_SHOP_COOKIE, target, COOKIE_OPTS);
    return res;
  }

  if (memberships.length === 0) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }
  if (memberships.length !== 1) {
    return NextResponse.redirect(new URL("/select-shop", req.url));
  }

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set(CURRENT_SHOP_COOKIE, memberships[0].shopId, COOKIE_OPTS);
  return res;
}
