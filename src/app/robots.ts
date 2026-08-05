import type { MetadataRoute } from "next";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://trustledger-frontend-pi.vercel.app"
).replace(/\/$/, "");

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
          "/assessment",
          "/readiness",
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
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
