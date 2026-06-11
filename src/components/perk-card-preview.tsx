"use client";

import { Coffee } from "lucide-react";
import { getColorHex, surfaceStyle } from "@/lib/tailwind-colors";
import { getPatternCSS } from "@/lib/patterns";

interface Props {
  shopName: string;
  shopLogo: string | null;
  bgColor: string;
  fgColor: string;
  bgPattern: string;
  dailyLimit: number;
}

/**
 * Settings preview of the corporate-perk customer card. Mirrors the frame of
 * CardPreview (logo block + body card + action) so the right panel stays
 * visually consistent when toggling between stamp and perk modes, but shows the
 * daily free-coffee allowance instead of a stamp grid. Static — no websocket.
 */
export default function PerkCardPreview({
  shopName,
  shopLogo,
  bgColor,
  fgColor,
  bgPattern,
  dailyLimit,
}: Props) {
  const bgHex = getColorHex(bgColor);
  const fgHex = getColorHex(fgColor);
  const patternCSS = getPatternCSS(bgPattern, fgHex, 0.05);
  const limit = dailyLimit || 2;

  return (
    <div
      className="relative flex w-full flex-col items-center overflow-hidden rounded-2xl p-6"
      style={{ backgroundColor: bgHex }}
    >
      {patternCSS && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: patternCSS }}
        />
      )}
      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Logo block — identical to the stamp card preview */}
        <div>
          {shopLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
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

        {/* Body — daily allowance instead of stamps */}
        <div className="rounded-2xl p-6" style={surfaceStyle(bgHex, fgHex)}>
          <p
            className="mb-4 text-center text-base font-semibold"
            style={{ color: fgHex }}
          >
            {shopName}{" "}
            <span style={{ opacity: 0.6 }}>&middot; Staff coffee perk</span>
          </p>
          <div className="flex flex-col items-center py-2">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: fgHex + "22" }}
            >
              <Coffee className="h-6 w-6" style={{ color: fgHex }} />
            </div>
            <p className="mt-4 text-center text-sm" style={{ color: fgHex }}>
              <span className="text-2xl font-bold">{limit}</span> of {limit}{" "}
              free coffee{limit === 1 ? "" : "s"} left today
            </p>
          </div>
        </div>

        {/* Action button mock */}
        <div
          className="flex w-full items-center justify-center gap-2 rounded-md py-3 text-center text-base font-normal opacity-90"
          style={{ backgroundColor: fgHex, color: bgHex }}
        >
          <Coffee className="h-5 w-5" />
          Get free coffee
        </div>
      </div>
    </div>
  );
}
