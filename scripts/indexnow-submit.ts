/**
 * Submit URLs to IndexNow for near-instant crawling by Bing (and Yandex,
 * Seznam, etc. — IndexNow is shared). Bing's index grounds ChatGPT search and
 * Copilot, so this is the fast lane for getting new/changed pages into the
 * AI-answer ecosystem.
 *
 * The key file must be live at https://brewstamp.app/<KEY>.txt containing the
 * exact key below — it's committed under public/, so it deploys with the app.
 *
 * Usage:
 *   # Submit every URL in the sitemap (default):
 *   npx tsx scripts/indexnow-submit.ts
 *
 *   # Submit specific URLs (e.g. just-shipped pages):
 *   npx tsx scripts/indexnow-submit.ts https://brewstamp.app/coffee-rewards-app
 *
 * Run it AFTER a deploy has gone live, so the key file and the pages exist.
 */
const KEY = "0692e347fd0dec4ee5b37c0110ba607e";
const HOST = "brewstamp.app";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP = `https://${HOST}/sitemap.xml`;

async function sitemapUrls(): Promise<string[]> {
  const res = await fetch(SITEMAP);
  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const args = process.argv.slice(2);
  const urlList = args.length ? args : await sitemapUrls();
  if (!urlList.length) {
    console.error("No URLs to submit.");
    process.exit(1);
  }

  console.log(`Submitting ${urlList.length} URL(s) to IndexNow:`);
  for (const u of urlList) console.log(`  ${u}`);

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  // 200 OK / 202 Accepted = success. 403 = key not found/valid (is the key
  // file deployed?). 422 = URL/host mismatch. 429 = rate limited.
  const body = await res.text();
  console.log(`\nIndexNow response: ${res.status} ${res.statusText}`);
  if (body) console.log(body);
  if (res.status !== 200 && res.status !== 202) process.exit(1);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
