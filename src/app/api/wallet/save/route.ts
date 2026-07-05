import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { StampCard, Shop } from "@/models";
import { issueSaveLinks } from "@/lib/wallet";
import { walletAvailable } from "@/lib/wallet/config";

// POST: customer-facing. Given { shopId, customerId }, ensure a StampCard
// exists and return "Add to Wallet" links for the configured + enabled
// providers. No merchant auth — this mirrors the cookie-based customer card.
export async function POST(req: Request) {
  await connectDB();
  const { shopId, customerId } = await req.json();
  if (!shopId || !customerId) {
    return NextResponse.json({ error: "Missing shopId or customerId" }, { status: 400 });
  }

  const shop = await Shop.findById(shopId).select("walletPasses").lean<any>();
  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }
  if (!walletAvailable(!!shop.walletPasses).enabled) {
    return NextResponse.json({ error: "Wallet passes not enabled" }, { status: 403 });
  }

  // Ensure a card exists so the pass has something to represent.
  const card = await StampCard.findOneAndUpdate(
    { shop: shopId, customer: customerId },
    { $setOnInsert: { shop: shopId, customer: customerId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const links = await issueSaveLinks(card._id.toString());
  return NextResponse.json({ links });
}
