import { StampRequest } from "@/models";

/**
 * Helpers for "perk mode" shops — employer-subsidised coffee where every
 * approved scan is a free drink, gated by email domain and capped per person
 * per local day. See the perkMode fields on the Shop model.
 */

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
  const domain = email.slice(at + 1).trim().toLowerCase();
  return domains.some((d) => normalizeDomain(d) === domain);
}

/**
 * The UTC instant at which the current local day began for `tz`. Used to count
 * "today's" redemptions for the daily cap. Computed via Intl offset parts so it
 * stays correct across DST without a date library.
 */
export function startOfDayInTz(tz: string, now: Date = new Date()): Date {
  const offsetMs = tzOffsetMs(tz, now);
  // Shift into local wall-clock time, floor to midnight, shift back to UTC.
  const local = new Date(now.getTime() + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - offsetMs);
}

/** Milliseconds that `tz` is ahead of UTC at `date` (negative when behind). */
function tzOffsetMs(tz: string, date: Date): number {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date);
  } catch {
    // Unknown timezone → treat as UTC rather than throwing in a request path.
    return 0;
  }
  const map: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = Number(p.value);
  // Intl renders hour 24 for midnight in some engines; normalise to 0.
  const hour = map.hour === 24 ? 0 : map.hour;
  const asUTC = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    hour,
    map.minute,
    map.second,
  );
  return asUTC - date.getTime();
}

/**
 * How many free drinks this *email* has already had today at this perk shop —
 * i.e. approved stamp requests since the local day began. Counting by email
 * (not by the device cookie) is what stops one person claiming the cap twice by
 * entering the same work email on two phones/browsers.
 */
export async function countPerkDrinksToday(
  shopId: string,
  email: string | null | undefined,
  tz: string,
): Promise<number> {
  if (!email) return 0;
  return StampRequest.countDocuments({
    shop: shopId,
    email: email.trim().toLowerCase(),
    status: "approved",
    createdAt: { $gte: startOfDayInTz(tz) },
  });
}
