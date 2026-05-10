"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus } from "lucide-react";
import { generateAnimalName } from "@/lib/animal-names";

interface Customer {
  _id: string;
  name?: string;
  email?: string;
  cookieId: string;
}

interface StampCardData {
  _id: string;
  customer: Customer;
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
  updatedAt: string;
  tags?: string[];
  notes?: string;
}

interface Props {
  stampCards: StampCardData[];
  threshold: number;
}

const PAGE_SIZE = 20;

export default function CustomerSearch({ stampCards, threshold }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(0);
  }, [query]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding("Adding...");
    setError("");

    const res = await fetch("/api/customers/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add customer");
      setAdding("");
      return;
    }

    const { customerId } = await res.json();
    setOpen(false);
    setName("");
    setEmail("");
    setAdding("");
    router.push(`/dashboard/customers/${customerId}`);
  }

  const validCards = stampCards.filter((card) => card.customer != null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of validCards) (c.tags || []).forEach((t) => set.add(t));
    return Array.from(set).sort();
  }, [validCards]);

  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      validCards.filter((card) => {
        if (tagFilter && !(card.tags || []).includes(tagFilter)) return false;
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        const name = card.customer.name?.toLowerCase() || "";
        const email = card.customer.email?.toLowerCase() || "";
        const cookieId = card.customer.cookieId?.toLowerCase() || "";
        const tagMatch = (card.tags || []).some((t) =>
          t.toLowerCase().includes(q),
        );
        return (
          name.includes(q) || email.includes(q) || cookieId.includes(q) || tagMatch
        );
      }),
    [validCards, query, tagFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = page * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const paged = filtered.slice(pageStart, pageEnd);

  return (
    <>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers..."
            className="pl-9"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer bg-amber-700 hover:bg-amber-800">
              <Plus className="mr-1 size-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
              <p className="text-sm text-muted-foreground">
                For customers who don&apos;t have a phone. You can stamp them in manually and search for them on future visits.
              </p>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Name</Label>
                <Input
                  id="customer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email (optional)</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full cursor-pointer bg-amber-700 hover:bg-amber-800"
                disabled={!!adding}
              >
                {adding || "Add Customer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter by tag:</span>
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={`cursor-pointer rounded-full border px-2 py-0.5 text-xs ${
              tagFilter === null
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTagFilter(t === tagFilter ? null : t)}
              className={`cursor-pointer rounded-full border px-2 py-0.5 text-xs ${
                tagFilter === t
                  ? "border-amber-500 bg-amber-500/15 text-amber-500"
                  : "border-amber-500/50 text-amber-500/80 hover:text-amber-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {query.trim() || tagFilter
            ? "No customers match your search."
            : "No customers yet."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Current Stamps</TableHead>
              <TableHead>Total Earned</TableHead>
              <TableHead>Free Redeemed</TableHead>
              <TableHead className="text-right">Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((card) => (
              <TableRow key={card._id} className="relative cursor-pointer">
                <TableCell>
                  <Link
                    href={`/dashboard/customers/${card.customer._id}`}
                    className="absolute inset-0"
                  />
                  <div>
                    <p className="font-medium">
                      {card.customer.name || generateAnimalName(card.customer.cookieId)}
                    </p>
                    {card.customer.email && (
                      <p className="text-xs text-muted-foreground">
                        {card.customer.email}
                      </p>
                    )}
                    {(card.tags || []).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(card.tags || []).slice(0, 3).map((t) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="border-amber-500/50 px-1.5 py-0 text-[10px] font-normal text-amber-500"
                          >
                            {t}
                          </Badge>
                        ))}
                        {(card.tags || []).length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{(card.tags || []).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {card.stamps} / {threshold}
                  </Badge>
                </TableCell>
                <TableCell>{card.totalEarned}</TableCell>
                <TableCell>{card.freeRedeemed}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(card.updatedAt).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {pageStart + 1}–{Math.min(pageEnd, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              className="cursor-pointer disabled:opacity-50"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="cursor-pointer disabled:opacity-50"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
