"use client";

import { Coffee, Check } from "lucide-react";

interface Props {
  stamps: number;
  threshold: number;
  fgColor?: string;
  animate?: boolean;
}

export default function StampDisplay({ stamps, threshold, fgColor, animate }: Props) {
  const fg = fgColor || "#d97706";
  const remaining = threshold - stamps;

  return (
    <div className="space-y-3">
      {/* Progress text */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium" style={{ color: fg }}>
          {stamps} of {threshold} stamps
        </p>
        {remaining > 0 && (
          <p className="text-xs" style={{ color: fg, opacity: 0.5 }}>
            {remaining} to go
          </p>
        )}
        {remaining <= 0 && (
          <p className="text-xs font-medium" style={{ color: fg }}>
            Free drink ready!
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: fg + "15" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            backgroundColor: fg,
            width: `${Math.min((stamps / threshold) * 100, 100)}%`,
          }}
        />
      </div>

      {/* Stamp grid */}
      <div className="grid grid-cols-4 place-items-center gap-2 pt-1">
        {Array.from({ length: threshold }, (_, i) => {
          const filled = i < stamps;
          const isNewest = animate && i === stamps - 1 && filled;
          return (
            <div
              key={i}
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                isNewest ? "animate-stamp-pop" : ""
              }`}
              style={
                filled
                  ? { borderColor: fg, backgroundColor: fg + "30", color: fg }
                  : { borderColor: fg + "12", backgroundColor: fg + "06", color: fg + "20" }
              }
            >
              {filled ? (
                <Check className="h-5 w-5" strokeWidth={2.5} />
              ) : (
                <Coffee className="h-5 w-5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
