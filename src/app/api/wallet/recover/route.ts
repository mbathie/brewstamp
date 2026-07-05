import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { WalletPass, Customer, Shop } from "@/models";

const ID_COOKIE = "brewstamp_id";

// "Recover my card" — the target of the link embedded in a customer's wallet
// pass. If they lose their browser cookie (cleared data, new device), tapping
// the link from their wallet re-points this browser at their existing card by
// restoring the brewstamp_id cookie, then redirects to the card.
//
// Security: the token is a 24-byte per-card secret that lives only on the pass
// in the owner's wallet — it is NOT the scannable barcode, so it can't be used
// to hijack a card by scanning someone's pass at the counter.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  if (!token) return new Response("Missing token", { status: 400 });

  await connectDB();
  // Prefer the dedicated recover token; fall back to authToken for legacy passes
  // issued before the two were split.
  const pass = await WalletPass.findOne({
    $or: [{ recoverToken: token }, { authToken: token }],
  })
    .select("customer shop")
    .lean<any>();
  if (!pass?.customer || !pass.shop) {
    return new Response("Invalid or expired recovery link", { status: 404 });
  }

  const [customer, shop] = await Promise.all([
    Customer.findById(pass.customer).select("cookieId").lean<any>(),
    Shop.findById(pass.shop).select("code").lean<any>(),
  ]);
  if (!customer?.cookieId || !shop?.code) {
    return new Response("Not found", { status: 404 });
  }

  const res = NextResponse.redirect(new URL(`/s/${shop.code}`, req.url));
  // Match the cookie middleware sets for new visitors (proxy.ts).
  res.cookies.set(ID_COOKIE, customer.cookieId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
  return res;
}
