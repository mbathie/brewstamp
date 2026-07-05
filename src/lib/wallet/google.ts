import crypto from "crypto";
import { GoogleAuth } from "google-auth-library";
import { getColorHex } from "@/lib/tailwind-colors";
import { t } from "@/lib/i18n";
import { APP_URL, googleWalletCreds } from "./config";
import { balanceString } from "./content";

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

// Shop-level branding that lives on the loyaltyClass (shared by every pass for
// the shop). A subset of WalletCardData so either can drive the class body.
export interface WalletClassData {
  shopId: string;
  shopName: string;
  shopLogo: string | null;
  bgColor: string;
  fgColor: string;
  perkMode: boolean;
  // Shop's customer-facing language — localizes the pass text.
  language: string;
}

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
  // Shop's customer-facing language — localizes the pass text.
  language: string;
  // "Recover my card" deep link embedded in the pass — restores the browser
  // cookie for this customer if they lose it. Optional (set at issue time).
  recoverUrl?: string | null;
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

// Google fetches programLogo server-side, so the URI MUST be a public URL.
// A data: URI (how uploaded logos are stored) makes the class create/update
// fail with a 500 — which silently drops the colour update too. So: pass an
// https logo straight through; serve a data-URI logo via our public logo
// endpoint when the app has a public https origin; otherwise use the fallback.
function classLogoUri(d: WalletClassData): string {
  if (d.shopLogo) {
    if (/^https?:\/\//i.test(d.shopLogo)) return d.shopLogo;
    if (d.shopLogo.startsWith("data:") && APP_URL.startsWith("https://")) {
      return `${APP_URL}/api/shop/${d.shopId}/logo`;
    }
  }
  return FALLBACK_LOGO;
}

function loyaltyClassBody(issuerId: string, d: WalletClassData) {
  const logoUri = classLogoUri(d);
  const hasRealLogo = logoUri !== FALLBACK_LOGO;
  const desc = {
    defaultValue: {
      language: d.language,
      value: t(d.language, "walletLogoDescription", { shop: d.shopName }),
    },
  };
  return {
    id: classId(issuerId, d.shopId),
    issuerName: d.shopName,
    programName: d.perkMode
      ? t(d.language, "walletPerkProgramName")
      : t(d.language, "walletProgramName", { shop: d.shopName }),
    reviewStatus: "UNDER_REVIEW",
    // Match the customer card: its dark background colour is the pass
    // background. Google auto-derives a legible (white/black) text colour from
    // this — it has no separate accent/foreground field like Apple does.
    hexBackgroundColor: getColorHex(d.bgColor),
    // Small circular issuer icon (top-left).
    programLogo: { sourceUri: { uri: logoUri }, contentDescription: desc },
    // The shop's wide banner logo renders edge-to-edge across the card, like
    // the banner on the Brewstamp customer card. Only set when we have a real
    // public logo (skip the square fallback so it isn't stretched).
    ...(hasRealLogo
      ? { heroImage: { sourceUri: { uri: logoUri }, contentDescription: desc } }
      : {}),
  };
}

// The label + balance block, shared by object create (loyaltyObjectBody) and
// the balance PATCH (googleUpdateObject) so they can't disagree.
function loyaltyPoints(d: WalletCardData) {
  return {
    label: t(d.language, d.perkMode ? "walletPerkPointsLabel" : "walletBalanceLabel"),
    balance: { string: balanceString(d) },
  };
}

function loyaltyObjectBody(issuerId: string, d: WalletCardData) {
  return {
    id: objectId(issuerId, d.cardId),
    classId: classId(issuerId, d.shopId),
    state: "ACTIVE",
    accountName: d.customerName,
    accountId: d.cardId,
    loyaltyPoints: loyaltyPoints(d),
    // No barcode: Brewstamp's flow is customer-scans-the-shop-QR, not
    // merchant-scans-the-pass, so a QR on the pass is misleading. null (not
    // omitted) so a PATCH clears it from already-saved passes too.
    barcode: null,
    // "Recover my card" link on the pass details — only the wallet owner sees
    // it (it's not the scannable barcode), so it can't be used to hijack a
    // card by scanning someone's pass at the counter.
    ...(d.recoverUrl
      ? {
          linksModuleData: {
            uris: [
              {
                uri: d.recoverUrl,
                description: t(d.language, "walletRecoverLinkDescription"),
                id: "recover",
              },
            ],
          },
        }
      : {}),
  };
}

async function apiGet(token: string, path: string): Promise<Response> {
  return fetch(`${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// POST/PATCH a JSON body to the walletobjects API. Centralizes the auth +
// content-type headers that were otherwise respelled at every call site.
async function apiWrite(
  token: string,
  method: "POST" | "PATCH",
  path: string,
  body: unknown,
): Promise<Response> {
  return fetch(`${BASE}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
      await apiWrite(token, "POST", "loyaltyClass", loyaltyClassBody(issuerId, d)),
    );
  } else if (res.ok) {
    await logIfError(
      "class update",
      await apiWrite(token, "PATCH", `loyaltyClass/${id}`, loyaltyClassBody(issuerId, d)),
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
      await apiWrite(token, "POST", "loyaltyObject", loyaltyObjectBody(creds.issuerId, d)),
    );
  } else if (existing.ok) {
    // Object already exists (re-add / re-issue) — PATCH so the recovery link and
    // balance are present/current on the already-saved pass.
    await logIfError(
      "object update",
      await apiWrite(token, "PATCH", `loyaltyObject/${oid}`, loyaltyObjectBody(creds.issuerId, d)),
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
 * PATCH the shop's loyaltyClass branding (logo, accent colour, name). Because
 * every customer's loyaltyObject inherits class-level branding, a single PATCH
 * updates the appearance of every saved Google pass for the shop. No-op if the
 * class doesn't exist yet (nobody has added a pass) or Google isn't configured.
 */
export async function googleUpdateClassBranding(
  d: WalletClassData,
): Promise<void> {
  const creds = googleWalletCreds();
  if (!creds) return;
  const token = await accessToken();
  if (!token) return;
  const id = classId(creds.issuerId, d.shopId);
  const res = await apiGet(token, `loyaltyClass/${id}`);
  if (!res.ok) return; // 404 → no class yet; nothing saved to update
  await logIfError(
    "class branding update",
    await apiWrite(token, "PATCH", `loyaltyClass/${id}`, loyaltyClassBody(creds.issuerId, d)),
  );
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
  await apiWrite(token, "PATCH", `loyaltyObject/${oid}`, {
    // accountName so a customer name change propagates to the saved pass.
    accountName: d.customerName,
    loyaltyPoints: loyaltyPoints(d),
  });
}
