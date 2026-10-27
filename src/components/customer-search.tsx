"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { avatarTint, initialsOf } from "@/lib/avatar";
import { Pager } from "@/components/ui/pager";
import { PageHeader } from "@/components/page-header";
import { timeAgo } from "@/lib/date";

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
  createdAt: string;
  updatedAt: string;
  // From approved stamp requests (see the page): null if they never visited.
  lastVisit?: string | null;
  visits?: number;
  tags?: string[];
  notes?: string;
  disabled?: boolean;
}

// Quick views over the list. Every view but "disabled" leaves disabled
// customers out, so the working list stays clean.
type View =
  | "all"
  | "ready"
  | "redeemed"
  | "new"
  | "lapsed"
  | "never"
  | "email"
  | "disabled";

const DAY = 864e5;
const NEW_DAYS = 30;
const LAPSED_DAYS = 30;

const VIEWS: { key: View; label: string; hint: string; stampOnly?: boolean }[] =
  [
    { key: "all", label: "All", hint: "Every active customer" },
    {
      key: "ready",
      label: "Reward ready",
      hint: "Card is full: a reward is waiting",
      stampOnly: true,
    },
    {
      key: "redeemed",
      label: "Redeemed before",
      hint: "Has redeemed at least one reward",
      stampOnly: true,
    },
    { key: "new", label: "New", hint: `Joined in the last ${NEW_DAYS} days` },
    {
      key: "lapsed",
      label: "Lapsed",
      hint: `Visited before, but not in the last ${LAPSED_DAYS} days`,
    },
    {
      key: "never",
      label: "No visits yet",
      hint: "Has a card but no approved stamps",
    },
    { key: "email", label: "Has email", hint: "Has an email address on file" },
    {
      key: "disabled",
      label: "Disabled",
      hint: "Can't earn stamps or claim rewards",
    },
  ];

type PerkRange = "7d" | "30d" | "mtd" | "all";

const PERK_RANGE_OPTIONS: { value: PerkRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "mtd", label: "This month" },
  { value: "all", label: "All time" },
];

/** Free drinks for one work email: in the chosen window, today, and lifetime. */
interface PerkStat {
  inRange: number;
  today: number;
  lifetime: number;
}

const NO_PERK_STAT: PerkStat = { inRange: 0, today: 0, lifetime: 0 };

