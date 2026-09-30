"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Coffee, Eye, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pager } from "@/components/ui/pager";
import { timeAgo } from "@/lib/date";

export type PlanSlug = "free" | "pro" | "plus" | "max";
export type Likelihood = "high" | "medium" | "low";

export interface ShopRow {
  _id: string;
  name: string;
  ownerEmail: string;
  perkMode: boolean;
  planSlug: PlanSlug;
  planLabel: string;
  monthlyCents: number;
  subStatus: "active" | "past_due" | null;
  cancelAtPeriodEnd: boolean;
  /** Plan label of the owner's paid sub on another shop, when that covers this one. */
  coveredBy: string | null;
  /** Free trial tier: 50 stamps for new shops, 100 if grandfathered. */
  freeTier: "free_50" | "free_100";
  freeLimit: number;
  totalStamps: number;
  freeCoffees: number;
  customers: number;
  engagedCustomers: number;
  activeDays: number;
  requests14d: number;
  stamps30d: number;
  walletPasses: number;
  freeCapUsed: number | null;
  upgradeNudgeSent: boolean;
  likelihood: Likelihood | null;
  conversionScore: number | null;
  conversionWhy: string | null;
  createdAt: string;
  lastActive: string | null;
}

// ── Filters ──────────────────────────────────────────────────────────────

type View = "all" | "paying" | "free" | "leads" | "risk";
type ActivityFilter = "any" | "7d" | "30d" | "idle" | "never";
type SignupFilter = "any" | "7" | "30" | "90";
type SortKey =
  | "name"
  | "plan"
  | "likelihood"
  | "stamps"
  | "customers"
  | "requests14d"
  | "createdAt"
  | "lastActive";
type SortDir = "asc" | "desc";

interface Filters {
  view: View;
  q: string;
  likelihood: Likelihood[];
  activity: ActivityFilter;
  signup: SignupFilter;
  nearCap: boolean;
}

const DEFAULT_FILTERS: Filters = {
  view: "all",
  q: "",
  likelihood: [],
  activity: "any",
  signup: "any",
  nearCap: false,
};

const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "Every shop" },
  { id: "paying", label: "Paying", hint: "On a paid plan, or covered by the owner's plan" },
  { id: "free", label: "Free", hint: "Not paying" },
  { id: "leads", label: "Upgrade leads", hint: "Free shops rated High or Medium" },
  { id: "risk", label: "At risk", hint: "Paying but past due, cancelling, or no stamps in 14 days" },
];

const LIKELIHOOD_STYLE: Record<Likelihood, string> = {
  high: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  low: "border-border text-muted-foreground",
};
const LIKELIHOOD_RANK: Record<Likelihood, number> = { high: 3, medium: 2, low: 1 };

const DAY_MS = 86_400_000;
const NEAR_CAP = 0.7;
const STORAGE_KEY = "brewstamp.admin-shops";
const PAGE_SIZES = [25, 50, 100] as const;

const isPaying = (s: ShopRow) => s.planSlug !== "free" || !!s.coveredBy;
const idleDays = (s: ShopRow) =>
  s.lastActive ? (Date.now() - new Date(s.lastActive).getTime()) / DAY_MS : Infinity;
const isAtRisk = (s: ShopRow) =>
  s.planSlug !== "free" &&
  (s.subStatus === "past_due" || s.cancelAtPeriodEnd || idleDays(s) > 14);

function matchesView(s: ShopRow, view: View): boolean {
  switch (view) {
    case "paying":
      return isPaying(s);
    case "free":
      return !isPaying(s);
    case "leads":
      return s.likelihood === "high" || s.likelihood === "medium";
    case "risk":
      return isAtRisk(s);
    default:
      return true;
  }
}

