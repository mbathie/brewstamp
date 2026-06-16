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
export const PERK_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
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
