import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/user-email";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: Request) {
  await connectDB();
  const { token, email, password } = await req.json().catch(() => ({}));

  if (!token || !email || !password) {
    return NextResponse.json(
      { error: "Token, email, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Match the email case-insensitively, then check the token on that account —
  // same test as before, just not defeated by how the address was typed.
  const candidate = await findUserByEmail(email);
  const user =
    candidate &&
    candidate.resetToken === hashedToken &&
    candidate.resetTokenExpiry &&
    candidate.resetTokenExpiry > new Date()
      ? candidate
      : null;

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired reset link" },
      { status: 400 }
    );
  }

  user.hash = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return NextResponse.json({ success: true });
}
