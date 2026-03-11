import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Shop } from "@/models";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  await connectDB();
  const shop = await Shop.findOne({ code: code.toUpperCase() });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!shop) {
    return NextResponse.redirect(`${appUrl}/register`);
  }

  const response = NextResponse.redirect(`${appUrl}/register?ref=${encodeURIComponent(shop.name)}`);
  response.cookies.set("brewstamp_ref", shop._id.toString(), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
