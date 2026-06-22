import crypto from "crypto";
import { connectDB } from "@/lib/mongoose";
import { StampCard, Shop, Customer, WalletPass } from "@/models";
import { generateAnimalName } from "@/lib/animal-names";
import { APP_URL, isAppleWalletConfigured, walletAvailable } from "./config";
import {
  googleSaveUrl,
  googleUpdateClassBranding,
  googleUpdateObject,
  type WalletCardData,
} from "./google";
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
    // Prefer the public Spaces URL — wallet providers fetch logos by URL and
    // can't use the data: URI stored in shop.logo.
    shopLogo: shop.logoUrl || shop.logo || null,
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

  const customerId = (
    await StampCard.findById(cardId).select("customer").lean<any>()
  )?.customer;

  // One recovery token per card, shared by both providers and reused across
  // re-issues. The pass embeds `${APP_URL}/api/wallet/recover?t=…`, which
  // restores this customer's browser cookie if they lose it.
  const existingToken = (
    await WalletPass.findOne({ card: d.cardId }).select("authToken").lean<any>()
  )?.authToken;
  const recoverToken = existingToken || crypto.randomBytes(24).toString("hex");
  d.recoverUrl = `${APP_URL}/api/wallet/recover?t=${recoverToken}`;

  const links: SaveLinks = { google: null, apple: null };

  if (avail.google) {
    links.google = await googleSaveUrl(d);
    if (links.google) {
      await WalletPass.updateOne(
        { card: d.cardId, provider: "google" },
        {
          card: d.cardId,
          shop: d.shopId,
          customer: customerId,
          provider: "google",
          serial: `card_${d.cardId}`,
          authToken: recoverToken,
        },
        { upsert: true },
      );
    }
  }

  if (avail.apple && isAppleWalletConfigured()) {
    const serial = `card_${d.cardId}`;
    await WalletPass.updateOne(
      { card: d.cardId, provider: "apple" },
      {
        card: d.cardId,
        shop: d.shopId,
        customer: customerId,
        provider: "apple",
        serial,
        authToken: recoverToken,
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
  const recoverUrl = `${APP_URL}/api/wallet/recover?t=${pass.authToken}`;
  return buildPkpass(d, pass.authToken, serial, recoverUrl);
}

/**
 * Push updated SHOP BRANDING (logo, accent colour, name, perk mode) to every
 * saved wallet pass for the shop. Call fire-and-forget after a Shop Setup save
 * that changed branding. Google needs one class PATCH (objects inherit it);
 * Apple needs a push per device so it re-fetches the rebuilt .pkpass. Never
 * throws into the settings flow.
 */
export async function syncWalletBranding(shopId: string): Promise<void> {
  try {
    await connectDB();
    const shop = await Shop.findById(shopId).lean<any>();
    if (!shop) return;
    const avail = walletAvailable(!!shop.walletPasses);
    if (!avail.enabled) return;

    if (avail.google) {
      await googleUpdateClassBranding({
        shopId: shop._id.toString(),
        shopName: shop.name,
        shopLogo: shop.logo || null,
        bgColor: shop.bgColor || "stone-800",
        fgColor: shop.fgColor || "amber-600",
        perkMode: !!shop.perkMode,
      });
    }

    if (avail.apple) {
      const passes = await WalletPass.find({ shop: shopId, provider: "apple" })
        .select("registrations")
        .lean<any[]>();
      const tokens = passes
        .flatMap((p) => p.registrations || [])
        .map((r: any) => r.pushToken)
        .filter(Boolean);
      await applePushUpdate(tokens);
      await WalletPass.updateMany(
        { shop: shopId, provider: "apple" },
        { lastPushedAt: new Date() },
      );
    }
  } catch (err) {
    console.error("[Wallet] branding sync failed for shop", shopId, err);
  }
}

/**
 * Sync every wallet pass belonging to a customer — across all the shops they
 * hold a card with. Call fire-and-forget after a customer's name changes (the
 * name shows on the pass). Walks each of their cards through syncWalletPasses.
 */
export async function syncWalletPassesForCustomer(
  customerId: string,
): Promise<void> {
  try {
    const cards = await WalletPass.find({ customer: customerId }).distinct(
      "card",
    );
    for (const cardId of cards) {
      await syncWalletPasses(cardId.toString());
    }
  } catch (err) {
    console.error("[Wallet] customer sync failed for", customerId, err);
  }
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
