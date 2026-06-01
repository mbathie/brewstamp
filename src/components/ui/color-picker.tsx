"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import colors, { getColorHex } from "@/lib/tailwind-colors";

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
  // A raw hex value (e.g. "#7c3aed") means the user is on a custom colour;
  // anything else is a Tailwind "hue-shade" palette key.
  const isCustom = value.startsWith("#");

  // The two modes are an explicit UI choice. Seed from the saved value's kind
  // at mount; after that the toggle owns it (we don't sync from value, so
  // flipping to Palette while the value is still a hex doesn't bounce back).
  const [mode, setMode] = useState<"palette" | "custom">(
    isCustom ? "custom" : "palette",
  );

  const [activeHue, setActiveHue] = useState(() => hueOf(value));
  useEffect(() => {
    setActiveHue(hueOf(value));
  }, [value]);

  const currentShade = shadeOf(value);

  return (
    <div className="space-y-3">
      {/* Mode toggle — makes it obvious whether you're choosing from the
          palette or entering an exact hex. */}
      <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium">
        {(["palette", "custom"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`cursor-pointer rounded-md px-2.5 py-1 transition ${
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "palette" ? "Palette" : "Custom hex"}
          </button>
        ))}
      </div>

      {mode === "palette" ? (
        <div className="space-y-3">
          {/* Hue selector — single dot per Tailwind hue */}
          <div className="flex flex-wrap gap-2">
            {HUES.map((hue) => {
              const isActive = !isCustom && activeHue === hue;
              return (
                <button
                  key={hue}
                  type="button"
                  aria-label={hue}
                  title={hue}
                  onClick={() => {
                    setActiveHue(hue);
                    // Keep the same shade level when switching hues.
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
      ) : (
        <HexInput value={value} onChange={onChange} />
      )}
    </div>
  );
}

function HexInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const resolved = getColorHex(value); // canonical #rrggbb for the current colour
  const [draft, setDraft] = useState(resolved.slice(1));
  const [error, setError] = useState(false);

  // Re-seed when the colour changes elsewhere (swatch, randomize, load).
  useEffect(() => {
    setDraft(getColorHex(value).slice(1));
    setError(false);
  }, [value]);

  const sanitize = (raw: string) =>
    raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const h = sanitize(e.target.value);
    setDraft(h);
    setError(false); // clear while typing; validate on blur
    // Commit only on a full 6-digit hex — never expand mid-type, so typing
    // "aa" doesn't auto-fill the rest.
    if (h.length === 6) onChange(`#${h.toLowerCase()}`);
  }

  function handleBlur() {
    let h = sanitize(draft);
    // Accept 3-digit shorthand on blur: "abc" → "aabbcc".
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    if (h.length === 6) {
      onChange(`#${h.toLowerCase()}`);
      setError(false);
    } else if (h.length === 0) {
      setDraft(getColorHex(value).slice(1)); // empty → revert to current
      setError(false);
    } else {
      setError(true); // incomplete/invalid — keep their text and flag it
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Native colour well — crop the browser chrome so only the swatch shows. */}
        <span className="relative size-9 shrink-0 overflow-hidden rounded-md border border-border">
          <input
            type="color"
            aria-label="Pick a custom colour"
            value={resolved}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-[-30%] size-[160%] cursor-pointer border-0 bg-transparent p-0"
          />
        </span>
        <div
          className={`flex items-center rounded-md border bg-transparent pl-2.5 transition focus-within:ring-1 ${
            error
              ? "border-destructive focus-within:ring-destructive/50"
              : "border-border focus-within:ring-ring"
          }`}
        >
          <span className="text-sm text-muted-foreground">#</span>
          <input
            type="text"
            inputMode="text"
            spellCheck={false}
            aria-label="Hex colour"
            aria-invalid={error}
            value={draft}
            placeholder="rrggbb"
            maxLength={6}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-24 bg-transparent py-1.5 pr-3 pl-1 font-mono text-sm uppercase outline-none placeholder:normal-case placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive">
          Enter a 6-digit hex colour — digits 0–9 and letters A–F.
        </p>
      )}
    </div>
  );
}
