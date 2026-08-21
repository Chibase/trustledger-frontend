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
  tasks: MarketingDeskTask[];
  error?: string;
};

export type MarketingDeskAction =
  | "setup"
  | "stage-chibase"
  | "stage-trustledger"
  | "register-webhook"
  | "publish";

export type MarketingDeskActionResult = {
  ok: boolean;
  action: MarketingDeskAction;
  message?: string;
  error?: string;
  result?: unknown;
};
