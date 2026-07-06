"use client";

import { getColorHex } from "@/lib/tailwind-colors";
import { getPatternCSS } from "@/lib/patterns";
import { LANGUAGE_META, resolveLanguage, t } from "@/lib/i18n";

interface Props {
  shopName: string;
  shopLogo: string | null;
  stamps: number;
  threshold: number;
  bgColor: string;
  fgColor: string;
  bgPattern: string;
  displayName?: string | null;
  language?: string;
}

/**
 * A faithful mock of the Apple/Google Wallet pass — same layout the real
 * `.pkpass` renders (logo chip top-left, big balance, Member/Reward rows). Lets
 * merchants preview how their card looks in a native wallet without leaving
 * Shop Setup. Purely presentational: it reads the same bg/fg/logo the server
 * bakes into the actual pass, so what you see here matches what ships.
 */
export default function WalletPassPreview({
  shopName,
  shopLogo,
  stamps,
  threshold,
  bgColor,
  fgColor,
  bgPattern,
  displayName,
  language,
}: Props) {
  const bgHex = getColorHex(bgColor);
  const fgHex = getColorHex(fgColor);
  const patternCSS = getPatternCSS(bgPattern, fgHex, 0.05);
  const lang = resolveLanguage(language);
  const isRtl = LANGUAGE_META[lang].rtl ?? false;
  const name = shopName || "Your Shop";
  const member = displayName?.trim() || "Sam";

  return (
    <div className="mx-auto w-full max-w-[320px]">
      {/* The pass. Rounded like a real wallet card, with a soft drop shadow so it
          reads as a physical object sitting on the panel. */}
      <div
        className="relative overflow-hidden rounded-[1.25rem] shadow-2xl ring-1 ring-black/10"
        style={{ backgroundColor: bgHex }}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {patternCSS && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: patternCSS }}
          />
        )}

        <div className="relative flex flex-col gap-6 p-5">
          {/* Header: white logo chip + shop name, exactly like the native pass. */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 min-w-11 items-center justify-center overflow-hidden rounded-md bg-white px-1.5 shadow-sm">
              {shopLogo ? (
                <img
                  src={shopLogo}
                  alt={name}
                  className="h-full w-auto max-w-[92px] object-contain"
                />
              ) : (
                <span className="px-1 text-[11px] font-bold uppercase tracking-tight text-stone-800">
                  {name}
                </span>
              )}
            </div>
            <span
              className="truncate text-lg font-semibold"
              style={{ color: fgHex }}
            >
              {name}
            </span>
          </div>

          {/* Primary field: the big balance, mirroring the storeCard primary. */}
          <div>
            <div
              className="text-5xl font-semibold leading-none tabular-nums"
              style={{ color: fgHex }}
            >
              {stamps} <span style={{ opacity: 0.5 }}>/</span> {threshold}
            </div>
            <div
              className="mt-1.5 text-sm font-medium"
              style={{ color: fgHex, opacity: 0.7 }}
            >
              {t(lang, "walletBalanceLabel")}
            </div>
          </div>

          {/* Secondary + auxiliary fields on one baseline, like Wallet renders
              them: MEMBER on the leading edge, REWARD on the trailing edge. */}
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: fgHex, opacity: 0.6 }}
              >
                {t(lang, "walletMemberLabel")}
              </div>
              <div
                className="truncate text-base font-medium"
                style={{ color: fgHex }}
              >
                {member}
              </div>
            </div>
            <div className="min-w-0 text-right">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: fgHex, opacity: 0.6 }}
              >
                {t(lang, "walletRewardLabel")}
              </div>
              <div
                className="truncate text-base font-medium"
                style={{ color: fgHex }}
              >
                {t(lang, "walletRewardValue", { threshold })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
