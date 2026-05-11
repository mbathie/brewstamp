import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models";
import { readSignupAttribution } from "@/lib/signup-attr";

export async function POST(req: Request) {
  await connectDB();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const attr = await readSignupAttribution();
  await User.create({ name: email.split("@")[0], email, hash, ...attr });

  return NextResponse.json({ success: true }, { status: 201 });
}
