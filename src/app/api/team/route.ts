import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/user-email";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Invite, ShopMembership } from "@/models";
import { getCurrentShopContext } from "@/lib/shop-context";
import { canAssign, seatFree, shopList, teamShops, type TeamRole } from "@/lib/team";
import { sendTeamInviteEmail } from "@/lib/email";

// GET /api/team — everyone with access to any of the viewer's shops, one entry
// per person with their access per shop, plus pending invites grouped by email
// (a multi-shop invite is one Invite row per shop).
export async function GET() {
  const ctx = await getCurrentShopContext();
  if (!ctx || ctx.memberships.length === 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();

  const shops = await teamShops(ctx);
  const shopIds = shops.map((s) => s._id);

  const [memberships, invites] = await Promise.all([
    ShopMembership.find({ shop: { $in: shopIds } })
      .populate("user", "name email")
      .sort({ createdAt: 1 })
      .lean(),
    Invite.find({ shop: { $in: shopIds }, acceptedAt: { $exists: false } })
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const people = new Map<string, any>();
  for (const m of memberships as any[]) {
    if (!m.user) continue;
    const id = m.user._id.toString();
    if (!people.has(id)) {
      people.set(id, {
        userId: id,
        name: m.user.name || "",
        email: m.user.email || "",
        isMe: id === ctx.userId,
        since: m.createdAt,
        access: [],
      });
    }
    people.get(id).access.push({ membershipId: m._id.toString(), shopId: m.shop.toString(), role: m.role });
  }

  const pending = new Map<string, any>();
  for (const inv of invites as any[]) {
    let group = pending.get(inv.email);
    if (!group) {
      group = {
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt,
        invitedBy: inv.invitedBy?.name || inv.invitedBy?.email || "",
        items: [],
      };
      pending.set(inv.email, group);
    }
    if (inv.expiresAt > group.expiresAt) group.expiresAt = inv.expiresAt;
    group.items.push({ inviteId: inv._id.toString(), shopId: inv.shop.toString(), role: inv.role });
  }

  return NextResponse.json({
    currentShopId: ctx.mode === "single" ? ctx.shopId : null,
    shops,
    people: [...people.values()],
    invites: [...pending.values()],
  });
}

// POST /api/team — invite someone to one or more shops.
// Body: { email, role: 'manager' | 'staff', shopIds?: string[] } — shopIds
// defaults to the current shop. One email goes out; accepting it accepts the
// invite at every shop (see /api/invites/accept).
export async function POST(req: Request) {
  const session = await auth();
  const ctx = await getCurrentShopContext();
  if (!session?.user || !ctx || ctx.memberships.length === 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { email?: string; role?: TeamRole; shopIds?: string[] };
  const email = body.email?.trim().toLowerCase();
  const role = body.role;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (role !== "manager" && role !== "staff") {
    return NextResponse.json({ error: "Role must be 'manager' or 'staff'" }, { status: 400 });
  }
  const wanted = body.shopIds?.length ? body.shopIds : ctx.shopId ? [ctx.shopId] : [];
  if (!wanted.length) {
    return NextResponse.json({ error: "Pick at least one shop." }, { status: 400 });
  }

  await connectDB();
  const shops = (await teamShops(ctx)).filter((s) => wanted.includes(s._id));
  if (shops.length !== new Set(wanted).size) {
    return NextResponse.json({ error: "You don't have access to one of those shops." }, { status: 403 });
  }
  const denied = shops.filter((s) => !canAssign(s.myRole, role));
  if (denied.length) {
    return NextResponse.json(
      {
        error:
          role === "manager"
            ? `Only the owner can add managers (${shopList(denied.map((s) => s.name))}).`
            : `You can't invite people to ${shopList(denied.map((s) => s.name))}.`,
      },
      { status: 403 },
    );
  }

  // Shops they're already on are skipped rather than refused.
  const existingUser = await findUserByEmail(email);
  const already = existingUser
    ? new Set(
        (await ShopMembership.find({ user: existingUser._id, shop: { $in: wanted } }).select("shop").lean()).map(
          (m: any) => m.shop.toString(),
        ),
      )
    : new Set<string>();
  const targets = shops.filter((s) => !already.has(s._id));
  if (!targets.length) {
    return NextResponse.json({ error: `${email} already has access to ${shopList(shops.map((s) => s.name))}.` }, { status: 400 });
  }

  // Plan gate per shop. Re-inviting the same address doesn't take a new seat.
  const pendingHere = new Set(
    (await Invite.find({ shop: { $in: targets.map((s) => s._id) }, email, acceptedAt: { $exists: false } }).select("shop").lean()).map(
      (i: any) => i.shop.toString(),
    ),
  );
  const full = targets.filter((s) => !pendingHere.has(s._id) && !seatFree(s));
  if (full.length) {
    const plan = full[0].plan;
    return NextResponse.json(
      {
        error: plan.hasStaffLogins
          ? `The ${plan.label} plan includes ${plan.staffLoginLimit} staff login${plan.staffLoginLimit === 1 ? "" : "s"} per shop and ${shopList(full.map((s) => s.name))} ${full.length === 1 ? "is" : "are"} full. Upgrade to Business for unlimited team logins.`
          : `The ${plan.label} plan doesn't include team logins. Upgrade to Pro for one staff login, or Business for unlimited.`,
        upgradeRequired: true,
      },
      { status: 402 },
    );
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tokens: string[] = [];
  for (const s of targets) {
    const token = crypto.randomBytes(24).toString("hex");
    tokens.push(token);
    await Invite.findOneAndUpdate(
      { shop: s._id, email, acceptedAt: { $exists: false } },
      { $set: { role, token, expiresAt, invitedBy: session.user.id } },
      { upsert: true },
    );
  }

  // Best-effort email; the first shop's token accepts them all.
  sendTeamInviteEmail({
    to: email,
    shopName: shopList(targets.map((s) => s.name)),
    inviterName: session.user.name || "A teammate",
    role,
    token: tokens[0],
  }).catch((err) => console.error("[team] invite email failed:", err));

  return NextResponse.json({
    ok: true,
    invited: targets.map((s) => s.name),
    skipped: shops.filter((s) => already.has(s._id)).map((s) => s.name),
  });
}
