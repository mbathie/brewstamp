import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Customer, Shop } from "@/models";
import { emailDomainAllowed } from "@/lib/perk";
import {
  generatePerkCode,
  hashPerkCode,
  PERK_CODE_TTL_MS,
} from "@/lib/perk-verify";
import { sendPerkVerifyCodeEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST: start (or restart) email verification for a perk-mode customer. Saves
// the work email as unverified, mints a 6-digit code, and emails it. The
// customer echoes the code back to /api/perk/verify/confirm.
export async function POST(req: Request) {
  await connectDB();
  const { shopId, customerId, email } = await req.json().catch(() => ({}));

  if (!shopId || !customerId || !email) {
    return NextResponse.json(
      { error: "Missing shopId, customerId or email" },
      { status: 400 },
    );
  }

  const value = String(email).trim().toLowerCase();
  if (!EMAIL_RE.test(value)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const shop = await Shop.findById(shopId);
  if (!shop?.perkMode) {
    return NextResponse.json({ error: "Not a perk shop" }, { status: 400 });
  }

  // Domain gate first — never reveal the allowed domain, just reject.
  if (!emailDomainAllowed(value, shop.allowedEmailDomains)) {
    return NextResponse.json(
      { error: "Please use your work email address.", code: "DOMAIN_NOT_ALLOWED" },
      { status: 403 },
    );
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const code = generatePerkCode();
  customer.email = value;
  customer.emailVerified = false;
  customer.emailVerifiedAt = undefined;
  customer.emailVerifyCodeHash = hashPerkCode(code);
  customer.emailVerifyExpires = new Date(Date.now() + PERK_CODE_TTL_MS);
  customer.emailVerifyAttempts = 0;
  await customer.save();

  // Fire-and-forget — a slow SMTP hop shouldn't block the counter UI. The
  // customer can hit "Resend" if it never arrives.
  sendPerkVerifyCodeEmail({ to: value, code, shopName: shop.name }).catch((err) =>
    console.error("[PerkVerify] send failed:", err),
  );

  return NextResponse.json({ ok: true });
}
