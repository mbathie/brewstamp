"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { generateAnimalName } from "@/lib/animal-names";

interface Customer {
  _id: string;
  name?: string;
  email?: string;
  cookieId: string;
}

interface ShopRef {
  _id: string;
  name: string;
  stampThreshold?: number;
}

interface StampCardData {
  _id: string;
  customer: Customer;
  shop?: ShopRef;
  stamps: number;
  totalEarned: number;
  freeRedeemed: number;
  updatedAt: string;
  tags?: string[];
  notes?: string;
  disabled?: boolean;
}

type StatusFilter = "active" | "disabled" | "all";

interface Props {
  stampCards: StampCardData[];
  threshold: number;
  // When true the user is viewing "All shops" — render a Shop column so
  // each row makes sense without context, and per-row threshold comes
  // from the populated shop ref instead of the page-level prop.
  aggregate?: boolean;
  // Perk shops earn no stamps — report on free coffees redeemed instead.
  perkMode?: boolean;
  // CSV export is a Plus+ feature. On lower plans we still render the
  // button (so customers know the capability exists) but disable it and
  // surface a tooltip nudging them to upgrade.
  canExportCsv?: boolean;
  planLabel?: string;
}

const PAGE_SIZE = 20;

/**
 * Escape a single CSV cell — wrap in quotes if it contains a comma, quote, or
 * newline, and double up any embedded quotes per RFC 4180.
 */
