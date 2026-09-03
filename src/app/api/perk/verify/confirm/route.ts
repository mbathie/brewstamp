import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongoose";
import { Customer, Shop, StampCard, StampRequest } from "@/models";
import { perkCodeMatches, PERK_CODE_MAX_ATTEMPTS } from "@/lib/perk-verify";

const ID_COOKIE = "brewstamp_id";
const ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // match proxy.ts

// POST: confirm a perk customer's email by echoing the 6-digit code we mailed.
// On success the email is marked verified (persisted) and the code is cleared.
export async function POST(req: Request) {
  await connectDB();
  const { customerId, code, shopId } = await req.json().catch(() => ({}));

  if (!customerId || !code) {
    return NextResponse.json(
      { error: "Missing customerId or code" },
      { status: 400 },
    );
  }

  // emailVerifyCodeHash is select:false on the model — opt in to compare it.
  const customer = await Customer.findById(customerId).select(
    "+emailVerifyCodeHash",
  );
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Idempotent — already verified, nothing to do.
  if (customer.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  if (!customer.emailVerifyCodeHash || !customer.emailVerifyExpires) {
    return NextResponse.json(
      { error: "Request a new code.", code: "CODE_EXPIRED" },
      { status: 400 },
    );
  }

  if (customer.emailVerifyExpires.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "That code expired. Request a new one.", code: "CODE_EXPIRED" },
      { status: 400 },
    );
  }

  if ((customer.emailVerifyAttempts || 0) >= PERK_CODE_MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many tries. Request a new code.", code: "TOO_MANY_ATTEMPTS" },
      { status: 429 },
    );
  }

  const submitted = String(code).trim();
  if (!perkCodeMatches(submitted, customer.emailVerifyCodeHash)) {
    customer.emailVerifyAttempts = (customer.emailVerifyAttempts || 0) + 1;
    await customer.save();
    return NextResponse.json(
      { error: "Incorrect code. Try again.", code: "INVALID_CODE" },
      { status: 400 },
    );
  }

  customer.emailVerified = true;
  customer.emailVerifiedAt = new Date();
  customer.perkVerifications = (customer.perkVerifications || 0) + 1;
  customer.emailVerifyCodeHash = undefined;
  customer.emailVerifyExpires = undefined;
  customer.emailVerifyAttempts = 0;
  await customer.save();

  // Identity reconcile — the work email, not the device cookie, is the real
  // identity in perk mode. If this person cleared their cookies and re-verified
  // the same email, they'd otherwise end up as a second customer row. Fold this
  // freshly-verified record back into the earliest one that already holds this
  // email at this shop, and re-point the browser cookie at it so future scans
  // land on the same identity. Prevents the duplicate rows a cleared cookie
  // used to create.
  if (shopId && customer.email) {
    const merged = await reconcileDuplicate(customer, shopId);
    if (merged) return NextResponse.json({ ok: true, merged: true });
  }

  return NextResponse.json({ ok: true });
}

// Returns true when `current` was folded into an earlier duplicate (and the
// caller should have the client reload as the canonical identity).
async function reconcileDuplicate(
  current: { _id: unknown; email: string },
  shopId: string,
): Promise<boolean> {
  const shop = await Shop.findById(shopId).select("perkMode");
  if (!shop?.perkMode) return false;

  const email = current.email.trim().toLowerCase();
  const currentId = String(current._id);

  // Every verified record carrying this email, oldest first.
  const sameEmail = await Customer.find({ email, emailVerified: true })
    .select("_id cookieId createdAt")
    .sort({ createdAt: 1 })
    .lean();
  if (sameEmail.length < 2) return false;

  // Narrow to the ones that actually have a card at this shop, then take the
  // earliest as canonical.
  const ids = sameEmail.map((c: any) => c._id);
  const cards = await StampCard.find({ shop: shopId, customer: { $in: ids } })
    .select("customer")
    .lean();
  const withCard = new Set(cards.map((c: any) => String(c.customer)));
  const canonical = sameEmail.find((c: any) => withCard.has(String(c._id)));

  if (!canonical || String(canonical._id) === currentId) return false;

  // Keep any request history (denormalised by email, so the daily cap is
  // unaffected either way) attached to the surviving identity.
  await StampRequest.updateMany(
    { shop: shopId, customer: current._id },
    { customer: canonical._id },
  );
  // The throwaway is about to be deleted — carry its verification onto the
  // survivor so repeat re-verifiers stay countable.
  await Customer.updateOne(
    { _id: canonical._id },
    { $inc: { perkVerifications: 1 } },
  );
  // Drop the duplicate's (empty) perk card at this shop — canonical has one.
  await StampCard.deleteOne({ shop: shopId, customer: current._id });
  // Remove the throwaway customer entirely if it isn't used anywhere else.
  const otherCards = await StampCard.countDocuments({ customer: current._id });
  if (otherCards === 0) await Customer.deleteOne({ _id: current._id });

  // Re-point this browser at the canonical identity (same attributes proxy.ts
  // uses to mint it).
  const jar = await cookies();
  jar.set(ID_COOKIE, canonical.cookieId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ID_COOKIE_MAX_AGE,
  });
  return true;
}
