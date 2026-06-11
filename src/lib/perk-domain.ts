// Pure, dependency-free helpers for the perk-mode email-domain gate. Kept in
// their own module (no model/mongoose imports) so the customer-facing client
// can share the exact same "is this email allowed?" logic as the server,
// instead of hand-rolling its own copy. `lib/perk.ts` re-exports these for
// server callers.

/** Lowercase, trim, and strip a leading "@" so "@Miovision.com " → "miovision.com". */
export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^@+/, "");
}

/** Parse a free-text list ("miovision.com, acme.io") into clean domains. */
export function parseDomains(input: string): string[] {
  return input
    .split(/[\s,;]+/)
    .map(normalizeDomain)
    .filter(Boolean);
}

/**
 * Does this email belong to one of the allowed domains? With no domains
 * configured the gate is closed (returns false) — a perk shop must name at
 * least one domain to admit anyone.
 */
export function emailDomainAllowed(
  email: string | null | undefined,
  domains: string[] | null | undefined,
): boolean {
  if (!email || !domains || domains.length === 0) return false;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();
  return domains.some((d) => normalizeDomain(d) === domain);
}
