// Deterministic, on-palette avatar tints so a person keeps the same colour
// everywhere they appear (customers list, customer detail header, team).
export const AVATAR_TINTS = [
  "bg-amber-500/15 text-amber-300",
  "bg-sky-500/15 text-sky-300",
  "bg-emerald-500/15 text-emerald-300",
  "bg-violet-500/15 text-violet-300",
  "bg-rose-500/15 text-rose-300",
  "bg-teal-500/15 text-teal-300",
];

/** Stable tint class for a seed (name or email). Same seed → same colour. */
export function avatarTint(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

/** 1–2 letter monogram from a display name (first + last initial). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
