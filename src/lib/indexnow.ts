// IndexNow: tell Bing (whose index grounds ChatGPT search and Copilot), Yandex
// and the other IndexNow engines which URLs changed, so they recrawl them now
// rather than whenever. The key file is public/<KEY>.txt, deployed with the app.

export const INDEXNOW_KEY = "0692e347fd0dec4ee5b37c0110ba607e";
export const INDEXNOW_HOST = "brewstamp.app";

/** Submit URLs; returns the HTTP status (200/202 = accepted). */
export async function submitToIndexNow(urlList: string[]): Promise<number> {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });
  return res.status;
}

/** Sitemap entries as [url, lastmod]. */
export function parseSitemap(xml: string): [string, string | null][] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => [
    m[1].match(/<loc>([^<]+)<\/loc>/)?.[1].trim() ?? "",
    m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1].trim() ?? null,
  ]);
}

const RECENT_DAYS = 3;
const AFTER_START_MS = 3 * 60 * 1000;

/**
 * After a production deploy: once the new server has been up a few minutes
 * (live behind the load balancer), submit the sitemap URLs whose content
 * changed in the last few days. Restarts resubmit the same handful — harmless.
 */
export function scheduleIndexNowAfterDeploy(port: number) {
  setTimeout(async () => {
    try {
      const xml = await (await fetch(`http://localhost:${port}/sitemap.xml`)).text();
      const cutoff = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString().slice(0, 10);
      const urls = parseSitemap(xml)
        .filter(([url, lastmod]) => url.startsWith(`https://${INDEXNOW_HOST}`) && lastmod && lastmod.slice(0, 10) >= cutoff)
        .map(([url]) => url);
      if (!urls.length) return console.log("[IndexNow] no recently changed pages to submit");
      const status = await submitToIndexNow(urls);
      console.log(`[IndexNow] submitted ${urls.length} changed page(s): ${status}`);
    } catch (err) {
      console.warn("[IndexNow] submit failed:", err instanceof Error ? err.message : err);
    }
  }, AFTER_START_MS).unref();
}
