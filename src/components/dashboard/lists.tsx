"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Pager } from "@/components/ui/pager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateAnimalName } from "@/lib/animal-names";
import type { CheckIn, ProInsights } from "@/lib/dashboard-stats";
import { EmptyState } from "./parts";

function displayName(c: { name: string | null; cookieId: string }): string {
  return c.name || generateAnimalName(c.cookieId || "");
}

/** Initial-letter avatar; hue derived from the id so a person keeps a colour. */
function Avatar({ name, seed }: { name: string; seed: string }) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white/90"
      style={{ backgroundColor: `hsl(${hash % 360} 35% 32%)` }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/** "8:12 am" today, "Yesterday 4:05 pm", "Tue 4:05 pm", else "3 Oct" (+ time when asked). */
function whenLabel(iso: string, alwaysTime = false): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const dayDiff = Math.round(
    (new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000,
  );
  if (dayDiff === 0) return time;
  if (dayDiff === 1) return `Yesterday ${time}`;
  if (dayDiff < 7) return `${d.toLocaleDateString(undefined, { weekday: "short" })} ${time}`;
  const date = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return alwaysTime ? `${date}, ${time}` : date;
}

/**
 * What a check-in did, in words: "+1 stamp", "Reward" (plus any stamps that
 * came with it), or "Declined". Redemptions read as a reward rather than as
 * the "-8" stamp arithmetic, which meant nothing to most owners.
 */
function CheckinValue({ c, perkMode }: { c: CheckIn; perkMode: boolean }) {
  if (c.status !== "approved") {
    return <span className="text-xs text-muted-foreground">Declined</span>;
  }
  if (perkMode || c.redeem) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
          {perkMode ? "Free reward" : "Reward"}
        </span>
        {!perkMode && c.stampsAwarded > 0 && <span className="text-amber-500">+{c.stampsAwarded}</span>}
      </span>
    );
  }
  return (
    <span className="text-amber-500">
      +{c.stampsAwarded} <span className="text-xs text-muted-foreground">stamp{c.stampsAwarded === 1 ? "" : "s"}</span>
    </span>
  );
}

/** The live feed beside today's chart: the most recent check-ins, any day. */
export function LatestFeed({ items, perkMode }: { items: CheckIn[]; perkMode: boolean }) {
  if (!items.length) {
    return <EmptyState height={200} title="No check-ins yet" hint="They'll appear here the moment they happen." />;
  }
  return (
    <ul className="-my-1 divide-y divide-border/60">
      {items.map((c) => {
        const name = displayName(c);
        const body = (
          <>
            <Avatar name={name} seed={c.customerId ?? c.id} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">{whenLabel(c.createdAt)}</p>
            </div>
            <span className="shrink-0 text-sm tabular-nums">
              <CheckinValue c={c} perkMode={perkMode} />
            </span>
          </>
        );
        return (
          <li key={c.id}>
            {c.customerId ? (
              <Link
                href={`/dashboard/customers/${c.customerId}`}
                className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/40"
              >
                {body}
              </Link>
            ) : (
              <div className="flex items-center gap-3 py-2">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface TopCustomer {
  rank: number;
  id: string;
  name: string | null;
  email: string | null;
  cookieId: string;
  totalEarned: number;
  freeRedeemed: number;
}

const MEDAL: Record<number, string> = {
  1: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  2: "bg-zinc-400/15 text-zinc-300 ring-zinc-400/30",
  3: "bg-orange-700/15 text-orange-400 ring-orange-600/30",
};

export function TopCustomersList({ customers, perkMode }: { customers: TopCustomer[]; perkMode: boolean }) {
  if (!customers.length) {
    return (
      <EmptyState
        height={180}
        title="No regulars yet"
        hint="Customers show up here once they've redeemed their first reward."
      />
    );
  }
  return (
    <ul className="-my-1 divide-y divide-border/60">
      {customers.map((c) => (
        <li key={c.id}>
          <Link
            href={`/dashboard/customers/${c.id}`}
            className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/40"
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                MEDAL[c.rank] ? `ring-1 ring-inset ${MEDAL[c.rank]}` : "text-muted-foreground"
              }`}
            >
              {c.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{displayName(c)}</p>
              {c.email && <p className="truncate text-xs text-muted-foreground">{c.email}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {perkMode ? c.freeRedeemed : c.totalEarned}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {perkMode ? "free rewards" : `stamps · ${c.freeRedeemed} rewards`}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function LapsedList({ lapsed }: { lapsed: ProInsights["lapsed"] }) {
  if (!lapsed.customers.length) {
    return (
      <EmptyState
        height={180}
        title="Everyone's been in lately"
        hint="No regular (3+ visits) has been away for more than 30 days."
      />
    );
  }
  return (
    <ul className="-my-1 divide-y divide-border/60">
      {lapsed.customers.map((c) => {
        const name = displayName(c);
        return (
          <li key={c.id}>
            <Link
              href={`/dashboard/customers/${c.id}`}
              className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/40"
            >
              <Avatar name={name} seed={c.id} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{c.visits} visits</p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-amber-400/90">{c.daysAway}d away</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const PAGE_SIZE = 10;

/** Every check-in in the selected period, newest first. */
export function CheckinLog({
  items,
  perkMode,
  capped,
}: {
  items: CheckIn[];
  perkMode: boolean;
  capped: boolean;
}) {
  const [page, setPage] = useState(0);
  // Back to the first page whenever the list itself changes (new period).
  const [seen, setSeen] = useState(items);
  if (seen !== items) {
    setSeen(items);
    setPage(0);
  }
  if (!items.length) return <EmptyState height={120} title="No check-ins in this period" />;
  const rows = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>What happened</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/40">
                <TableCell>
                  {c.customerId ? (
                    <Link href={`/dashboard/customers/${c.customerId}`} className="group block">
                      <span className="font-medium group-hover:underline">{displayName(c)}</span>
                      {c.email && <span className="block text-xs text-muted-foreground">{c.email}</span>}
                    </Link>
                  ) : (
                    <span className="font-medium">{displayName(c)}</span>
                  )}
                  {c.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="border-amber-500/50 px-1.5 py-0 text-[10px] font-normal text-amber-500"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  <CheckinValue c={c} perkMode={perkMode} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {whenLabel(c.createdAt, true)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pager page={page} pageSize={PAGE_SIZE} count={items.length} onPage={setPage} />
      {capped && (
        <p className="pt-2 text-xs text-muted-foreground">
          Showing the latest {items.length}. The full history is on each customer&apos;s page.
        </p>
      )}
    </>
  );
}
