"use client";

import { useState } from "react";
import { patterns } from "@/lib/patterns";
import { X } from "lucide-react";

interface PatternPickerProps {
  value: string;
  onChange: (patternKey: string) => void;
  previewColor?: string;
  previewBg?: string;
}

const QUICK_COUNT = 11; // shows None + 11 patterns = 12 total in a tidy grid

export default function PatternPicker({
  value,
  onChange,
  previewColor = "#d97706",
  previewBg = "#292524",
}: PatternPickerProps) {
  const visiblePatterns = patterns.slice(0, QUICK_COUNT);
  const hiddenPatterns = patterns.slice(QUICK_COUNT);

  // Auto-expand if the selected pattern isn't in the quick set.
  const selectedHidden = hiddenPatterns.some((p) => p.key === value);
  const [expanded, setExpanded] = useState(selectedHidden);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* None option */}
        <PatternThumb
          label="None"
          selected={value === "none"}
          onClick={() => onChange("none")}
          previewBg={previewBg}
          previewColor={previewColor}
        />
        {visiblePatterns.map((p) => (
          <PatternThumb
            key={p.key}
            label={p.label}
            selected={value === p.key}
            onClick={() => onChange(p.key)}
            previewBg={previewBg}
            previewColor={previewColor}
            patternFn={p.fn}
          />
        ))}
        {expanded &&
          hiddenPatterns.map((p) => (
            <PatternThumb
              key={p.key}
              label={p.label}
              selected={value === p.key}
              onClick={() => onChange(p.key)}
              previewBg={previewBg}
              previewColor={previewColor}
              patternFn={p.fn}
            />
          ))}
      </div>

      {hiddenPatterns.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded
            ? "Hide patterns"
            : `Show ${hiddenPatterns.length} more patterns`}
        </button>
      )}
    </div>
  );
}

function PatternThumb({
  label,
  selected,
  onClick,
  previewBg,
  previewColor,
  patternFn,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  previewBg: string;
  previewColor: string;
  patternFn?: (color: string, opacity: number) => string;
}) {
  const bgImage = patternFn ? patternFn(previewColor, 0.4) : undefined;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex size-14 cursor-pointer items-center justify-center rounded-lg border border-border transition-transform ${
        selected
          ? "ring-foreground ring-offset-background scale-105 ring-2 ring-offset-2"
          : "hover:scale-105"
      }`}
      style={{
        backgroundColor: previewBg,
        backgroundImage: bgImage,
      }}
    >
      {!patternFn && <X className="h-4 w-4 text-muted-foreground opacity-50" />}
    </button>
  );
}
