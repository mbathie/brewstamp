// When each public page's content last changed, from git (written before each
// build by scripts/content-dates.mjs). Feeds the sitemap's <lastmod> and the
// blog posts' dateModified — a real date, not "now" on every request.
import dates from "./content-dates.json";

const DATES = dates as Record<string, string>;

/** YYYY-MM-DD the page at `path` last changed, if known. */
export function contentDate(path: string): string | undefined {
  return DATES[path];
}

/** The later of a post's published date and its last content change. */
export function modifiedDate(path: string, published: string): string {
  const changed = DATES[path];
  return changed && changed > published ? changed : published;
}