function matchesFilters(s: ShopRow, f: Filters): boolean {
  if (!matchesView(s, f.view)) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    if (!s.name.toLowerCase().includes(q) && !s.ownerEmail.toLowerCase().includes(q)) return false;
  }
  if (f.likelihood.length && (!s.likelihood || !f.likelihood.includes(s.likelihood))) return false;
  const idle = idleDays(s);
  if (f.activity === "7d" && idle > 7) return false;
  if (f.activity === "30d" && idle > 30) return false;
  if (f.activity === "idle" && (idle <= 30 || idle === Infinity)) return false;
  if (f.activity === "never" && idle !== Infinity) return false;
  if (f.signup !== "any") {
    const age = (Date.now() - new Date(s.createdAt).getTime()) / DAY_MS;
    if (age > Number(f.signup)) return false;
  }
  if (f.nearCap && (s.freeCapUsed ?? 0) < NEAR_CAP) return false;
  return true;
}

// Filters live in the URL so a view can be bookmarked or shared; the hash is
// left alone because the page's section pills use it.
function readFiltersFromUrl(): Filters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  const p = new URLSearchParams(window.location.search);
  const view = p.get("view") as View | null;
  const lk = (p.get("likelihood") || "")
    .split(",")
    .filter((x): x is Likelihood => x === "high" || x === "medium" || x === "low");
  return {
    view: view && VIEWS.some((v) => v.id === view) ? view : "all",
    q: p.get("q") || "",
    likelihood: lk,
    activity: (["7d", "30d", "idle", "never"].includes(p.get("activity") || "")
      ? p.get("activity")
      : "any") as ActivityFilter,
    signup: (["7", "30", "90"].includes(p.get("signup") || "") ? p.get("signup") : "any") as SignupFilter,
    nearCap: p.get("nearCap") === "1",
  };
}

function writeFiltersToUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.view !== "all") p.set("view", f.view);
  if (f.q) p.set("q", f.q);
  if (f.likelihood.length) p.set("likelihood", f.likelihood.join(","));
  if (f.activity !== "any") p.set("activity", f.activity);
  if (f.signup !== "any") p.set("signup", f.signup);
  if (f.nearCap) p.set("nearCap", "1");
  const qs = p.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", url);
}

// Other parts of the page (the "Needs attention" cards) switch the table's
// view through this event rather than sharing state with it.
const VIEW_EVENT = "admin-shops:set-view";
type ViewPatch = Partial<Pick<Filters, "nearCap" | "activity">>;

export function setShopsTableView(view: View, patch: ViewPatch = {}) {
  window.dispatchEvent(new CustomEvent(VIEW_EVENT, { detail: { view, patch } }));
}

const activeFilterCount = (f: Filters) =>
  (f.q ? 1 : 0) +
  (f.likelihood.length ? 1 : 0) +
  (f.activity !== "any" ? 1 : 0) +
  (f.signup !== "any" ? 1 : 0) +
  (f.nearCap ? 1 : 0);

// ── Component ────────────────────────────────────────────────────────────

