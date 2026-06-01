import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Invite, ShopMembership, User } from "@/models";
import { CURRENT_SHOP_COOKIE } from "@/lib/shop-context";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

// POST /api/invites/accept — consumes an invite token for the signed-in
// user. Body: { token }. The signed-in user's email must match the invite
// (case-insensitive). Creates the ShopMembership, marks the invite
// accepted, and sets the current-shop cookie so the new shop is the active
// context after the redirect.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in first to accept the invite." },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { token?: string };
  if (!body.token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  await connectDB();
  const invite = await Invite.findOne({
    token: body.token,
    acceptedAt: { $exists: false },
  });
  if (!invite) {
    return NextResponse.json(
      { error: "This invite is invalid or has already been used." },
      { status: 404 }
    );
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invite has expired — ask for a fresh one." },
      { status: 410 }
    );
  }

  const userId = (session.user as any).id as string;
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `This invite was sent to ${invite.email}. Sign in with that email to accept.`,
      },
      { status: 403 }
    );
  }

  // Idempotent: skip the create if membership already exists.
  const existing = await ShopMembership.findOne({
    user: user._id,
    shop: invite.shop,
  });
  if (!existing) {
    await ShopMembership.create({
      user: user._id,
      shop: invite.shop,
      role: invite.role,
      invitedBy: invite.invitedBy,
      acceptedAt: new Date(),
    });
  }

  invite.acceptedAt = new Date();
  await invite.save();

  const res = NextResponse.json({
    ok: true,
    shopId: invite.shop.toString(),
  });
  res.cookies.set(CURRENT_SHOP_COOKIE, invite.shop.toString(), COOKIE_OPTS);
  return res;
}
