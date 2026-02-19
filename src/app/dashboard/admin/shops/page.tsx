"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ADMIN_EMAIL = "mbathie@gmail.com";

interface ShopRow {
  _id: string;
  name: string;
  code: string;
  ownerEmail: string;
  totalStamps: number;
  customers: number;
  createdAt: string;
}

type SortKey = "name" | "ownerEmail" | "code" | "totalStamps" | "customers" | "ratio" | "createdAt";
type SortDir = "asc" | "desc";

function getRatio(shop: ShopRow) {
  return shop.customers === 0 ? 0 : shop.totalStamps / shop.customers;
}

export default function AdminShopsPage() {
  const { data: session, status } = useSession();
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.email !== ADMIN_EMAIL) {
      redirect("/dashboard");
    }

    fetch("/api/admin/shops")
      .then((res) => res.json())
      .then((data) => {
        setShops(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, status]);

  const sorted = useMemo(() => {
    return [...shops].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortKey === "ratio") {
        aVal = getRatio(a);
        bVal = getRatio(b);
      } else if (sortKey === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }

      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal as string);
        return sortDir === "asc" ? cmp : -cmp;
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [shops, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "ownerEmail" || key === "code" ? "asc" : "desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="ml-1 inline size-3" />
      : <ArrowDown className="ml-1 inline size-3" />;
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Shops</h1>
        <p className="text-muted-foreground">
          All signed up shops ({shops.length})
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {([
                { key: "name" as SortKey, label: "Shop Name", align: "" },
                { key: "ownerEmail" as SortKey, label: "Owner", align: "" },
                { key: "code" as SortKey, label: "Code", align: "" },
                { key: "totalStamps" as SortKey, label: "Stamps", align: "text-right" },
                { key: "customers" as SortKey, label: "Customers", align: "text-right" },
                { key: "ratio" as SortKey, label: "Stamps/Customer", align: "text-right" },
                { key: "createdAt" as SortKey, label: "Signed Up", align: "" },
              ]).map((col) => (
                <TableHead
                  key={col.key}
                  className={`${col.align} cursor-pointer select-none hover:text-foreground`}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  <SortIcon col={col.key} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No shops found
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((shop) => (
                <TableRow key={shop._id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>{shop.ownerEmail}</TableCell>
                  <TableCell className="font-mono text-xs">{shop.code}</TableCell>
                  <TableCell className="text-right">{shop.totalStamps}</TableCell>
                  <TableCell className="text-right">{shop.customers}</TableCell>
                  <TableCell className="text-right">
                    {shop.customers === 0 ? "—" : getRatio(shop).toFixed(1)}
                  </TableCell>
                  <TableCell>
                    {new Date(shop.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
