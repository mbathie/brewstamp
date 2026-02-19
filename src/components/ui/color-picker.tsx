"use client";

import { useState, useRef, useEffect } from "react";
import colors, { getColorHex } from "@/lib/tailwind-colors";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const tailwindColors = [
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose", "slate", "gray", "zinc",
  "neutral", "stone",
];

const shades = [100, 200, 300, 400, 500, 600, 700, 800, 900];

interface ColorPickerProps {
  value: string;
  onChange: (colorKey: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [selected, setSelected] = useState(value || "amber-600");
  const [open, setOpen] = useState(false);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(value || "amber-600");
  }, [value]);

  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "auto",
        block: "center",
        inline: "center",
      });
    }
  }, [open]);

  const selectedHex = getColorHex(selected);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-44 cursor-pointer justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-5 w-5 rounded border border-border"
              style={{ backgroundColor: selectedHex }}
            />
            <span className="text-sm">{selected}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto bg-card p-2" align="start">
        <div className="max-h-48 overflow-auto">
          <div className="min-w-max">
            <div className="flex flex-col">
              {tailwindColors.map((color) => (
                <div key={color} className="flex">
                  {shades.map((shade) => (
                    <div
                      key={shade}
                      ref={
                        selected === `${color}-${shade}`
                          ? selectedRef
                          : null
                      }
                      onClick={() => {
                        const colorKey = `${color}-${shade}`;
                        setSelected(colorKey);
                        onChange(colorKey);
                        setOpen(false);
                      }}
                      className={`h-6 w-6 cursor-pointer transition-transform hover:scale-110 ${
                        selected === `${color}-${shade}`
                          ? "z-10 scale-110 ring-2 ring-white ring-offset-1 ring-offset-black"
                          : ""
                      }`}
                      style={{
                        backgroundColor: colors[color]?.[shade],
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            {/* White and Black */}
            <div className="mt-2 flex gap-1 border-t border-border pt-2">
              <div
                ref={selected === "white" ? selectedRef : null}
                onClick={() => {
                  setSelected("white");
                  onChange("white");
                  setOpen(false);
                }}
                className={`h-6 w-6 cursor-pointer border border-border transition-transform hover:scale-110 ${
                  selected === "white"
                    ? "z-10 scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background"
                    : ""
                }`}
                style={{ backgroundColor: "#ffffff" }}
              />
              <div
                ref={selected === "black" ? selectedRef : null}
                onClick={() => {
                  setSelected("black");
                  onChange("black");
                  setOpen(false);
                }}
                className={`h-6 w-6 cursor-pointer transition-transform hover:scale-110 ${
                  selected === "black"
                    ? "z-10 scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background"
                    : ""
                }`}
                style={{ backgroundColor: "#000000" }}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
