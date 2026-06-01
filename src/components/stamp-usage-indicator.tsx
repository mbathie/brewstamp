"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

interface Props {
  totalStamps: number;
  hasSubscription: boolean;
  planLabel?: string;
}

export function StampUsageIndicator({
  totalStamps,
  hasSubscription,
  planLabel,
}: Props) {
  if (hasSubscription) {
    return (
      <Link
        href="/dashboard/billing"
        className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
      >
        <Zap className="size-3" />
        {planLabel || "Pro"}
      </Link>
    );
  }

  let colorClasses: string;
  let pulse = false;

  if (totalStamps >= 100) {
    colorClasses = "bg-red-500/15 text-red-400";
    pulse = true;
  } else if (totalStamps >= 90) {
    colorClasses = "bg-red-500/15 text-red-400";
  } else if (totalStamps >= 80) {
    colorClasses = "bg-orange-500/15 text-orange-400";
  } else if (totalStamps >= 50) {
    colorClasses = "bg-amber-500/15 text-amber-400";
  } else {
    colorClasses = "";
  }

  return (
    <Link
      href="/dashboard/billing"
      className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80 ${colorClasses} ${pulse ? "animate-pulse" : ""}`}
    >
      {totalStamps >= 50 && <span>{totalStamps}/100 stamps used</span>}
      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
        Upgrade
      </span>
    </Link>
  );
}
