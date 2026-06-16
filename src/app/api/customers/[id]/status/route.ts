import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { StampCard } from "@/models";

// PATCH: enable/disable a customer at the merchant's current shop. Disabling is
// per-shop (lives on the StampCard) and blocks both stamp earning and perk
// claims. Upserts the card so a customer with no card yet can be pre-disabled.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { disabled } = await req.json();
  if (typeof disabled !== "boolean") {
    return NextResponse.json(
      { error: "disabled must be a boolean" },
      { status: 400 },
    );
  }

  await connectDB();

  const card = await StampCard.findOneAndUpdate(
    { shop: merchant.shop._id, customer: id },
    { $set: { disabled } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return NextResponse.json({ disabled: !!card.disabled });
}
