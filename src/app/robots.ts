import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/aeo/siteFacts";

/**
 * Keep public marketing + FAQ crawlable for search and AI bots.
 * Explicit allow-list includes paths LLMs cite; private app surfaces stay disallowed.
 * Do not add GPTBot / PerplexityBot / Google-Extended blocks — AEO requires openness.
 *
 * `host` / sitemap follow SITE_URL (default https://trustledger.co.za).
 * Legacy *.vercel.app traffic is 308’d to the apex via vercel.json.
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
          "/assessment",
          "/readiness",
          "/resources",
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
