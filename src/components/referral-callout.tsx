"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift } from "lucide-react";

export function ReferralCallout({ shopCode }: { shopCode: string }) {
  const pathname = usePathname();

  // Don't show on the referrals page itself
  if (pathname === "/dashboard/referrals") return null;

  return (
    <Link
      href="/dashboard/referrals"
      className="hidden items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 sm:flex"
    >
      <Gift className="size-3.5" />
      Refer a shop, get 2 months free
    </Link>
  );
}
