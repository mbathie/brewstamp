import http2 from "http2";
import { readFile } from "fs/promises";
import path from "path";
import { PKPass } from "passkit-generator";
import sharp from "sharp";
import { getColorHex, hexToRgb } from "@/lib/tailwind-colors";
import { t } from "@/lib/i18n";
import { APP_URL, appleWalletCreds } from "./config";
import { balanceString } from "./content";
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

// Apple appends the versioned path itself: iOS calls
// `{webServiceURL}/v1/devices/…`, `{webServiceURL}/v1/passes/…`, etc. So the
// baked-in webServiceURL must be the BASE (no `/v1`) — our routes live at
// `/api/wallet/apple/v1/…`. Including `/v1` here doubled it to `…/v1/v1/…`,
// which 404s, so devices never registered and balances never pushed.
const WEB_SERVICE_URL = `${APP_URL}/api/wallet/apple`;
const APNS_HOST = "https://api.push.apple.com:443";

// Apple wants rgb(r, g, b) strings, not hex. Convert from the shop's accent.
function rgb(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
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

// Round the corners of a logo bitmap so it reads as a soft chip on the coloured
// pass instead of a hard rectangle. Masks the corners to transparent; returns
// null (caller falls back to the square original) on any failure.
async function roundedCorners(buf: Buffer): Promise<Buffer | null> {
  try {
    const meta = await sharp(buf).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) return null;
    const radius = Math.round(Math.min(w, h) * 0.16);
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${radius}" ry="${radius}"/></svg>`,
    );
    return await sharp(buf)
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  } catch (err) {
    console.error("[Wallet/apple] logo rounding failed:", err);
    return null;
  }
}

/**
 * Render a "punch card" strip: a row (or two, for large cards) of stamp tokens,
 * filled up to the current count. Returns the @1x/@2x/@3x PNGs Apple wants for a
 * storeCard strip, on a transparent background so the pass's own colour shows
 * through. Best-effort — returns null on any failure so the pass still builds.
 */
