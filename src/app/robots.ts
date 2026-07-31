import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/aeo/siteFacts";

/**
 * Keep public marketing + FAQ crawlable for search and AI bots.
 * Explicit allow-list includes paths LLMs cite; private app surfaces stay disallowed.
 * Do not add GPTBot / PerplexityBot / Google-Extended blocks — AEO requires openness.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/product",
          "/faq",
          "/compare",
          "/guides",
          "/assessment",
          "/contact",
          "/quote",
          "/trial",
          "/pay",
          "/privacy",
          "/terms",
          "/status",
          "/llms.txt",
        ],
        disallow: ["/app/", "/ops/", "/login", "/auth/", "/api/", "/invite/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
