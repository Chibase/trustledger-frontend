import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/aeo/siteFacts";

/**
 * Keep public marketing + FAQ crawlable for search and AI bots.
 * Explicit allow-list includes paths LLMs cite; private app surfaces stay disallowed.
 * Do not add GPTBot / PerplexityBot / Google-Extended blocks — AEO requires openness.
 *
 * `host` / sitemap follow SITE_URL (= NEXT_PUBLIC_SITE_URL in Production).
 * When a custom domain serves this app, set that env so canons do not advertise *.vercel.app.
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
