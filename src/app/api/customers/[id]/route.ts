import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Customer } from "@/models";
import bcrypt from "bcrypt";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const { name, email, password } = await req.json();
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

  return NextResponse.json({ customer });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const customer = await Customer.findById(id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}
