import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ATTR_COOKIE = "bs_attr";
const ID_COOKIE = "brewstamp_id";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev-only: forward ?stamp=N as a header for dashboard layout
  if (
    process.env.NODE_ENV === "development" &&
    pathname.startsWith("/dashboard")
  ) {
    const stamp = request.nextUrl.searchParams.get("stamp");
    if (stamp) {
      const headers = new Headers(request.headers);
      headers.set("x-debug-stamp", stamp);
      return NextResponse.next({ request: { headers } });
    }
  }

  // /s/ customer-scan pages — anonymous-id cookie for stamp continuity
  if (pathname.startsWith("/s/")) {
    if (request.cookies.get(ID_COOKIE)?.value) return NextResponse.next();
    const response = NextResponse.next();
    response.cookies.set(ID_COOKIE, crypto.randomUUID(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 5,
    });
    return response;
  }

  // First-touch attribution. On the visitor's first marketing pageview we
  // stash where they came from + which page they landed on, so when they
  // later register we can attribute the signup (search → /es, direct → /,
  // etc.). Skipped if the cookie already exists or they're already in the
  // logged-in app surface.
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }
  if (request.cookies.get(ATTR_COOKIE)?.value) return NextResponse.next();

  const referrer = request.headers.get("referer") || "";
  // Ignore internal referrers — only first-touch from outside the site counts.
  const host = request.nextUrl.host;
  const externalReferrer =
    referrer && !referrer.includes(`://${host}`) ? referrer : "";

  const landing = pathname + (request.nextUrl.search || "");
  const payload = JSON.stringify({
    r: externalReferrer,
    p: landing,
    ts: Date.now(),
  });

  const response = NextResponse.next();
  response.cookies.set(ATTR_COOKIE, payload, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // 30 days — long enough that a researcher who bookmarks and returns
    // still gets attributed, short enough that the slot doesn't linger.
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export const config = {
  // Run on everything except static assets and the websocket upgrade path.
  matcher: ["/((?!_next/static|_next/image|_ws|favicon\\.ico|.*\\..*).*)"],
};
