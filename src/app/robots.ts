import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Generative-AI and AI-search crawlers we explicitly welcome so they can read
// and cite the public marketing/content pages (GEO). They're already covered by
// the "*" rule below, but listing them makes the intent explicit and survives
// any future tightening of the wildcard. Same path policy as everyone else:
// public content allowed, the app + API blocked.
const AI_BOTS = [
  "GPTBot", // OpenAI training crawler
  "OAI-SearchBot", // ChatGPT search
  "ChatGPT-User", // ChatGPT live browsing
  "ClaudeBot", // Anthropic crawler
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot", // Perplexity index
  "Perplexity-User", // Perplexity live fetch
  "Google-Extended", // Gemini / AI Overviews grounding
  "Applebot-Extended", // Apple Intelligence
  "CCBot", // Common Crawl (feeds many LLMs)
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  const allow = ["/", "/api/og"];
  const disallow = ["/dashboard", "/api"];
  return {
    rules: [
      { userAgent: "*", allow, disallow },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow, disallow })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
