import { cookies } from "next/headers";
import { partnerIdForCode, REF_COOKIE } from "./referrals";

// Read the `bs_ref` cookie (set by proxy.ts from ?ref=CODE) and resolve it
// to the partner's user id for stamping onto a new user. Request-scoped —
// only import from route handlers / server actions, never from the cron.
export async function readReferralPartnerId(): Promise<string | null> {
  try {
    const c = await cookies();
    return await partnerIdForCode(c.get(REF_COOKIE)?.value);
  } catch {
    return null;
  }
}
