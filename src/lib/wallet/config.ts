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

// Apple config lands here in the Apple milestone (cert/team/pass-type-id).
export function isAppleWalletConfigured(): boolean {
  return Boolean(
    process.env.APPLE_PASS_TYPE_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_PASS_CERT_BASE64,
  );
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
