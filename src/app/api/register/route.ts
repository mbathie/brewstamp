import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/mongoose";
import { User, Shop } from "@/models";

export async function POST(req: Request) {
  await connectDB();
  const { name, email, password, shopName } = await req.json();

  if (!name || !email || !password || !shopName) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  // Generate a random 8-character alphanumeric shop code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid ambiguity
  let code = "";
  do {
    code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (await Shop.findOne({ code }));

  const user = await User.create({ name, email, hash });
  const shop = await Shop.create({ name: shopName, owner: user._id, code });

  user.shopId = shop._id;
  await user.save();

  return NextResponse.json({ success: true }, { status: 201 });
}
