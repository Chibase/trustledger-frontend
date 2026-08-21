import { zernioAccountIds } from "@/lib/marketing/config";
import type {
  MarketingBrand,
  MarketingLength,
  MarketingPlacement,
} from "@/lib/marketing/types";
import {
  MARKETING_LENGTHS,
  MARKETING_PLACEMENTS,
  type MarketingLengthId,
  type MarketingPlacementId,
} from "@/lib/marketing/desk.types";

export function isPlacementId(value: string | undefined): value is MarketingPlacementId {
  return Boolean(value && MARKETING_PLACEMENTS.some((p) => p.id === value));
}

export function isLengthId(value: string | undefined): value is MarketingLengthId {
  return Boolean(value && MARKETING_LENGTHS.some((l) => l.id === value));
}

export function lengthBudget(length: MarketingLength): {
  chars?: number;
  words?: number;
  label: string;
} {
  switch (length) {
    case "comment":
      return { chars: 280, label: "about 250 characters" };
    case "short":
      return { chars: 700, label: "about 700 characters" };
    case "standard":
      return { chars: 1100, label: "about 1,100 characters" };
    case "article":
      return { words: 1000, label: "about 1,000 words" };
    case "blog":
      return { words: 1200, label: "about 1,200 words" };
    default:
      return { chars: 1100, label: "about 1,100 characters" };
  }
}

export function placementChannel(
  placement: MarketingPlacement,
): "social" | "blog" {
  return placement === "website-blog" ? "blog" : "social";
}

export function placementPlatforms(placement: MarketingPlacement): string[] {
  switch (placement) {
    case "linkedin-post":
    case "linkedin-article":
    case "linkedin-comment":
      return ["linkedin"];
    case "reddit-post":
      return ["reddit"];
    case "esg-post":
      return ["esg"];
    case "website-blog":
      return ["website"];
    default:
      return ["linkedin"];
  }
}

export function utmMediumFor(placement: MarketingPlacement | undefined): string {
  switch (placement) {
    case "reddit-post":
      return "reddit";
    case "esg-post":
      return "esg";
    case "website-blog":
      return "blog";
    case "linkedin-article":
      return "linkedin_article";
    case "linkedin-comment":
      return "linkedin_comment";
    default:
      return "linkedin";
  }
}

export function publishModeFor(
  brand: MarketingBrand,
  placement: MarketingPlacement | undefined,
): "zernio" | "paste" {
  if (!placement || placement === "linkedin-post") return "zernio";
  if (placement === "reddit-post") {
    return zernioAccountIds(brand).some((p) => p.platform === "reddit")
      ? "zernio"
      : "paste";
  }
  return "paste";
}

export function pasteTargetHint(
  brand: MarketingBrand,
  placement: MarketingPlacement,
): string {
  if (placement === "website-blog") {
    return brand === "chibase"
      ? "Paste into Chibase Insights (`/firm/insights`) after human edit. This desk does not write the live site."
      : "Paste into the TrustLedger website CMS (Webway) after human edit. This desk does not publish the public site.";
  }
  if (placement === "linkedin-article") {
    return "Paste into LinkedIn Articles. Feed auto-post is not used for long-form.";
  }
  if (placement === "linkedin-comment") {
    return "Paste as a comment on the target LinkedIn thread. Not auto-posted.";
  }
  if (placement === "esg-post") {
    return "Paste into the ESG / sustainability community you use. Not auto-posted.";
  }
  if (placement === "reddit-post") {
    return "Paste into Reddit (title + body). Auto-post only if a Reddit account is connected.";
  }
  return "Review then publish.";
}

export function slugifyBrief(topic: string): string {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "brief";
}
