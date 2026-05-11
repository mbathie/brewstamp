/**
 * Find URLs flagged with "Page with redirect" indexing issue via the GSC
 * URL Inspection API.
 *
 * Usage:
 *   npx tsx scripts/gsc-redirect-issues.ts \
 *     [--site sc-domain:brewstamp.app] \
 *     [--sitemap https://brewstamp.app/sitemap.xml] \
 *     [--include-ok]
 *
 * Reads creds from ~/.config/brewstamp/gsc-oauth-token.json (see gsc-report.ts).
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SITE = getArg("--site") ?? "sc-domain:brewstamp.app";
const SITEMAP_URL =
  getArg("--sitemap") ?? "https://brewstamp.app/sitemap.xml";
const INCLUDE_OK = process.argv.includes("--include-ok");

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

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
    throw new Error("Missing OAuth client_id/client_secret.");
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
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  return ((await res.json()) as { access_token: string }).access_token;
}

async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const res = await fetch(sitemapUrl);
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  // Quick & dirty XML parsing — sitemaps are highly regular.
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  // Recurse into sitemap-index if needed.
  const nested: string[] = [];
  for (const loc of locs) {
    if (loc.endsWith(".xml")) {
      try {
        nested.push(...(await fetchSitemapUrls(loc)));
      } catch {
        // ignore
      }
    }
  }
  return Array.from(new Set([...locs.filter((l) => !l.endsWith(".xml")), ...nested]));
}

interface InspectionResult {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      pageFetchState?: string;
      lastCrawlTime?: string;
      googleCanonical?: string;
      userCanonical?: string;
      indexingState?: string;
    };
  };
}

async function inspectUrl(
  token: string,
  url: string,
): Promise<InspectionResult> {
  const res = await fetch(
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl: url,
        siteUrl: SITE,
      }),
    },
  );
  if (res.status === 429) {
    // throttled — wait and retry once
    await new Promise((r) => setTimeout(r, 2000));
    return inspectUrl(token, url);
  }
  if (!res.ok) {
    throw new Error(
      `Inspect failed for ${url}: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as InspectionResult;
}

async function followRedirect(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      return res.headers.get("location");
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Site: ${SITE}`);
  console.log(`Sitemap: ${SITEMAP_URL}\n`);

  const token = await getAccessToken();
  const urls = await fetchSitemapUrls(SITEMAP_URL);
  console.log(`Found ${urls.length} URLs in sitemap. Inspecting…\n`);

  const issues: Array<{
    url: string;
    coverage: string;
    pageFetch: string;
    googleCanonical?: string;
    userCanonical?: string;
    redirectsTo?: string | null;
  }> = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stdout.write(`  [${i + 1}/${urls.length}] ${url} … `);
    try {
      const r = await inspectUrl(token, url);
      const idx = r.inspectionResult?.indexStatusResult;
      const coverage = idx?.coverageState ?? "unknown";
      const pageFetch = idx?.pageFetchState ?? "unknown";
      const googleCanonical = idx?.googleCanonical;
      const userCanonical = idx?.userCanonical;
      const isRedirect =
        /redirect/i.test(coverage) || pageFetch === "PAGE_WITH_REDIRECT";
      if (isRedirect || INCLUDE_OK) {
        const redirectsTo = isRedirect ? await followRedirect(url) : undefined;
        issues.push({
          url,
          coverage,
          pageFetch,
          googleCanonical,
          userCanonical,
          redirectsTo,
        });
      }
      console.log(coverage);
    } catch (err) {
      console.log(`ERROR: ${(err as Error).message}`);
    }
    // Light throttle to stay well under per-minute quotas (URL Inspection has
    // a default 600/day, ~2k/day for verified sites — we won't hit limits
    // here but we still sleep a touch between calls.)
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("\n────────────────────────────────────────");
  console.log(`Pages with redirect issues: ${issues.filter((i) => /redirect/i.test(i.coverage)).length}`);
  console.log("────────────────────────────────────────\n");

  if (issues.length === 0) {
    console.log("No redirect-flagged pages found in the sitemap. 🎉");
    console.log("(Affected URLs may not be in your sitemap — check the GSC UI for the full list.)");
    return;
  }

  for (const issue of issues) {
    console.log(`URL:                ${issue.url}`);
    console.log(`  Coverage:         ${issue.coverage}`);
    console.log(`  Page fetch state: ${issue.pageFetch}`);
    if (issue.googleCanonical)
      console.log(`  Google canonical: ${issue.googleCanonical}`);
    if (issue.userCanonical && issue.userCanonical !== issue.url)
      console.log(`  User canonical:   ${issue.userCanonical}`);
    if (issue.redirectsTo !== undefined)
      console.log(`  Redirects to:     ${issue.redirectsTo ?? "(no live redirect)"}`);
    console.log();
  }
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