export function ShopsTable({
  shops,
  freeStampLimit,
}: {
  shops: ShopRow[];
  freeStampLimit: number;
}) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("lastActive");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);

  // Restore filters from the URL and sort from the last visit.
  useEffect(() => {
    setFilters(readFiltersFromUrl());
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved.sortKey) setSortKey(saved.sortKey);
      if (saved.sortDir) setSortDir(saved.sortDir);
      if (PAGE_SIZES.includes(saved.pageSize)) setPageSize(saved.pageSize);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeFiltersToUrl(filters);
  }, [filters, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, sortKey, sortDir, pageSize }));
    } catch {}
  }, [sortKey, sortDir, pageSize, ready]);

  useEffect(() => {
    const onView = (e: Event) => {
      const { view, patch } = (e as CustomEvent<{ view: View; patch: ViewPatch }>).detail;
      setFilters({ ...DEFAULT_FILTERS, view, ...patch });
      setPage(0);
      if (view === "leads") {
        setSortKey("likelihood");
        setSortDir("desc");
      }
      // Scroll once React has rendered the filtered rows; scrolling now would
      // be cancelled by the table's height changing underneath it.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.getElementById("all")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        ),
      );
    };
    window.addEventListener(VIEW_EVENT, onView);
    return () => window.removeEventListener(VIEW_EVENT, onView);
  }, []);

  // "/" focuses search, Escape clears it — the usual admin-table shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Any change to what's shown, or how it's ordered, starts again at page 1.
  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  };
  // Relative times ("3d ago") are computed against one clock per render pass.
  const [now] = useState(() => Date.now());

  function selectView(view: View) {
    // Likelihood only means something for free shops; drop it when leaving them.
    const keepLikelihood = view === "all" || view === "free" || view === "leads";
    update({ view, likelihood: keepLikelihood ? filters.likelihood : [] });
    if (view === "leads") {
      setSortKey("likelihood");
      setSortDir("desc");
    }
  }

  const viewCounts = useMemo(() => {
    const out = {} as Record<View, number>;
    for (const v of VIEWS) out[v.id] = shops.filter((s) => matchesView(s, v.id)).length;
    return out;
  }, [shops]);

  const filtered = useMemo(() => shops.filter((s) => matchesFilters(s, filters)), [shops, filters]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const activity = (s: ShopRow) => (s.perkMode ? s.freeCoffees : s.totalStamps);
    // Nulls (no score, never active) always sink, whichever way the column sorts.
    const val = (s: ShopRow): number | string | null => {
      switch (sortKey) {
        case "name":
          return s.name.toLowerCase();
        case "plan":
          return s.planSlug === "free" ? (s.coveredBy ? 0.5 : 0) : s.monthlyCents;
        case "likelihood":
          return s.likelihood ? LIKELIHOOD_RANK[s.likelihood] * 1000 + (s.conversionScore ?? 0) : null;
        case "stamps":
          return activity(s);
        case "customers":
          return s.customers;
        case "requests14d":
          return s.requests14d;
        case "createdAt":
          return new Date(s.createdAt).getTime();
        case "lastActive":
          return s.lastActive ? new Date(s.lastActive).getTime() : null;
      }
    };
    return [...filtered].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === "string") return av.localeCompare(bv as string) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  function toggleSort(key: SortKey) {
    setPage(0);
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const nFilters = activeFilterCount(filters);
  const showLikelihood = filters.view === "all" || filters.view === "free" || filters.view === "leads";
  const likelihoodOptions: Likelihood[] = filters.view === "leads" ? ["high", "medium"] : ["high", "medium", "low"];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        {/* Views — the common questions, one click each */}
        <div
          role="tablist"
          aria-label="Shop views"
          className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1"
        >
          {VIEWS.map((v) => {
            const active = filters.view === v.id;
            return (
              <button
                key={v.id}
                role="tab"
                aria-selected={active}
                title={v.hint}
                onClick={() => selectView(v.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.label}
                <span
                  className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                    active ? "bg-muted text-foreground" : "text-muted-foreground"
                  } ${v.id === "risk" && viewCounts.risk > 0 ? "text-red-300" : ""}`}
                >
                  {viewCounts[v.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Refine */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  update({ q: "" });
                  e.currentTarget.blur();
                }
              }}
              placeholder="Search shop or owner"
              aria-label="Search shops by name or owner email"
              className="h-8 pl-8 pr-8 text-sm"
            />
            {filters.q ? (
              <button
                onClick={() => update({ q: "" })}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border px-1.5 text-[10px] text-muted-foreground sm:block">
                /
              </kbd>
            )}
          </div>

          {showLikelihood && (
            <div className="inline-flex items-center gap-1" role="group" aria-label="Upgrade likelihood">
              {likelihoodOptions.map((lk) => {
                const on = filters.likelihood.includes(lk);
                return (
                  <button
                    key={lk}
                    aria-pressed={on}
                    onClick={() =>
                      update({
                        likelihood: on
                          ? filters.likelihood.filter((x) => x !== lk)
                          : [...filters.likelihood, lk],
                      })
                    }
                    className={`h-8 cursor-pointer rounded-md border px-2.5 text-xs font-medium capitalize transition-colors ${
                      on ? LIKELIHOOD_STYLE[lk] : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lk}
                  </button>
                );
              })}
            </div>
          )}

          <Select value={filters.activity} onValueChange={(v) => update({ activity: v as ActivityFilter })}>
            <SelectTrigger className="h-8 w-[10.5rem] text-xs" aria-label="Last stamp">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any activity</SelectItem>
              <SelectItem value="7d">Stamped in 7 days</SelectItem>
              <SelectItem value="30d">Stamped in 30 days</SelectItem>
              <SelectItem value="idle">Idle 30+ days</SelectItem>
              <SelectItem value="never">Never stamped</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.signup} onValueChange={(v) => update({ signup: v as SignupFilter })}>
            <SelectTrigger className="h-8 w-[9.5rem] text-xs" aria-label="Signed up">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any signup date</SelectItem>
              <SelectItem value="7">Signed up 7 days</SelectItem>
              <SelectItem value="30">Signed up 30 days</SelectItem>
              <SelectItem value="90">Signed up 90 days</SelectItem>
            </SelectContent>
          </Select>

          {filters.view !== "paying" && filters.view !== "risk" && (
            <button
              aria-pressed={filters.nearCap}
              onClick={() => update({ nearCap: !filters.nearCap })}
              title={`Free shops that have used ${Math.round(NEAR_CAP * 100)}%+ of their free stamps (${freeStampLimit} for new shops, 100 if grandfathered)`}
              className={`h-8 cursor-pointer rounded-md border px-2.5 text-xs font-medium transition-colors ${
                filters.nearCap
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Near free cap
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span aria-live="polite">
              {sorted.length === shops.length
                ? `${shops.length} shops`
                : `${sorted.length} of ${shops.length} shops`}
            </span>
            {(nFilters > 0 || filters.view !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={resetFilters}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 z-[1] bg-background">
              <TableRow>
                <SortHead k="name" label="Shop" sortKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHead k="plan" label="Plan" sortKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHead
                  k="likelihood"
                  label="Upgrade"
                  title="Likelihood a free shop upgrades, from the signals paying shops showed before converting"
                  sortKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHead k="stamps" label="Stamps" align="right" sortKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHead
                  k="customers"
                  label="Customers"
                  title="Customers active in the last 90 days"
                  align="right"
                  className="hidden sm:table-cell"
                  sortKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHead
                  k="requests14d"
                  label="14d"
                  title="Approved stamp requests in the last 14 days"
                  align="right"
                  className="hidden md:table-cell"
                  sortKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHead k="lastActive" label="Last stamp" sortKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHead
                  k="createdAt"
                  label="Signed up"
                  className="hidden lg:table-cell"
                  sortKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">No shops match these filters.</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0 text-xs"
                      onClick={resetFilters}
                    >
                      Reset filters
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((shop) => (
                  <ShopTableRow
                    key={shop._id}
                    shop={shop}
                    now={now}
                    onOpen={() => router.push(`/dashboard/admin/shops/${shop._id}`)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1">
            <Pager
              page={safePage}
              pageSize={pageSize}
              count={sorted.length}
              onPage={(p) => {
                setPage(p);
                document.getElementById("all")?.scrollIntoView({ block: "start" });
              }}
            />
          </div>
          {sorted.length > PAGE_SIZES[0] && (
            <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              Rows
              <Select value={String(pageSize)} onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(0);
                }}>
                <SelectTrigger className="h-8 w-[4.5rem] text-xs" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          )}
        </div>
        <p className="px-1 text-xs text-muted-foreground">
          Customers are those active in the last 90 days. Perk shops show free rewards instead of stamps. Upgrade
          likelihood uses the same model as the pipeline report and is only scored for free stamp shops.
        </p>
      </div>
    </TooltipProvider>
  );
}

function ShopTableRow({
  shop,
  now,
  onOpen,
}: {
  shop: ShopRow;
  now: number;
  onOpen: () => void;
}) {
  const href = `/dashboard/admin/shops/${shop._id}`;
  return (
    <TableRow className="group cursor-pointer hover:bg-muted/50" onClick={onOpen}>
      {/* Shop + owner */}
      <TableCell className="max-w-[18rem] py-2.5">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="block truncate font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
          title={shop.name}
        >
          {shop.name}
        </Link>
        <span className="block truncate text-xs text-muted-foreground" title={shop.ownerEmail}>
          {shop.ownerEmail}
        </span>
      </TableCell>

      {/* Plan + billing state */}
      <TableCell className="py-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {shop.coveredBy ? (
            <Badge
              variant="outline"
              className="px-1.5 py-0 text-[10px] text-muted-foreground"
              title={`No subscription on this shop; the owner's ${shop.coveredBy} plan covers it`}
            >
              {shop.coveredBy} · owner
            </Badge>
          ) : (
            <PlanBadge slug={shop.planSlug} label={shop.planLabel} monthlyCents={shop.monthlyCents} />
          )}
          {shop.perkMode && <PerkBadge />}
          {shop.subStatus === "past_due" && (
            <Badge className="border-red-500/40 bg-red-500/15 px-1.5 py-0 text-[10px] text-red-300 hover:bg-red-500/15">
              Past due
            </Badge>
          )}
          {shop.cancelAtPeriodEnd && (
            <Badge className="border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-300 hover:bg-amber-500/10">
              Cancelling
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Upgrade likelihood */}
      <TableCell className="py-2.5">
        {shop.likelihood ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${LIKELIHOOD_STYLE[shop.likelihood]}`}
              >
                {shop.likelihood}
                <span className="font-normal tabular-nums opacity-70">{shop.conversionScore}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-medium capitalize">
                {shop.likelihood} · score {shop.conversionScore}/100
              </p>
              <p className="opacity-80">{shop.conversionWhy}</p>
              <p className="mt-1 opacity-60">
                {shop.engagedCustomers} engaged customers · {shop.activeDays} active days
                {shop.walletPasses ? ` · ${shop.walletPasses} wallet passes` : ""}
                {shop.upgradeNudgeSent ? " · upgrade email sent" : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </TableCell>

      {/* Stamps, with progress to the free cap */}
      <TableCell className="py-2.5 text-right tabular-nums">
        {shop.perkMode ? (
          <span className="inline-flex items-center justify-end gap-1 text-amber-300" title="Free rewards redeemed">
            <Coffee className="size-3" />
            {shop.freeCoffees.toLocaleString()}
          </span>
        ) : (
          <div className="inline-flex flex-col items-end gap-1">
            <span>{shop.totalStamps.toLocaleString()}</span>
            {shop.freeCapUsed !== null && (
              <CapBar used={shop.freeCapUsed} stamps={shop.totalStamps} limit={shop.freeLimit} />
            )}
          </div>
        )}
      </TableCell>

      <TableCell className="hidden py-2.5 text-right tabular-nums sm:table-cell">
        {shop.customers.toLocaleString()}
      </TableCell>

      <TableCell
        className={`hidden py-2.5 text-right tabular-nums md:table-cell ${
          shop.requests14d ? "" : "text-muted-foreground/50"
        }`}
      >
        {shop.requests14d || "—"}
      </TableCell>

      <TableCell className="whitespace-nowrap py-2.5">
        <LastActive iso={shop.lastActive} now={now} />
      </TableCell>

      <TableCell
        className="hidden whitespace-nowrap py-2.5 text-muted-foreground lg:table-cell"
        title={fmtDate(shop.createdAt)}
      >
        {timeAgo(shop.createdAt)}
      </TableCell>

      <TableCell className="py-2.5">
        <ViewAsButton shopId={shop._id} name={shop.name} />
      </TableCell>
    </TableRow>
  );
}

function CapBar({ used, stamps, limit }: { used: number; stamps: number; limit: number }) {
  const tone = used >= 1 ? "bg-red-500" : used >= NEAR_CAP ? "bg-amber-500" : "bg-muted-foreground/40";
  return (
    <span
      className="block h-1 w-14 overflow-hidden rounded-full bg-muted"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={Math.min(stamps, limit)}
      aria-label="Free stamp allowance used"
      title={`${Math.min(stamps, limit)} of ${limit} free stamps used`}
    >
      <span className={`block h-full ${tone}`} style={{ width: `${Math.max(2, used * 100)}%` }} />
    </span>
  );
}

function LastActive({ iso, now }: { iso: string | null; now: number }) {
  if (!iso) return <span className="text-muted-foreground/60">Never</span>;
  const days = (now - new Date(iso).getTime()) / DAY_MS;
  const dot = days <= 3 ? "bg-emerald-500" : days <= 14 ? "bg-amber-500" : "bg-muted-foreground/40";
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground" title={fmtDateTime(iso)}>
      <span className={`size-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      {timeAgo(iso)}
    </span>
  );
}

function SortHead({
  k,
  label,
  title,
  align,
  className = "",
  sortKey,
  dir,
  onClick,
}: {
  k: SortKey;
  label: string;
  title?: string;
  align?: "right";
  className?: string;
  sortKey: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <TableHead
      className={`${align === "right" ? "text-right" : ""} ${className}`}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        title={title}
        onClick={() => onClick(k)}
        className={`inline-flex cursor-pointer select-none items-center whitespace-nowrap hover:text-foreground ${
          active ? "text-foreground" : ""
        }`}
      >
        {label}
        {!active ? (
          <ArrowUpDown className="ml-1 size-3 opacity-40" />
        ) : dir === "asc" ? (
          <ArrowUp className="ml-1 size-3" />
        ) : (
          <ArrowDown className="ml-1 size-3" />
        )}
      </button>
    </TableHead>
  );
}

// ── Shared bits (also used by the page's top-shops card) ─────────────────

const PLAN_BADGE: Record<PlanSlug, string> = {
  free: "border-border text-muted-foreground",
  pro: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  plus: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  max: "border-violet-500/30 bg-violet-500/15 text-violet-300",
};

function fmtPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
}

