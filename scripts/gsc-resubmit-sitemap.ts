/**
 * Resubmit sitemap.xml to Google Search Console to nudge a re-crawl + pick up
 * any newly added pages.
 *
 * The `webmasters/v3/sites/.../sitemaps/...` PUT endpoint either creates a new
 * sitemap registration or refreshes the existing one. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/gsc-resubmit-sitemap.ts \
 *     [--site sc-domain:brewstamp.app] \
 *     [--sitemap https://brewstamp.app/sitemap.xml]
 *
 * Requires the OAuth refresh token to have the `webmasters` scope (write).
 * The existing token under ~/.config/brewstamp/gsc-oauth-token.json may have
 * only `webmasters.readonly` — if so, re-auth via the OAuth playground or
 * gcloud with the broader scope.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SITE = getArg("--site") ?? "sc-domain:brewstamp.app";
const SITEMAP =
  getArg("--sitemap") ?? "https://brewstamp.app/sitemap.xml";

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function getAccessToken(): Promise<{
  token: string;
  scope: string;
}> {
  const cfg = JSON.parse(
    readFileSync(
      join(homedir(), ".config/brewstamp/gsc-oauth-token.json"),
      "utf8",
    ),
  ) as {
    refresh_token: string;
    client_id?: string;
    client_secret?: string;
  };
  const clientId =
    process.env.GSC_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || cfg.client_id!;
  const clientSecret =
    process.env.GSC_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    cfg.client_secret!;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: cfg.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const json = (await res.json()) as {
    access_token: string;
    scope: string;
  };
  return { token: json.access_token, scope: json.scope };
}

async function main() {
  console.log(`Site:    ${SITE}`);
  console.log(`Sitemap: ${SITEMAP}\n`);
  const { token, scope } = await getAccessToken();
  console.log(`Token scope: ${scope}`);
  if (!scope.includes("webmasters") || scope.includes("webmasters.readonly")) {
    console.error(
      `\n⚠  Current token scope is read-only. Sitemap submission requires the ` +
        `'https://www.googleapis.com/auth/webmasters' scope.\n`,
    );
  }

  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    SITE,
  )}/sitemaps/${encodeURIComponent(SITEMAP)}`;

  console.log(`PUT ${url}`);
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`→ ${res.status} ${res.statusText}`);
  if (!res.ok) {
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }

  // Read back the sitemap status
  const getRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (getRes.ok) {
    const info = await getRes.json();
    console.log("\nSitemap status:");
    console.log(JSON.stringify(info, null, 2));
  }
  console.log("\nDone. Re-crawl is scheduled by Google — discovery typically");
  console.log("takes 1–7 days. Check GSC → Sitemaps for status.");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
