"use client";

import { Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";

interface Props {
  fgColor?: string;
  language?: string;
}

export default function CustomerWaiting({ fgColor = "#d97706", language }: Props) {
  return (
    <div
      className="flex items-center justify-center gap-2.5 rounded-2xl px-5 py-3"
      style={{ backgroundColor: fgColor + "20", border: `1px solid ${fgColor}30` }}
    >
      <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: fgColor }} />
      <p className="text-sm font-medium" style={{ color: fgColor, opacity: 0.7 }}>
        {t(language, "waitingApproval")}
      </p>
    </div>
  );
}
