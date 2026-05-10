import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app";

  return [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/try`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/register`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: new Date(), priority: 0.5 },
    { url: `${baseUrl}/alternatives`, lastModified: new Date(), priority: 0.7 },
    {
      url: `${baseUrl}/alternatives/stamp-me`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/alternatives/loopy-loyalty`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/alternatives/punchpass`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/alternatives/square-loyalty`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/alternatives/loyverse`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/alternatives/smile-io`,
      lastModified: new Date(),
      priority: 0.7,
    },
    { url: `${baseUrl}/blog`, lastModified: new Date(), priority: 0.7 },
    {
      url: `${baseUrl}/blog/multi-language-loyalty-card`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/set-up-your-brewstamp-shop`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/thirty-7even-macquarie-park`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/bennett-st-dairy-bondi`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/coffee-shop-loyalty-cards`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/digital-loyalty-cards-for-cafes`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/qr-code-loyalty-program`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/why-paper-loyalty-cards-dont-work`,
      lastModified: new Date(),
      priority: 0.8,
    },
    { url: `${baseUrl}/contact`, lastModified: new Date(), priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), priority: 0.3 },
  ];
}
