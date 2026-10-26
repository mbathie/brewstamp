import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Invite } from "@/models";
import { getCurrentShopContext } from "@/lib/shop-context";
import { canAssign } from "@/lib/team";

// DELETE /api/team/invites/[id] — revoke a pending invite at one shop. Allowed
// to whoever could have sent it there (see canAssign).
export async function DELETE(
  _req: NextRequest,
  ctxArg: { params: Promise<{ id: string }> }
) {
  const ctx = await getCurrentShopContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await ctxArg.params;
  const inv = await Invite.findById(id);
  const mine = inv && ctx.memberships.find((m) => m.shopId === inv.shop.toString());
  if (!inv || !mine) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAssign(mine.role, inv.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Invite.deleteOne({ _id: inv._id });
  return NextResponse.json({ ok: true });
}
