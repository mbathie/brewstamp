import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById((session.user as any).id).select(
    "name email phone"
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById((session.user as any).id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { name, email, phone, currentPassword, newPassword } =
    await req.json();

  // Update name
  if (name !== undefined) {
    if (!name.trim()) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }
    user.name = name.trim();
  }

  // Update email
  if (email !== undefined && email !== user.email) {
    if (!email.trim()) {
      return NextResponse.json(
        { error: "Email cannot be empty" },
        { status: 400 }
      );
    }
    const existing = await User.findOne({ email: email.trim() });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }
    user.email = email.trim();
  }

  // Update phone
  if (phone !== undefined) {
    user.phone = phone.trim() || undefined;
  }

  // Update password
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to set a new password" },
        { status: 400 }
      );
    }
    const valid = await bcrypt.compare(currentPassword, user.hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }
    user.hash = await bcrypt.hash(newPassword, 10);
  }

  await user.save();

  return NextResponse.json({ success: true });
}
