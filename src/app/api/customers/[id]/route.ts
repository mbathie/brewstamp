import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Customer, StampCard } from "@/models";
import { requireMerchant, unauthorized } from "@/lib/api-auth";
import { syncWalletPassesForCustomer } from "@/lib/wallet";
import bcrypt from "bcrypt";

// Confirm the signed-in merchant may act on this customer: the customer must
// hold a stamp card at one of the merchant's shops. Without this any anonymous
// caller could read or rewrite an arbitrary customer by id (IDOR). Returns a
// Response to short-circuit with, or null when access is allowed.
async function denyIfNotOwned(customerId: string): Promise<Response | null> {
  const merchant = await requireMerchant();
  if (!merchant) return unauthorized();
  const owns = await StampCard.exists({
    shop: { $in: merchant.shopIds },
    customer: customerId,
  });
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const denied = await denyIfNotOwned(id);
  if (denied) return denied;

  const { name, email, password } = await req.json().catch(() => ({}));
  const update: any = {};
  if (name) update.name = name;
  if (email) update.email = email;
  if (password) update.password = await bcrypt.hash(password, 10);

  // If the email is changing, any prior perk verification no longer applies —
  // reset it so the new address must be verified before it can redeem.
  if (email) {
    const current = await Customer.findById(id).select("email").lean();
    const changed =
      (current as any)?.email?.trim().toLowerCase() !==
      String(email).trim().toLowerCase();
    if (changed) {
      update.emailVerified = false;
      update.emailVerifiedAt = null;
      update.emailVerifyCodeHash = null;
      update.emailVerifyExpires = null;
      update.emailVerifyAttempts = 0;
    }
  }

  const customer = await Customer.findByIdAndUpdate(id, update, { new: true });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // The customer's name shows on their wallet passes — push the change to every
  // pass they hold (all shops). Fire-and-forget; never block the save.
  if (name !== undefined) {
    void syncWalletPassesForCustomer(id);
  }

  return NextResponse.json({ customer });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const denied = await denyIfNotOwned(id);
  if (denied) return denied;

  const customer = await Customer.findById(id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}
