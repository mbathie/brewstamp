"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

interface Props {
  totalStamps: number;
  hasSubscription: boolean;
}

export function StampUsageIndicator({ totalStamps, hasSubscription }: Props) {
  if (hasSubscription) {
    return (
      <Link
        href="/dashboard/billing"
        className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
      >
        <Zap className="size-3" />
        Pro
      </Link>
    );
  }

  // Only show at 50%+ usage
  if (totalStamps < 50) return null;

  let colorClasses: string;
  let pulse = false;

  if (totalStamps >= 100) {
    colorClasses = "bg-red-500/15 text-red-400";
    pulse = true;
  } else if (totalStamps >= 90) {
    colorClasses = "bg-red-500/15 text-red-400";
  } else if (totalStamps >= 80) {
    colorClasses = "bg-orange-500/15 text-orange-400";
  } else {
    colorClasses = "bg-amber-500/15 text-amber-400";
  }

  return (
    <Link
      href="/dashboard/billing"
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80 ${colorClasses} ${pulse ? "animate-pulse" : ""}`}
    >
      {totalStamps}/100 stamps
    </Link>
  );
}
