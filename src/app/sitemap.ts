import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app";

  return [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/try`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/register`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: new Date(), priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), priority: 0.7 },
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
