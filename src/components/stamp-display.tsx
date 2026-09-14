"use client";

import { Coffee, Check } from "lucide-react";
import { t } from "@/lib/i18n";

interface Props {
  stamps: number;
  threshold: number;
  fgColor?: string;
  animate?: boolean;
  language?: string;
}

/**
 * A stamp grid earns its place because a person can count it at a glance,
 * and that holds to roughly a dozen. Past that the circles stop communicating
 * progress — 7/90 and 9/90 look the same — and a card that scrolls for
 * screens loses the button. So the layout follows the threshold:
 *
 *   ≤ 12   the classic 4-wide grid (97% of shops)
 *   13–30  a 6-wide grid of smaller stamps, so 30 is five rows, not eight
 *   > 30   no circles at all: a hero count and the bar with milestone ticks.
 *          A partial row of "recent" stamps was tried and dropped — seven
 *          filled out of eight reads as nearly done, contradicting the bar.
 *
 * Every tier reuses the same strings, so nothing new to translate.
 */
const GRID_MAX = 12;
const DENSE_GRID_MAX = 30;

export default function StampDisplay({ stamps, threshold, fgColor, animate, language }: Props) {
  const fg = fgColor || "#d97706";
  const remaining = threshold - stamps;
  const dense = threshold > GRID_MAX && threshold <= DENSE_GRID_MAX;
  const hero = threshold > DENSE_GRID_MAX;

  const filledStyle = { borderColor: fg, backgroundColor: fg + "30", color: fg };
  const emptyStyle = { borderColor: fg + "40", backgroundColor: fg + "18", color: fg + "45" };

  return (
    <div className="space-y-3">
      {/* Progress text — for the hero tier the count itself is the headline. */}
      {hero ? (
        <div className="px-1 pt-1">
          <p className="text-4xl font-bold leading-none tabular-nums" style={{ color: fg }}>
            {stamps}
            <span className="text-xl font-medium" style={{ color: fg + "80" }}>
              {" "}/ {threshold}
            </span>
          </p>
          <p className="mt-1.5 text-sm" style={{ color: fg }}>
            {remaining > 0 ? t(language, "toGo", { remaining }) : t(language, "rewardReady")}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between px-1">
          <p className="text-base font-semibold" style={{ color: fg }}>
            {t(language, "stampsOf", { stamps, threshold })}
          </p>
          {remaining > 0 && (
            <p className="text-sm" style={{ color: fg }}>
              {t(language, "toGo", { remaining })}
            </p>
          )}
          {remaining <= 0 && (
            <p className="text-sm font-medium" style={{ color: fg }}>
              {t(language, "rewardReady")}
            </p>
          )}
        </div>
      )}

      {/* Progress bar — taller with tenth-milestone ticks when it's the main event. */}
      <div className="relative">
        <div
          className={`${hero ? "h-2.5" : "h-1.5"} overflow-hidden rounded-full`}
          style={{ backgroundColor: fg + "15" }}
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              hero && animate ? "animate-stamp-pop" : ""
            }`}
            style={{
              backgroundColor: fg,
              width: `${Math.min((stamps / threshold) * 100, 100)}%`,
            }}
          />
        </div>
        {hero && (
          <div className="pointer-events-none absolute inset-0 flex justify-between px-[10%]">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="h-full w-px" style={{ backgroundColor: fg + "30" }} />
            ))}
          </div>
        )}
      </div>

      {!hero && (
        <div
          className={`grid place-items-center pt-1 ${
            dense ? "grid-cols-6 gap-1.5" : "grid-cols-4 gap-2"
          }`}
        >
          {Array.from({ length: threshold }, (_, i) => {
            const filled = i < stamps;
            const isNewest = animate && i === stamps - 1 && filled;
            return (
              <div
                key={i}
                className={`flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  dense ? "h-9 w-9" : "h-14 w-14"
                } ${isNewest ? "animate-stamp-pop" : ""}`}
                style={filled ? filledStyle : emptyStyle}
              >
                {filled ? (
                  <Check className={dense ? "size-4" : "h-5 w-5"} strokeWidth={2.5} />
                ) : (
                  <Coffee className={dense ? "size-4" : "size-5"} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
