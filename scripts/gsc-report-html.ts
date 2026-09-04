/**
 * Google Search Console → standalone HTML report for brewstamp.app.
 *
 * Usage:
 *   source ~/.config/brewstamp/gsc-oauth.env && \
 *     npx tsx scripts/gsc-report-html.ts [--days 28] [--history 180] [--out <path>]
 *
 * Companion to scripts/gsc-report.ts (terminal version). Same auth: OAuth
 * refresh token from ~/.config/brewstamp/gsc-oauth-token.json.
 *
 * Writes a single self-contained file (no network assets) with the trailing
 * window vs the preceding window, daily trends, opportunity analysis and
 * derived recommendations. Default output: ~/Downloads/brewstamp-seo-report.html
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface Row {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Metric {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

const SITE = getArg("--site") ?? "sc-domain:brewstamp.app";
const DAYS = parseInt(getArg("--days") ?? "28", 10);
const HISTORY_DAYS = parseInt(getArg("--history") ?? "180", 10);
const OUT =
  getArg("--out") ?? join(homedir(), "Downloads", "brewstamp-seo-report.html");

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shiftDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/* ── auth + fetch ─────────────────────────────────────────────────────── */

async function getAccessToken(): Promise<string> {
  const tokenPath = join(homedir(), ".config/brewstamp/gsc-oauth-token.json");
  const config = JSON.parse(readFileSync(tokenPath, "utf8")) as {
    refresh_token: string;
    client_id?: string;
    client_secret?: string;
  };
  const clientId =
    process.env.GSC_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || config.client_id;
  const clientSecret =
    process.env.GSC_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    config.client_secret;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing OAuth client creds. Set GSC_CLIENT_ID + GSC_CLIENT_SECRET, or add " +
        "client_id/client_secret to ~/.config/brewstamp/gsc-oauth-token.json.",
    );
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function query(
  token: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  rowLimit = 1000,
): Promise<Row[]> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    SITE,
  )}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
  });
  if (!res.ok) throw new Error(`GSC query failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { rows?: Row[] }).rows ?? [];
}

/* ── analysis helpers ─────────────────────────────────────────────────── */

function totals(rows: Row[]): Metric {
  let clicks = 0,
    impressions = 0,
    posSum = 0;
  for (const r of rows) {
    clicks += r.clicks;
    impressions += r.impressions;
    posSum += r.position * r.impressions;
  }
  return {
    clicks,
    impressions,
    ctr: impressions === 0 ? 0 : clicks / impressions,
    position: impressions === 0 ? 0 : posSum / impressions,
  };
}

/** Modelled organic CTR by rank — an industry blend, used only to size headroom. */
function benchCtr(pos: number): number {
  const t = [0, 0.281, 0.157, 0.11, 0.08, 0.061, 0.048, 0.039, 0.032, 0.028, 0.025];
  const p = Math.max(1, Math.round(pos));
  if (p <= 10) return t[p];
  if (p <= 15) return 0.015;
  if (p <= 20) return 0.01;
  if (p <= 30) return 0.006;
  return 0.003;
}

function stripHost(u: string): string {
  return u.replace(/^https?:\/\/brewstamp\.app/, "") || "/";
}

function movingAvg(vals: number[], window: number): (number | null)[] {
  return vals.map((_, i) => {
    if (i < window - 1) return null;
    let s = 0;
    for (let k = i - window + 1; k <= i; k++) s += vals[k];
    return s / window;
  });
}

/** Parse the summary table out of docs/seo-snapshots.md for the long history. */
function readSnapshotHistory(): Array<{
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}> {
  const path = join(process.cwd(), "docs", "seo-snapshots.md");
  if (!existsSync(path)) return [];
  const out: Array<{
    date: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }> = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(
      /^\|\s*(\d{4}-\d{2}-\d{2})\s*\|[^|]*\|\s*([\d,]+)[^|]*\|\s*([\d,]+)[^|]*\|\s*([\d.]+)%\s*\|\s*([\d.]+)\s*\|/,
    );
    if (!m) continue;
    out.push({
      date: m[1],
      impressions: parseInt(m[2].replace(/,/g, ""), 10),
      clicks: parseInt(m[3].replace(/,/g, ""), 10),
      ctr: parseFloat(m[4]) / 100,
      position: parseFloat(m[5]),
    });
  }
  return out;
}

/* ── main ─────────────────────────────────────────────────────────────── */

async function main() {
  const token = await getAccessToken();

  // GSC's reporting lag isn't a fixed two days — it moves. Pull the daily series
  // first and anchor the window to the last day that actually reported, so the
  // window never includes a dead trailing day. That silently understates the
  // totals and makes two runs a day apart look like a decline.
  const today = new Date();
  const probeStart = isoDate(shiftDays(today, -(HISTORY_DAYS + 5)));
  const daily = await query(token, probeStart, isoDate(today), ["date"], 1000);
  const lastReported = daily.length
    ? daily.map((r) => r.keys?.[0] ?? "").sort().slice(-1)[0]
    : isoDate(shiftDays(today, -2));

  const end = new Date(lastReported + "T12:00:00Z");
  const start = shiftDays(end, -(DAYS - 1));
  const prevEnd = shiftDays(start, -1);
  const prevStart = shiftDays(prevEnd, -(DAYS - 1));
  const histStart = shiftDays(end, -(HISTORY_DAYS - 1));

  const [S, E, PS, PE, HS] = [start, end, prevStart, prevEnd, histStart].map(isoDate);

  console.log(`Site: ${SITE}`);
  console.log(`Window: ${S} → ${E}  (vs ${PS} → ${PE})`);
  console.log(`Last day reported by GSC: ${E}`);

  const [
    currTot,
    prevTot,
    qCurr,
    qPrev,
    pCurr,
    pPrev,
    cCurr,
    cPrev,
    dCurr,
    dPrev,
    pageQuery,
  ] = await Promise.all([
    query(token, S, E, [], 1),
    query(token, PS, PE, [], 1),
    query(token, S, E, ["query"], 500),
    query(token, PS, PE, ["query"], 500),
    query(token, S, E, ["page"], 500),
    query(token, PS, PE, ["page"], 500),
    query(token, S, E, ["country"], 250),
    query(token, PS, PE, ["country"], 250),
    query(token, S, E, ["device"], 5),
    query(token, PS, PE, ["device"], 5),
    query(token, S, E, ["page", "query"], 3000),
  ]);

  const curr = totals(currTot);
  const prev = totals(prevTot);

  const key = (r: Row) => r.keys?.[0] ?? "";
  const mapOf = (rows: Row[]) => new Map(rows.map((r) => [key(r), r]));
  const qPrevMap = mapOf(qPrev);
  const pPrevMap = mapOf(pPrev);
  const cPrevMap = mapOf(cPrev);
  const dPrevMap = mapOf(dPrev);

  const zero: Row = { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  const withDelta = (rows: Row[], prevMap: Map<string, Row>, label = (s: string) => s) =>
    rows.map((r) => {
      const k = key(r);
      const p = prevMap.get(k);
      return {
        key: label(k),
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        pClicks: (p ?? zero).clicks,
        pImpressions: (p ?? zero).impressions,
        pCtr: (p ?? zero).ctr,
        pPosition: p ? p.position : null,
        isNew: !p,
        headroom: Math.max(0, r.impressions * benchCtr(r.position) - r.clicks),
      };
    });

  const queries = withDelta(qCurr, qPrevMap).sort((a, b) => b.impressions - a.impressions);
  const pages = withDelta(pCurr, pPrevMap, stripHost).sort(
    (a, b) => b.impressions - a.impressions,
  );
  const countries = withDelta(cCurr, cPrevMap).sort((a, b) => b.impressions - a.impressions);
  const devices = withDelta(dCurr, dPrevMap);

  // Queries that ranked last period and are gone now.
  const currQueryKeys = new Set(qCurr.map(key));
  const lost = qPrev
    .filter((r) => !currQueryKeys.has(key(r)) && r.impressions >= 10)
    .map((r) => ({
      key: key(r),
      impressions: r.impressions,
      clicks: r.clicks,
      position: r.position,
    }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  // Top queries per page, for the drill-down rows.
  const perPage = new Map<string, Array<{ q: string; clicks: number; impressions: number; position: number }>>();
  for (const r of pageQuery) {
    const pg = stripHost(r.keys?.[0] ?? "");
    if (!perPage.has(pg)) perPage.set(pg, []);
    perPage.get(pg)!.push({
      q: r.keys?.[1] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      position: r.position,
    });
  }
  const pageQueries: Record<string, Array<{ q: string; clicks: number; impressions: number; position: number }>> = {};
  const pageQueryStats: Record<
    string,
    { queries: number; impressions: number; clicks: number; headroom: number }
  > = {};
  for (const [pg, rows] of perPage) {
    pageQueries[pg] = rows.sort((a, b) => b.impressions - a.impressions).slice(0, 6);
    pageQueryStats[pg] = {
      queries: rows.length,
      impressions: rows.reduce((s, r) => s + r.impressions, 0),
      clicks: rows.reduce((s, r) => s + r.clicks, 0),
      headroom: rows.reduce(
        (s, r) => s + Math.max(0, r.impressions * benchCtr(r.position) - r.clicks),
        0,
      ),
    };
  }

  // Rank distribution, weighted by impressions, current vs prior.
  const buckets = [
    { label: "1–3", test: (p: number) => p < 3.5 },
    { label: "4–10", test: (p: number) => p < 10.5 },
    { label: "11–20", test: (p: number) => p < 20.5 },
    { label: "21–50", test: (p: number) => p < 50.5 },
    { label: "51+", test: () => true },
  ];
  const bucketise = (rows: Row[]) => {
    const acc = buckets.map(() => ({ impressions: 0, clicks: 0 }));
    for (const r of rows) {
      const i = buckets.findIndex((b) => b.test(r.position));
      acc[i].impressions += r.impressions;
      acc[i].clicks += r.clicks;
    }
    return acc;
  };
  const distCurr = bucketise(qCurr);
  const distPrev = bucketise(qPrev);

  // Daily series (fill gaps so the x-axis is continuous).
  const dailyMap = new Map(daily.map((r) => [key(r), r]));
  const allDates: string[] = [];
  for (let d = new Date(histStart); isoDate(d) <= E; d = shiftDays(d, 1)) allDates.push(isoDate(d));
  // GSC returns no row at all for a day it has no data for — including the tail
  // of the window, which is still settling. Trim to the last reporting day
  // rather than filling zeros, which would draw a cliff that isn't real.
  let last = allDates.length - 1;
  while (last >= 0 && !dailyMap.has(allDates[last])) last--;
  const dates = allDates.slice(0, last + 1).filter((dt) => dt >= HS);
  const series = {
    dates,
    clicks: dates.map((d) => dailyMap.get(d)?.clicks ?? null),
    impressions: dates.map((d) => dailyMap.get(d)?.impressions ?? null),
    position: dates.map((d) => dailyMap.get(d)?.position ?? null),
  };

  const totalHeadroom = queries.reduce((s, q) => s + q.headroom, 0);

  // Country upside: what the big impression pools would earn at the site's
  // best-converting significant market's CTR.
  const significant = countries.filter((c) => c.impressions >= 200);
  const bestCtr = significant.length ? Math.max(...significant.map((c) => c.ctr)) : curr.ctr;
  const bestCtrCountry = significant.find((c) => c.ctr === bestCtr)?.key ?? "";
  const countryUpside = significant.map((c) => ({
    ...c,
    upside: Math.max(0, c.impressions * bestCtr - c.clicks),
  }));

  const data = {
    site: SITE,
    generatedAt: new Date().toISOString(),
    window: { start: S, end: E, prevStart: PS, prevEnd: PE, days: DAYS },
    curr,
    prev,
    queries,
    pages,
    pageQueries,
    pageQueryStats,
    countries: countryUpside,
    bestCtr,
    bestCtrCountry,
    devices,
    lost,
    dist: { labels: buckets.map((b) => b.label), curr: distCurr, prev: distPrev },
    series,
    history: readSnapshotHistory(),
    totalHeadroom,
  };

  writeFileSync(OUT, renderHtml(data, worldMapSvg()), "utf8");
  console.log(`\nWrote ${OUT}`);
  console.log(
    `  Clicks ${curr.clicks} · Impressions ${curr.impressions} · CTR ${(curr.ctr * 100).toFixed(
      1,
    )}% · Avg pos ${curr.position.toFixed(1)}`,
  );
  console.log(`  Modelled click headroom at current ranks: ~${Math.round(totalHeadroom)}/28d`);
}

/* ── world map ────────────────────────────────────────────────────────── */

/**
 * Inline SVG of the world, one <path> per country keyed by ISO alpha-3 (what
 * Search Console reports), from the cached Natural Earth asset built by
 * scripts/build-world-paths.ts. The page colours it client-side. Returns "" if
 * the asset is missing so the report still renders without a map.
 */
function worldMapSvg(): string {
  const path = join(process.cwd(), "scripts/assets/world-paths.json");
  if (!existsSync(path)) return "";
  const world = JSON.parse(readFileSync(path, "utf8")) as {
    width: number;
    height: number;
    countries: Record<string, { name: string; d: string }>;
  };
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const paths = Object.entries(world.countries)
    // Antarctica is a third of the canvas and never has traffic.
    .filter(([iso]) => iso !== "ATA")
    .map(
      ([iso, c]) =>
        `<path data-iso="${iso}" data-name="${esc(c.name)}" d="${c.d}"/>`,
    )
    .join("");
  return `<svg id="worldmap" viewBox="0 0 ${world.width} ${world.height}" role="img" aria-label="Impressions by country">${paths}</svg>`;
}

/* ── html ─────────────────────────────────────────────────────────────── */

function renderHtml(d: any, worldSvg: string): string {
  const generated = new Date(d.generatedAt).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const json = JSON.stringify(d).replace(/</g, "\\u003c");
  const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const dlt = (c: number, p: number) => {
    if (p === 0) return c === 0 ? "no change" : "new";
    const pc = ((c - p) / p) * 100;
    return `${pc >= 0 ? "+" : ""}${pc.toFixed(0)}% vs prior 28d`;
  };
  const posDlt = (c: number, p: number) => {
    const delta = c - p;
    return `${delta <= 0 ? "▲" : "▼"} ${delta > 0 ? "+" : ""}${delta.toFixed(1)} vs prior 28d`;
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Brewstamp SEO — ${d.window.start} → ${d.window.end}</title>
<style>
:root {
  color-scheme: light dark;
  --page:        #f9f9f7;
  --surface:     #fcfcfb;
  --ink:         #0b0b0b;
  --ink-2:       #52514e;
  --muted:       #898781;
  --grid:        #e1e0d9;
  --axis:        #c3c2b7;
  --border:      rgba(11,11,11,0.10);
  --s1:          #2a78d6;
  --s2:          #eb6834;
  --s3:          #1baf7a;
  --neutral:     #c3c2b7;
  --good:        #006300;
  --bad:         #d03b3b;
  --wash:        rgba(42,120,214,0.10);
  /* sequential blue, low→high; on the light surface the low end recedes */
  --seq1: #b7d3f6; --seq2: #86b6ef; --seq3: #5598e7; --seq4: #2a78d6; --seq5: #184f95;
  --map-none:    #ececea;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --page:    #0d0d0d;
    --surface: #1a1a19;
    --ink:     #ffffff;
    --ink-2:   #c3c2b7;
    --muted:   #898781;
    --grid:    #2c2c2a;
    --axis:    #383835;
    --border:  rgba(255,255,255,0.10);
    --s1:      #3987e5;
    --s2:      #d95926;
    --s3:      #199e70;
    --neutral: #52514e;
    --good:    #0ca30c;
    --bad:     #e66767;
    --wash:    rgba(57,135,229,0.14);
    /* on the dark surface the ramp runs dark→light so the high end pops */
    --seq1: #184f95; --seq2: #256abf; --seq3: #3987e5; --seq4: #6da7ec; --seq5: #9ec5f4;
    --map-none: #232322;
  }
}
:root[data-theme="dark"] {
  --page:#0d0d0d; --surface:#1a1a19; --ink:#fff; --ink-2:#c3c2b7; --muted:#898781;
  --grid:#2c2c2a; --axis:#383835; --border:rgba(255,255,255,0.10);
  --s1:#3987e5; --s2:#d95926; --s3:#199e70; --neutral:#52514e;
  --good:#0ca30c; --bad:#e66767; --wash:rgba(57,135,229,0.14);
  --seq1:#184f95; --seq2:#256abf; --seq3:#3987e5; --seq4:#6da7ec; --seq5:#9ec5f4; --map-none:#232322;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--page);
  color: var(--ink);
  font: 14px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 1120px; margin: 0 auto; padding: 32px 24px 80px; }
header.top { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 4px; }
h1 { font-size: 22px; font-weight: 620; letter-spacing: -0.01em; margin: 0; }
.sub { color: var(--ink-2); font-size: 13px; margin: 2px 0 28px; }
h2 { font-size: 15px; font-weight: 620; letter-spacing: -0.005em; margin: 40px 0 4px; }
h2:first-of-type { margin-top: 32px; }
.note { color: var(--muted); font-size: 12.5px; margin: 0 0 14px; max-width: 68ch; }
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 18px 18px 14px;
}
.grid { display: grid; gap: 14px; }
.tiles { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.two { grid-template-columns: 1fr 1fr; }
@media (max-width: 780px) { .two { grid-template-columns: 1fr; } }
.tile .label { color: var(--ink-2); font-size: 12px; font-weight: 550; letter-spacing: 0.02em; text-transform: uppercase; }
.tile .value { font-size: 34px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; margin: 6px 0 2px; }
.tile .delta { font-size: 12.5px; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.up { color: var(--good); } .down { color: var(--bad); }
.tile .spark { margin-top: 10px; height: 30px; }
.chart-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 2px; }
.chart-title { font-size: 13.5px; font-weight: 600; }
.legend { display: flex; gap: 14px; align-items: center; color: var(--ink-2); font-size: 12px; }
.legend i { display: inline-block; width: 14px; height: 0; border-top-style: solid; margin-right: 5px; vertical-align: middle; }
button.ghost {
  font: inherit; font-size: 12px; color: var(--ink-2); background: none;
  border: 1px solid var(--border); border-radius: 6px; padding: 3px 9px; cursor: pointer;
}
button.ghost:hover { background: var(--wash); color: var(--ink); }
.plot { position: relative; }
svg { display: block; overflow: visible; }
.tt {
  position: absolute; pointer-events: none; opacity: 0; transition: opacity .1s;
  background: var(--surface); border: 1px solid var(--border); border-radius: 7px;
  padding: 7px 9px; font-size: 12px; box-shadow: 0 4px 14px rgba(0,0,0,.10);
  white-space: nowrap; z-index: 5; font-variant-numeric: tabular-nums;
}
.tt b { font-weight: 600; }
table { border-collapse: collapse; width: 100%; font-size: 13px; font-variant-numeric: tabular-nums; }
th, td { text-align: right; padding: 7px 9px; border-bottom: 1px solid var(--grid); white-space: nowrap; }
th:first-child, td:first-child { text-align: left; white-space: normal; }
th {
  color: var(--ink-2); font-weight: 550; font-size: 11.5px; letter-spacing: .03em;
  text-transform: uppercase; border-bottom: 1px solid var(--axis); position: sticky; top: 0;
  background: var(--surface); cursor: pointer; user-select: none;
}
th.nosort { cursor: default; }
th[aria-sort="ascending"]::after { content: " ↑"; color: var(--muted); }
th[aria-sort="descending"]::after { content: " ↓"; color: var(--muted); }
tbody tr:hover { background: var(--wash); }
td.q { max-width: 300px; overflow: hidden; text-overflow: ellipsis; }
.scroll { overflow-x: auto; max-height: 560px; overflow-y: auto; }
.bar-cell { position: relative; }
.bar-cell .fill {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  height: 16px; background: var(--wash); border-radius: 3px; z-index: 0;
}
.bar-cell span { position: relative; z-index: 1; }
.pill {
  display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 7px;
  border-radius: 20px; border: 1px solid var(--border); color: var(--ink-2);
}
.pill.hot { color: var(--good); border-color: var(--good); }
.pill.warn { color: var(--s2); border-color: var(--s2); }
ul.actions { list-style: none; padding: 0; margin: 0; }
ul.actions li { border-bottom: 1px solid var(--grid); padding: 12px 0; display: flex; gap: 12px; }
ul.actions li:last-child { border-bottom: 0; }
ul.actions .n {
  flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--wash);
  color: var(--s1); font-size: 12px; font-weight: 650; display: grid; place-items: center;
}
ul.actions .why { color: var(--ink-2); font-size: 12.5px; }
.mono { font-variant-numeric: tabular-nums; }
#worldmap { width: 100%; height: auto; display: block; }
#worldmap path { fill: var(--map-none); stroke: var(--surface); stroke-width: 0.6; transition: opacity .1s; }
#worldmap path[data-has] { cursor: default; }
#worldmap path:hover { opacity: .8; }
.map-legend { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 11.5px; color: var(--ink-2); margin-top: 8px; }
.map-legend i { display: inline-block; width: 22px; height: 10px; border-radius: 2px; }
.map-legend span { margin-right: 8px; }
.hidden { display: none !important; }
footer { color: var(--muted); font-size: 12px; margin-top: 48px; border-top: 1px solid var(--grid); padding-top: 14px; }
</style>
</head>
<body>
<div class="wrap">

<header class="top">
  <div>
    <h1>Brewstamp organic search</h1>
    <div class="sub">${d.window.days}-day window <b>${d.window.start} → ${d.window.end}</b>,
      compared with <b>${d.window.prevStart} → ${d.window.prevEnd}</b> · ${d.site}</div>
    <div class="sub" style="margin-top:-22px">Generated <b>${generated}</b> · data to ${d.window.end}</div>
  </div>
  <button class="ghost" id="theme">Toggle theme</button>
</header>

<div class="grid tiles">
  <div class="card tile">
    <div class="label">Clicks</div>
    <div class="value">${d.curr.clicks.toLocaleString()}</div>
    <div class="delta ${d.curr.clicks >= d.prev.clicks ? "up" : "down"}">${dlt(d.curr.clicks, d.prev.clicks)}</div>
    <div class="spark" data-spark="clicks"></div>
  </div>
  <div class="card tile">
    <div class="label">Impressions</div>
    <div class="value">${d.curr.impressions.toLocaleString()}</div>
    <div class="delta ${d.curr.impressions >= d.prev.impressions ? "up" : "down"}">${dlt(d.curr.impressions, d.prev.impressions)}</div>
    <div class="spark" data-spark="impressions"></div>
  </div>
  <div class="card tile">
    <div class="label">CTR</div>
    <div class="value">${fmtPct(d.curr.ctr)}</div>
    <div class="delta ${d.curr.ctr >= d.prev.ctr ? "up" : "down"}">${((d.curr.ctr - d.prev.ctr) * 100 >= 0 ? "+" : "") + ((d.curr.ctr - d.prev.ctr) * 100).toFixed(2)}pp vs prior 28d</div>
    <div class="spark" data-spark="ctr"></div>
  </div>
  <div class="card tile">
    <div class="label">Avg position</div>
    <div class="value">${d.curr.position.toFixed(1)}</div>
    <div class="delta ${d.curr.position <= d.prev.position ? "up" : "down"}">${posDlt(d.curr.position, d.prev.position)}</div>
    <div class="spark" data-spark="position"></div>
  </div>
</div>

<h2>What to do next</h2>
<p class="note">Derived from this window's data by the rules below each item — a starting shortlist, not a substitute for judgement.</p>
<div class="card"><ul class="actions" id="actions"></ul></div>

<h2>Daily trend</h2>
<p class="note">Last ${d.series.dates.length} days. The thin line is each day; the heavy line is the 7-day average.
  The shaded band marks the current ${d.window.days}-day window.</p>
<div class="grid">
  <div class="card" data-chart="impressions"></div>
  <div class="card" data-chart="clicks"></div>
  <div class="card" data-chart="position"></div>
</div>

<h2>Where the impressions rank</h2>
<p class="note">Impressions grouped by the average position of the query that produced them — the shape of visibility, not just its size.</p>
<div class="card" data-chart="dist"></div>

<h2>Click headroom</h2>
<p class="note">For every query, expected clicks at its current rank (a modelled industry CTR-by-position curve) minus the clicks actually earned.
  Positive headroom means the ranking is already there and the snippet isn't converting it. Site-wide: <b>~${Math.round(d.totalHeadroom).toLocaleString()} clicks per ${d.window.days} days</b> unrealised.</p>
<div class="grid two">
  <div class="card">
    <div class="chart-head"><div class="chart-title">Page 1, zero clicks</div></div>
    <p class="note">Ranked in the top 10 with no clicks at all. Title/meta rewrite territory.</p>
    <div class="scroll"><table data-table="page1"></table></div>
  </div>
  <div class="card">
    <div class="chart-head"><div class="chart-title">Striking distance (11–20)</div></div>
    <p class="note">One page-1 push away. Content depth and internal links are the levers.</p>
    <div class="scroll"><table data-table="striking"></table></div>
  </div>
</div>

<h2>Queries</h2>
<p class="note">Top 60 by impressions, with change against the prior window. Click a column head to sort.</p>
<div class="card"><div class="scroll"><table data-table="queries"></table></div></div>

<h2>Movers</h2>
<div class="grid two">
  <div class="card">
    <div class="chart-head"><div class="chart-title">Gained the most impressions</div></div>
    <div class="scroll"><table data-table="gainers"></table></div>
  </div>
  <div class="card">
    <div class="chart-head"><div class="chart-title">Lost the most impressions</div></div>
    <div class="scroll"><table data-table="losers"></table></div>
  </div>
  <div class="card">
    <div class="chart-head"><div class="chart-title">Biggest rank improvements</div></div>
    <p class="note">Queries with ≥30 impressions that climbed at least a full position.</p>
    <div class="scroll"><table data-table="climbers"></table></div>
  </div>
  <div class="card">
    <div class="chart-head"><div class="chart-title">Dropped out of the results</div></div>
    <p class="note">Ranked last window with ≥10 impressions, absent this window.</p>
    <div class="scroll"><table data-table="lost"></table></div>
  </div>
</div>

<h2>Pages</h2>
<p class="note">Click a row to see the queries that page ranks for. Headroom is summed over the
  named queries for that page, not derived from the page's average position — a page average blends
  its whole tail, so putting it through a rank-CTR curve badly overstates the opportunity.</p>
<div class="card"><div class="scroll"><table data-table="pages"></table></div></div>

<h2>Markets</h2>
<p class="note">Upside is what each market would earn at ${d.bestCtrCountry ? `<b>${d.bestCtrCountry.toUpperCase()}</b>'s` : "the best"} CTR of ${fmtPct(d.bestCtr)} — the site's best-converting market with real volume. It sizes the ranking-quality gap, it is not a forecast.</p>
${worldSvg ? `<div class="card" style="margin-bottom:14px">
  <div class="chart-head"><div class="chart-title">Impressions by country</div>
    <div class="legend"><span>Log scale · hover a country</span></div></div>
  <div class="plot">${worldSvg}<div class="tt" id="map-tt"></div></div>
  <div class="map-legend" id="map-legend"></div>
</div>` : ""}
<div class="grid two">
  <div class="card">
    <div class="chart-head"><div class="chart-title">By country</div></div>
    <div class="scroll"><table data-table="countries"></table></div>
  </div>
  <div class="card">
    <div class="chart-head"><div class="chart-title">By device</div></div>
    <div class="scroll"><table data-table="devices"></table></div>
  </div>
</div>

<h2>Snapshot history</h2>
<p class="note">Every trailing-28-day pull recorded in <code>docs/seo-snapshots.md</code>. Each chart is one measure on its own scale; points are evenly spaced by snapshot order, not by calendar date.</p>
<div class="grid two" id="history"></div>

<footer>
  Generated ${new Date(d.generatedAt).toLocaleString()} from the Google Search Console API
  (<code>scripts/gsc-report-html.ts</code>). The window ends on the last day Search Console had
  data for (${d.window.end}) rather than a fixed lag, so runs on consecutive days stay
  comparable; that final day may still be settling. CTR-by-position benchmarks are modelled
  industry averages used for sizing only.
</footer>

</div>
<script>
const DATA = ${json};

/* ── formatting ──────────────────────────────────────────────── */
const nf = (n) => Math.round(n).toLocaleString();
const pf = (n) => (n * 100).toFixed(1) + "%";
const posf = (n) => n.toFixed(1);
const deltaCell = (c, p, invert) => {
  if (p === 0 && c === 0) return '<span style="color:var(--muted)">—</span>';
  if (p === 0) return '<span class="pill hot">new</span>';
  const dv = c - p;
  const pc = (dv / p) * 100;
  const good = invert ? dv < 0 : dv > 0;
  if (Math.abs(pc) < 0.5) return '<span style="color:var(--muted)">flat</span>';
  return '<span class="' + (good ? "up" : "down") + '">' + (pc >= 0 ? "+" : "") + pc.toFixed(0) + "%</span>";
};
const posDeltaCell = (c, p) => {
  if (p == null) return '<span class="pill hot">new</span>';
  const dv = c - p;
  if (Math.abs(dv) < 0.15) return '<span style="color:var(--muted)">flat</span>';
  return '<span class="' + (dv < 0 ? "up" : "down") + '">' + (dv < 0 ? "▲ " : "▼ ") + Math.abs(dv).toFixed(1) + "</span>";
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ── charts ──────────────────────────────────────────────────── */
const NS = "http://www.w3.org/2000/svg";
function svgEl(name, attrs) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function niceTicks(min, max, count) {
  const span = (max - min) || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || 10 * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(v);
  return out;
}

/* Line chart: shared x-domain of dates, one measure, optional 7-day average. */
function timeChart(host, cfg) {
  const rawLabel = cfg.rawLabel || "daily";
  const avgLabel = cfg.avgLabel || "7-day avg";
  const render = () => {
    host.innerHTML = "";
    const head = document.createElement("div");
    head.className = "chart-head";
    head.innerHTML =
      '<div class="chart-title">' + cfg.title + "</div>" +
      '<div class="legend">' +
      '<span><i style="border-top-width:1px;border-color:' + cfg.color + ';opacity:.5"></i>' + rawLabel + "</span>" +
      '<span><i style="border-top-width:2px;border-color:' + cfg.color + '"></i>' + avgLabel + "</span>" +
      '<button class="ghost" data-toggle>Table</button></div>';
    host.appendChild(head);

    const plot = document.createElement("div");
    plot.className = "plot";
    host.appendChild(plot);

    const W = Math.max(320, host.clientWidth - 36), H = cfg.height || 190;
    const M = { t: 12, r: 12, b: 22, l: 46 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;
    const svg = svgEl("svg", { width: W, height: H, role: "img", "aria-label": cfg.title });

    const vals = (cfg.scaleToAvg ? cfg.avg : cfg.values).filter((v) => v != null);
    let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (cfg.invert) { const t = lo; lo = hi; hi = t; }
    let dmin = Math.min(lo, hi), dmax = Math.max(lo, hi);
    if (!cfg.invert) dmin = 0;
    const pad = (dmax - dmin) * 0.12 || 1;
    const y0 = cfg.invert ? Math.max(1, dmin - pad) : 0;
    const y1 = dmax + pad;
    const x = (i) => M.l + (iw * i) / Math.max(1, cfg.dates.length - 1);
    const y = (v) => {
      const t = (v - y0) / (y1 - y0 || 1);
      return cfg.invert ? M.t + t * ih : M.t + (1 - t) * ih;
    };

    // Current-window band
    if (cfg.bandFrom != null) {
      svg.appendChild(svgEl("rect", {
        x: x(cfg.bandFrom), y: M.t, width: iw - (x(cfg.bandFrom) - M.l), height: ih,
        fill: "var(--wash)",
      }));
    }
    // Gridlines + y ticks
    for (const t of niceTicks(Math.min(y0, y1), Math.max(y0, y1), 4)) {
      const yy = y(t);
      if (yy < M.t - 1 || yy > M.t + ih + 1) continue;
      svg.appendChild(svgEl("line", { x1: M.l, x2: M.l + iw, y1: yy, y2: yy, stroke: "var(--grid)", "stroke-width": 1 }));
      const lab = svgEl("text", { x: M.l - 8, y: yy + 4, "text-anchor": "end", fill: "var(--muted)", "font-size": 11 });
      lab.textContent = cfg.fmt(t);
      svg.appendChild(lab);
    }
    // x labels — first, middle, last
    [0, Math.floor(cfg.dates.length / 2), cfg.dates.length - 1].forEach((i, k) => {
      const t = svgEl("text", {
        x: x(i), y: M.t + ih + 16, fill: "var(--muted)", "font-size": 11,
        "text-anchor": k === 0 ? "start" : k === 2 ? "end" : "middle",
      });
      t.textContent = cfg.dates[i].slice(5);
      svg.appendChild(t);
    });
    svg.appendChild(svgEl("line", { x1: M.l, x2: M.l + iw, y1: M.t + ih, y2: M.t + ih, stroke: "var(--axis)", "stroke-width": 1 }));

    const clipId = "clip-" + Math.random().toString(36).slice(2, 9);
    const clip = svgEl("clipPath", { id: clipId });
    clip.appendChild(svgEl("rect", { x: M.l, y: M.t, width: iw, height: ih }));
    svg.appendChild(clip);

    const path = (arr, width, opacity, clipped) => {
      let dstr = "", pen = false;
      arr.forEach((v, i) => {
        if (v == null) { pen = false; return; }
        dstr += (pen ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1) + " ";
        pen = true;
      });
      const attrs = {
        d: dstr, fill: "none", stroke: cfg.color, "stroke-width": width,
        "stroke-linejoin": "round", "stroke-linecap": "round", opacity: opacity,
      };
      if (clipped) attrs["clip-path"] = "url(#" + clipId + ")";
      svg.appendChild(svgEl("path", attrs));
    };
    path(cfg.values, 1, 0.45, true);
    path(cfg.avg, 2, 1, false);

    // Endpoint direct label on the average
    for (let i = cfg.avg.length - 1; i >= 0; i--) {
      if (cfg.avg[i] == null) continue;
      svg.appendChild(svgEl("circle", { cx: x(i), cy: y(cfg.avg[i]), r: 3.5, fill: cfg.color, stroke: "var(--surface)", "stroke-width": 2 }));
      const t = svgEl("text", { x: x(i) - 8, y: y(cfg.avg[i]) - 9, "text-anchor": "end", fill: "var(--ink)", "font-size": 11.5, "font-weight": 600 });
      t.textContent = cfg.fmt(cfg.avg[i]);
      svg.appendChild(t);
      break;
    }

    const bounds = [Math.min(y0, y1), Math.max(y0, y1)];
    const outside = cfg.values.filter((v) => v != null && (v < bounds[0] || v > bounds[1])).length;

    const cross = svgEl("line", { y1: M.t, y2: M.t + ih, stroke: "var(--axis)", "stroke-width": 1, opacity: 0 });
    const dot = svgEl("circle", { r: 4, fill: cfg.color, stroke: "var(--surface)", "stroke-width": 2, opacity: 0 });
    svg.appendChild(cross); svg.appendChild(dot);
    plot.appendChild(svg);

    const tip = document.createElement("div");
    tip.className = "tt";
    plot.appendChild(tip);
    svg.addEventListener("pointermove", (ev) => {
      const r = svg.getBoundingClientRect();
      const i = Math.round(((ev.clientX - r.left - M.l) / iw) * (cfg.dates.length - 1));
      if (i < 0 || i >= cfg.dates.length) return;
      const v = cfg.values[i];
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("opacity", 1);
      if (v != null) { dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(v)); dot.setAttribute("opacity", 1); }
      else dot.setAttribute("opacity", 0);
      tip.innerHTML = "<b>" + cfg.dates[i] + "</b><br>" + cfg.title + ": " + (v == null ? "—" : cfg.fmt(v)) +
        (cfg.avg[i] != null ? "<br>" + avgLabel + ": " + cfg.fmt(cfg.avg[i]) : "");
      tip.style.opacity = 1;
      const tx = Math.min(Math.max(x(i) - 60, 0), W - 170);
      tip.style.left = tx + "px";
      tip.style.top = (v == null ? M.t : Math.max(0, y(v) - 62)) + "px";
    });
    svg.addEventListener("pointerleave", () => {
      tip.style.opacity = 0; cross.setAttribute("opacity", 0); dot.setAttribute("opacity", 0);
    });

    if (outside) {
      const n = document.createElement("p");
      n.className = "note";
      n.style.margin = "6px 0 0";
      n.textContent = outside + " day" + (outside === 1 ? "" : "s") +
        " fall outside this axis and are clipped — the scale follows the " + avgLabel +
        " so the recent range stays readable. Hover, or open the table, for every value.";
      host.appendChild(n);
    }

    // Table view twin
    const tbl = document.createElement("div");
    tbl.className = "scroll hidden";
    tbl.style.marginTop = "10px";
    let rows = "";
    for (let i = cfg.dates.length - 1; i >= 0; i--) {
      rows += "<tr><td>" + cfg.dates[i] + "</td><td>" + (cfg.values[i] == null ? "—" : cfg.fmt(cfg.values[i])) +
        "</td><td>" + (cfg.avg[i] == null ? "—" : cfg.fmt(cfg.avg[i])) + "</td></tr>";
    }
    tbl.innerHTML = "<table><thead><tr><th class='nosort'>Date</th><th class='nosort'>" + cfg.title +
      "</th><th class='nosort'>" + avgLabel + "</th></tr></thead><tbody>" + rows + "</tbody></table>";
    host.appendChild(tbl);
    head.querySelector("[data-toggle]").addEventListener("click", (e) => {
      const on = tbl.classList.toggle("hidden");
      e.target.textContent = on ? "Table" : "Chart";
      plot.classList.toggle("hidden", !on);
    });
  };
  render();
  window.addEventListener("resize", debounce(render, 180));
}

function debounce(fn, ms) { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; }

/* Sparkline for the stat tiles — no axes, no tooltip; the tile carries the number. */
function sparkline(host, values, color) {
  const render = () => {
    host.innerHTML = "";
    const W = Math.max(120, host.clientWidth), H = 30;
    const vals = values.filter((v) => v != null);
    const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    const svg = svgEl("svg", { width: W, height: H, "aria-hidden": "true" });
    let dstr = "", pen = false;
    values.forEach((v, i) => {
      if (v == null) { pen = false; return; }
      const x = (W * i) / Math.max(1, values.length - 1);
      const y = H - 3 - ((v - lo) / ((hi - lo) || 1)) * (H - 6);
      dstr += (pen ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " ";
      pen = true;
    });
    svg.appendChild(svgEl("path", { d: dstr, fill: "none", stroke: color, "stroke-width": 1.5, "stroke-linejoin": "round", opacity: 0.8 }));
    host.appendChild(svg);
  };
  render();
  window.addEventListener("resize", debounce(render, 180));
}

/* Grouped bars: current window vs prior, one dimension. */
function groupedBars(host, cfg) {
  const render = () => {
    host.innerHTML = "";
    const head = document.createElement("div");
    head.className = "chart-head";
    head.innerHTML = '<div class="chart-title">' + cfg.title + "</div>" +
      '<div class="legend">' +
      '<span><i style="border-top-width:8px;border-color:' + cfg.colors[0] + '"></i>' + cfg.names[0] + "</span>" +
      '<span><i style="border-top-width:8px;border-color:' + cfg.colors[1] + '"></i>' + cfg.names[1] + "</span></div>";
    host.appendChild(head);
    const plot = document.createElement("div");
    plot.className = "plot";
    host.appendChild(plot);

    const W = Math.max(320, host.clientWidth - 36), H = 210;
    const M = { t: 16, r: 12, b: 34, l: 52 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;
    const svg = svgEl("svg", { width: W, height: H, role: "img", "aria-label": cfg.title });
    const max = Math.max.apply(null, cfg.groups.flatMap((g) => g.values)) || 1;
    const y = (v) => M.t + ih - (v / (max * 1.12)) * ih;

    for (const t of niceTicks(0, max * 1.12, 4)) {
      const yy = y(t);
      svg.appendChild(svgEl("line", { x1: M.l, x2: M.l + iw, y1: yy, y2: yy, stroke: "var(--grid)", "stroke-width": 1 }));
      const lab = svgEl("text", { x: M.l - 8, y: yy + 4, "text-anchor": "end", fill: "var(--muted)", "font-size": 11 });
      lab.textContent = nf(t);
      svg.appendChild(lab);
    }
    const gw = iw / cfg.groups.length;
    const bw = Math.min(34, (gw - 14) / 2);
    const tip = document.createElement("div");
    tip.className = "tt";

    cfg.groups.forEach((g, gi) => {
      const cx = M.l + gw * gi + gw / 2;
      g.values.forEach((v, si) => {
        const bx = cx - bw - 1 + si * (bw + 2);
        const by = y(v), bh = Math.max(1, M.t + ih - by);
        const rect = svgEl("rect", { x: bx, y: by, width: bw, height: bh, rx: 4, fill: cfg.colors[si] });
        rect.addEventListener("pointerenter", () => {
          tip.innerHTML = "<b>" + g.label + "</b><br>" + cfg.names[si] + ": " + nf(v) + " impressions";
          tip.style.opacity = 1; tip.style.left = Math.min(bx, W - 190) + "px"; tip.style.top = Math.max(0, by - 54) + "px";
        });
        rect.addEventListener("pointerleave", () => (tip.style.opacity = 0));
        svg.appendChild(rect);
      });
      const lab = svgEl("text", { x: cx, y: M.t + ih + 17, "text-anchor": "middle", fill: "var(--ink-2)", "font-size": 11.5 });
      lab.textContent = g.label;
      svg.appendChild(lab);
      const share = svgEl("text", { x: cx, y: M.t + ih + 30, "text-anchor": "middle", fill: "var(--muted)", "font-size": 10.5 });
      share.textContent = g.share;
      svg.appendChild(share);
    });
    svg.appendChild(svgEl("line", { x1: M.l, x2: M.l + iw, y1: M.t + ih, y2: M.t + ih, stroke: "var(--axis)", "stroke-width": 1 }));
    plot.appendChild(svg);
    plot.appendChild(tip);
    const axisLabel = document.createElement("p");
    axisLabel.className = "note";
    axisLabel.style.margin = "8px 0 0";
    axisLabel.textContent = "Average position of the query · impressions";
    host.appendChild(axisLabel);
  };
  render();
  window.addEventListener("resize", debounce(render, 180));
}

/* ── tables ──────────────────────────────────────────────────── */
function buildTable(table, cols, rows, opts) {
  opts = opts || {};
  const thead = "<thead><tr>" + cols.map((c, i) =>
    '<th' + (c.sortable === false ? ' class="nosort"' : ' data-col="' + i + '"') + '>' + c.label + "</th>").join("") + "</tr></thead>";
  const body = () => "<tbody>" + rows.map((r, ri) => {
    const attrs = opts.rowKey ? ' data-row="' + esc(opts.rowKey(r)) + '"' + (opts.expandable ? ' style="cursor:pointer"' : "") : "";
    return "<tr" + attrs + ">" + cols.map((c) => "<td" + (c.cls ? ' class="' + c.cls + '"' : "") + ">" + c.cell(r, ri) + "</td>").join("") + "</tr>";
  }).join("") + "</tbody>";
  table.innerHTML = thead + body();

  let sortCol = null, dir = -1;
  table.querySelectorAll("th[data-col]").forEach((th) => {
    th.addEventListener("click", () => {
      const i = +th.dataset.col;
      dir = sortCol === i ? -dir : -1;
      sortCol = i;
      const val = cols[i].sortValue || ((r) => r[cols[i].key]);
      rows.sort((a, b) => {
        const av = val(a), bv = val(b);
        if (typeof av === "string") return dir === -1 ? av.localeCompare(bv) : bv.localeCompare(av);
        return dir === -1 ? bv - av : av - bv;
      });
      table.querySelectorAll("th").forEach((h) => h.removeAttribute("aria-sort"));
      th.setAttribute("aria-sort", dir === -1 ? "descending" : "ascending");
      table.querySelector("tbody").outerHTML = body();
      if (opts.expandable) wireExpand(table, opts);
    });
  });
  if (opts.expandable) wireExpand(table, opts);
}

function wireExpand(table, opts) {
  table.querySelectorAll("tbody tr[data-row]").forEach((tr) => {
    tr.addEventListener("click", () => {
      const next = tr.nextElementSibling;
      if (next && next.classList.contains("detail")) { next.remove(); return; }
      const html = opts.detail(tr.dataset.row);
      if (!html) return;
      const d = document.createElement("tr");
      d.className = "detail";
      d.innerHTML = '<td colspan="' + tr.children.length + '" style="background:var(--wash)">' + html + "</td>";
      tr.after(d);
    });
  });
}

/* ── build the page ──────────────────────────────────────────── */
const S = DATA.series;
const bandFrom = S.dates.indexOf(DATA.window.start);
const ma = (v, w) => v.map((_, i) => {
  if (i < w - 1) return null;
  let s = 0, n = 0;
  for (let k = i - w + 1; k <= i; k++) { if (v[k] == null) continue; s += v[k]; n++; }
  return n ? s / n : null;
});

timeChart(document.querySelector('[data-chart="impressions"]'), {
  title: "Impressions", color: "var(--s1)", dates: S.dates, values: S.impressions,
  avg: ma(S.impressions, 7), fmt: nf, bandFrom: bandFrom,
});
timeChart(document.querySelector('[data-chart="clicks"]'), {
  title: "Clicks", color: "var(--s2)", dates: S.dates, values: S.clicks,
  avg: ma(S.clicks, 7), fmt: nf, bandFrom: bandFrom,
});
timeChart(document.querySelector('[data-chart="position"]'), {
  title: "Average position", color: "var(--s3)", dates: S.dates, values: S.position,
  avg: ma(S.position, 7), fmt: posf, invert: true, bandFrom: bandFrom, scaleToAvg: true,
});

document.querySelectorAll("[data-spark]").forEach((el) => {
  const k = el.dataset.spark;
  const vals = k === "ctr"
    ? S.dates.map((_, i) => (S.impressions[i] ? S.clicks[i] / S.impressions[i] : null))
    : S[k];
  const win = vals.slice(-DATA.window.days * 2);
  sparkline(el, ma(win, 7), k === "clicks" ? "var(--s2)" : k === "position" ? "var(--s3)" : "var(--s1)");
});

const totalImpr = DATA.dist.curr.reduce((s, b) => s + b.impressions, 0) || 1;
groupedBars(document.querySelector('[data-chart="dist"]'), {
  title: "Impressions by rank band",
  names: ["This window", "Prior window"],
  colors: ["var(--s1)", "var(--neutral)"],
  groups: DATA.dist.labels.map((l, i) => ({
    label: l,
    values: [DATA.dist.curr[i].impressions, DATA.dist.prev[i].impressions],
    share: ((DATA.dist.curr[i].impressions / totalImpr) * 100).toFixed(0) + "% of impr",
  })),
});

/* Query tables */
const qcols = [
  { label: "Query", key: "key", cls: "q", cell: (r) => esc(r.key), sortValue: (r) => r.key },
  { label: "Clicks", key: "clicks", cell: (r) => nf(r.clicks) },
  { label: "Δ", sortable: false, cell: (r) => deltaCell(r.clicks, r.pClicks) },
  { label: "Impr", key: "impressions", cell: (r) => nf(r.impressions) },
  { label: "Δ", sortable: false, cell: (r) => deltaCell(r.impressions, r.pImpressions) },
  { label: "CTR", key: "ctr", cell: (r) => pf(r.ctr) },
  { label: "Pos", key: "position", cell: (r) => posf(r.position), sortValue: (r) => -r.position },
  { label: "Δ pos", sortable: false, cell: (r) => posDeltaCell(r.position, r.pPosition) },
  { label: "Headroom", key: "headroom", cell: (r) => (r.headroom >= 1 ? '<span class="pill warn">+' + Math.round(r.headroom) + "</span>" : '<span style="color:var(--muted)">—</span>') },
];
buildTable(document.querySelector('[data-table="queries"]'), qcols, DATA.queries.slice(0, 60));

const page1 = DATA.queries.filter((q) => q.position <= 10.5 && q.clicks === 0 && q.impressions >= 20)
  .sort((a, b) => b.headroom - a.headroom).slice(0, 20);
buildTable(document.querySelector('[data-table="page1"]'), [
  { label: "Query", key: "key", cls: "q", cell: (r) => esc(r.key), sortValue: (r) => r.key },
  { label: "Impr", key: "impressions", cell: (r) => nf(r.impressions) },
  { label: "Pos", key: "position", cell: (r) => posf(r.position), sortValue: (r) => -r.position },
  { label: "Headroom", key: "headroom", cell: (r) => '<span class="pill warn">+' + Math.round(r.headroom) + "</span>" },
], page1);

const striking = DATA.queries.filter((q) => q.position > 10.5 && q.position <= 20.5 && q.impressions >= 25)
  .sort((a, b) => b.impressions - a.impressions).slice(0, 20);
buildTable(document.querySelector('[data-table="striking"]'), [
  { label: "Query", key: "key", cls: "q", cell: (r) => esc(r.key), sortValue: (r) => r.key },
  { label: "Impr", key: "impressions", cell: (r) => nf(r.impressions) },
  { label: "Δ", sortable: false, cell: (r) => deltaCell(r.impressions, r.pImpressions) },
  { label: "Pos", key: "position", cell: (r) => posf(r.position), sortValue: (r) => -r.position },
  { label: "Δ pos", sortable: false, cell: (r) => posDeltaCell(r.position, r.pPosition) },
], striking);

/* Movers */
const moverCols = [
  { label: "Query", key: "key", cls: "q", cell: (r) => esc(r.key), sortValue: (r) => r.key },
  { label: "Impr", key: "impressions", cell: (r) => nf(r.impressions) },
  { label: "Prior", key: "pImpressions", cell: (r) => nf(r.pImpressions) },
  { label: "Δ", sortable: false, cell: (r) => deltaCell(r.impressions, r.pImpressions) },
  { label: "Pos", key: "position", cell: (r) => posf(r.position), sortValue: (r) => -r.position },
];
const byDelta = DATA.queries.filter((q) => q.impressions + q.pImpressions >= 40);
buildTable(document.querySelector('[data-table="gainers"]'), moverCols,
  byDelta.slice().sort((a, b) => (b.impressions - b.pImpressions) - (a.impressions - a.pImpressions)).slice(0, 12));
buildTable(document.querySelector('[data-table="losers"]'), moverCols,
  byDelta.slice().sort((a, b) => (a.impressions - a.pImpressions) - (b.impressions - b.pImpressions)).slice(0, 12));

buildTable(document.querySelector('[data-table="climbers"]'), [
  { label: "Query", key: "key", cls: "q", cell: (r) => esc(r.key), sortValue: (r) => r.key },
  { label: "Impr", key: "impressions", cell: (r) => nf(r.impressions) },
  { label: "Was", sortable: false, cell: (r) => posf(r.pPosition) },
  { label: "Now", key: "position", cell: (r) => posf(r.position), sortValue: (r) => -r.position },
  { label: "Δ pos", sortable: false, cell: (r) => posDeltaCell(r.position, r.pPosition) },
], DATA.queries.filter((q) => q.pPosition != null && q.impressions >= 30 && q.pPosition - q.position >= 1)
  .sort((a, b) => (b.pPosition - b.position) - (a.pPosition - a.position)).slice(0, 12));

buildTable(document.querySelector('[data-table="lost"]'), [
  { label: "Query", key: "key", cls: "q", cell: (r) => esc(r.key), sortValue: (r) => r.key },
  { label: "Impr (prior)", key: "impressions", cell: (r) => nf(r.impressions) },
  { label: "Clicks (prior)", key: "clicks", cell: (r) => nf(r.clicks) },
  { label: "Pos (prior)", key: "position", cell: (r) => posf(r.position), sortValue: (r) => -r.position },
], DATA.lost);

/* Pages */
const maxPageImpr = Math.max.apply(null, DATA.pages.map((p) => p.impressions)) || 1;
buildTable(document.querySelector('[data-table="pages"]'), [
  { label: "Page", key: "key", cls: "q", cell: (r) => esc(r.key), sortValue: (r) => r.key },
  { label: "Clicks", key: "clicks", cell: (r) => nf(r.clicks) },
  { label: "Δ", sortable: false, cell: (r) => deltaCell(r.clicks, r.pClicks) },
  {
    label: "Impr", key: "impressions", cls: "bar-cell",
    cell: (r) => '<div class="fill" style="width:' + ((r.impressions / maxPageImpr) * 100).toFixed(1) + '%"></div><span>' + nf(r.impressions) + "</span>",
  },
  { label: "Δ", sortable: false, cell: (r) => deltaCell(r.impressions, r.pImpressions) },
  { label: "CTR", key: "ctr", cell: (r) => pf(r.ctr) },
  { label: "Pos", key: "position", cell: (r) => posf(r.position), sortValue: (r) => -r.position },
  { label: "Δ pos", sortable: false, cell: (r) => posDeltaCell(r.position, r.pPosition) },
  { label: "Share", sortable: false, cell: (r) => ((r.impressions / DATA.curr.impressions) * 100).toFixed(0) + "%" },
  {
    label: "Headroom", sortable: false,
    cell: (r) => {
      const st = DATA.pageQueryStats[r.key];
      return st && st.headroom >= 1 ? '<span class="pill warn">+' + Math.round(st.headroom) + "</span>"
        : '<span style="color:var(--muted)">—</span>';
    },
  },
], DATA.pages.slice(0, 40), {
  rowKey: (r) => r.key,
  expandable: true,
  detail: (pg) => {
    const qs = DATA.pageQueries[pg];
    if (!qs || !qs.length) return '<span style="color:var(--muted)">No query breakdown for this page.</span>';
    const st = DATA.pageQueryStats[pg];
    const cov = st ? " — GSC names " + st.queries + " queries for this page, covering " +
      nf(st.impressions) + " of its impressions; the remainder is anonymised long tail" : "";
    return '<div style="font-size:12.5px"><b>Top queries for ' + esc(pg) + "</b>" +
      '<span style="color:var(--muted)">' + cov + "</span><table style='margin-top:6px'>" +
      "<thead><tr><th class='nosort'>Query</th><th class='nosort'>Clicks</th><th class='nosort'>Impr</th><th class='nosort'>Pos</th></tr></thead><tbody>" +
      qs.map((q) => "<tr><td>" + esc(q.q) + "</td><td>" + nf(q.clicks) + "</td><td>" + nf(q.impressions) + "</td><td>" + posf(q.position) + "</td></tr>").join("") +
      "</tbody></table></div>";
  },
});

/* Markets */
const maxCountryImpr = Math.max.apply(null, DATA.countries.map((c) => c.impressions)) || 1;
buildTable(document.querySelector('[data-table="countries"]'), [
  { label: "Country", key: "key", cell: (r) => r.key.toUpperCase(), sortValue: (r) => r.key },
  { label: "Clicks", key: "clicks", cell: (r) => nf(r.clicks) },
  {
    label: "Impr", key: "impressions", cls: "bar-cell",
    cell: (r) => '<div class="fill" style="width:' + ((r.impressions / maxCountryImpr) * 100).toFixed(1) + '%"></div><span>' + nf(r.impressions) + "</span>",
  },
  { label: "CTR", key: "ctr", cell: (r) => pf(r.ctr) },
  { label: "Pos", key: "position", cell: (r) => posf(r.position), sortValue: (r) => -r.position },
  { label: "Upside", key: "upside", cell: (r) => (r.upside >= 1 ? '<span class="pill warn">+' + Math.round(r.upside) + "</span>" : '<span style="color:var(--muted)">—</span>') },
], DATA.countries);

buildTable(document.querySelector('[data-table="devices"]'), [
  { label: "Device", key: "key", cell: (r) => r.key.charAt(0) + r.key.slice(1).toLowerCase(), sortValue: (r) => r.key },
  { label: "Clicks", key: "clicks", cell: (r) => nf(r.clicks) },
  { label: "Δ", sortable: false, cell: (r) => deltaCell(r.clicks, r.pClicks) },
  { label: "Impr", key: "impressions", cell: (r) => nf(r.impressions) },
  { label: "CTR", key: "ctr", cell: (r) => pf(r.ctr) },
  { label: "Pos", key: "position", cell: (r) => posf(r.position), sortValue: (r) => -r.position },
], DATA.devices);

/* Snapshot history — small multiples, one measure each, never a shared axis */
if (DATA.history.length > 1) {
  const host = document.getElementById("history");
  [
    { k: "impressions", title: "Impressions", color: "var(--s1)", fmt: nf },
    { k: "clicks", title: "Clicks", color: "var(--s2)", fmt: nf },
    { k: "ctr", title: "CTR", color: "var(--s1)", fmt: (v) => pf(v) },
    { k: "position", title: "Average position", color: "var(--s3)", fmt: posf, invert: true },
  ].forEach((m) => {
    const card = document.createElement("div");
    card.className = "card";
    host.appendChild(card);
    const vals = DATA.history.map((h) => h[m.k]);
    timeChart(card, {
      title: m.title, color: m.color, rawLabel: "per snapshot", avgLabel: "3-snapshot avg",
      dates: DATA.history.map((h) => h.date), values: vals,
      avg: ma(vals, 3), fmt: m.fmt, invert: m.invert, height: 160,
    });
  });
}

/* World map — sequential fill by impressions, one hue, log-binned so a market
   with 7 impressions and one with 2,500 both read. */
(function worldMap() {
  const svg = document.getElementById("worldmap");
  if (!svg) return;
  const byIso = new Map(DATA.countries.map((c) => [String(c.key).toUpperCase(), c]));
  const max = Math.max(1, ...DATA.countries.map((c) => c.impressions));
  const ramp = ["var(--seq1)", "var(--seq2)", "var(--seq3)", "var(--seq4)", "var(--seq5)"];
  const bin = (v) => Math.min(4, Math.floor((Math.log(v + 1) / Math.log(max + 1)) * 5));
  const tip = document.getElementById("map-tt");
  const plot = tip.parentElement;

  svg.querySelectorAll("path").forEach((p) => {
    const c = byIso.get(p.dataset.iso);
    if (!c || !c.impressions) return;
    p.style.fill = ramp[bin(c.impressions)];
    p.setAttribute("data-has", "1");
    p.addEventListener("pointermove", (ev) => {
      const r = plot.getBoundingClientRect();
      tip.innerHTML = "<b>" + esc(p.dataset.name) + "</b> · " + p.dataset.iso +
        "<br>" + nf(c.impressions) + " impressions · " + nf(c.clicks) + " clicks<br>CTR " +
        pf(c.ctr) + " · pos " + posf(c.position);
      tip.style.opacity = 1;
      tip.style.left = Math.min(ev.clientX - r.left + 12, r.width - 200) + "px";
      tip.style.top = Math.max(0, ev.clientY - r.top - 70) + "px";
    });
    p.addEventListener("pointerleave", () => (tip.style.opacity = 0));
  });

  // Legend: the lower bound of each bin, on the same log scale.
  const legend = document.getElementById("map-legend");
  const lower = (i) => Math.round(Math.exp((i / 5) * Math.log(max + 1)) - 1);
  legend.innerHTML =
    '<i style="background:var(--map-none)"></i><span>no traffic</span>' +
    ramp.map((col, i) =>
      '<i style="background:' + col + '"></i><span>' + nf(Math.max(1, lower(i))) +
      (i === 4 ? "+" : "–" + nf(lower(i + 1))) + "</span>").join("");
})();

/* Recommendations */
(function actions() {
  const out = [];
  const add = (title, why) => out.push({ title, why });

  const snippetPages = DATA.pages.filter((p) => p.impressions >= 150 && p.position <= 14 && p.ctr < 0.015)
    .sort((a, b) => b.impressions - a.impressions).slice(0, 3);
  for (const p of snippetPages) {
    const st = DATA.pageQueryStats[p.key];
    let why = nf(p.impressions) + " impressions at position " + posf(p.position) + " but only " + pf(p.ctr) +
      " CTR (" + p.clicks + " clicks). ";
    if (st && st.headroom >= 1) {
      why += "Across the " + st.queries + " queries GSC names for it (" + nf(st.impressions) +
        " impressions, " + Math.round((st.impressions / p.impressions) * 100) + "% of the page's total), " +
        "about <b>" + Math.round(st.headroom) + " clicks</b> go unclaimed at their current ranks. " +
        "The rest of the page's impressions come from queries GSC won't name, so the true figure is higher. ";
    }
    why += "Rule: page-1-ish rank, ≥150 impressions, CTR under 1.5%.";
    add("Rewrite the title + meta description on <code>" + esc(p.key) + "</code>", why);
  }

  const expand = DATA.pages.filter((p) => p.impressions >= 100 && p.position > 18)
    .sort((a, b) => b.impressions - a.impressions).slice(0, 2);
  for (const p of expand) {
    add("Expand the content on <code>" + esc(p.key) + "</code>",
      nf(p.impressions) + " impressions but position " + posf(p.position) + " — demand exists, the page isn't competitive. " +
      "Rule: ≥100 impressions and average position worse than 18.");
  }

  if (page1.length) {
    add("Fix the snippets on " + page1.length + (page1.length === 1 ? " page-1 query" : " page-1 queries") + " earning zero clicks",
      "Top of the list: " + page1.slice(0, 3).map((q) => '"' + esc(q.key) + '" (pos ' + posf(q.position) + ", " + nf(q.impressions) + " impr)").join(", ") +
      ". Combined modelled headroom " + Math.round(page1.reduce((s, q) => s + q.headroom, 0)) + " clicks per " + DATA.window.days + " days.");
  }

  const topUpside = DATA.countries.slice().sort((a, b) => b.upside - a.upside)[0];
  if (topUpside && topUpside.upside >= 5) {
    add("Close the CTR gap in " + topUpside.key.toUpperCase(),
      nf(topUpside.impressions) + " impressions at " + pf(topUpside.ctr) + " CTR (position " + posf(topUpside.position) + "). " +
      "At " + DATA.bestCtrCountry.toUpperCase() + "'s " + pf(DATA.bestCtr) + " that is +" + Math.round(topUpside.upside) +
      " clicks. Usually a ranking-quality gap rather than a copy problem — check what ranks above you there.");
  }

  const decliners = DATA.queries.filter((q) => q.pImpressions >= 60 && q.impressions < q.pImpressions * 0.75)
    .sort((a, b) => (a.impressions - a.pImpressions) - (b.impressions - b.pImpressions)).slice(0, 3);
  if (decliners.length) {
    add("Investigate " + decliners.length + (decliners.length === 1 ? " query" : " queries") + " losing visibility",
      decliners.map((q) => '"' + esc(q.key) + '" ' + nf(q.pImpressions) + " → " + nf(q.impressions)).join("; ") +
      ". Rule: had ≥60 impressions last window and lost more than a quarter of them.");
  }

  if (DATA.lost.length) {
    add(DATA.lost.length + (DATA.lost.length === 1 ? " query" : " queries") + " dropped out of the results entirely",
      "Biggest: " + DATA.lost.slice(0, 3).map((q) => '"' + esc(q.key) + '" (' + nf(q.impressions) + " impr)").join(", ") +
      ". Worth checking whether the matching page changed or got de-indexed.");
  }

  document.getElementById("actions").innerHTML = out.map((a, i) =>
    '<li><span class="n">' + (i + 1) + '</span><div><div>' + a.title + '</div><div class="why">' + a.why + "</div></div></li>").join("")
    || '<li><div class="why">Nothing crossed the thresholds this window.</div></li>';
})();

/* Theme toggle */
document.getElementById("theme").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme");
  const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
  window.dispatchEvent(new Event("resize"));
});
</script>
</body>
</html>`;
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
