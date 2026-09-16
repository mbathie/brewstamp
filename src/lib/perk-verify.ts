import crypto from "crypto";

/**
 * Email-ownership verification for perk-mode shops. Staff enter a work email
 * (domain-gated elsewhere) and must echo back a 6-digit code we mail them, so a
 * domain-valid but spoofed address (fake@company.com) can't claim a coffee.
 *
 * The code is short-lived and attempt-limited: 10^6 combos brute-forced within
 * a 10-minute window is the threat, so we cap attempts well below feasibility
 * and expire the code regardless.
 */
export const PERK_CODE_TTL_MS = 30 * 60 * 1000; // 30 minutes — staff on old phones are slow to get back
export const PERK_CODE_MAX_ATTEMPTS = 5;

/** A zero-padded 6-digit numeric code, e.g. "048213". */
export function generatePerkCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** sha256 of the code — we never store the plaintext, mirroring reset tokens. */
export function hashPerkCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/** Constant-time compare of a submitted code against a stored hash. */
export function perkCodeMatches(code: string, storedHash: string): boolean {
  const a = Buffer.from(hashPerkCode(code), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Magic-link token: the same email also carries a one-tap link. Tapping it
 * verifies without typing anything and, crucially, sets the identity cookie in
 * whichever browser opened it — so a phone whose camera viewer dropped the
 * cookie still lands on its own card. 32 random bytes, hashed at rest.
 */
export function generatePerkLinkToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
export function hashPerkLinkToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
