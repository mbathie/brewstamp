// The shape of a stored server-log batch, and how to read one back. Pure (no
// database), so the writer (server-log.ts), the admin API and the CLI script
// all agree on the format. Ported from pos2.
import { gzipSync, gunzipSync } from "zlib";

export const LEVELS = ["log", "warn", "error", "http", "notfound"] as const;
export type LogLevel = (typeof LEVELS)[number];

// Seven days: long enough to investigate a Monday email about Thursday, short
// enough that the collection stays small.
export const SERVER_LOG_RETENTION_DAYS = 7;

export interface LogLine {
  /** ISO timestamp. */
  t: string;
  /** Level. */
  l: LogLevel;
  /** Message. */
  m: string;
}

/** Serialise a batch of lines to the stored, compressed form. */
export function packLines(lines: LogLine[]) {
  const buf = gzipSync(Buffer.from(JSON.stringify(lines), "utf8"));
  const levels: Record<LogLevel, number> = { log: 0, warn: 0, error: 0, http: 0, notfound: 0 };
  for (const l of lines) if (l.l in levels) levels[l.l] += 1;
  return {
    from: new Date(lines[0].t),
    to: new Date(lines[lines.length - 1].t),
    count: lines.length,
    levels,
    lines: buf,
    bytes: buf.length,
  };
}

/** Read the lines back out of a stored batch (mongoose doc, lean doc or raw driver doc). */
export function unpackLines(doc: unknown): LogLine[] {
  const raw = (doc as { lines?: any } | null | undefined)?.lines;
  if (!raw) return [];
  const buf: Buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw.buffer ?? raw);
  try {
    return JSON.parse(gunzipSync(buf).toString("utf8"));
  } catch {
    return [];
  }
}

export interface LineFilter {
  /** Case-insensitive substring. */
  q?: string;
  /** Level names; empty means all. */
  levels?: string[];
  since?: Date | string | null;
  until?: Date | string | null;
  limit?: number;
}

/** The lines a reader asked for, newest first, capped at `limit`. */
export function filterLines(lines: LogLine[], { q = "", levels = [], since = null, until = null, limit = 500 }: LineFilter = {}) {
  const needle = String(q || "").toLowerCase();
  const lv = new Set(levels || []);
  const s = since ? new Date(since).getTime() : null;
  const u = until ? new Date(until).getTime() : null;
  const out: LogLine[] = [];
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
    const l = lines[i];
    if (lv.size && !lv.has(l.l)) continue;
    const t = new Date(l.t).getTime();
    if (s != null && t < s) continue;
    if (u != null && t > u) continue;
    if (needle && !String(l.m).toLowerCase().includes(needle)) continue;
    out.push(l);
  }
  return out;
}

/** One console argument list as a single line of text, the way stdout shows it. */
export function formatArgs(args: unknown[]) {
  return args
    .map((a) => {
      if (typeof a === "string") return a;
      if (a instanceof Error) return a.stack || a.message;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(" ");
}

/** Trim a line so one runaway dump can't bloat a batch. */
export function clampLine(m: unknown, max = 4000) {
  const s = String(m ?? "");
  return s.length > max ? `${s.slice(0, max)}… [${s.length - max} more chars]` : s;
}
