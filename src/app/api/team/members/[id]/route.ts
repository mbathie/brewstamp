import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { ShopMembership } from "@/models";
import { getCurrentShopContext } from "@/lib/shop-context";

// PATCH /api/team/members/[id] — change a member's role.
// Body: { role: 'manager' | 'staff' }
//
// Cannot promote anyone to "owner" via this route (ownership transfer is
// a Phase 3 feature). Cannot demote the existing owner. Manager can change
// roles among staff/manager but not touch the owner.
export async function PATCH(
  req: NextRequest,
  ctxArg: { params: Promise<{ id: string }> }
) {
  const ctx = await getCurrentShopContext();
  if (!ctx || ctx.mode !== "single") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myMembership = ctx.memberships.find((m) => m.shopId === ctx.shopId);
  if (
    !myMembership ||
    (myMembership.role !== "owner" && myMembership.role !== "manager")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    role?: "manager" | "staff";
  };
  if (body.role !== "manager" && body.role !== "staff") {
    return NextResponse.json(
      { error: "Role must be 'manager' or 'staff'" },
      { status: 400 }
    );
  }
  // Only the owner can grant the manager role.
  if (body.role === "manager" && myMembership.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can promote to manager." },
      { status: 403 }
    );
  }

  await connectDB();
  const { id } = await ctxArg.params;
  const target = await ShopMembership.findById(id);
  if (!target || target.shop.toString() !== ctx.shop._id.toString()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json(
      { error: "Owner role can't be changed here." },
      { status: 400 }
    );
  }

  target.role = body.role;
  await target.save();

  return NextResponse.json({ ok: true });
}

// DELETE /api/team/members/[id] — remove a member from the current shop.
// Owners cannot be removed. Users cannot remove themselves via this route
// (use a "leave" flow once it exists).
export async function DELETE(
  _req: NextRequest,
  ctxArg: { params: Promise<{ id: string }> }
) {
  const ctx = await getCurrentShopContext();
  if (!ctx || ctx.mode !== "single") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myMembership = ctx.memberships.find((m) => m.shopId === ctx.shopId);
  if (
    !myMembership ||
    (myMembership.role !== "owner" && myMembership.role !== "manager")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await ctxArg.params;
  const target = await ShopMembership.findById(id);
  if (!target || target.shop.toString() !== ctx.shop._id.toString()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json(
      { error: "The shop owner can't be removed." },
      { status: 400 }
    );
  }
  if (target.user.toString() === ctx.userId) {
    return NextResponse.json(
      { error: "You can't remove yourself — ask another admin." },
      { status: 400 }
    );
  }

  await ShopMembership.deleteOne({ _id: target._id });
  return NextResponse.json({ ok: true });
}
