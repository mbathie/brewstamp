/**
 * Inspect a specific list of URLs via the GSC URL Inspection API.
 *
 * Usage:
 *   npx tsx scripts/gsc-inspect-urls.ts <url> [<url> ...]
 *   echo "url1\nurl2" | npx tsx scripts/gsc-inspect-urls.ts -
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SITE = process.env.GSC_SITE ?? "sc-domain:brewstamp.app";

async function getAccessToken(): Promise<string> {
  const tokenPath = join(homedir(), ".config/brewstamp/gsc-oauth-token.json");
  const config = JSON.parse(readFileSync(tokenPath, "utf8")) as {
    refresh_token: string;
    client_id?: string;
    client_secret?: string;
  };
  const clientId =
    process.env.GSC_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || config.client_id!;
  const clientSecret =
    process.env.GSC_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    config.client_secret!;
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
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function inspect(token: string, url: string): Promise<unknown> {
  const res = await fetch(
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE }),
    },
  );
  if (!res.ok)
    throw new Error(`Inspect failed for ${url}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  let urls = process.argv.slice(2);
  if (urls[0] === "-") {
    urls = (await new Promise<string>((res) => {
      let data = "";
      process.stdin.on("data", (c) => (data += c));
      process.stdin.on("end", () => res(data));
    }))
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (urls.length === 0) {
    console.error("Pass URLs as arguments, or '-' to read from stdin.");
    process.exit(1);
  }

  const token = await getAccessToken();
  for (const url of urls) {
    const r = (await inspect(token, url)) as {
      inspectionResult?: {
        indexStatusResult?: Record<string, string>;
      };
    };
    const idx = r.inspectionResult?.indexStatusResult ?? {};
    console.log(`\n${url}`);
    for (const [k, v] of Object.entries(idx)) {
      console.log(`  ${k.padEnd(28)} ${v}`);
    }
    await new Promise((res) => setTimeout(res, 250));
  }
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
