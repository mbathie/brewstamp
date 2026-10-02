// Production server logs, kept for 7 days in Mongo (ported from pos2).
//
// Installed once at boot from server.ts. Wraps console.log / info / warn /
// error so every line still goes to stdout exactly as before AND lands in a
// buffer. The buffer is flushed to the `serverlogs` collection every 30s (or
// sooner when it fills) as one gzipped batch; see src/models/ServerLog.ts.
// server.ts adds an `http` line per API request and a `notfound` line per
// page 404, so the record shows what a merchant actually hit.
//
// Read it at /dashboard/admin/logs, GET /api/admin/logs, or
// scripts/prod-logs.ts. On only for brewstamp.app; SERVER_LOG_DB=1 / 0 forces
// it either way (so a dev laptop doesn't fill its database with its own noise).
//
// Relative imports only: this file is compiled into dist/ by
// tsconfig.server.json, which doesn't know the `@/` alias.
import { packLines, formatArgs, clampLine, type LogLevel, type LogLine } from "./server-log-pure";

const FLUSH_MS = 30_000;
const FLUSH_AT = 500;
const MAX_BUFFER = 5000;
const KEY = Symbol.for("brewstamp.serverLog");

type Console4 = Pick<Console, "log" | "info" | "warn" | "error">;
interface State {
  installed: boolean;
  enabled: boolean;
  buffer: LogLine[];
  original: Console4 | null;
  timer: NodeJS.Timeout | null;
  flushing: boolean;
}

function state(): State {
  const g = globalThis as any;
  if (!g[KEY]) g[KEY] = { installed: false, enabled: false, buffer: [], original: null, timer: null, flushing: false };
  return g[KEY];
}

export function serverLogEnabled() {
  if (process.env.SERVER_LOG_DB === "0") return false;
  if (process.env.SERVER_LOG_DB === "1") return true;
  let host = "";
  try {
    host = new URL(process.env.NEXT_PUBLIC_APP_URL || "").hostname;
  } catch {}
  return host === "brewstamp.app" || host === "www.brewstamp.app";
}

/** Add one line to the buffer. A no-op until installed (and when disabled). */
export function logLine(level: LogLevel, message: string) {
  const s = state();
  if (!s.enabled) return;
  if (s.buffer.length >= MAX_BUFFER) {
    // Never grow without bound: drop the oldest tenth and say so.
    s.buffer.splice(0, Math.floor(MAX_BUFFER / 10));
    s.buffer.push({ t: new Date().toISOString(), l: "warn", m: "[server-log] buffer overflow, oldest lines dropped" });
  }
  s.buffer.push({ t: new Date().toISOString(), l: level, m: clampLine(message) });
  if (s.buffer.length >= FLUSH_AT) void flush();
}

/** One line per request, from server.ts. */
export function logHttp({ method, path, status, ms }: { method: string; path: string; status: number; ms: number }) {
  logLine(status === 404 && !path.startsWith("/api/") ? "notfound" : "http", `${method} ${path} ${status} ${ms}ms`);
}

async function flush() {
  const s = state();
  if (s.flushing || !s.buffer.length) return;
  s.flushing = true;
  const lines = s.buffer.splice(0, s.buffer.length);
  try {
    const { connectDB } = await import("./mongoose");
    const { default: ServerLog } = await import("../models/ServerLog");
    await connectDB();
    await ServerLog.create({
      ...packLines(lines),
      commit: process.env.COMMIT_SHA || process.env.SOURCE_COMMIT || undefined,
      host: process.env.HOSTNAME || undefined,
    });
  } catch (err: any) {
    // Straight to the ORIGINAL console: logging a flush failure through the
    // wrapper would only put it back in the buffer.
    s.original?.error("[server-log] flush failed:", err?.message);
  } finally {
    s.flushing = false;
  }
}

export function installServerLog() {
  const s = state();
  if (s.installed) return s.enabled;
  s.installed = true;
  s.enabled = serverLogEnabled();
  if (!s.enabled) return false;

  const original: Console4 = { log: console.log, info: console.info, warn: console.warn, error: console.error };
  s.original = original;
  const wrap =
    (level: LogLevel, orig: (...a: any[]) => void) =>
    (...args: unknown[]) => {
      try {
        logLine(level, formatArgs(args));
      } catch {}
      return orig.apply(console, args);
    };
  console.log = wrap("log", original.log);
  console.info = wrap("log", original.info);
  console.warn = wrap("warn", original.warn);
  console.error = wrap("error", original.error);

  s.timer = setInterval(() => void flush(), FLUSH_MS);
  s.timer.unref?.();
  // Get the tail out on the way down (a deploy sends SIGTERM).
  for (const sig of ["SIGTERM", "SIGINT"] as const) {
    process.once(sig, () => {
      flush().finally(() => process.exit(0));
    });
  }
  original.log("[server-log] capturing console + http lines to the database (7-day retention)");
  return true;
}

export { flush as flushServerLog };
