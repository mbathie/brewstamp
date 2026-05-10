"use client";

import StampDisplay from "@/components/stamp-display";
import { getColorHex } from "@/lib/tailwind-colors";
import { getPatternCSS } from "@/lib/patterns";

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
  fitToParent,
  children,
}: Props) {
  const bgHex = getColorHex(bgColor);
  const fgHex = getColorHex(fgColor);
  const patternCSS = getPatternCSS(bgPattern, fgHex, 0.05);
  const remaining = threshold - stamps;

  const containerClass = fitToParent
    ? "relative flex w-full flex-col items-center overflow-hidden rounded-2xl p-6"
    : "relative flex min-h-screen flex-col items-center p-4 pt-4 md:justify-center";

  return (
    <div className={containerClass} style={{ backgroundColor: bgHex }}>
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
          style={{ backgroundColor: fgHex + "38", border: `1px solid ${fgHex}50` }}
        >
          <p className="mb-4 text-center text-sm font-medium" style={{ color: fgHex }}>
            {shopName} <span style={{ opacity: 0.6 }}>&middot; Loyalty Card</span>
          </p>
          <StampDisplay
            stamps={stamps}
            threshold={threshold}
            fgColor={fgHex}
            animate={animate}
          />
          {remaining > 0 && displayName ? (
            <p className="mt-3 text-center text-xs" style={{ color: fgHex }}>
              {displayName}, you&apos;re {remaining} stamp{remaining > 1 ? "s" : ""} away from a free one!
            </p>
          ) : remaining > 0 ? (
            <p className="mt-3 text-center text-xs" style={{ color: fgHex }}>
              Collect {threshold} stamps to earn 1 free
            </p>
          ) : null}
          {totalEarned !== undefined && freeRedeemed !== undefined && (
            <p className="mt-1 text-center text-xs" style={{ color: fgHex }}>
              {totalEarned} stamps earned &middot; {freeRedeemed} rewards redeemed
            </p>
          )}
        </div>
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
