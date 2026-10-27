import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, StampRequest } from "@/models";
import { requireMerchant, unauthorized } from "@/lib/api-auth";
import { syncWalletPasses } from "@/lib/wallet";

const MAX_REASON = 200;

// POST: take stamps off a customer's card at one shop (a stamp given by
// mistake, a duplicate scan). Owners and managers only. Each removal is logged
// as an "adjusted" StampRequest, so it shows in the customer's history beside
// the stamps they earned.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const merchant = await requireMerchant();
  if (!merchant) return unauthorized();

  const { id } = await params;
  const { shopId, stamps, reason } = await req.json().catch(() => ({}));
  if (!isValidObjectId(id) || !isValidObjectId(shopId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const role = merchant.memberships.find((m) => m.shopId === String(shopId))?.role;
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json(
      { error: "Only owners and managers can remove stamps." },
      { status: 403 },
    );
  }
  const amount = Number(stamps);
  if (!Number.isInteger(amount) || amount < 1) {
    return NextResponse.json({ error: "Enter a whole number of stamps to remove." }, { status: 400 });
  }
  const note = typeof reason === "string" ? reason.trim().slice(0, MAX_REASON) : "";

  await connectDB();

  const shop = await Shop.findById(shopId).select("perkMode").lean<{ perkMode?: boolean }>();
  if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (shop.perkMode) {
    return NextResponse.json({ error: "Perk shops don't keep stamps." }, { status: 400 });
  }

  // Conditional on the balance, so two removals at once can't take the card
  // below zero. Lifetime stamps drop too: a stamp given by mistake was never
  // earned.
  const card = await StampCard.findOneAndUpdate(
    { shop: shopId, customer: id, stamps: { $gte: amount } },
    [
      {
        $set: {
          stamps: { $subtract: ["$stamps", amount] },
          totalEarned: { $max: [0, { $subtract: ["$totalEarned", amount] }] },
        },
      },
    ],
    { returnDocument: "after", updatePipeline: true },
  );
  if (!card) {
    const exists = await StampCard.exists({ shop: shopId, customer: id });
    return exists
      ? NextResponse.json({ error: "The card doesn't have that many stamps." }, { status: 409 })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entry = new StampRequest({
    shop: shopId,
    customer: id,
    status: "adjusted",
    stampsAwarded: -amount,
    adjustedBy: merchant.userId,
    ...(note ? { reason: note } : {}),
  });
  entry.expiresAt = undefined; // a log entry, not a pending request: no TTL
  await entry.save();

  void syncWalletPasses(card._id.toString());

  return NextResponse.json({
    stampCard: {
      stamps: card.stamps,
      totalEarned: card.totalEarned,
      freeRedeemed: card.freeRedeemed,
    },
  });
}
