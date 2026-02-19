import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: "/s/:path*",
};
