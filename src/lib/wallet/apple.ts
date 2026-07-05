import http2 from "http2";
import { readFile } from "fs/promises";
import path from "path";
import { PKPass } from "passkit-generator";
import { getColorHex } from "@/lib/tailwind-colors";
import { APP_URL, appleWalletCreds } from "./config";
import type { WalletCardData } from "./google";

/**
 * Apple Wallet (.pkpass) loyalty passes. Server-side only.
 *
 * Model: each customer card becomes one storeCard pass, signed with the shop's
 * Pass Type ID certificate. The customer downloads it from the save link; their
 * device registers with our PassKit web service (see app/api/wallet/apple/v1).
 * When stamps change we send an empty APNs push to every registered device,
 * which then re-fetches the updated pass from the web service.
 *
 * Everything here no-ops cleanly when Apple Wallet isn't configured
 * (appleWalletCreds() returns null) — the app behaves as browser-card-only.
 */

const WEB_SERVICE_URL = `${APP_URL}/api/wallet/apple/v1`;
const APNS_HOST = "https://api.push.apple.com:443";

// Apple wants rgb(r, g, b) strings, not hex. Convert from the shop's accent.
function rgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h.slice(0, 6),
    16,
  );
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

function balanceString(d: WalletCardData): string {
  if (d.perkMode) return `${d.freeRedeemed} redeemed`;
  return `${d.stamps} / ${d.threshold}`;
}

// PNG bytes for the pass icon/logo. Prefer the shop's uploaded logo (fetched
// server-side); fall back to the bundled Brewstamp mark. Returns null only if
// even the fallback can't be read.
async function logoBytes(shopLogo: string | null): Promise<Buffer | null> {
  if (shopLogo) {
    // Uploaded logos are data: URIs — decode straight to bytes (Apple bakes the
    // image into the .pkpass, so no public URL needed, unlike Google).
    const data = /^data:image\/[a-z0-9.+-]+;base64,(.+)$/i.exec(shopLogo);
    if (data) {
      try {
        return Buffer.from(data[1], "base64");
      } catch {
        // fall through to bundled mark
      }
    }
    if (/^https?:\/\//i.test(shopLogo)) {
      try {
        const res = await fetch(shopLogo);
        if (res.ok) return Buffer.from(await res.arrayBuffer());
      } catch {
        // fall through to bundled mark
      }
    }
  }
  try {
    return await readFile(
      path.join(process.cwd(), "public", "apple-touch-icon.png"),
    );
  } catch {
    return null;
  }
}

/**
 * Build a signed .pkpass for a card. Returns null if Apple Wallet isn't
 * configured or assets can't be loaded. `authToken` is the per-pass secret the
 * device sends back on web-service calls; `serial` is the pass serialNumber.
 */
export async function buildPkpass(
  d: WalletCardData,
  authToken: string,
  serial: string,
  recoverUrl?: string | null,
): Promise<Buffer | null> {
  const creds = appleWalletCreds();
  if (!creds) return null;

  const img = await logoBytes(d.shopLogo);
  if (!img) return null;

  // Match the customer card: dark background colour, accent colour for the
  // field text/labels. Apple lets us set all three independently (Google only
  // takes a single background colour).
  const background = getColorHex(d.bgColor);
  const accent = getColorHex(d.fgColor);

  let pass: PKPass;
  try {
    pass = new PKPass(
      {
        "icon.png": img,
        "icon@2x.png": img,
        "logo.png": img,
        "logo@2x.png": img,
      },
      {
        wwdr: creds.wwdr,
        signerCert: creds.signerCert,
        signerKey: creds.signerKey,
        signerKeyPassphrase: creds.signerKeyPassphrase,
      },
      {
        passTypeIdentifier: creds.passTypeId,
        teamIdentifier: creds.teamId,
        serialNumber: serial,
        description: `${d.shopName} loyalty card`,
        organizationName: d.shopName,
        logoText: d.shopName,
        foregroundColor: rgb(accent),
        backgroundColor: rgb(background),
        labelColor: rgb(accent),
        webServiceURL: WEB_SERVICE_URL,
        authenticationToken: authToken,
      },
    );
  } catch (err) {
    console.error("[Wallet/apple] pkpass build failed:", err);
    return null;
  }

  pass.type = "storeCard";
  // No barcode: Brewstamp's flow is customer-scans-the-shop-QR, not
  // merchant-scans-the-pass, so a QR on the pass would be misleading.
  pass.primaryFields.push({
    key: "balance",
    label: d.perkMode ? "Redeemed" : "Stamps",
    value: balanceString(d),
  });
  pass.secondaryFields.push({
    key: "member",
    label: "Member",
    value: d.customerName,
  });
  if (!d.perkMode) {
    pass.auxiliaryFields.push({
      key: "reward",
      label: "Reward",
      value: `Free at ${d.threshold}`,
    });
  }
  // Back of pass: a tappable "recover my card" link. Only the wallet owner can
  // open it, so it safely restores their browser card if they lose the cookie.
  if (recoverUrl) {
    pass.backFields.push({
      key: "recover",
      label: "Your card",
      value: `Open your card online: ${recoverUrl}`,
    });
  }

  try {
    return pass.getAsBuffer();
  } catch (err) {
    console.error("[Wallet/apple] pkpass sign failed:", err);
    return null;
  }
}

/**
 * Send an empty APNs push to every registered device for a pass (certificate
 * auth, using the Pass Type ID cert). The empty payload just wakes Wallet,
 * which re-fetches the updated pass. No-op when unconfigured or no tokens.
 */
export async function applePushUpdate(pushTokens: string[]): Promise<void> {
  const creds = appleWalletCreds();
  if (!creds || pushTokens.length === 0) return;

  let client: http2.ClientHttp2Session;
  try {
    client = http2.connect(APNS_HOST, {
      cert: creds.signerCert,
      key: creds.signerKey,
      passphrase: creds.signerKeyPassphrase,
    });
  } catch (err) {
    console.error("[Wallet/apple] APNs connect failed:", err);
    return;
  }

  // http2.connect() connects asynchronously — a DNS/TLS/cert failure surfaces as
  // an 'error' event on the SESSION (not a throw above). Without this listener
  // Node treats it as an uncaught exception and crashes the whole process, which
  // is fatal because we're called fire-and-forget on every stamp change.
  client.on("error", (err) => {
    console.error("[Wallet/apple] APNs session error:", err);
  });

  await Promise.all(
    pushTokens.map(
      (token) =>
        new Promise<void>((resolve) => {
          let req: http2.ClientHttp2Stream;
          try {
            req = client.request({
              ":method": "POST",
              ":path": `/3/device/${token}`,
              "apns-topic": creds.passTypeId,
              "apns-push-type": "background",
              "apns-priority": "5",
              "content-type": "application/json",
            });
          } catch (err) {
            // Session already destroyed (e.g. after a connection error).
            console.error("[Wallet/apple] APNs request failed:", err);
            return resolve();
          }
          let status = 0;
          req.on("response", (h) => {
            status = Number(h[":status"]) || 0;
          });
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", () => {
            if (status && status !== 200) {
              console.error(`[Wallet/apple] APNs ${status}:`, body);
            }
            resolve();
          });
          req.on("error", (err) => {
            console.error("[Wallet/apple] APNs request error:", err);
            resolve();
          });
          req.end(JSON.stringify({}));
        }),
    ),
  );

  client.close();
}
