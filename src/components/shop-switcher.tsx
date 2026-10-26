"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, LayoutGrid, Loader2, Store, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

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

// Past this many shops the list gets a search box and is sorted by name; a
// one-to-three shop owner just sees the short list.
const SEARCH_FROM = 6;

export default function ShopSwitcher({ shops, currentShopId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  const isAll = currentShopId === null;
  const current = shops.find((s) => s.shopId === currentShopId);
  const label = isAll ? "All shops" : current?.shopName || "Pick a shop";
  const searchable = shops.length >= SEARCH_FROM;
  const listed = useMemo(
    () => (searchable ? [...shops].sort((a, b) => a.shopName.localeCompare(b.shopName)) : shops),
    [shops, searchable],
  );

  async function select(target: string) {
    setOpen(false);
    if (target === (currentShopId ?? "all")) return;
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending} className="cursor-pointer gap-2">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isAll ? (
            <LayoutGrid className="h-4 w-4 text-amber-500" />
          ) : (
            <Store className="h-4 w-4" />
          )}
          <span className="max-w-[160px] truncate">{label}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] p-0">
        <Command>
          {searchable && <CommandInput placeholder={`Find one of ${shops.length} shops…`} />}
          <CommandList className="max-h-[min(380px,60vh)]">
            <CommandEmpty>No shop found.</CommandEmpty>
            {/* "All shops" is the aggregate roll-up; only meaningful with
                more than one shop (the server returns 400 otherwise). */}
            {shops.length > 1 && (
              <CommandGroup>
                <CommandItem value="all shops overview" onSelect={() => select("all")} className="cursor-pointer">
                  <LayoutGrid className="text-amber-500" />
                  <span className="flex-1">All shops</span>
                  {isAll ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{shops.length}</span>
                  )}
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Switch shop">
              {listed.map((s) => (
                <CommandItem
                  key={s.shopId}
                  value={`${s.shopName} ${s.shopId}`}
                  onSelect={() => select(s.shopId)}
                  className="cursor-pointer"
                >
                  <Store />
                  <span className="flex-1 truncate">{s.shopName}</span>
                  {s.role !== "owner" && <span className="text-xs capitalize text-muted-foreground">{s.role}</span>}
                  {s.shopId === currentShopId && <Check className="h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem
              value="add a new shop"
              onSelect={() => {
                setOpen(false);
                router.push("/dashboard/shops/new");
              }}
              className="cursor-pointer"
            >
              <Plus />
              Add a new shop
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
