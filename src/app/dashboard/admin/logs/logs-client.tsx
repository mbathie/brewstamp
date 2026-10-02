"use client";

// Server logs: the last 7 days of production console output, searchable.
// The platform's log viewer keeps a short tail; this keeps a week. Lines come
// from src/lib/server-log.ts (console capture) and server.ts (API writes,
// API errors and page 404s). "[PayPal client]" lines are the card form's own
// report of what happened in the browser.

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HOURS = [
  { value: "1", label: "Last hour" },
  { value: "6", label: "Last 6 hours" },
  { value: "24", label: "Last 24 hours" },
  { value: "72", label: "Last 3 days" },
  { value: "168", label: "Last 7 days" },
];
const LEVELS = [
  { value: "error", label: "Errors" },
  { value: "warn", label: "Warnings" },
  { value: "notfound", label: "404s" },
  { value: "http", label: "API requests" },
  { value: "log", label: "Info" },
];
const TONE: Record<string, string> = {
  error: "bg-red-500/15 text-red-400",
  warn: "bg-amber-500/15 text-amber-400",
  notfound: "bg-violet-500/15 text-violet-400",
  http: "bg-blue-500/15 text-blue-400",
  log: "bg-muted text-muted-foreground",
};
const PRESETS = [
  { label: "PayPal", q: "paypal" },
  { label: "Billing API", q: "/api/billing" },
];

interface Line {
  t: string;
  l: string;
  m: string;
  commit: string | null;
}
interface Data {
  lines: Line[];
  scanned: number;
  batches: number;
  oldest: string | null;
  truncated: boolean;
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export default function LogsClient() {
  const [hours, setHours] = useState("24");
  const [levels, setLevels] = useState<string[]>(["error", "warn", "notfound"]);
  const [q, setQ] = useState("");
  const debouncedQ = useDebounced(q.trim(), 300);
  const [data, setData] = useState<Data | null>(null);
  const [reload, setReload] = useState(0);
  const query = `${hours}|${levels.join(",")}|${debouncedQ}|${reload}`;
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const loading = loadedQuery !== query;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ hours, limit: "1000" });
    if (levels.length) params.set("level", levels.join(","));
    if (debouncedQ) params.set("q", debouncedQ);
    fetch(`/api/admin/logs?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoadedQuery(query);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadedQuery(query);
      });
    return () => {
      cancelled = true;
    };
  }, [hours, levels, debouncedQ, query]);

  const toggle = (l: string) => setLevels((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]));
  const lines = data?.lines || [];

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Server logs</h1>
          <p className="text-sm text-muted-foreground">
            Production logs kept for 7 days: errors, warnings, 404s, API writes and the card form&apos;s own reports.
            {data?.oldest ? ` Oldest kept: ${fmt(data.oldest)}.` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setReload((n) => n + 1)} disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <RefreshCw className="mr-1.5 size-4" />}
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={hours} onValueChange={setHours}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h.value} value={h.value}>
                {h.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Levels">
          {LEVELS.map((l) => {
            const on = levels.includes(l.value);
            return (
              <button
                key={l.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(l.value)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
                  on ? `${TONE[l.value]} border-transparent` : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search: a path, a shop id, an email, an error…"
            aria-label="Search log lines"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <Button key={p.q} variant="ghost" size="sm" className="cursor-pointer" onClick={() => setQ(p.q)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {data && (
        <p className="text-xs text-muted-foreground">
          {lines.length.toLocaleString()} line{lines.length === 1 ? "" : "s"}
          {data.truncated ? " (capped, narrow the range)" : ""} · {data.scanned.toLocaleString()} scanned · newest first
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border">
        {loading && !data ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : lines.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nothing matches.{data?.batches === 0 ? " No logs have been kept for this range yet." : ""}
          </p>
        ) : (
          <table className="w-full font-mono text-xs">
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-b border-border/50 align-top hover:bg-muted/30">
                  <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">{fmt(l.t)}</td>
                  <td className="px-2 py-1.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${TONE[l.l] || TONE.log}`}>{l.l}</span>
                  </td>
                  <td className="whitespace-pre-wrap break-all px-3 py-1.5">{l.m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
