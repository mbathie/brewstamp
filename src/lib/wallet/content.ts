// Shared, localized text for the pass body — used by BOTH the Apple and Google
// providers so the two never drift. The balance string in particular used to be
// copy-pasted in apple.ts and google.ts.
import { t } from "@/lib/i18n";
import type { WalletCardData } from "./google";

/**
 * The value shown for the card's balance. Perk mode counts redemptions
 * ("3 redeemed"); loyalty mode shows progress ("5 / 8"). The digits-only form
 * needs no translation; the label above it does (see the providers).
 */
export function balanceString(d: WalletCardData): string {
  if (d.perkMode) {
    return t(d.language, "walletRedeemedValue", { count: d.freeRedeemed });
  }
  return `${d.stamps} / ${d.threshold}`;
}
