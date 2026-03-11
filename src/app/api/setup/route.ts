import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { User, Shop } from "@/models";
import { sendWelcomeEmail } from "@/lib/email";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { shopName, name, phone } = await req.json();

  if (!shopName) {
    return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.shopId) {
    return NextResponse.json({ error: "Shop already exists" }, { status: 400 });
  }

  // Generate a random 8-character alphanumeric shop code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (await Shop.findOne({ code }));

  // Check for referral cookie
  const cookieStore = await cookies();
  const refCookie = cookieStore.get("brewstamp_ref");
  let referredBy: string | undefined;
  if (refCookie?.value) {
    const referringShop = await Shop.findById(refCookie.value);
    if (referringShop) {
      referredBy = referringShop._id.toString();
    }
  }

  const shop = await Shop.create({
    name: shopName,
    owner: user._id,
    code,
    ...(referredBy ? { referredBy } : {}),
  });

  user.shopId = shop._id;
  if (name) user.name = name;
  if (phone) user.phone = phone;
  await user.save();

  // Send welcome email (fire-and-forget)
  sendWelcomeEmail({
    to: user.email,
    merchantName: user.name,
    shopName,
  }).catch((err) => console.error("[Setup] Welcome email failed:", err));

  // Clear referral cookie after use
  if (refCookie?.value) {
    const response = NextResponse.json({ success: true, shopId: shop._id }, { status: 201 });
    response.cookies.delete("brewstamp_ref");
    return response;
  }

  return NextResponse.json({ success: true, shopId: shop._id }, { status: 201 });
}
