/**
 * Shared shapes for the Platform Ops marketing desk (MKT-2).
 * Types only — safe to import from the ops client panel.
 */

export type MarketingEngineFlags = {
  gemini: boolean;
  zernio: boolean;
  zernioAccounts: boolean;
  clickup: boolean;
  webhookSecret: boolean;
  webhookSecretDedicated: boolean;
  listId: string;
  teamId: string;
};

export type MarketingDeskBrand = "chibase" | "trustledger";

export type MarketingPlacementId =
  | "linkedin-post"
  | "linkedin-article"
  | "linkedin-comment"
  | "reddit-post"
  | "esg-post"
  | "website-blog";

export type MarketingLengthId =
  | "comment"
  | "short"
  | "standard"
  | "article"
  | "blog";

export const MARKETING_PLACEMENTS: Array<{
  id: MarketingPlacementId;
  label: string;
  hint: string;
  defaultLength: MarketingLengthId;
}> = [
  {
    id: "linkedin-post",
    label: "LinkedIn post",
    hint: "Feed post. Can auto-post via connected social after you apply.",
    defaultLength: "standard",
  },
  {
    id: "linkedin-article",
    label: "LinkedIn article",
    hint: "Long-form. Staged for paste into LinkedIn Articles — not auto-posted.",
    defaultLength: "article",
  },
  {
    id: "linkedin-comment",
    label: "LinkedIn comment",
    hint: "Reply-length. Copy into a thread; not auto-posted.",
    defaultLength: "comment",
  },
  {
    id: "reddit-post",
    label: "Reddit",
    hint: "Title + self-text. Paste unless a Reddit account is connected.",
    defaultLength: "standard",
  },
  {
    id: "esg-post",
    label: "ESG platform",
    hint: "Practitioner community article/post. Always paste-ready.",
    defaultLength: "article",
  },
  {
    id: "website-blog",
    label: "Website blog",
    hint: "Markdown for TrustLedger (Webway) or Chibase Insights. Never auto-published.",
    defaultLength: "blog",
  },
];

export const MARKETING_LENGTHS: Array<{
  id: MarketingLengthId;
  label: string;
}> = [
  { id: "comment", label: "Comment (~250 characters)" },
  { id: "short", label: "Short (~700 characters)" },
  { id: "standard", label: "Standard post (~1,100 characters)" },
  { id: "article", label: "Long article (~1,000 words)" },
  { id: "blog", label: "Blog (~1,200 words)" },
];

export type MarketingBriefInput = {
  brand: MarketingDeskBrand;
  topic: string;
  notes?: string;
  placement: MarketingPlacementId;
  length: MarketingLengthId;
  sourceSlug?: string;
};

export type MarketingDeskSource = {
  slug: string;
  title: string;
  brand: MarketingDeskBrand;
};

export type MarketingDeskTask = {
  id: string;
  name: string;
  status: string;
  url: string;
  brand: MarketingDeskBrand | null;
  weekKey: string | null;
  thisWeek: boolean;
  headline: string | null;
  bodyPreview: string | null;
  published: boolean;
  engineTask: boolean;
  placement: MarketingPlacementId | null;
  publishMode: "zernio" | "paste";
};

export type MarketingDeskCron = {
  brand: MarketingDeskBrand;
  label: string;
  scheduleUtc: string;
  sast: string;
  path: string;
};

export type MarketingDeskSnapshot = {
  ok: boolean;
  generatedAt: string;
  weekKey: string;
  status: MarketingEngineFlags;
  links: {
    list: string;
    setupTask: string;
  };
  crons: MarketingDeskCron[];
  content: {
    chibase: number;
    trustledger: number;
  };
  sources: MarketingDeskSource[];
  tasks: MarketingDeskTask[];
  error?: string;
};

export type MarketingDeskAction =
  | "setup"
  | "stage-chibase"
  | "stage-trustledger"
  | "register-webhook"
  | "publish"
  | "compose";

export type MarketingDeskActionResult = {
  ok: boolean;
  action: MarketingDeskAction;
  message?: string;
  error?: string;
  result?: unknown;
};