async function renderStampStrip(
  stamps: number,
  threshold: number,
  fgHex: string,
): Promise<Record<string, Buffer> | null> {
  try {
    if (!Number.isFinite(threshold) || threshold < 1) return null;
    const W = 375;
    const H = 132;
    const padX = 24;
    const perRow = threshold <= 10 ? threshold : Math.ceil(threshold / 2);
    const rows = Math.ceil(threshold / perRow);
    const r = Math.max(
      7,
      Math.min((W - 2 * padX) / perRow / 2 - 6, rows === 1 ? 22 : 17),
    );
    const rowStride = 2 * r + 18;
    const contentH = rows * 2 * r + (rows - 1) * 18;
    const startY = (H - contentH) / 2 + r;
    // Reward-ready celebration: once the card is full, the stamps turn gold
    // instead of the shop accent so the "you've earned it" moment pops.
    const ready = stamps >= threshold;
    const fill = ready ? "#f5b301" : fgHex;
    const marks: string[] = [];
    for (let i = 0; i < threshold; i++) {
      const row = Math.floor(i / perRow);
      const countThisRow = Math.min(perRow, threshold - row * perRow);
      const col = i - row * perRow;
      const cell = (W - 2 * padX) / countThisRow;
      const cx = padX + cell * col + cell / 2;
      const cy = startY + row * rowStride;
      if (i < stamps) {
        // Filled stamp: solid disc with a small inset ring so it reads as
        // "stamped", not just a coloured dot.
        marks.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`);
        marks.push(
          `<circle cx="${cx}" cy="${cy}" r="${(r * 0.62).toFixed(1)}" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.5"/>`,
        );
      } else {
        // Empty slot: outline ring at low opacity.
        marks.push(
          `<circle cx="${cx}" cy="${cy}" r="${(r - 1.5).toFixed(1)}" fill="none" stroke="${fgHex}" stroke-opacity="0.32" stroke-width="2.5"/>`,
        );
      }
    }
    const body = marks.join("");
    const svg = (w: number, h: number) =>
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${W} ${H}">${body}</svg>`,
      );
    const [x1, x2, x3] = await Promise.all([
      sharp(svg(W, H)).png().toBuffer(),
      sharp(svg(W * 2, H * 2)).png().toBuffer(),
      sharp(svg(W * 3, H * 3)).png().toBuffer(),
    ]);
    return { "strip.png": x1, "strip@2x.png": x2, "strip@3x.png": x3 };
  } catch (err) {
    console.error("[Wallet/apple] strip render failed:", err);
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

  // Loyalty passes get a punch-card strip that visualises the stamps — it fills
  // the otherwise-empty card body with the progress customers actually care
  // about. Perk passes have no stamp progression, so they keep the plain layout.
  const strip = d.perkMode
    ? null
    : await renderStampStrip(d.stamps, d.threshold, accent);

  // The logo shows as a chip on the coloured card — round its corners. Keep the
  // square original for icon.png (Apple applies its own mask to the icon).
  const logoImg = (await roundedCorners(img)) ?? img;

  let pass: PKPass;
  try {
    pass = new PKPass(
      {
        "icon.png": img,
        "icon@2x.png": img,
        "logo.png": logoImg,
        "logo@2x.png": logoImg,
        ...(strip ?? {}),
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
        // No logoText: the uploaded logo already carries the shop name, so a
        // second copy next to it just truncated ("Byron Bay Br…"). Icon-only
        // logos still identify the shop via organizationName in Wallet.
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
  if (strip) {
    // The strip carries the stamps visually; a header field keeps the running
    // count visible even when the pass is collapsed in the stacked Wallet view.
    pass.headerFields.push({
      key: "count",
      label: t(d.language, "walletBalanceLabel"),
      value: `${d.stamps}/${d.threshold}`,
    });
    pass.secondaryFields.push({
      key: "member",
      label: t(d.language, "walletMemberLabel"),
      value: d.customerName,
    });
    pass.auxiliaryFields.push({
      key: "reward",
      label: t(d.language, "walletRewardLabel"),
      // Once full, the reward field celebrates instead of restating the target.
      value:
        d.stamps >= d.threshold
          ? t(d.language, "rewardReady")
          : t(d.language, "walletRewardValue", { threshold: d.threshold }),
    });
  } else {
    // Perk passes (or a strip-render failure): the original field-only layout.
    pass.primaryFields.push({
      key: "balance",
      // Match Google's perk label ("Free rewards") — the value already reads
      // "N redeemed", so "Redeemed" here was both redundant and inconsistent.
      label: t(d.language, d.perkMode ? "walletPerkPointsLabel" : "walletBalanceLabel"),
      value: balanceString(d),
    });
    pass.secondaryFields.push({
      key: "member",
      label: t(d.language, "walletMemberLabel"),
      value: d.customerName,
    });
    if (!d.perkMode) {
      pass.auxiliaryFields.push({
        key: "reward",
        label: t(d.language, "walletRewardLabel"),
        value: t(d.language, "walletRewardValue", { threshold: d.threshold }),
      });
    }
  }
  // Back of pass (the ⓘ flip side). A short "how it works" reusing the already-
  // localized card copy, the recover link, and a Brewstamp footer — so the back
  // isn't bare and gives the customer something to tap.
  if (!d.perkMode) {
    pass.backFields.push({
      key: "howto",
      label: t(d.language, "walletRewardLabel"),
      value: t(d.language, "stampsAwayGeneric", { n: d.threshold }),
    });
  }
  // Back of pass: a tappable "recover my card" link. Only the wallet owner can
  // open it, so it safely restores their browser card if they lose the cookie.
  if (recoverUrl) {
    pass.backFields.push({
      key: "recover",
      label: t(d.language, "walletRecoverLabel"),
      value: t(d.language, "walletRecoverValue", { url: recoverUrl }),
    });
  }
  // Brand footer — Apple linkifies the URL so it's tappable. Constant across
  // languages (brand name + domain), so no translation needed.
  pass.backFields.push({
    key: "about",
    label: "Brewstamp",
    value: `${APP_URL.replace(/^https?:\/\//, "")}`,
  });

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
  if (!creds) {
    console.log("[Wallet/apple] push: SKIPPED — Apple Wallet not configured");
    return;
  }
  if (pushTokens.length === 0) {
    console.log(
      "[Wallet/apple] push: SKIPPED — 0 registered devices (pass never registered; re-add the pass to fix)",
    );
    return;
  }
  console.log(`[Wallet/apple] push: sending to ${pushTokens.length} device(s)`);

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
            } else {
              console.log(
                `[Wallet/apple] APNs ${status || "?"} ok for ${token.slice(0, 8)}…`,
              );
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
