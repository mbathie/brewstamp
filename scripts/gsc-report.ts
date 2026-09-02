/**
 * Google Search Console SEO report for brewstamp.app.
 *
 * Usage:
 *   GSC_CLIENT_ID=... GSC_CLIENT_SECRET=... \
 *     npx tsx scripts/gsc-report.ts [--days 28] [--site sc-domain:brewstamp.app]
 *
 * The window is a trailing --days ending on the last day Search Console has
 * data for (its lag moves, so this is not a fixed offset from today).
 *
 * Refresh token is read from ~/.config/brewstamp/gsc-oauth-token.json.
 * The OAuth client id/secret must belong to the same project that minted
 * the refresh token — re-use the app's Google OAuth client (the same
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET used in production).
 *
 * No extra npm deps: this script uses fetch + native auth flow only.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface SearchAnalyticsRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

const SITE = getArg("--site") ?? "sc-domain:brewstamp.app";
const DAYS = parseInt(getArg("--days") ?? "28", 10);
const ROW_LIMIT = parseInt(getArg("--rows") ?? "25", 10);

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtPos(v: number): string {
  return v.toFixed(1);
}

function fmtDelta(curr: number, prev: number, kind: "int" | "pct" | "pos" = "int") {
  const delta = curr - prev;
  const sign = delta > 0 ? "+" : "";
  if (kind === "pos") {
    // For position, lower is better — invert the colour cue
    const arrow = delta < 0 ? "▲" : delta > 0 ? "▼" : "·";
    return `${arrow} ${sign}${delta.toFixed(1)}`;
  }
  if (kind === "pct") {
    return `${sign}${(delta * 100).toFixed(1)}pp`;
  }
  const pct = prev === 0 ? null : (delta / prev) * 100;
  const pctStr = pct === null ? "n/a" : `${sign}${pct.toFixed(0)}%`;
  return `${sign}${delta} (${pctStr})`;
}

async function getAccessToken(): Promise<string> {
  const tokenPath = join(homedir(), ".config/brewstamp/gsc-oauth-token.json");
  const config = JSON.parse(readFileSync(tokenPath, "utf8")) as {
    refresh_token: string;
    client_id?: string;
    client_secret?: string;
  };
  const refresh_token = config.refresh_token;

  const clientId =
    process.env.GSC_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || config.client_id;
  const clientSecret =
    process.env.GSC_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    config.client_secret;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing OAuth client creds. Either set GSC_CLIENT_ID + GSC_CLIENT_SECRET env vars, " +
        "or add `client_id` and `client_secret` to ~/.config/brewstamp/gsc-oauth-token.json.",
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function querySearchAnalytics(
  token: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  rowLimit = 1000,
): Promise<SearchAnalyticsRow[]> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    SITE,
  )}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions,
      rowLimit,
    }),
  });
  if (!res.ok) {
    throw new Error(`GSC query failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { rows?: SearchAnalyticsRow[] };
  return json.rows ?? [];
}

function totals(rows: SearchAnalyticsRow[]) {
  let clicks = 0,
    impressions = 0,
    positionSum = 0;
  for (const r of rows) {
    clicks += r.clicks;
    impressions += r.impressions;
    positionSum += r.position * r.impressions;
  }
  return {
    clicks,
    impressions,
    ctr: impressions === 0 ? 0 : clicks / impressions,
    position: impressions === 0 ? 0 : positionSum / impressions,
  };
}

function table(
  headers: string[],
  rows: Array<Array<string | number>>,
  aligns: Array<"left" | "right"> = [],
) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)),
  );
  const fmt = (cells: Array<string | number>) =>
    cells
      .map((c, i) => {
        const s = String(c ?? "");
        const w = widths[i];
        return aligns[i] === "right" ? s.padStart(w) : s.padEnd(w);
      })
      .join("  ");
  console.log(fmt(headers));
  console.log(widths.map((w) => "─".repeat(w)).join("  "));
  for (const r of rows) console.log(fmt(r));
}

async function main() {
  const today = new Date();
  const token = await getAccessToken();

  // GSC's reporting delay isn't a fixed two days — it moves. Anchor the window
  // to the last day that actually reported, so it never includes a dead
  // trailing day: that understates the totals and makes two runs a day apart
  // look like a decline when nothing changed.
  const probeStart = new Date(today);
  probeStart.setDate(probeStart.getDate() - (DAYS * 2 + 10));
  const probe = await querySearchAnalytics(
    token,
    isoDate(probeStart),
    isoDate(today),
    ["date"],
    1000,
  );
  const lastReported = probe.length
    ? probe
        .map((r) => r.keys?.[0] ?? "")
        .sort()
        .slice(-1)[0]
    : null;

  const end = lastReported ? new Date(`${lastReported}T12:00:00Z`) : new Date(today);
  if (!lastReported) end.setDate(end.getDate() - 2);
  const start = new Date(end);
  start.setDate(start.getDate() - (DAYS - 1));
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (DAYS - 1));

  const startISO = isoDate(start);
  const endISO = isoDate(end);
  const prevStartISO = isoDate(prevStart);
  const prevEndISO = isoDate(prevEnd);

  console.log(`Site: ${SITE}`);
  console.log(
    `Window: ${startISO} → ${endISO}  (vs ${prevStartISO} → ${prevEndISO})`,
  );
  console.log(`Last day reported by GSC: ${endISO}\n`);

  const [
    currTotalsRows,
    prevTotalsRows,
    queriesRows,
    pagesRows,
    countriesRows,
    devicesRows,
  ] = await Promise.all([
    querySearchAnalytics(token, startISO, endISO, [], 1),
    querySearchAnalytics(token, prevStartISO, prevEndISO, [], 1),
    querySearchAnalytics(token, startISO, endISO, ["query"], 200),
    querySearchAnalytics(token, startISO, endISO, ["page"], 200),
    querySearchAnalytics(token, startISO, endISO, ["country"], 20),
    querySearchAnalytics(token, startISO, endISO, ["device"], 5),
  ]);
  const dailyRows = probe.filter((r) => {
    const d = r.keys?.[0] ?? "";
    return d >= startISO && d <= endISO;
  });

  const curr = totals(currTotalsRows);
  const prev = totals(prevTotalsRows);

  console.log("Overall");
  console.log(`  Clicks       ${curr.clicks}        ${fmtDelta(curr.clicks, prev.clicks)}`);
  console.log(
    `  Impressions  ${curr.impressions}        ${fmtDelta(curr.impressions, prev.impressions)}`,
  );
  console.log(
    `  CTR          ${fmtPct(curr.ctr)}        ${fmtDelta(curr.ctr, prev.ctr, "pct")}`,
  );
  console.log(
    `  Avg pos      ${fmtPos(curr.position)}        ${fmtDelta(curr.position, prev.position, "pos")}\n`,
  );

  // Previous-period query map for delta diff
  const prevQueries = await querySearchAnalytics(
    token,
    prevStartISO,
    prevEndISO,
    ["query"],
    200,
  );
  const prevQueryMap = new Map<string, SearchAnalyticsRow>();
  for (const r of prevQueries) prevQueryMap.set(r.keys?.[0] ?? "", r);

  console.log(`Top queries (top ${ROW_LIMIT} by impressions)`);
  const queriesSorted = [...queriesRows].sort(
    (a, b) => b.impressions - a.impressions,
  );
  table(
    ["query", "clicks", "Δclicks", "impr", "Δimpr", "ctr", "pos"],
    queriesSorted.slice(0, ROW_LIMIT).map((r) => {
      const q = r.keys?.[0] ?? "";
      const p = prevQueryMap.get(q) ?? {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      };
      return [
        q.length > 50 ? q.slice(0, 49) + "…" : q,
        r.clicks,
        fmtDelta(r.clicks, p.clicks),
        r.impressions,
        fmtDelta(r.impressions, p.impressions),
        fmtPct(r.ctr),
        fmtPos(r.position),
      ];
    }),
    ["left", "right", "right", "right", "right", "right", "right"],
  );

  console.log(`\nTop pages (top ${ROW_LIMIT} by impressions)`);
  const pagesSorted = [...pagesRows].sort(
    (a, b) => b.impressions - a.impressions,
  );
  table(
    ["page", "clicks", "impr", "ctr", "pos"],
    pagesSorted.slice(0, ROW_LIMIT).map((r) => {
      const p = (r.keys?.[0] ?? "").replace(/^https?:\/\/brewstamp\.app/, "");
      return [
        p.length > 60 ? p.slice(0, 59) + "…" : p,
        r.clicks,
        r.impressions,
        fmtPct(r.ctr),
        fmtPos(r.position),
      ];
    }),
    ["left", "right", "right", "right", "right"],
  );

  console.log("\nBy country");
  table(
    ["country", "clicks", "impr", "ctr"],
    countriesRows.slice(0, 10).map((r) => [
      r.keys?.[0] ?? "",
      r.clicks,
      r.impressions,
      fmtPct(r.ctr),
    ]),
    ["left", "right", "right", "right"],
  );

  console.log("\nBy device");
  table(
    ["device", "clicks", "impr", "ctr"],
    devicesRows.map((r) => [
      r.keys?.[0] ?? "",
      r.clicks,
      r.impressions,
      fmtPct(r.ctr),
    ]),
    ["left", "right", "right", "right"],
  );

  // Daily sparkline (text)
  if (dailyRows.length > 0) {
    console.log("\nDaily impressions");
    const max = Math.max(...dailyRows.map((r) => r.impressions), 1);
    const bars = "▁▂▃▄▅▆▇█";
    const spark = dailyRows
      .map((r) => bars[Math.min(7, Math.floor((r.impressions / max) * 8))])
      .join("");
    console.log(`  ${spark}`);
    console.log(
      `  ${dailyRows[0].keys?.[0]} … ${dailyRows[dailyRows.length - 1].keys?.[0]}`,
    );
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
