import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

const ADMIN_EMAIL = "mbathie@gmail.com";

// PATCH: activate / deactivate a promotion code. Deactivating stops new
// redemptions immediately without deleting the (immutable) coupon behind it.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { active } = await req.json().catch(() => ({}));
  if (typeof active !== "boolean") {
    return NextResponse.json(
      { error: "active must be a boolean" },
      { status: 400 },
    );
  }

  const promo = await stripe.promotionCodes.update(id, { active });
  return NextResponse.json({ id: promo.id, active: promo.active });
}
