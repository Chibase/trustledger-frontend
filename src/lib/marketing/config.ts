import type { MarketingBrand } from "@/lib/marketing/types";

const DEFAULT_LIST_ID = "901220539195";
const DEFAULT_TEAM_ID = "90121198081";

export function envTrim(name: string): string {
  return (process.env[name] || "").trim();
}

export function geminiApiKey(): string {
  return envTrim("GEMINI_API_KEY");
}

export function geminiModel(): string {
  return envTrim("GEMINI_MODEL") || "gemini-2.0-flash";
}

export function zernioApiKey(): string {
  return envTrim("ZERNIO_API_KEY");
}

export function zernioBaseUrl(): string {
  return (envTrim("ZERNIO_BASE_URL") || "https://zernio.com/api/v1").replace(
    /\/$/,
    "",
  );
}

export function clickupApiKey(): string {
  return envTrim("CLICKUP_API_KEY");
}

export function clickupTeamId(): string {
  return envTrim("CLICKUP_TEAM_ID") || DEFAULT_TEAM_ID;
}

export function clickupListId(): string {
  return envTrim("CLICKUP_LIST_ID") || DEFAULT_LIST_ID;
}

export function clickupWebhookSecret(): string {
  return envTrim("CLICKUP_WEBHOOK_SECRET") || cronSecret();
}

export function clickupWebhookSecretDedicated(): boolean {
  return Boolean(envTrim("CLICKUP_WEBHOOK_SECRET"));
}

export function cronSecret(): string {
  return envTrim("CRON_SECRET");
}

export function marketingEngineStatus(): {
  gemini: boolean;
  zernio: boolean;
  zernioAccounts: boolean;
  clickup: boolean;
  webhookSecret: boolean;
  webhookSecretDedicated: boolean;
  listId: string;
  teamId: string;
} {
  return {
    gemini: Boolean(geminiApiKey()),
    zernio: Boolean(zernioApiKey()),
    zernioAccounts:
      zernioAccountIds("trustledger").length > 0 ||
      zernioAccountIds("chibase").length > 0,
    clickup: Boolean(clickupApiKey()),
    webhookSecret: Boolean(clickupWebhookSecret()),
    webhookSecretDedicated: clickupWebhookSecretDedicated(),
    listId: clickupListId(),
    teamId: clickupTeamId(),
  };
}

export function clickupListUrl(): string {
  return `https://app.clickup.com/${clickupTeamId()}/v/l/li/${clickupListId()}`;
}

export function clickupSetupTaskUrl(): string {
  const id = envTrim("CLICKUP_SETUP_TASK_ID") || "869en19vw";
  return `https://app.clickup.com/t/${id}`;
}

export function clickupTaskUrl(taskId: string): string {
  return `https://app.clickup.com/t/${taskId}`;
}

/**
 * Account map for Zernio publish.
 * Prefer brand-specific IDs; fall back to a shared LinkedIn account.
 */
export function zernioAccountIds(brand: MarketingBrand): Array<{
  platform: string;
  accountId: string;
}> {
  const out: Array<{ platform: string; accountId: string }> = [];
  const push = (platform: string, id: string) => {
    if (id) out.push({ platform, accountId: id });
  };

  if (brand === "chibase") {
    push("linkedin", envTrim("ZERNIO_CHIBASE_LINKEDIN_ACCOUNT_ID"));
    push("twitter", envTrim("ZERNIO_CHIBASE_TWITTER_ACCOUNT_ID"));
  } else {
    push("linkedin", envTrim("ZERNIO_TRUSTLEDGER_LINKEDIN_ACCOUNT_ID"));
    push("twitter", envTrim("ZERNIO_TRUSTLEDGER_TWITTER_ACCOUNT_ID"));
  }

  if (!out.some((p) => p.platform === "linkedin")) {
    push("linkedin", envTrim("ZERNIO_LINKEDIN_ACCOUNT_ID"));
  }
  if (!out.some((p) => p.platform === "twitter")) {
    push("twitter", envTrim("ZERNIO_TWITTER_ACCOUNT_ID"));
  }

  const extra = envTrim("ZERNIO_PLATFORMS");
  if (extra) {
    for (const part of extra.split(",")) {
      const [platform, accountId] = part.split(":").map((s) => s.trim());
      if (platform && accountId && !out.some((p) => p.platform === platform)) {
        out.push({ platform, accountId });
      }
    }
  }

  return out;
}
