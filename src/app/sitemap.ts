import type { MetadataRoute } from "next";
import { RESOURCE_PACKS } from "@/data/resources";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://trustledger-frontend-pi.vercel.app"
).replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
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
  ];
}
