import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Invite } from "@/models";
import { getCurrentShopContext } from "@/lib/shop-context";

// DELETE /api/team/invites/[id] — revoke a pending invite.
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
  const inv = await Invite.findById(id);
  if (!inv || inv.shop.toString() !== ctx.shop._id.toString()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await Invite.deleteOne({ _id: inv._id });
  return NextResponse.json({ ok: true });
}