export function PlanBadge({
  slug,
  label,
  monthlyCents,
}: {
  slug: PlanSlug;
  label: string;
  monthlyCents: number;
}) {
  const cls = PLAN_BADGE[slug] ?? PLAN_BADGE.free;
  return (
    <Badge variant="outline" className={`px-1.5 py-0 text-[10px] hover:bg-transparent ${cls}`}>
      {slug === "free" ? label || "Free" : label}
      {slug !== "free" && monthlyCents > 0 && <span className="ml-1 opacity-70">{fmtPrice(monthlyCents)}</span>}
    </Badge>
  );
}

export function PerkBadge() {
  return (
    <Badge className="border-amber-500/30 bg-amber-500/15 px-1.5 py-0 text-[10px] text-amber-300 hover:bg-amber-500/15">
      <Coffee className="mr-0.5 size-2.5" />
      Perk
    </Badge>
  );
}

/**
 * Enter "view as" for a shop's owner, then hard-navigate to their dashboard.
 * A full load (not router.push) because the server context, sidebar and any
 * cached segments were all rendered as the admin.
 */
function ViewAsButton({ shopId, name }: { shopId: string; name: string }) {
  const [busy, setBusy] = useState(false);

  async function viewAs(e: React.MouseEvent) {
    // The row itself is a link into the shop detail page.
    e.stopPropagation();
    setBusy(true);
    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Couldn't view as that account.");
      setBusy(false);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <button
      type="button"
      onClick={viewAs}
      disabled={busy}
      aria-label={`View the dashboard as ${name}'s owner`}
      title={`View the dashboard as ${name}'s owner`}
      className="cursor-pointer rounded p-1 text-muted-foreground opacity-60 hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
    >
      <Eye className="size-4" />
    </button>
  );
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
