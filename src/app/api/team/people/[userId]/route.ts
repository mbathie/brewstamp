import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { ShopMembership } from "@/models";
import { getCurrentShopContext } from "@/lib/shop-context";
import { canAssign, seatFree, shopList, teamShops, type TeamRole } from "@/lib/team";

type Access = Record<string, TeamRole | null>;

// PUT /api/team/people/[userId] — set which shops a login can use, and as
// what. Body: { access: { [shopId]: 'manager' | 'staff' | null } }; null
// removes them from that shop, shops left out are untouched. Adding a shop
// gives access straight away (they already have a login), subject to the
// plan's staff seats. An owner can also send allShops: true to have them
// follow every shop the owner adds later, or false to stop that.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const body = (await req.json().catch(() => ({}))) as { access?: Access; allShops?: boolean };
  if (!body.access || typeof body.access !== "object") {
    return NextResponse.json({ error: "Missing access" }, { status: 400 });
  }
  const { userId } = await params;
  return setAccess(userId, body.access, false, typeof body.allShops === "boolean" ? body.allShops : undefined);
}

// DELETE /api/team/people/[userId] — remove them from every shop the viewer
// manages.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const ctx = await getCurrentShopContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access: Access = Object.fromEntries(ctx.memberships.map((m) => [m.shopId, null]));
  return setAccess(userId, access, true);
}

async function setAccess(userId: string, access: Access, lenient = false, allShops?: boolean) {
  const ctx = await getCurrentShopContext();
  if (!ctx || ctx.memberships.length === 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (userId === ctx.userId) {
    return NextResponse.json({ error: "You can't change your own access — ask the owner." }, { status: 400 });
  }
  for (const role of Object.values(access)) {
    if (role !== null && role !== "manager" && role !== "staff") {
      return NextResponse.json({ error: "Role must be 'manager' or 'staff'" }, { status: 400 });
    }
  }

  await connectDB();
  const shops = new Map((await teamShops(ctx)).map((s) => [s._id, s]));
  const current = new Map(
    (await ShopMembership.find({ user: userId, shop: { $in: [...shops.keys()] } }).lean()).map((m: any) => [
      m.shop.toString(),
      m,
    ]),
  );

  const creates: { shop: string; role: TeamRole }[] = [];
  const updates: { id: unknown; role: TeamRole }[] = [];
  const deletes: unknown[] = [];
  const denied: string[] = [];
  const full: string[] = [];

  for (const [shopId, role] of Object.entries(access)) {
    const shop = shops.get(shopId);
    if (!shop) {
      if (lenient) continue;
      return NextResponse.json({ error: "You don't have access to one of those shops." }, { status: 403 });
    }
    const m = current.get(shopId);
    if (role === null) {
      if (!m) continue;
      // Removing needs the same rights as changing their role there.
      if (!canAssign(shop.myRole, "staff", m.role)) {
        if (!lenient) denied.push(shop.name);
        continue;
      }
      deletes.push(m._id);
    } else if (!m) {
      if (!canAssign(shop.myRole, role)) denied.push(shop.name);
      else if (!seatFree(shop)) full.push(shop.name);
      else creates.push({ shop: shopId, role });
    } else if (m.role !== role) {
      if (!canAssign(shop.myRole, role, m.role)) denied.push(shop.name);
      else updates.push({ id: m._id, role });
    }
  }

  if (denied.length) {
    return NextResponse.json(
      { error: `You can't make that change at ${shopList(denied)}. Only the owner can manage managers.` },
      { status: 403 },
    );
  }
  if (full.length) {
    return NextResponse.json(
      {
        error: `No staff logins left at ${shopList(full)} on your plan. Upgrade to Business for unlimited team logins.`,
        upgradeRequired: true,
      },
      { status: 402 },
    );
  }

  await Promise.all([
    creates.length &&
      ShopMembership.insertMany(
        creates.map((c) => ({ user: userId, shop: c.shop, role: c.role, invitedBy: ctx.userId, acceptedAt: new Date() })),
      ),
    ...updates.map((u) => ShopMembership.updateOne({ _id: u.id }, { $set: { role: u.role } })),
    deletes.length && ShopMembership.deleteMany({ _id: { $in: deletes } }),
  ]);

  // Only the owner decides whether someone follows all their shops.
  if (allShops !== undefined) {
    const owned = [...shops.values()].filter((s) => s.myRole === "owner").map((s) => s._id);
    if (owned.length) {
      await ShopMembership.updateMany(
        { user: userId, shop: { $in: owned }, role: { $ne: "owner" } },
        allShops ? { $set: { allShops: true } } : { $unset: { allShops: 1 } },
      );
    }
  }

  return NextResponse.json({ ok: true, added: creates.length, changed: updates.length, removed: deletes.length });
}
