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

type ApplePassLike = { registrations?: Array<{ pushToken?: string }> };

// Every device push token registered across the given Apple passes.
function applePushTokens(passes: ApplePassLike[]): string[] {
  return passes
    .flatMap((p) => p.registrations || [])
    .map((r) => r.pushToken)
    .filter((tok): tok is string => Boolean(tok));
}

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
    language: shop.language || "en",
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

  // One recovery token per card, shared by both providers. The pass embeds
  // `${APP_URL}/api/wallet/recover?t=…`, which restores the customer's browser
  // cookie if they lose it. Prefer a legacy pass's token (issued before the
  // token moved onto the card) so already-saved passes keep the same link;
  // otherwise claim one ATOMICALLY on the StampCard, so two simultaneous
  // first-time saves converge on a single value instead of racing.
  const legacy = await WalletPass.findOne({ card: d.cardId })
    .select("recoverToken authToken")
    .lean<any>();
  let recoverToken: string | undefined =
    legacy?.recoverToken || legacy?.authToken || undefined;
  if (!recoverToken) {
    // Only the first writer's filter matches; concurrent callers no-op and then
    // read back the same token.
    await StampCard.updateOne(
      { _id: d.cardId, walletRecoverToken: { $exists: false } },
      { $set: { walletRecoverToken: crypto.randomBytes(24).toString("hex") } },
    );
    recoverToken = (
      await StampCard.findById(d.cardId)
        .select("walletRecoverToken")
        .lean<any>()
    )?.walletRecoverToken;
  }
  d.recoverUrl = `${APP_URL}/api/wallet/recover?t=${recoverToken}`;

  const links: SaveLinks = { google: null, apple: null };

  // Each provider is isolated: a Google outage must not abort the Apple link
  // (or vice versa). The customer still gets whichever provider succeeded.
  if (avail.google) {
    try {
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
            recoverToken,
          },
          { upsert: true },
        );
      }
    } catch (err) {
      console.error("[Wallet] google save link failed for card", cardId, err);
    }
  }

  if (avail.apple && isAppleWalletConfigured()) {
    try {
      // Reuse the existing serial + web-service authToken across re-issues so
      // the pass already in the customer's wallet keeps matching our records.
      // The serial is a RANDOM token, not `card_<id>`: it's the only key on the
      // unauthenticated .pkpass download route, so it must not be derivable from
      // the (non-secret) card id.
      const existingApple = await WalletPass.findOne({
        card: d.cardId,
        provider: "apple",
      })
        .select("serial authToken")
        .lean<any>();
      const serial =
        existingApple?.serial || `apple_${crypto.randomBytes(24).toString("hex")}`;
      const authToken =
        existingApple?.authToken || crypto.randomBytes(24).toString("hex");
      await WalletPass.updateOne(
        { card: d.cardId, provider: "apple" },
        {
          card: d.cardId,
          shop: d.shopId,
          customer: customerId,
          provider: "apple",
          serial,
          authToken,
          recoverToken,
        },
        { upsert: true },
      );
      // Direct .pkpass download — Wallet opens it natively on iOS.
      links.apple = `${APP_URL}/api/wallet/apple/download/${serial}`;
    } catch (err) {
      console.error("[Wallet] apple save link failed for card", cardId, err);
    }
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
    .select("card authToken recoverToken")
    .lean<any>();
  if (!pass?.card || !pass.authToken) return null;
  const d = await buildCardData(pass.card.toString());
  if (!d) return null;
  // Recover link uses the recover token, NOT the web-service authToken, so a
  // pass never exposes the credential that authenticates its refreshes.
  const recoverToken = pass.recoverToken || pass.authToken;
  const recoverUrl = `${APP_URL}/api/wallet/recover?t=${recoverToken}`;
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
        // Prefer the public Spaces URL (content-hashed, so logo changes bust
        // Google's server-side cache) — matches buildCardData. Passing shop.logo
        // alone drops logoUrl and reverts the pass to the fallback mark.
        shopLogo: shop.logoUrl || shop.logo || null,
        bgColor: shop.bgColor || "stone-800",
        fgColor: shop.fgColor || "amber-600",
        perkMode: !!shop.perkMode,
        language: shop.language || "en",
      });
    }

    if (avail.apple) {
      const passes = await WalletPass.find({ shop: shopId, provider: "apple" })
        .select("registrations")
        .lean<ApplePassLike[]>();
      await applePushUpdate(applePushTokens(passes));
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
    if (!passes.length) {
      console.log(`[Wallet] sync: no passes for card=${cardId} (nothing to push)`);
      return;
    }
    const d = await buildCardData(cardId);
    if (!d) return;
    const applePass = passes.find((p) => p.provider === "apple");
    console.log(
      `[Wallet] sync card=${cardId} stamps=${d.stamps}/${d.threshold} providers=[${passes
        .map((p) => p.provider)
        .join(",")}] appleRegs=${(applePass?.registrations || []).length}`,
    );
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
        await applePushUpdate(applePushTokens([p]));
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