function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(
  rows: StampCardData[],
  aggregate: boolean,
  perkMode: boolean,
) {
  const header = [
    ...(aggregate ? ["Shop"] : []),
    "Name",
    "Email",
    "Status",
    "Tags",
    "Notes",
    // Perk reports are reimbursement-focused: just the free coffees per person.
    ...(perkMode
      ? ["Free Rewards Redeemed"]
      : ["Current Stamps", "Total Earned", "Free Rewards Redeemed"]),
    "Last Visit",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const c of rows) {
    const name =
      c.customer.name?.trim() || generateAnimalName(c.customer.cookieId);
    lines.push(
      [
        ...(aggregate ? [csvCell(c.shop?.name || "")] : []),
        csvCell(name),
        csvCell(c.customer.email || ""),
        csvCell(c.disabled ? "Disabled" : "Active"),
        csvCell((c.tags || []).join("; ")),
        csvCell((c.notes || "").replace(/\s+/g, " ").trim()),
        ...(perkMode
          ? [csvCell(c.freeRedeemed)]
          : [
              csvCell(c.stamps),
              csvCell(c.totalEarned),
              csvCell(c.freeRedeemed),
            ]),
        csvCell(new Date(c.updatedAt).toISOString()),
      ].join(","),
    );
  }
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `brewstamp-customers-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function CustomerSearch({
  stampCards,
  threshold,
  aggregate = false,
  perkMode = false,
  canExportCsv = true,
  planLabel,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

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
  // Default to active so disabled (e.g. spoofed/ex-staff) customers are hidden
  // from the working list but still reachable via the filter and the CSV.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  // Reset to first page when the visible set changes
  useEffect(() => {
    setPage(0);
  }, [query, statusFilter, tagFilter]);

  type SortKey =
    | "customer"
    | "shop"
    | "stamps"
    | "totalEarned"
    | "freeRedeemed"
    | "lastVisit";
  const [sortKey, setSortKey] = useState<SortKey>("lastVisit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Click a header: toggle dir if it's the active column, otherwise switch
  // to that column with a sensible default (strings ascending, numbers/
  // dates descending — most-recent / largest first).
  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "customer" || key === "shop" ? "asc" : "desc");
    }
  }

  // Search + tag filtered and sorted, across ALL statuses. This is what the CSV
  // exports — so a Plus owner gets active and disabled customers in one file.
  const sortedAll = useMemo(() => {
    const list = validCards.filter((card) => {
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
        name.includes(q) ||
        email.includes(q) ||
        cookieId.includes(q) ||
        tagMatch
      );
    });

    const mul = sortDir === "asc" ? 1 : -1;
    const compare = (a: StampCardData, b: StampCardData): number => {
      switch (sortKey) {
        case "customer": {
          const an = (
            a.customer.name ||
            a.customer.email ||
            a.customer.cookieId ||
            ""
          ).toLowerCase();
          const bn = (
            b.customer.name ||
            b.customer.email ||
            b.customer.cookieId ||
            ""
          ).toLowerCase();
          return an.localeCompare(bn) * mul;
        }
        case "shop": {
          const an = (a.shop?.name || "").toLowerCase();
          const bn = (b.shop?.name || "").toLowerCase();
          return an.localeCompare(bn) * mul;
        }
        case "stamps":
          return (a.stamps - b.stamps) * mul;
        case "totalEarned":
          return (a.totalEarned - b.totalEarned) * mul;
        case "freeRedeemed":
          return (a.freeRedeemed - b.freeRedeemed) * mul;
        case "lastVisit":
          return (
            (new Date(a.updatedAt).getTime() -
              new Date(b.updatedAt).getTime()) *
            mul
          );
      }
    };
    return [...list].sort(compare);
  }, [validCards, query, tagFilter, sortKey, sortDir]);

  // Table view applies the status filter on top of the sorted base.
  const filtered = useMemo(() => {
    if (statusFilter === "all") return sortedAll;
    const wantDisabled = statusFilter === "disabled";
    return sortedAll.filter((c) => !!c.disabled === wantDisabled);
  }, [sortedAll, statusFilter]);

  const disabledCount = useMemo(
    () => validCards.filter((c) => c.disabled).length,
    [validCards],
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
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[130px] cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">
              Disabled{disabledCount > 0 ? ` (${disabledCount})` : ""}
            </SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        {canExportCsv ? (
          <Button
            variant="outline"
            onClick={() => downloadCsv(sortedAll, aggregate, perkMode)}
            disabled={sortedAll.length === 0}
            className="cursor-pointer"
            title="Download all customers (active + disabled) as CSV"
          >
            <Download className="mr-1 size-4" />
            Export CSV
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Wrapper span so the tooltip still fires on a disabled
                  button (disabled elements don't emit pointer events). */}
              <span tabIndex={0}>
                <Button
                  variant="outline"
                  disabled
                  className="pointer-events-none opacity-60"
                >
                  <Download className="mr-1 size-4" />
                  Export CSV
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              CSV export is available on Plus and Max plans.
              {planLabel ? ` You're on ${planLabel}.` : ""}{" "}
              <a
                href="/dashboard/billing"
                className="underline underline-offset-2"
              >
                Upgrade
              </a>
            </TooltipContent>
          </Tooltip>
        )}
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
                For customers who don&apos;t have a phone. You can stamp them in
                manually and search for them on future visits.
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
            : statusFilter === "disabled"
              ? "No disabled customers."
              : statusFilter === "active"
                ? "No active customers."
                : "No customers yet."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader
                label="Customer"
                k="customer"
                activeKey={sortKey}
                dir={sortDir}
                onClick={toggleSort}
              />
              {aggregate && (
                <SortHeader
                  label="Shop"
                  k="shop"
                  activeKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
              )}
              {!perkMode && (
                <SortHeader
                  label="Current Stamps"
                  k="stamps"
                  activeKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
              )}
              {!perkMode && (
                <SortHeader
                  label="Total Earned"
                  k="totalEarned"
                  activeKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
              )}
              <SortHeader
                label={perkMode ? "Free rewards" : "Free Redeemed"}
                k="freeRedeemed"
                activeKey={sortKey}
                dir={sortDir}
                onClick={toggleSort}
              />
              <SortHeader
                label="Last Visit"
                k="lastVisit"
                activeKey={sortKey}
                dir={sortDir}
                onClick={toggleSort}
                align="right"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((card) => {
              const rowThreshold = card.shop?.stampThreshold ?? threshold;
              return (
                <TableRow
                  key={card._id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/customers/${card.customer._id}`,
                    )
                  }
                >
                  <TableCell className="max-w-[220px]">
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        <span className={card.disabled ? "text-muted-foreground line-through" : ""}>
                          {card.customer.name ||
                            generateAnimalName(card.customer.cookieId)}
                        </span>
                        {card.disabled && (
                          <Badge
                            variant="outline"
                            className="border-red-500/40 px-1.5 py-0 text-[10px] font-normal text-red-400"
                          >
                            Disabled
                          </Badge>
                        )}
                      </p>
                      {card.customer.email && (
                        <p className="truncate text-xs text-muted-foreground">
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
                  {aggregate && (
                    <TableCell className="text-sm text-muted-foreground">
                      {card.shop?.name || "—"}
                    </TableCell>
                  )}
                  {!perkMode && (
                    <TableCell>
                      <Badge variant="outline">
                        {card.stamps} / {rowThreshold}
                      </Badge>
                    </TableCell>
                  )}
                  {!perkMode && <TableCell>{card.totalEarned}</TableCell>}
                  <TableCell>{card.freeRedeemed}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(card.updatedAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {pageStart + 1}–{Math.min(pageEnd, filtered.length)} of{" "}
            {filtered.length}
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

function SortHeader<K extends string>({
  label,
  k,
  activeKey,
  dir,
  onClick,
  align,
}: {
  label: string;
  k: K;
  activeKey: K;
  dir: "asc" | "desc";
  onClick: (k: K) => void;
  align?: "right";
}) {
  const active = activeKey === k;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`group inline-flex cursor-pointer items-center gap-1 ${
          align === "right" ? "ml-auto" : ""
        } ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        <span>{label}</span>
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-40 transition-opacity group-hover:opacity-80" />
        )}
      </button>
    </TableHead>
  );
}
