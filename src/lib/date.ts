// Shared relative/absolute time formatting for the merchant dashboard. Uses the
// viewer's locale (undefined) for calendar formats. Previously these were hand-
// rolled and duplicated across customer-detail and dashboard components.

/** "just now / 5m ago / 3h ago / 2d ago / 4mo ago / 1y ago". */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Never";
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  if (day < 365) return `${Math.floor(day / 30)}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

/**
 * Compact timestamp for activity rows: "5m ago" / "3h ago" within the day, the
 * time-of-day if it's today, otherwise a short date (with year only if it
 * differs from now).
 */
export function shortDateTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const min = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "2-digit" }),
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Membership length: "12d" / "5mo" / "2y 3mo". */
export function membershipDuration(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.max(
    1,
    Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months > 0 ? `${years}y ${months}mo` : `${years}y`;
}
