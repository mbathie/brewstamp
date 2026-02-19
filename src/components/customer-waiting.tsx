"use client";

import { Loader2 } from "lucide-react";

interface Props {
  fgColor?: string;
}

export default function CustomerWaiting({ fgColor = "#d97706" }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl px-6 py-5"
      style={{ backgroundColor: fgColor + "20", border: `1px solid ${fgColor}30` }}
    >
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: fgColor }} />
      <p className="text-sm font-medium" style={{ color: fgColor, opacity: 0.7 }}>
        Waiting for approval from the counter...
      </p>
    </div>
  );
}
