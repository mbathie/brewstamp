import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { StampCard } from "@/models";
import { isTopCustomer } from "@/lib/top-customers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await connectDB();
  const card = await StampCard.findOne({
    shop: merchant.shop._id,
    customer: id,
  })
    .select("notes tags")
    .lean<{ notes?: string; tags?: string[] }>();
  const topCustomer = await isTopCustomer(
    merchant.shop._id,
    id,
    undefined,
    !!merchant.shop.perkMode,
  );
  return NextResponse.json({
    notes: card?.notes || "",
    tags: card?.tags || [],
    isTopCustomer: topCustomer,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const notes =
    typeof body.notes === "string" ? body.notes.slice(0, 2000) : undefined;
  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter((t: unknown): t is string => typeof t === "string")
        .map((t: string) => t.trim())
        .filter(Boolean)
        .slice(0, 10)
    : undefined;

  await connectDB();

  const update: Record<string, unknown> = {};
  if (notes !== undefined) update.notes = notes;
  if (tags !== undefined) update.tags = tags;

  const card = await StampCard.findOneAndUpdate(
    { shop: merchant.shop._id, customer: id },
    { $set: update },
    { new: true },
  );

  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ notes: card.notes, tags: card.tags });
}
