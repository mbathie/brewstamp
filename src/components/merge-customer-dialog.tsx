"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Combine, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { generateAnimalName } from "@/lib/animal-names";
import { timeAgo } from "@/lib/date";

interface CardRow {
  customerId: string;
  name: string;
  email: string | null;
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
  createdAt: string;
  updatedAt: string;
}

// "Merge a duplicate card into this one." The same person can end up with two
// cards when a scan opens a different browser (the card lives in a browser
// cookie). The owner picks the duplicate; its stamps, rewards, history and
// wallet pass move onto this card, and the duplicate's phone shows this card
// from then on. Not reversible.
export default function MergeCustomerDialog({
  customerId,
  displayName,
  stamps,
  totalEarned,
  freeRedeemed,
  threshold,
}: {
  customerId: string;
  displayName: string;
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
  threshold: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CardRow[] | null>(null);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<CardRow | null>(null);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    if (!open || rows) return;
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) =>
        setRows(
          (d.customers || [])
            .filter((c: any) => c.customer && String(c.customer._id) !== customerId)
            .map((c: any) => ({
              customerId: String(c.customer._id),
              name: c.customer.name?.trim() || generateAnimalName(c.customer.cookieId || String(c.customer._id)),
              email: c.customer.email || null,
              stamps: c.stamps || 0,
              totalEarned: c.totalEarned || 0,
              freeRedeemed: c.freeRedeemed || 0,
              createdAt: c.createdAt,
              updatedAt: c.updatedAt,
            })),
        ),
      )
      .catch(() => setRows([]));
  }, [open, rows, customerId]);

  const shown = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    const list = needle
      ? rows.filter((r) => r.name.toLowerCase().includes(needle) || (r.email || "").toLowerCase().includes(needle))
      : rows;
    return list.slice(0, 100);
  }, [rows, q]);

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setPicked(null);
      setQ("");
    }
  }

  async function merge() {
    if (!picked) return;
    setMerging(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: picked.customerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Couldn't merge those cards.");
        return;
      }
      toast.success(`Merged ${picked.name}'s card into ${displayName}.`);
      reset(false);
      setRows(null);
      router.refresh();
    } finally {
      setMerging(false);
    }
  }

  const combined = picked ? stamps + picked.stamps : stamps;

  return (
    <>
      <Button variant="outline" className="cursor-pointer" onClick={() => reset(true)}>
        <Combine className="mr-1.5 size-4" />
        Merge duplicate
      </Button>
      <Sheet open={open} onOpenChange={reset}>
        {/* Full-height side panel so the customer list gets the whole viewport. */}
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Merge a duplicate card into {displayName}</SheetTitle>
            <SheetDescription>
              For when the same customer ended up with a second card, for example after scanning with a different
              browser. The duplicate&apos;s stamps, rewards and history move onto this card, and their phone shows this
              card from then on.
            </SheetDescription>
          </SheetHeader>

          {!picked ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search the duplicate by name or email"
                  aria-label="Search customers"
                  className="pl-8"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
                {!rows ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 size-4 animate-spin" /> Loading customers…
                  </div>
                ) : shown.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No other customers match.</p>
                ) : (
                  <ul className="divide-y">
                    {shown.map((r) => (
                      <li key={r.customerId}>
                        <button
                          type="button"
                          onClick={() => setPicked(r)}
                          className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{r.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {r.email ? `${r.email} · ` : ""}first seen {timeAgo(r.createdAt)} · last {timeAgo(r.updatedAt)}
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                            <span className="block text-sm font-medium text-foreground">
                              {r.stamps} / {threshold}
                            </span>
                            {r.totalEarned} earned
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Only customers with stamps at this shop are listed.
                {rows && rows.length > shown.length && !q ? ` Showing the ${shown.length} most recent — search to find others.` : ""}
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto px-4 text-sm">
              <div className="rounded-lg border p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duplicate (removed)</span>
                  <span className="font-medium">{picked.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kept</span>
                  <span className="font-medium">{displayName}</span>
                </div>
              </div>
              <div className="space-y-1 rounded-lg border bg-muted/30 p-3 tabular-nums">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current stamps</span>
                  <span>
                    {stamps} + {picked.stamps} = <b>{combined}</b> / {threshold}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stamps earned, all time</span>
                  <span>{totalEarned + picked.totalEarned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rewards redeemed</span>
                  <span>{freeRedeemed + picked.freeRedeemed}</span>
                </div>
                {combined >= threshold && (
                  <p className="pt-1 text-xs text-emerald-400">
                    A reward will be ready{combined - threshold > 0 ? `, with ${combined - threshold} stamps carried over` : ""}.
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">This can&apos;t be undone.</p>
            </div>
          )}

          <SheetFooter className="flex-row justify-end gap-2 border-t">
            {picked ? (
              <>
                <Button variant="ghost" className="cursor-pointer" onClick={() => setPicked(null)} disabled={merging}>
                  Back
                </Button>
                <Button className="cursor-pointer bg-amber-700 hover:bg-amber-800" onClick={merge} disabled={merging}>
                  {merging ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
                  Merge into {displayName}
                </Button>
              </>
            ) : (
              <Button variant="ghost" className="cursor-pointer" onClick={() => reset(false)}>
                Cancel
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
