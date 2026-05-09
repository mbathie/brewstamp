"use client";

import { useEffect, useState } from "react";
import colors from "@/lib/tailwind-colors";

const HUES = [
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose", "slate", "gray", "zinc",
  "neutral", "stone",
];
const SHADES = [100, 200, 300, 400, 500, 600, 700, 800, 900];

interface ColorPickerProps {
  value: string;
  onChange: (colorKey: string) => void;
}

function hueOf(value: string): string {
  const [hue] = value.split("-");
  return HUES.includes(hue) ? hue : "amber";
}

function shadeOf(value: string): number {
  const [, shade] = value.split("-");
  const n = Number(shade);
  return SHADES.includes(n) ? n : 600;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  // The hue dropdown is a UI-only bit of state — the actual saved value is the
  // full "hue-shade" key. We seed it from the saved value but let the user
  // browse hues without committing until they pick a shade.
  const [activeHue, setActiveHue] = useState(() => hueOf(value));

  // If the saved value's hue changes externally (e.g. randomize), follow it.
  useEffect(() => {
    setActiveHue(hueOf(value));
  }, [value]);

  const currentShade = shadeOf(value);

  return (
    <div className="space-y-3">
      {/* Hue selector — single dot per Tailwind hue */}
      <div className="flex flex-wrap gap-2">
        {HUES.map((hue) => {
          const isActive = activeHue === hue;
          return (
            <button
              key={hue}
              type="button"
              aria-label={hue}
              title={hue}
              onClick={() => {
                setActiveHue(hue);
                // Keep the same shade level when switching hues so the saved
                // value tracks user intent (e.g. amber-600 → blue-600).
                onChange(`${hue}-${currentShade}`);
              }}
              className={`size-7 cursor-pointer rounded-md transition-transform ${
                isActive
                  ? "ring-foreground ring-offset-background scale-110 ring-2 ring-offset-2"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: colors[hue][500] }}
            />
          );
        })}
      </div>

      {/* Shade selector — for the active hue */}
      <div className="flex flex-wrap gap-2">
        {SHADES.map((shade) => {
          const colorKey = `${activeHue}-${shade}`;
          const isSelected = value === colorKey;
          return (
            <button
              key={shade}
              type="button"
              aria-label={colorKey}
              title={colorKey}
              onClick={() => onChange(colorKey)}
              className={`size-14 cursor-pointer rounded-lg border border-border transition-transform ${
                isSelected
                  ? "ring-foreground ring-offset-background scale-105 ring-2 ring-offset-2"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: colors[activeHue][shade] }}
            />
          );
        })}
      </div>
    </div>
  );
}
