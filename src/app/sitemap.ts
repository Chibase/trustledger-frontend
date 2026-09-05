import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { RESOURCE_PACKS } from "@/data/resources";
import {
  CHIBASE_CANONICAL_HOST,
  CHIBASE_PUBLIC_URL,
  isChibaseHost,
} from "@/lib/security/hosts";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://trustledger-frontend-pi.vercel.app"
).replace(/\/$/, "");

const FIRM_PATHS = [
  "/",
  "/practice",
  "/packages",
  "/about",
  "/contact",
  "/insights",
  "/trustledger",
] as const;

function firmOriginFromHost(hostHeader: string | null): string {
  if (CHIBASE_PUBLIC_URL) return CHIBASE_PUBLIC_URL;
  const host = (hostHeader || "").split(":")[0]?.toLowerCase() || "";
  if (host.endsWith(CHIBASE_CANONICAL_HOST)) {
    return `https://${host}`;
  }
  return `https://${CHIBASE_CANONICAL_HOST}`;
}

function firmEntries(origin: string, now: Date): MetadataRoute.Sitemap {
  return FIRM_PATHS.map((path, i) => ({
    url: path === "/" ? origin : `${origin}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: i === 0 ? 1 : 0.8,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const host = (await headers()).get("host");

  // Firm host: only clean brochure URLs (never product or retired WP spam).
  if (isChibaseHost(host)) {
    return firmEntries(firmOriginFromHost(host), now);
  }

  const packs = RESOURCE_PACKS.map((pack) => ({
    url: `${siteUrl}/resources/${pack.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/product`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.92,
    },
    {
      url: `${siteUrl}/readiness`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/resources`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    ...packs,
    {
      url: `${siteUrl}/assessment`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/quote`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/trial`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/pay`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/status`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/subprocessors`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/legal/dpa`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...chibaseCrossSitemap(now),
  ];
}

/** Product-host sitemap also lists firm URLs once canonical env is set. */
function chibaseCrossSitemap(now: Date): MetadataRoute.Sitemap {
  const firm = (process.env.NEXT_PUBLIC_CHIBASE_SITE_URL || "").replace(
    /\/$/,
    "",
  );
  if (!firm) return [];
  return firmEntries(firm, now).map((entry, i) => ({
    ...entry,
    priority: i === 0 ? 0.8 : 0.6,
    changeFrequency: "monthly" as const,
  }));
}
