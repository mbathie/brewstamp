"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

interface Props {
  totalStamps: number;
  hasSubscription: boolean;
  planLabel?: string;
  /** This shop's Free allowance: 50 for new shops, 100 if grandfathered. */
  freeLimit: number;
}

export function StampUsageIndicator({
  totalStamps,
  hasSubscription,
  planLabel,
  freeLimit,
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

  // Thresholds are shares of the allowance so both tiers warn at the same
  // point: 50% amber, 80% orange, 90% red, at the cap pulsing.
  const used = freeLimit > 0 ? totalStamps / freeLimit : 1;
  if (used >= 1) {
    colorClasses = "bg-red-500/15 text-red-400";
    pulse = true;
  } else if (used >= 0.9) {
    colorClasses = "bg-red-500/15 text-red-400";
  } else if (used >= 0.8) {
    colorClasses = "bg-orange-500/15 text-orange-400";
  } else if (used >= 0.5) {
    colorClasses = "bg-amber-500/15 text-amber-400";
  } else {
    colorClasses = "";
  }

  return (
    <Link
      href="/dashboard/billing"
      className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80 ${colorClasses} ${pulse ? "animate-pulse" : ""}`}
    >
      {used >= 0.5 && (
        <span>
          {totalStamps}/{freeLimit} free stamps used
        </span>
      )}
      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
        Upgrade
      </span>
    </Link>
  );
}
