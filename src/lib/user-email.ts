import { User } from "@/models";

/**
 * Merchant emails are matched case-insensitively.
 *
 * They weren't: registering as Uniqono@gmail.com and later signing in (or
 * following a magic link, which NextAuth lowercases) as uniqono@gmail.com
 * created a second account and a second shop. Two merchants hit it before it
 * was noticed. Stored emails are now lowercased on write; lookups tolerate the
 * mixed-case rows that already exist.
 */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

function exactCaseInsensitive(email: string) {
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { $regex: `^${escaped}$`, $options: "i" };
}

/**
 * Find a merchant by email regardless of case. An exact-case match wins so
 * the handful of legacy accounts that differ only by case keep resolving to
 * the account their owner actually uses; anything else falls back to a
 * case-insensitive match.
 */
export async function findUserByEmail(email: string | null | undefined) {
  const raw = (email ?? "").trim();
  if (!raw) return null;
  return (
    (await User.findOne({ email: raw })) ??
    (await User.findOne({ email: exactCaseInsensitive(raw) }))
  );
}
