import { connectDB } from "@/lib/mongoose";
import { StampCard, Shop, Customer, WalletPass } from "@/models";
import { generateAnimalName } from "@/lib/animal-names";
import { isAppleWalletConfigured, walletAvailable } from "./config";
import { googleSaveUrl, googleUpdateObject, type WalletCardData } from "./google";
// Apple provider lands in the Apple milestone; the orchestration below already
// branches on isAppleWalletConfigured() so it slots in without changes here.

type CardDoc = {
  _id: { toString(): string };
  shop: { toString(): string };
  customer: { toString(): string };
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
};

async function buildCardData(cardId: string): Promise<WalletCardData | null> {
  const card = (await StampCard.findById(cardId).lean()) as CardDoc | null;
  if (!card) return null;
  const [shop, customer] = await Promise.all([
    Shop.findById(card.shop).lean<any>(),
    Customer.findById(card.customer).lean<any>(),
  ]);
  if (!shop || !customer) return null;
  return {
    cardId: card._id.toString(),
    shopId: card.shop.toString(),
    shopName: shop.name,
    shopLogo: shop.logo || null,
    shopCode: shop.code,
    bgColor: shop.bgColor || "stone-800",
    fgColor: shop.fgColor || "amber-600",
    customerName: customer.name?.trim() || generateAnimalName(customer.cookieId),
    perkMode: !!shop.perkMode,
    stamps: card.stamps || 0,
    totalEarned: card.totalEarned || 0,
    freeRedeemed: card.freeRedeemed || 0,
    threshold: shop.stampThreshold || 8,
  };
}

export interface SaveLinks {
  google: string | null;
  apple: string | null;
}

/**
 * Issue "Add to Wallet" links for a card and record the pass(es) so future
 * stamp changes get pushed. Only returns links for configured + enabled
 * providers. Safe when nothing is configured (returns nulls).
 */
export async function issueSaveLinks(cardId: string): Promise<SaveLinks> {
  await connectDB();
  const d = await buildCardData(cardId);
  if (!d) return { google: null, apple: null };

  const shop = await Shop.findById(d.shopId).select("walletPasses").lean<any>();
  const avail = walletAvailable(!!shop?.walletPasses);
  if (!avail.enabled) return { google: null, apple: null };

  const links: SaveLinks = { google: null, apple: null };

  if (avail.google) {
    links.google = await googleSaveUrl(d);
    if (links.google) {
      await WalletPass.updateOne(
        { card: d.cardId, provider: "google" },
        {
          card: d.cardId,
          shop: d.shopId,
          customer: (await StampCard.findById(cardId).select("customer").lean<any>())?.customer,
          provider: "google",
          serial: `card_${d.cardId}`,
        },
        { upsert: true },
      );
    }
  }

  // Apple link is wired in the Apple milestone (.pkpass endpoint).
  if (avail.apple && isAppleWalletConfigured()) {
    links.apple = null;
  }

  return links;
}

/**
 * Push the latest balance to every wallet pass registered for a card. Call
 * fire-and-forget after a stamp/redeem change — never block or throw into the
 * approval flow.
 */
export async function syncWalletPasses(cardId: string): Promise<void> {
  try {
    const passes = await WalletPass.find({ card: cardId }).select("provider").lean<any[]>();
    if (!passes.length) return;
    const d = await buildCardData(cardId);
    if (!d) return;
    for (const p of passes) {
      if (p.provider === "google") {
        await googleUpdateObject(d);
        await WalletPass.updateOne(
          { card: cardId, provider: "google" },
          { lastPushedAt: new Date() },
        );
      }
      // Apple push (APNs) lands in the Apple milestone.
    }
  } catch (err) {
    console.error("[Wallet] sync failed for card", cardId, err);
  }
}
