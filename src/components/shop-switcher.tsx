"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, LayoutGrid, Store, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ShopOption {
  shopId: string;
  shopName: string;
  role: string;
}

interface Props {
  shops: ShopOption[];
  // null = aggregate "All shops" view; otherwise current single shop id.
  currentShopId: string | null;
}

export default function ShopSwitcher({ shops, currentShopId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  const isAll = currentShopId === null;
  const current = shops.find((s) => s.shopId === currentShopId);
  const label = isAll ? "All shops" : current?.shopName || "Pick a shop";

  async function select(target: string) {
    setOpen(false);
    setPending(true);
    const res = await fetch("/api/shop-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
    if (!res.ok) {
      setPending(false);
      return;
    }
    // Hard reload instead of router.refresh — many dashboard pages are
    // client components that fetch shop data on mount and cache it in
    // local state (settings, customers, etc.). router.refresh only
    // re-runs server components, leaving that client state stale. Full
    // reload guarantees every page reflects the new shop context.
    window.location.reload();
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          className="cursor-pointer gap-2"
        >
          {isAll ? (
            <LayoutGrid className="h-4 w-4 text-amber-500" />
          ) : (
            <Store className="h-4 w-4" />
          )}
          <span className="max-w-[160px] truncate">{label}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuLabel>Switch shop</DropdownMenuLabel>
        {/* "All shops" is the aggregate roll-up; only meaningful when the
            user owns multiple shops. The server returns 400 otherwise, so
            we hide the option entirely instead of letting the click no-op. */}
        {shops.length > 1 && (
          <>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => select("all")}
            >
              <LayoutGrid className="mr-2 h-4 w-4 text-amber-500" />
              <span className="flex-1">All shops</span>
              {isAll && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {shops.map((s) => (
          <DropdownMenuItem
            key={s.shopId}
            className="cursor-pointer"
            onClick={() => select(s.shopId)}
          >
            <Store className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">{s.shopName}</span>
            {s.shopId === currentShopId && (
              <Check className={cn("h-4 w-4")} />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            setOpen(false);
            router.push("/dashboard/shops/new");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add a new shop
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
