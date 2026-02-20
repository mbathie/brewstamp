"use client";

import { useState } from "react";
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
}

interface Props {
  stampCards: StampCardData[];
  threshold: number;
}

export default function CustomerSearch({ stampCards, threshold }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState("");
  const [error, setError] = useState("");

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

  const filtered = query.trim()
    ? stampCards.filter((card) => {
        const q = query.toLowerCase();
        const name = card.customer.name?.toLowerCase() || "";
        const email = card.customer.email?.toLowerCase() || "";
        const cookieId = card.customer.cookieId.toLowerCase();
        return name.includes(q) || email.includes(q) || cookieId.includes(q);
      })
    : stampCards;

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
            <Button className="cursor-pointer bg-amber-600 hover:bg-amber-700">
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
                className="w-full cursor-pointer bg-amber-600 hover:bg-amber-700"
                disabled={!!adding}
              >
                {adding || "Add Customer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {query.trim() ? "No customers match your search." : "No customers yet."}
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
            {filtered.map((card) => (
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
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