interface Props {
  stampCards: StampCardData[];
  threshold: number;
  // When true the user is viewing "All shops" — render a Shop column so
  // each row makes sense without context, and per-row threshold comes
  // from the populated shop ref instead of the page-level prop.
  aggregate?: boolean;
  // Perk shops earn no stamps — report on free coffees redeemed instead.
  perkMode?: boolean;
  // Free drinks per work email, counted server-side over the selected window.
  // Keyed by lowercased email; absent for non-perk shops.
  perkStats?: Record<string, PerkStat> | null;
  perkRange?: PerkRange;
  perkRangeLabel?: string;
  perkDailyLimit?: number;
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
  statOf: (card: StampCardData) => PerkStat,
  rangeLabel: string,
) {
  const header = [
    ...(aggregate ? ["Shop"] : []),
    "Name",
    "Email",
    "Status",
    "Tags",
    "Notes",
    // Perk reports are reimbursement-focused: free coffees per person, for the
    // window on screen plus today and lifetime for context.
    ...(perkMode
      ? [`Rewards (${rangeLabel})`, "Rewards Today", "Rewards All Time"]
      : ["Current Stamps", "Total Earned", "Free Rewards Redeemed"]),
    "Visits",
    "Last Visit",
    "Customer Since",
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
          ? [
              csvCell(statOf(c).inRange),
              csvCell(statOf(c).today),
              csvCell(statOf(c).lifetime),
            ]
          : [
              csvCell(c.stamps),
              csvCell(c.totalEarned),
              csvCell(c.freeRedeemed),
            ]),
        csvCell(c.visits ?? 0),
        csvCell(c.lastVisit ? new Date(c.lastVisit).toISOString() : ""),
        csvCell(new Date(c.createdAt).toISOString()),
      ].join(","),
    );
  }
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  // Name the window into the file — a reimbursement CSV is meaningless once
  // it's detached from the period it covers.
  a.download = perkMode
    ? `brewstamp-perk-rewards-${rangeLabel.toLowerCase().replace(/\s+/g, "-")}-${stamp}.csv`
    : `brewstamp-customers-${stamp}.csv`;
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
  perkStats = null,
  perkRange = "30d",
  perkRangeLabel = "Last 30 days",
  perkDailyLimit,
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

  // Perk usage is keyed by work email — the same identity the daily cap counts.
  // A customer with no email (shouldn't happen in a perk shop) reads as zero
  // rather than throwing off the sort.
  const statOf = useCallback(
    (card: StampCardData): PerkStat => {
      const email = card.customer.email?.trim().toLowerCase();
      if (!email || !perkStats) return NO_PERK_STAT;
      return perkStats[email] || NO_PERK_STAT;
    },
    [perkStats],
  );

  // Switching the window is a server round-trip (the counts are aggregated in
  // Mongo), so drive it through the URL rather than refiltering on the client.
  function setRange(next: PerkRange) {
    const params = new URLSearchParams(window.location.search);
    params.set("range", next);
    router.push(`?${params.toString()}`);
  }

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of validCards) (c.tags || []).forEach((t) => set.add(t));
    return Array.from(set).sort();
  }, [validCards]);

  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [view, setView] = useState<View>("all");

  // Reset to first page when the visible set changes
  useEffect(() => {
    setPage(0);
  }, [query, view, tagFilter]);

  type SortKey =
    | "customer"
    | "shop"
    | "stamps"
    | "totalEarned"
    | "freeRedeemed"
    | "perkRange"
    | "perkToday"
    | "lastVisit";
  // Perk shops open on heaviest-user-first for the selected window — the
  // question an employer is on this page to answer.
  const [sortKey, setSortKey] = useState<SortKey>(
    perkMode ? "perkRange" : "lastVisit",
  );
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

  // Search + tag filtered and sorted; the view chips narrow it further.
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
        case "perkRange":
          return (statOf(a).inRange - statOf(b).inRange) * mul;
        case "perkToday":
          return (statOf(a).today - statOf(b).today) * mul;
        case "lastVisit":
          return (visitTime(a) - visitTime(b)) * mul;
      }
    };
    return [...list].sort(compare);
  }, [validCards, query, tagFilter, sortKey, sortDir, statOf]);

  const views = VIEWS.filter((v) => !(perkMode && v.stampOnly));

  // Which views a card belongs to. Computed once per render of the list and
  // shared by the chip counts and the filter, so the two always agree.
  const inView = useCallback(
    (c: StampCardData, v: View): boolean => {
      if (v === "disabled") return !!c.disabled;
      if (c.disabled) return false;
      const now = Date.now();
      switch (v) {
        case "all":
          return true;
        case "ready":
          return c.stamps >= (c.shop?.stampThreshold ?? threshold);
        case "redeemed":
          return c.freeRedeemed > 0;
        case "new":
          return now - new Date(c.createdAt).getTime() < NEW_DAYS * DAY;
        case "lapsed":
          return (
            !!c.lastVisit &&
            now - new Date(c.lastVisit).getTime() >= LAPSED_DAYS * DAY
          );
        case "never":
          return !c.lastVisit;
        case "email":
          return !!c.customer.email?.trim();
      }
    },
    [threshold],
  );

  const counts = useMemo(() => {
    const out = {} as Record<View, number>;
    for (const v of VIEWS)
      out[v.key] = sortedAll.filter((c) => inView(c, v.key)).length;
    return out;
  }, [sortedAll, inView]);

  const filtered = useMemo(
    () => sortedAll.filter((c) => inView(c, view)),
    [sortedAll, view, inView],
  );
  const activeTotal = useMemo(
    () => validCards.filter((c) => !c.disabled).length,
    [validCards],
  );

  // Headline for the perk report: drinks in the window, and how many distinct
  // people claimed them. Derived from the rows on screen so it always agrees
  // with the table beneath it.
  const perkTotals = useMemo(() => {
    let drinks = 0;
    let people = 0;
    for (const c of filtered) {
      const n = statOf(c).inRange;
      drinks += n;
      if (n > 0) people += 1;
    }
    return { drinks, people };
  }, [filtered, statOf]);

  const pageStart = page * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const paged = filtered.slice(pageStart, pageEnd);

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${activeTotal} active`}
        actions={
          <>
            {canExportCsv ? (
              <Button
                variant="outline"
                onClick={() =>
                  downloadCsv(
                    filtered,
                    aggregate,
                    perkMode,
                    statOf,
                    perkRangeLabel,
                  )
                }
                disabled={filtered.length === 0}
                className="cursor-pointer"
                title={`Download the ${filtered.length} customers in this view as CSV`}
              >
                <Download className="mr-1 size-4" />
                Export
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
                      Export
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  CSV export is available on the Business plan.
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
                  Add customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add customer</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    For customers who don&apos;t have a phone. You can stamp
                    them in manually and search for them on future visits.
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
                    {adding || "Add customer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or tag"
            aria-label="Search customers"
            className="pl-9"
          />
        </div>
        {perkMode && (
          <Select
            value={perkRange}
            onValueChange={(v) => setRange(v as PerkRange)}
          >
            <SelectTrigger className="w-[150px] cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERK_RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Filter customers"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {views.map((v) => {
          const active = view === v.key;
          const n = counts[v.key];
          return (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={active}
              title={v.hint}
              onClick={() => setView(v.key)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {v.label}
              <span
                className={`tabular-nums text-xs ${active ? "text-background/70" : "text-muted-foreground/70"}`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>
      {perkMode && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {perkTotals.drinks}
          </span>{" "}
          free {perkTotals.drinks === 1 ? "reward" : "rewards"} claimed by{" "}
          <span className="font-medium text-foreground">
            {perkTotals.people}
          </span>{" "}
          {perkTotals.people === 1 ? "person" : "people"} ·{" "}
          {perkRangeLabel.toLowerCase()}
          {perkDailyLimit ? ` · limit ${perkDailyLimit}/person/day` : ""}.
          Counted by work email, so duplicate sign-ups don&apos;t split a
          person&apos;s total.
        </p>
      )}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Tags:</span>
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
            : view === "all"
              ? "No customers yet. They appear here after their first scan."
              : `No customers in “${views.find((v) => v.key === view)?.label}”.`}
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
                  label="Card"
                  k="stamps"
                  activeKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
              )}
              {!perkMode && (
                <SortHeader
                  label="Lifetime stamps"
                  k="totalEarned"
                  activeKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                  className="hidden md:table-cell"
                />
              )}
              {perkMode ? (
                <>
                  <SortHeader
                    label={`Rewards · ${perkRangeLabel}`}
                    k="perkRange"
                    activeKey={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                  <SortHeader
                    label="Today"
                    k="perkToday"
                    activeKey={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                  <SortHeader
                    label="All time"
                    k="freeRedeemed"
                    activeKey={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                </>
              ) : (
                <SortHeader
                  label="Rewards"
                  k="freeRedeemed"
                  activeKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                  className="hidden md:table-cell"
                />
              )}
              <SortHeader
                label="Last visit"
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
              const displayName =
                card.customer.name ||
                generateAnimalName(card.customer.cookieId);
              return (
                <TableRow
                  key={card._id}
                  className="cursor-pointer transition-colors hover:bg-muted/40"
                  onClick={() =>
                    router.push(`/dashboard/customers/${card.customer._id}`)
                  }
                >
                  <TableCell className="max-w-[260px]">
                    <div className="flex items-center gap-3">
                      <Monogram name={displayName} dimmed={!!card.disabled} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium">
                          <span
                            className={
                              card.disabled
                                ? "text-muted-foreground line-through"
                                : ""
                            }
                          >
                            {displayName}
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
                    </div>
                  </TableCell>
                  {aggregate && (
                    <TableCell className="text-sm text-muted-foreground">
                      {card.shop?.name || "—"}
                    </TableCell>
                  )}
                  {!perkMode && (
                    <TableCell>
                      <StampProgress
                        stamps={card.stamps}
                        threshold={rowThreshold}
                      />
                    </TableCell>
                  )}
                  {!perkMode && (
                    <TableCell
                      className={`hidden tabular-nums md:table-cell ${card.totalEarned ? "" : "text-muted-foreground"}`}
                    >
                      {card.totalEarned}
                    </TableCell>
                  )}
                  {perkMode ? (
                    <>
                      <TableCell className="tabular-nums">
                        {statOf(card).inRange > 0 ? (
                          <span className="font-medium text-amber-500">
                            {statOf(card).inRange}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {statOf(card).today > 0 ? (
                          <span
                            className={
                              perkDailyLimit &&
                              statOf(card).today >= perkDailyLimit
                                ? "font-medium text-foreground"
                                : "text-foreground"
                            }
                            title={
                              perkDailyLimit &&
                              statOf(card).today >= perkDailyLimit
                                ? `At today's limit of ${perkDailyLimit}`
                                : undefined
                            }
                          >
                            {statOf(card).today}
                            {perkDailyLimit ? (
                              <span className="text-muted-foreground">
                                /{perkDailyLimit}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            0{perkDailyLimit ? `/${perkDailyLimit}` : ""}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {statOf(card).lifetime}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell className="hidden tabular-nums md:table-cell">
                      {card.freeRedeemed > 0 ? (
                        <span className="font-medium text-amber-500">
                          {card.freeRedeemed}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell
                    className="text-right text-muted-foreground"
                    title={
                      card.lastVisit
                        ? new Date(card.lastVisit).toLocaleString()
                        : undefined
                    }
                    suppressHydrationWarning
                  >
                    {card.lastVisit ? timeAgo(card.lastVisit) : "No visits"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      <Pager
        page={page}
        pageSize={PAGE_SIZE}
        count={filtered.length}
        onPage={setPage}
      />
    </>
  );
}

// Disabled customers fall back to a plain muted chip; everyone else gets their
// stable per-name tint (shared with the detail header + team list).
function Monogram({ name, dimmed }: { name: string; dimmed: boolean }) {
  const tint = dimmed ? "bg-muted text-muted-foreground" : avatarTint(name);
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tint}`}
    >
      {initialsOf(name)}
    </span>
  );
}

// Compact progress readout for the stamps column: the count plus a thin track
// that fills toward the threshold, turning green the moment a reward is ready.
function StampProgress({
  stamps,
  threshold,
}: {
  stamps: number;
  threshold: number;
}) {
  const pct =
    threshold > 0 ? Math.min(100, Math.round((stamps / threshold) * 100)) : 0;
  const ready = threshold > 0 && stamps >= threshold;
  return (
    <div className="flex w-28 flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm tabular-nums">
        <span>
          <span className="font-semibold text-foreground">{stamps}</span>
          <span className="text-muted-foreground"> / {threshold}</span>
        </span>
        {ready && (
          <span className="rounded-full bg-emerald-500/15 px-1.5 text-[10px] font-medium text-emerald-500">
            Ready
          </span>
        )}
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: ready
              ? "var(--color-emerald-500)"
              : "var(--color-amber-500)",
          }}
        />
      </div>
    </div>
  );
}

function SortHeader<K extends string>({
  label,
  k,
  activeKey,
  dir,
  onClick,
  align,
  className,
}: {
  label: string;
  k: K;
  activeKey: K;
  dir: "asc" | "desc";
  onClick: (k: K) => void;
  align?: "right";
  className?: string;
}) {
  const active = activeKey === k;
  return (
    <TableHead
      className={`${align === "right" ? "text-right" : ""} ${className ?? ""}`}
    >
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

// Sort key for "Last visit": the real last visit, or the day the card was made
// for someone who has never been stamped (so they sort as oldest).
function visitTime(c: StampCardData): number {
  return new Date(c.lastVisit || c.createdAt).getTime();
}
