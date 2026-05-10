import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  // Only set the cookie for customer scan pages
  if (!pathname.startsWith("/s/")) return NextResponse.next();

  const cookieId = request.cookies.get("brewstamp_id")?.value;
  if (cookieId) return NextResponse.next();

  // First visit — set the cookie so the page can read it
  const response = NextResponse.next();
  const id = crypto.randomUUID();
  response.cookies.set("brewstamp_id", id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });

  return response;
}

export const config = {
  matcher: ["/s/:path*", "/dashboard/:path*"],
};
