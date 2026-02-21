import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { sendResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  await connectDB();
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await User.findOne({ email });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    user.resetToken = hashed;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    sendResetEmail({ to: email, token }).catch((err) =>
      console.error("[ForgotPassword] Reset email failed:", err)
    );
  }

  return NextResponse.json({
    message: "If an account exists with that email, we sent a reset link.",
  });
}
