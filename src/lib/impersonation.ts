import { cache } from "react";
import { cookies } from "next/headers";

/**
 * Admin "view as" — lets the platform admin load the dashboard exactly as one
 * of their merchants sees it, for support and debugging.
 *
 * Security model, in short: the cookie names a target, it never grants one.
 * Resolving it always requires the caller to pass the REAL session email, which
 * is re-checked against the admin address on every request — so a forged,
 * copied or stale cookie resolves to null and changes nothing. Impersonation is
 * also strictly read-only (writes are blocked in proxy.ts) and drops admin
 * privileges for its duration, so a support session can't mutate a merchant's
 * data or reach the admin surfaces while wearing their identity.
 *
 * This module deliberately does NOT import `auth` — `lib/auth.ts` is one of its
 * consumers, and the cycle would be a load-order hazard in a security path.
 * Callers already hold a session; they pass the email in.
 */
export const IMPERSONATE_COOKIE = "bs_impersonate";

/** Short-lived by design — a forgotten "view as" shouldn't outlive the day. */
export const IMPERSONATE_MAX_AGE = 60 * 60 * 2;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mbathie@gmail.com";

export interface Impersonation {
  /** Target user id — whose eyes the dashboard is rendered through. */
  userId: string;
  /** Shop to land on, so the target's shop picker resolves immediately. */
  shopId?: string;
  /** The admin's own current-shop cookie, restored when they exit. */
  prevShopCookie?: string;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email === ADMIN_EMAIL;
}

export function encodeImpersonation(value: Impersonation): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeImpersonation(raw: string): Impersonation | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as Impersonation;
    if (!parsed || typeof parsed.userId !== "string" || !parsed.userId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const readCookie = cache(async (): Promise<Impersonation | null> => {
  const raw = (await cookies()).get(IMPERSONATE_COOKIE)?.value;
  return raw ? decodeImpersonation(raw) : null;
});

/**
 * The active impersonation, or null. `realEmail` must come from the underlying
 * session — never from anything the impersonation cookie influences, or the
 * feature would be authorising itself.
 */
export async function getImpersonationFor(
  realEmail: string | null | undefined,
): Promise<Impersonation | null> {
  if (!isAdminEmail(realEmail)) return null;
  return readCookie();
}
