import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import {
  Invite,
  ShopMembership,
  User,
} from "@/models";
import { getCurrentShopContext } from "@/lib/shop-context";
import { getPlanBySlug } from "@/lib/plans";
import { getShopPlanLimits } from "@/lib/plan-limits";
import { sendTeamInviteEmail } from "@/lib/email";

// GET /api/team — list members + pending invites.
//
// Single-shop context: returns just that shop's team.
// Aggregate ("All shops"): returns the rollup across every shop the viewer
// has membership on, with the shop attached to each row so the UI can
// show a Shop column. Invite form is hidden in aggregate (invites are
// shop-scoped — the user picks a specific shop to invite to).
export async function GET() {
  const ctx = await getCurrentShopContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.mode === "unset") {
    return NextResponse.json(
      { error: "Pick a shop or 'All shops' from the top bar first." },
      { status: 400 }
    );
  }

  await connectDB();

  const aggregate = ctx.mode === "all";
  const accessibleShopIds = ctx.memberships.map((m) => m.shopId);
  const shopFilter = aggregate
    ? { $in: accessibleShopIds }
    : ctx.shop._id;

  const memberships = await ShopMembership.find({ shop: shopFilter })
    .populate("user", "name email")
    .populate("shop", "_id name")
    .sort({ createdAt: 1 })
    .lean();

  const invites = await Invite.find({
    shop: shopFilter,
    acceptedAt: { $exists: false },
  })
    .populate("invitedBy", "name email")
    .populate("shop", "_id name")
    .sort({ createdAt: -1 })
    .lean();

  // Per-shop plan info. In aggregate mode the invite form is hidden so we
  // only need a single representative plan flag — pick the viewer's
  // current single shop or the first accessible shop.
  const planShopId = aggregate
    ? ctx.memberships[0]?.shopId
    : ctx.shop._id.toString();
  const plan = planShopId
    ? (await getShopPlanLimits(planShopId)).plan
    : getPlanBySlug("free")!;

  // Viewer's role per accessible shop. The UI uses this to decide whether
  // the actions column should render (e.g. a manager on Shop A can edit
  // its rows but is staff on Shop B and can't edit those).
  const myRolesByShop: Record<string, string> = {};
  for (const m of ctx.memberships) {
    myRolesByShop[m.shopId] = m.role;
  }
  const myRole = aggregate
    ? null
    : ctx.memberships.find((m) => m.shopId === ctx.shopId)?.role || null;

  return NextResponse.json({
    aggregate,
    shop: aggregate
      ? null
      : { _id: ctx.shop._id.toString(), name: ctx.shop.name },
    myRole,
    myRolesByShop,
    plan: {
      slug: plan.slug,
      label: plan.label,
      hasStaffLogins: plan.hasStaffLogins,
    },
    members: memberships.map((m: any) => ({
      _id: m._id.toString(),
      role: m.role,
      acceptedAt: m.acceptedAt,
      createdAt: m.createdAt,
      shop: {
        _id: m.shop?._id?.toString(),
        name: m.shop?.name || "",
      },
      user: {
        _id: m.user?._id?.toString(),
        name: m.user?.name || "",
        email: m.user?.email || "",
      },
    })),
    invites: invites.map((inv: any) => ({
      _id: inv._id.toString(),
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      shop: {
        _id: inv.shop?._id?.toString(),
        name: inv.shop?.name || "",
      },
      invitedBy: {
        name: inv.invitedBy?.name || "",
        email: inv.invitedBy?.email || "",
      },
    })),
  });
}

// POST /api/team — invite a new member to the current shop.
// Body: { email: string, role: 'manager' | 'staff' }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getCurrentShopContext();
  if (!ctx || ctx.mode !== "single") {
    return NextResponse.json(
      { error: "Pick a single shop to invite team members." },
      { status: 400 }
    );
  }

  const myMembership = ctx.memberships.find((m) => m.shopId === ctx.shopId);
  if (!myMembership || (myMembership.role !== "owner" && myMembership.role !== "manager")) {
    return NextResponse.json(
      { error: "Only the shop owner or a manager can invite team members." },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    role?: "manager" | "staff";
  };
  const email = body.email?.trim().toLowerCase();
  const role = body.role;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (role !== "manager" && role !== "staff") {
    return NextResponse.json(
      { error: "Role must be 'manager' or 'staff'" },
      { status: 400 }
    );
  }
  // Only the owner can invite at the manager level.
  if (role === "manager" && myMembership.role !== "owner") {
    return NextResponse.json(
      { error: "Only the shop owner can invite managers." },
      { status: 403 }
    );
  }

  await connectDB();

  // Plan gate — staff logins are a Plus+ feature. Resolved from the shop
  // OWNER's effective plan so it covers every shop the owner pays for, not
  // just the one carrying the Stripe subscription.
  const plan = (await getShopPlanLimits(ctx.shop._id.toString())).plan;
  if (!plan.hasStaffLogins) {
    return NextResponse.json(
      {
        error: `The ${plan.label} plan doesn't include team logins. Upgrade to Plus or Max to invite team members.`,
        upgradeRequired: true,
        currentPlan: plan.slug,
      },
      { status: 402 }
    );
  }

  // No-op if the target email already has a membership on this shop.
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const already = await ShopMembership.findOne({
      user: existingUser._id,
      shop: ctx.shop._id,
    });
    if (already) {
      return NextResponse.json(
        { error: `${email} is already on the team for this shop.` },
        { status: 400 }
      );
    }
  }

  // Reuse a pending invite if one already exists for this email/shop —
  // refresh the token + expiry instead of creating duplicates.
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  let invite = await Invite.findOne({
    shop: ctx.shop._id,
    email,
    acceptedAt: { $exists: false },
  });
  if (invite) {
    invite.role = role;
    invite.token = token;
    invite.expiresAt = expiresAt;
    invite.invitedBy = (session.user as any).id;
    await invite.save();
  } else {
    invite = await Invite.create({
      shop: ctx.shop._id,
      email,
      role,
      token,
      invitedBy: (session.user as any).id,
      expiresAt,
    });
  }

  // Best-effort email send (don't block the response on delivery).
  const inviterName = session.user.name || "A teammate";
  const shopName = ctx.shop.name;
  sendTeamInviteEmail({
    to: email,
    shopName,
    inviterName,
    role,
    token,
  }).catch((err) => console.error("[team] invite email failed:", err));

  return NextResponse.json({
    ok: true,
    invite: {
      _id: invite._id.toString(),
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    },
  });
}
