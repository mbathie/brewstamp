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
import { INDEXNOW_HOST, parseSitemap, submitToIndexNow } from "../src/lib/indexnow";

async function sitemapUrls(): Promise<string[]> {
  const res = await fetch(`https://${INDEXNOW_HOST}/sitemap.xml`);
  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status}`);
  return parseSitemap(await res.text()).map(([url]) => url);
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

  // 200 OK / 202 Accepted = success. 403 = key not found/valid (is the key
  // file deployed?). 422 = URL/host mismatch. 429 = rate limited.
  const status = await submitToIndexNow(urlList);
  console.log(`\nIndexNow response: ${status}`);
  if (status !== 200 && status !== 202) process.exit(1);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
