// Shared wallet config + helpers. Both providers are fully optional: if their
// env vars are absent, isXConfigured() returns false and the app behaves
// exactly as before (browser card only). Nothing throws when unconfigured.

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app";

export interface GoogleWalletCreds {
  issuerId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Google Wallet service-account creds. Set GOOGLE_WALLET_ISSUER_ID and
 * GOOGLE_WALLET_SA_JSON_BASE64 (base64 of the downloaded service-account JSON
 * key) to enable. Returns null when not configured.
 */
export function googleWalletCreds(): GoogleWalletCreds | null {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const b64 = process.env.GOOGLE_WALLET_SA_JSON_BASE64;
  if (!issuerId || !b64) return null;
  try {
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    if (!json.client_email || !json.private_key) return null;
    return {
      issuerId,
      clientEmail: json.client_email,
      privateKey: json.private_key,
    };
  } catch {
    return null;
  }
}

export function isGoogleWalletConfigured(): boolean {
  return googleWalletCreds() !== null;
}

export interface AppleWalletCreds {
  passTypeId: string;
  teamId: string;
  // PEM strings, decoded from base64 env vars. signerKeyPassphrase is optional
  // (only set if the .p8/.pem key was exported with a password).
  signerCert: string;
  signerKey: string;
  wwdr: string;
  signerKeyPassphrase?: string;
}

/**
 * Apple Wallet signing creds. To enable, set:
 *   APPLE_PASS_TYPE_ID       — e.g. pass.app.brewstamp
 *   APPLE_TEAM_ID            — your Apple Developer Team ID
 *   APPLE_PASS_CERT_BASE64   — base64 of the Pass Type ID signing cert (PEM)
 *   APPLE_PASS_KEY_BASE64    — base64 of the matching private key (PEM)
 *   APPLE_WWDR_BASE64        — base64 of Apple's WWDR intermediate cert (PEM)
 *   APPLE_PASS_KEY_PASSWORD  — (optional) passphrase for the private key
 * Returns null when not fully configured — nothing throws.
 */
export function appleWalletCreds(): AppleWalletCreds | null {
  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const certB64 = process.env.APPLE_PASS_CERT_BASE64;
  const keyB64 = process.env.APPLE_PASS_KEY_BASE64;
  const wwdrB64 = process.env.APPLE_WWDR_BASE64;
  if (!passTypeId || !teamId || !certB64 || !keyB64 || !wwdrB64) return null;
  const dec = (b: string) => Buffer.from(b, "base64").toString("utf8");
  return {
    passTypeId,
    teamId,
    signerCert: dec(certB64),
    signerKey: dec(keyB64),
    wwdr: dec(wwdrB64),
    signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSWORD || undefined,
  };
}

export function isAppleWalletConfigured(): boolean {
  return appleWalletCreds() !== null;
}

/** Wallet UI/issuance is available for a shop only when it's switched on AND
 * at least one provider is configured server-side. */
export function walletAvailable(shopWalletPasses: boolean): {
  enabled: boolean;
  google: boolean;
  apple: boolean;
} {
  const google = isGoogleWalletConfigured();
  const apple = isAppleWalletConfigured();
  return { enabled: !!shopWalletPasses && (google || apple), google, apple };
}
