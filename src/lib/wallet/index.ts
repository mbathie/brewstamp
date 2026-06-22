import crypto from "crypto";
import { connectDB } from "@/lib/mongoose";
import { StampCard, Shop, Customer, WalletPass } from "@/models";
import { generateAnimalName } from "@/lib/animal-names";
import { APP_URL, isAppleWalletConfigured, walletAvailable } from "./config";
import { googleSaveUrl, googleUpdateObject, type WalletCardData } from "./google";
import { applePushUpdate, buildPkpass } from "./apple";

// Re-export so route handlers (e.g. the .pkpass download) can rebuild a pass.
export { buildPkpass } from "./apple";
export type { WalletCardData } from "./google";

type CardDoc = {
  _id: { toString(): string };
  shop: { toString(): string };
  customer: { toString(): string };
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
};

export async function buildCardData(
  cardId: string,
): Promise<WalletCardData | null> {
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

  if (avail.apple && isAppleWalletConfigured()) {
    const customerId = (
      await StampCard.findById(cardId).select("customer").lean<any>()
    )?.customer;
    const serial = `card_${d.cardId}`;
    // Reuse the existing auth token if this pass was issued before, so a
    // re-download keeps the same web-service credential.
    const existing = await WalletPass.findOne({
      card: d.cardId,
      provider: "apple",
    })
      .select("authToken")
      .lean<any>();
    const authToken = existing?.authToken || crypto.randomBytes(24).toString("hex");
    await WalletPass.updateOne(
      { card: d.cardId, provider: "apple" },
      {
        card: d.cardId,
        shop: d.shopId,
        customer: customerId,
        provider: "apple",
        serial,
        authToken,
      },
      { upsert: true },
    );
    // Direct .pkpass download — Wallet opens it natively on iOS.
    links.apple = `${APP_URL}/api/wallet/apple/download/${serial}`;
  }

  return links;
}

/**
 * Rebuild the signed .pkpass for an Apple pass identified by its serialNumber.
 * Used by both the initial download route and the PassKit web-service GET. Reads
 * the per-pass authToken so the served pass carries the right credential.
 * Returns null if the pass isn't found or Apple Wallet isn't configured.
 */
export async function pkpassForSerial(serial: string): Promise<Buffer | null> {
  await connectDB();
  const pass = await WalletPass.findOne({ serial, provider: "apple" })
    .select("card authToken")
    .lean<any>();
  if (!pass?.card || !pass.authToken) return null;
  const d = await buildCardData(pass.card.toString());
  if (!d) return null;
  return buildPkpass(d, pass.authToken, serial);
}

/**
 * Push the latest balance to every wallet pass registered for a card. Call
 * fire-and-forget after a stamp/redeem change — never block or throw into the
 * approval flow.
 */
export async function syncWalletPasses(cardId: string): Promise<void> {
  try {
    const passes = await WalletPass.find({ card: cardId })
      .select("provider registrations")
      .lean<any[]>();
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
      } else if (p.provider === "apple") {
        // Empty APNs push wakes each registered device; it then re-fetches the
        // freshly-built pass from our web service. The pass body itself is
        // rebuilt on demand in the download/web-service route.
        const tokens = (p.registrations || [])
          .map((r: any) => r.pushToken)
          .filter(Boolean);
        await applePushUpdate(tokens);
        await WalletPass.updateOne(
          { card: cardId, provider: "apple" },
          { lastPushedAt: new Date() },
        );
      }
    }
  } catch (err) {
    console.error("[Wallet] sync failed for card", cardId, err);
  }
}
