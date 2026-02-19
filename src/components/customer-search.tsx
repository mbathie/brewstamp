"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
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
  const [query, setQuery] = useState("");

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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers..."
          className="pl-9"
        />
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
              <TableRow key={card._id} className="cursor-pointer">
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
