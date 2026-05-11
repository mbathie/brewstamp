"use client";

import StampDisplay from "@/components/stamp-display";
import { getColorHex } from "@/lib/tailwind-colors";
import { getPatternCSS } from "@/lib/patterns";
import { LANGUAGE_META, resolveLanguage, t } from "@/lib/i18n";

interface Props {
  shopName: string;
  shopLogo: string | null;
  stamps: number;
  threshold: number;
  totalEarned?: number;
  freeRedeemed?: number;
  bgColor: string;
  fgColor: string;
  bgPattern: string;
  displayName?: string | null;
  animate?: boolean;
  language?: string;
  /** When true, fills parent container instead of min-h-screen — use in previews. */
  fitToParent?: boolean;
  /** Slot for the action button(s) below the card. */
  children?: React.ReactNode;
}

export default function CardPreview({
  shopName,
  shopLogo,
  stamps,
  threshold,
  totalEarned,
  freeRedeemed,
  bgColor,
  fgColor,
  bgPattern,
  displayName,
  animate,
  language,
  fitToParent,
  children,
}: Props) {
  const bgHex = getColorHex(bgColor);
  const fgHex = getColorHex(fgColor);
  const patternCSS = getPatternCSS(bgPattern, fgHex, 0.05);
  const remaining = threshold - stamps;
  const lang = resolveLanguage(language);
  const isRtl = LANGUAGE_META[lang].rtl ?? false;

  const containerClass = fitToParent
    ? "relative flex w-full flex-col items-center overflow-hidden rounded-2xl p-6"
    : "relative flex min-h-screen flex-col items-center p-4 pt-4 md:justify-center";

  return (
    <div
      className={containerClass}
      style={{ backgroundColor: bgHex }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {patternCSS && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: patternCSS }}
        />
      )}
      <div className="relative z-10 w-full max-w-sm space-y-6">
        <div>
          {shopLogo ? (
            <img
              src={shopLogo}
              alt={shopName}
              className="aspect-[3/1] w-full rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div
              className="flex aspect-[3/1] w-full items-center justify-center rounded-2xl px-6 text-center shadow-lg"
              style={{ backgroundColor: fgHex }}
            >
              <h2
                className="text-2xl font-bold leading-tight"
                style={{ color: bgHex }}
              >
                {shopName}
              </h2>
            </div>
          )}
        </div>
        <div
          className="rounded-2xl p-6"
          style={{
            // Solid bg base masks the patterned backdrop behind text, then a
            // translucent fg tint sits on top for the brand-coloured wash.
            // Without the solid base the pattern shows through and competes
            // with the body copy on mobile.
            backgroundColor: bgHex,
            backgroundImage: `linear-gradient(${fgHex}38, ${fgHex}38)`,
            border: `1px solid ${fgHex}50`,
          }}
        >
          <p className="mb-4 text-center text-base font-semibold" style={{ color: fgHex }}>
            {shopName} <span style={{ opacity: 0.6 }}>&middot; {t(lang, "loyaltyCard")}</span>
          </p>
          <StampDisplay
            stamps={stamps}
            threshold={threshold}
            fgColor={fgHex}
            animate={animate}
            language={lang}
          />
          {remaining > 0 && displayName ? (
            <p className="mt-3 text-center text-sm leading-relaxed" style={{ color: fgHex }}>
              {t(lang, "stampsAwayPersonal", {
                name: displayName,
                n: remaining,
                s: remaining > 1 ? "s" : "",
                s2: remaining > 1 ? "n" : "",
                si: remaining > 1 ? "i" : "o",
              })}
            </p>
          ) : remaining > 0 ? (
            <p className="mt-3 text-center text-sm leading-relaxed" style={{ color: fgHex }}>
              {t(lang, "stampsAwayGeneric", { n: threshold })}
            </p>
          ) : null}
          {totalEarned !== undefined && freeRedeemed !== undefined && (
            <p className="mt-1 text-center text-sm" style={{ color: fgHex }}>
              {t(lang, "stampsEarnedRedeemed", {
                earned: totalEarned,
                redeemed: freeRedeemed,
              })}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
