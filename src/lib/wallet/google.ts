import crypto from "crypto";
import { GoogleAuth } from "google-auth-library";
import { getColorHex } from "@/lib/tailwind-colors";
import { APP_URL, googleWalletCreds } from "./config";

/**
 * Google Wallet (Android) loyalty passes. Server-side only.
 *
 * Model: each shop gets one LoyaltyClass (branding/template); each customer
 * card gets one LoyaltyObject (their balance). The customer adds it via a
 * signed "Save to Google Wallet" JWT link; we PATCH the object when stamps
 * change, which pushes the update to their device automatically.
 */

const BASE = "https://walletobjects.googleapis.com/walletobjects/v1";
const SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";

// Stamp-card branding shared by class + object.
export interface WalletCardData {
  cardId: string;
  shopId: string;
  shopName: string;
  shopLogo: string | null;
  shopCode: string;
  bgColor: string;
  fgColor: string;
  customerName: string;
  perkMode: boolean;
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
  threshold: number;
}

function classId(issuerId: string, shopId: string) {
  return `${issuerId}.shop_${shopId}`;
}
function objectId(issuerId: string, cardId: string) {
  return `${issuerId}.card_${cardId}`;
}

async function accessToken(): Promise<string | null> {
  const creds = googleWalletCreds();
  if (!creds) return null;
  const auth = new GoogleAuth({
    credentials: { client_email: creds.clientEmail, private_key: creds.privateKey },
    scopes: [SCOPE],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  return token ?? null;
}

// Google requires a programLogo on every loyalty class — fall back to the
// Brewstamp mark when the shop hasn't uploaded one (a publicly reachable URL,
// since Google fetches it server-side).
const FALLBACK_LOGO = "https://brewstamp.app/apple-touch-icon.png";

function loyaltyClassBody(issuerId: string, d: WalletCardData) {
  return {
    id: classId(issuerId, d.shopId),
    issuerName: d.shopName,
    programName: d.perkMode ? "Staff perk" : `${d.shopName} loyalty`,
    reviewStatus: "UNDER_REVIEW",
    // Use the shop's accent colour as the pass background so it reads as their
    // brand (Google auto-picks legible label colours from this).
    hexBackgroundColor: getColorHex(d.fgColor),
    programLogo: {
      sourceUri: { uri: d.shopLogo || FALLBACK_LOGO },
      contentDescription: {
        defaultValue: { language: "en", value: `${d.shopName} logo` },
      },
    },
  };
}

function balanceString(d: WalletCardData): string {
  if (d.perkMode) return `${d.freeRedeemed} redeemed`;
  return `${d.stamps} / ${d.threshold} stamps`;
}

function loyaltyObjectBody(issuerId: string, d: WalletCardData) {
  return {
    id: objectId(issuerId, d.cardId),
    classId: classId(issuerId, d.shopId),
    state: "ACTIVE",
    accountName: d.customerName,
    accountId: d.cardId,
    loyaltyPoints: {
      label: d.perkMode ? "Free rewards" : "Stamps",
      balance: { string: balanceString(d) },
    },
    barcode: {
      type: "QR_CODE",
      value: `${APP_URL}/s/${d.shopCode}`,
      alternateText: d.shopName,
    },
  };
}

async function apiGet(token: string, path: string): Promise<Response> {
  return fetch(`${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function logIfError(label: string, res: Response) {
  if (!res.ok) {
    console.error(`[Wallet/google] ${label} ${res.status}:`, await res.text());
  }
  return res;
}

/**
 * Create the shop's class if missing, or update its branding (logo/colours/name)
 * if it already exists — so editing the shop's brand reflects on saved passes.
 */
async function ensureClass(token: string, issuerId: string, d: WalletCardData) {
  const id = classId(issuerId, d.shopId);
  const res = await apiGet(token, `loyaltyClass/${id}`);
  if (res.status === 404) {
    await logIfError(
      "class create",
      await fetch(`${BASE}/loyaltyClass`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(loyaltyClassBody(issuerId, d)),
      }),
    );
  } else if (res.ok) {
    await logIfError(
      "class update",
      await fetch(`${BASE}/loyaltyClass/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(loyaltyClassBody(issuerId, d)),
      }),
    );
  }
}

/**
 * Build a "Save to Google Wallet" URL for a card. Ensures the class + object
 * exist, then returns a signed JWT link. Returns null if Google Wallet isn't
 * configured.
 */
export async function googleSaveUrl(d: WalletCardData): Promise<string | null> {
  const creds = googleWalletCreds();
  if (!creds) return null;
  const token = await accessToken();
  if (!token) return null;

  await ensureClass(token, creds.issuerId, d);

  const oid = objectId(creds.issuerId, d.cardId);
  const existing = await apiGet(token, `loyaltyObject/${oid}`);
  if (existing.status === 404) {
    await logIfError(
      "object create",
      await fetch(`${BASE}/loyaltyObject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(loyaltyObjectBody(creds.issuerId, d)),
      }),
    );
  }

  // Signed JWT save link (RS256 with the service-account private key).
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: creds.clientEmail,
    aud: "google",
    typ: "savetowallet",
    origins: [APP_URL],
    payload: { loyaltyObjects: [{ id: oid }] },
  };
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64(header)}.${b64(payload)}`;
  const sig = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(creds.privateKey, "base64url");
  return `https://pay.google.com/gp/v/save/${unsigned}.${sig}`;
}

/**
 * Push the latest balance to an existing Google Wallet object (PATCH). No-op if
 * unconfigured. Safe to call fire-and-forget on every stamp change.
 */
export async function googleUpdateObject(d: WalletCardData): Promise<void> {
  const creds = googleWalletCreds();
  if (!creds) return;
  const token = await accessToken();
  if (!token) return;
  const oid = objectId(creds.issuerId, d.cardId);
  await fetch(`${BASE}/loyaltyObject/${oid}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      loyaltyPoints: {
        label: d.perkMode ? "Free rewards" : "Stamps",
        balance: { string: balanceString(d) },
      },
    }),
  });
}
