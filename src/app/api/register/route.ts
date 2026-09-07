import { NextResponse } from "next/server";
import { findUserByEmail, normalizeEmail } from "@/lib/user-email";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models";
import { readSignupAttribution } from "@/lib/signup-attr";

export async function POST(req: Request) {
  await connectDB();
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const attr = await readSignupAttribution();
  const normalized = normalizeEmail(email);
  await User.create({ name: normalized.split("@")[0], email: normalized, hash, ...attr });

  return NextResponse.json({ success: true }, { status: 201 });
}
