import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  CHIBASE_CANONICAL_HOST,
  CHIBASE_PUBLIC_URL,
  isChibaseHost,
} from "@/lib/security/hosts";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://trustledger-frontend-pi.vercel.app"
).replace(/\/$/, "");

const FIRM_PUBLIC_PATHS = [
  "/",
  "/practice",
  "/packages",
  "/about",
  "/contact",
  "/insights",
  "/trustledger",
] as const;

/**
 * Keep public marketing + FAQ crawlable for search and AI bots.
 * Explicit allow-list includes paths LLMs cite; private app surfaces stay disallowed.
 * Do not add GPTBot / PerplexityBot / Google-Extended blocks — AEO requires openness.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  if (isChibaseHost(host)) {
    const firm =
      CHIBASE_PUBLIC_URL || `https://${CHIBASE_CANONICAL_HOST}`;
    return {
      rules: [
        {
          userAgent: "*",
          allow: [...FIRM_PUBLIC_PATHS],
          disallow: [
            "/app/",
            "/ops/",
            "/login",
            "/auth/",
            "/api/",
            "/pay/",
            "/trial",
            "/product",
            "/firm",
            "/subscription",
            "/*casino*",
            "/*1xbet*",
            "/*onlyfan*",
            "/*togel*",
            "/*jackpot*",
          ],
        },
      ],
      sitemap: `${firm}/sitemap.xml`,
      host: firm.replace(/^https?:\/\//, ""),
    };
  }

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
        disallow: ["/app/", "/ops/", "/login", "/auth/", "/api/", "/invite/", "/firm"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
