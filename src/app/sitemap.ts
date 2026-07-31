import type { MetadataRoute } from "next";
import { comparisonSlugs } from "@/lib/aeo/comparisons";
import { SITE_URL } from "@/lib/aeo/siteFacts";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const siteUrl = SITE_URL;
  const compareEntries = comparisonSlugs().map((slug) => ({
    url: `${siteUrl}/compare/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.88,
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
      url: `${siteUrl}/compare`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...compareEntries,
    {
      url: `${siteUrl}/guides/ess10-ifc-grievance`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
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
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/status`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.3,
    },
  ];
}
