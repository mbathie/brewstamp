// Upgrade likelihood for a free shop, scored on the signals the paying shops
// showed before they converted. Shared by the admin shops page and
// scripts/pipeline-report.ts, so the two always agree on who is a lead.
//
// Calibration (as of 2026-09): paying shops converted at a median of 73
// stamps and 14 engaged customers. Recency gates everything: a shop that
// stopped stamping is not about to pay, however big its history.

export type Likelihood = "high" | "medium" | "low";

export interface ConversionSignals {
  /** Stamps awarded across all approved requests. */
  stamps: number;
  /** Customers who have earned at least one stamp. */
  engaged: number;
  /** Distinct days with at least one approved stamp. */
  activeDays: number;
  /** Most recent approved stamp, or null if the shop never stamped. */
  lastStampAt: Date | string | null;
  hasLogo: boolean;
  /** True when the card colour was changed from the default. */
  hasCustomColor: boolean;
  walletPasses: number;
  /** The shop's Free allowance (50, or 100 if grandfathered). Default 100. */
  freeLimit?: number;
}

export interface ConversionScore {
  likelihood: Likelihood;
  /** 0–100. Orders shops within a band; the band is what gets read. */
  score: number;
  /** Plain-language reason, for a tooltip. */
  why: string;
  /** Days since the last stamp, or null if never. */
  idleDays: number | null;
}

const DAY_MS = 86_400_000;

export function scoreFreeShop(s: ConversionSignals, now = Date.now()): ConversionScore {
  const idleDays = s.lastStampAt ? (now - new Date(s.lastStampAt).getTime()) / DAY_MS : null;
  const idle = idleDays ?? Infinity;

  const recency = idle <= 3 ? 1 : idle <= 7 ? 0.7 : idle <= 14 ? 0.4 : idle <= 30 ? 0.15 : 0;
  const setup = (s.hasLogo ? 1 : 0) + (s.hasCustomColor ? 1 : 0);
  const score =
    recency *
    // Cap proximity: how much of its own free allowance the shop has used.
    (40 * Math.min(1, s.stamps / (s.freeLimit ?? 100)) +
      Math.min(30, s.engaged * 2) +
      Math.min(15, s.activeDays * 2) +
      setup * 4 +
      Math.min(6, s.walletPasses * 2));

  const strong = s.stamps >= 40 || s.engaged >= 15 || s.activeDays >= 10;
  const some = s.stamps >= 15 || s.engaged >= 6 || s.activeDays >= 4;
  const likelihood: Likelihood =
    strong && idle <= 3 ? "high"
    : (strong && idle <= 14) || (some && idle <= 7) ? "medium"
    : "low";

  const why = [
    idle === Infinity ? "never stamped" : idle < 1 ? "active today" : `idle ${Math.round(idle)}d`,
    s.stamps >= 40 ? `${s.stamps} stamps` : null,
    s.engaged >= 6 ? `${s.engaged} engaged customers` : null,
    s.activeDays >= 4 ? `${s.activeDays} active days` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return { likelihood, score: Math.round(score), why, idleDays };
}

/** Shop.bgColor default; anything else counts as the owner customising. */
export const DEFAULT_BG_COLOR = "stone-800";
