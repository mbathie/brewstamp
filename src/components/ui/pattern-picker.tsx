"use client";

import { useState, useEffect } from "react";
import { patterns, getPatternCSS } from "@/lib/patterns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";

interface PatternPickerProps {
  value: string;
  onChange: (patternKey: string) => void;
  previewColor?: string;
  previewBg?: string;
}

export default function PatternPicker({
  value,
  onChange,
  previewColor = "#d97706",
  previewBg = "#292524",
}: PatternPickerProps) {
  const [selected, setSelected] = useState(value || "none");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSelected(value || "none");
  }, [value]);

  const selectedLabel =
    selected === "none"
      ? "None"
      : patterns.find((p) => p.key === selected)?.label || selected;

  const previewBgImage = getPatternCSS(selected, previewColor, 0.4);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-44 cursor-pointer justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-5 w-5 rounded border border-border"
              style={{
                backgroundColor: previewBg,
                backgroundImage: previewBgImage || undefined,
              }}
            />
            <span className="truncate text-sm">{selectedLabel}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-card p-2" align="start">
        <div className="max-h-64 overflow-auto">
          {/* None option */}
          <button
            onClick={() => {
              setSelected("none");
              onChange("none");
              setOpen(false);
            }}
            className={`mb-1 flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
              selected === "none" ? "bg-accent" : ""
            }`}
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-border"
              style={{ backgroundColor: previewBg }}
            >
              <X className="h-4 w-4 opacity-30" />
            </div>
            <span>None</span>
          </button>

          {/* Pattern grid */}
          <div className="grid grid-cols-1 gap-1">
            {patterns.map((p) => {
              const css = p.fn(previewColor, 0.4);
              return (
                <button
                  key={p.key}
                  onClick={() => {
                    setSelected(p.key);
                    onChange(p.key);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                    selected === p.key ? "bg-accent" : ""
                  }`}
                >
                  <div
                    className="h-14 w-14 shrink-0 rounded border border-border"
                    style={{
                      backgroundColor: previewBg,
                      backgroundImage: css,
                    }}
                  />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
