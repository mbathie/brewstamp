import type { MetadataRoute } from "next";
import { LANDING_LANGS } from "@/lib/i18n/landing";
import { SITE_URL } from "@/lib/site";
import { contentDate } from "@/lib/content-dates";

// <lastmod> is when the page's content last changed (git), not today: a
// sitemap that's always "modified now" teaches crawlers to ignore it.
function withLastModified(entry: MetadataRoute.Sitemap[number]): MetadataRoute.Sitemap[number] {
  const path = entry.url.slice(SITE_URL.length) || "/";
  const date = contentDate(LANDING_LANGS.includes(path.slice(1)) ? "/[lang]" : path);
  return date ? { ...entry, lastModified: date } : entry;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1 },
    ...LANDING_LANGS.map((lang) => ({
      url: `${baseUrl}/${lang}`,
            priority: 0.8,
    })),
    { url: `${baseUrl}/features`, priority: 0.9 },
    { url: `${baseUrl}/how-it-works`, priority: 0.8 },
    {
      url: `${baseUrl}/coffee-rewards-app`,
            priority: 0.9,
    },
    {
      url: `${baseUrl}/cafe-loyalty-app`,
            priority: 0.9,
    },
    { url: `${baseUrl}/pricing`, priority: 0.9 },
    { url: `${baseUrl}/partners`, priority: 0.6 },
    { url: `${baseUrl}/try`, priority: 0.8 },
    { url: `${baseUrl}/register`, priority: 0.7 },
    { url: `${baseUrl}/login`, priority: 0.5 },
    { url: `${baseUrl}/alternatives`, priority: 0.7 },
    {
      url: `${baseUrl}/alternatives/stamp-me`,
            priority: 0.7,
    },
    {
      url: `${baseUrl}/alternatives/loopy-loyalty`,
            priority: 0.7,
    },
    {
      url: `${baseUrl}/alternatives/punchpass`,
            priority: 0.7,
    },
    {
      url: `${baseUrl}/alternatives/square-loyalty`,
            priority: 0.7,
    },
    {
      url: `${baseUrl}/alternatives/loyverse`,
            priority: 0.7,
    },
    {
      url: `${baseUrl}/alternatives/smile-io`,
            priority: 0.7,
    },
    { url: `${baseUrl}/blog`, priority: 0.7 },
    {
      url: `${baseUrl}/blog/apple-google-wallet-loyalty-card`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/corporate-coffee-perk`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/coffee-shop-loyalty-card-printing`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/how-many-stamps-for-a-free-coffee`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/cafe-loyalty-programs-for-customers`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/multi-language-loyalty-card`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/set-up-your-brewstamp-shop`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/thirty-7even-macquarie-park`,
            priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/bennett-st-dairy-bondi`,
            priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/best-coffee-shop-loyalty-apps`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/coffee-shop-loyalty-cards`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/digital-loyalty-cards-for-cafes`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/qr-code-loyalty-program`,
            priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/why-paper-loyalty-cards-dont-work`,
            priority: 0.8,
    },
    { url: `${baseUrl}/contact`, priority: 0.5 },
    { url: `${baseUrl}/privacy`, priority: 0.3 },
    { url: `${baseUrl}/terms`, priority: 0.3 },
  ];
  return entries.map(withLastModified);
}
