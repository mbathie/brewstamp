"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ArrowRight, Loader2 } from "lucide-react";

interface Props {
  shopId: string;
  shopName: string;
  customers: number;
  stamps: number;
  redemptions: number;
}

// A clickable "By shop" row. The whole row triggers the shop switch — not
// just the trailing arrow — so the click target matches the visual row.
// We POST to /api/shop-context then hard-reload to /dashboard, mirroring
// the top-bar ShopSwitcher: a plain <Link> would keep Next's cached render
// even after the server set the new bs_current_shop cookie.
export default function SwitchShopRow({
  shopId,
  shopName,
  customers,
  stamps,
  redemptions,
}: Props) {
  const [pending, setPending] = useState(false);

  async function go() {
    if (pending) return;
    setPending(true);
    const res = await fetch("/api/shop-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: shopId }),
    });
    if (!res.ok) {
      setPending(false);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <TableRow
      onClick={go}
      className="cursor-pointer transition-colors hover:bg-muted/40 data-[pending=true]:opacity-50"
      data-pending={pending}
    >
      <TableCell className="font-medium">{shopName}</TableCell>
      <TableCell className="text-right">{customers}</TableCell>
      <TableCell className="text-right">{stamps}</TableCell>
      <TableCell className="text-right">{redemptions}</TableCell>
      <TableCell className="w-12 text-amber-600">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
      </TableCell>
    </TableRow>
  );
}
