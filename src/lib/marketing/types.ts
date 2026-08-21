/**
 * Developer-owned marketing engine (packet MKT-1 / ADR-052).
 * Server-only. Never import from client components.
 */

export type MarketingBrand = "chibase" | "trustledger";

export type MarketingKind =
  | "thought-leadership"
  | "saas-spotlight"
  | "trial-outreach";

export type MarketingChannel = "social" | "outreach";

export type CampaignAsset = {
  headline: string;
  body: string;
  hooks: string[];
  hashtags: string[];
  cta: { label: string; url: string };
  platforms: string[];
  firstComment?: string;
  outreachDraft?: string;
};

export type ContentDoc = {
  slug: string;
  title: string;
  brand: MarketingBrand;
  kind: MarketingKind;
  channel: MarketingChannel;
  ctaLabel: string;
  ctaUrl: string;
  platforms: string[];
  source?: string;
  body: string;
  filePath: string;
};

export type MarketingPayload = {
  v: 1;
  brand: MarketingBrand;
  kind: MarketingKind;
  channel: MarketingChannel;
  sourceSlug: string;
  weekKey: string;
  asset: CampaignAsset;
  publishedAt?: string;
  zernioPostId?: string;
};

export type DraftCycleResult = {
  ok: boolean;
  dryRun: boolean;
  skipped?: string;
  weekKey: string;
  sourceSlug?: string;
  clickupTaskId?: string;
  clickupTaskUrl?: string;
  synthesizer?: "gemini" | "template";
  asset?: CampaignAsset;
  error?: string;
};

export type PublishResult = {
  ok: boolean;
  skipped?: string;
  taskId: string;
  zernioPostId?: string;
  platforms?: string[];
  error?: string;
};
