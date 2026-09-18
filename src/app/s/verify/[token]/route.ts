import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Customer, Shop, StampCard, StampRequest } from "@/models";
import { hashPerkLinkToken } from "@/lib/perk-verify";

const ID_COOKIE = "brewstamp_id";
const ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // match proxy.ts

// One-tap perk verification from the email. Unlike the code flow this doesn't
// depend on the original tab surviving: whichever browser opens the link gets
// the identity cookie set here, then lands on the shop's card as the verified
// customer. Folds into an existing verified identity for the same email at
// the shop so a re-verifier keeps their history (mirrors confirm/route.ts).
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app";
  if (!/^[a-f0-9]{64}$/.test(token)) return NextResponse.redirect(`${appUrl}/?verify=invalid`);

  await connectDB();
  const customer = await Customer.findOne({ emailVerifyLinkHash: hashPerkLinkToken(token) }).select("+emailVerifyLinkHash");
  if (!customer) return NextResponse.redirect(`${appUrl}/?verify=invalid`);

  // Their card tells us which shop to land on.
  const card = await StampCard.findOne({ customer: customer._id }).sort({ updatedAt: -1 }).select("shop");
  const shop = card ? await Shop.findById(card.shop).select("code perkMode") : null;
  const landing = shop ? `${appUrl}/s/${shop.code}` : `${appUrl}/`;

  if (!customer.emailVerifyExpires || customer.emailVerifyExpires.getTime() < Date.now()) {
    return NextResponse.redirect(`${landing}?verify=expired`);
  }

  // Mark verified, clear both secrets.
  customer.emailVerified = true;
  customer.emailVerifiedAt = new Date();
  customer.perkVerifications = (customer.perkVerifications || 0) + 1;
  customer.emailVerifyCodeHash = undefined;
  customer.emailVerifyLinkHash = undefined;
  customer.emailVerifyExpires = undefined;
  customer.emailVerifyAttempts = 0;
  await customer.save();

  // Reconcile with the earliest verified identity holding this email at the
  // shop, so the cookie we set points at the record with their history.
  let identity = customer;
  if (shop?.perkMode && customer.email) {
    const email = customer.email.trim().toLowerCase();
    const sameEmail = await Customer.find({ email, emailVerified: true }).select("_id cookieId createdAt").sort({ createdAt: 1 });
    const ids = sameEmail.map((c) => c._id);
    const cards = await StampCard.find({ shop: shop._id, customer: { $in: ids } }).select("customer").lean();
    const withCard = new Set(cards.map((c: any) => String(c.customer)));
    const canonical = sameEmail.find((c) => withCard.has(String(c._id)));
    if (canonical && String(canonical._id) !== String(customer._id)) {
      await StampRequest.updateMany({ shop: shop._id, customer: customer._id }, { customer: canonical._id });
      await Customer.updateOne({ _id: canonical._id }, { $inc: { perkVerifications: 1 } });
      await StampCard.deleteOne({ shop: shop._id, customer: customer._id });
      // Keep the throwaway as a pointer (see confirm/route.ts) so a cookie
      // that never got swapped still resolves to the canonical identity.
      const otherCards = await StampCard.countDocuments({ customer: customer._id });
      if (otherCards === 0) await Customer.updateOne({ _id: customer._id }, { $set: { mergedInto: canonical._id } });
      identity = canonical as typeof customer;
    }
  }

  const res = NextResponse.redirect(`${landing}?verified=1`);
  res.cookies.set(ID_COOKIE, identity.cookieId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ID_COOKIE_MAX_AGE,
  });
  return res;
}
