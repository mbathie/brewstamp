"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";

// Day-first (DD/MM/YYYY) date field: type the digits and slashes are inserted
// automatically (10042026 → 10/04/2026), or pick from the calendar popover.

const pad2 = (n: number) => String(n).padStart(2, "0");

function dateToText(d: Date | null): string {
  if (!d) return "";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Render raw digits as DD/MM/YYYY, adding each slash as soon as a segment fills
// so the caret jumps straight to the next segment.
function formatDigits(digits: string): string {
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  let out = dd;
  if (digits.length >= 2) out += "/" + mm;
  if (digits.length >= 4) out += "/" + yyyy;
  return out;
}

function parseText(text: string): Date | null {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = +m[1];
  const mm = +m[2];
  const yyyy = +m[3];
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(yyyy, mm - 1, dd);
  // Reject impossible dates that JS rolls over (e.g. 31/02 → 03 Mar).
  if (d.getDate() !== dd || d.getMonth() !== mm - 1 || d.getFullYear() !== yyyy)
    return null;
  return d;
}

const sameDay = (a: Date | null, b: Date | null) =>
  a && b ? a.getTime() === b.getTime() : a === b;

export function DateField({
  value,
  onChange,
  id,
  placeholder = "dd/mm/yyyy",
  min,
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
  id?: string;
  placeholder?: string;
  min?: Date;
}) {
  const [text, setText] = useState(() => dateToText(value));
  const [open, setOpen] = useState(false);
  const prevLen = useRef(text.length);

  // Re-sync from an external value change (calendar pick, form reset) without
  // clobbering a partially-typed string that already represents this value.
  useEffect(() => {
    if (!sameDay(parseText(text), value)) {
      setText(dateToText(value));
      prevLen.current = dateToText(value).length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleInput(raw: string) {
    const deleting = raw.length < prevLen.current;
    let digits = raw.replace(/\D/g, "").slice(0, 8);
    // Backspacing onto an auto-inserted slash should delete the digit before it
    // rather than re-adding the slash and getting stuck.
    if (deleting && (digits.length === 2 || digits.length === 4)) {
      digits = digits.slice(0, -1);
    }
    const formatted = formatDigits(digits);
    prevLen.current = formatted.length;
    setText(formatted);
    onChange(parseText(formatted));
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={text}
        inputMode="numeric"
        placeholder={placeholder}
        onChange={(e) => handleInput(e.target.value)}
        className="pr-9"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Open calendar"
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <CalendarIcon className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            defaultMonth={value ?? undefined}
            disabled={min ? { before: min } : undefined}
            onSelect={(d) => {
              onChange(d ?? null);
              setText(dateToText(d ?? null));
              prevLen.current = dateToText(d ?? null).length;
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
