import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Customer } from "@/models";
import { perkCodeMatches, PERK_CODE_MAX_ATTEMPTS } from "@/lib/perk-verify";

// POST: confirm a perk customer's email by echoing the 6-digit code we mailed.
// On success the email is marked verified (persisted) and the code is cleared.
export async function POST(req: Request) {
  await connectDB();
  const { customerId, code } = await req.json().catch(() => ({}));

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
  customer.emailVerifyCodeHash = undefined;
  customer.emailVerifyExpires = undefined;
  customer.emailVerifyAttempts = 0;
  await customer.save();

  return NextResponse.json({ ok: true });
}
