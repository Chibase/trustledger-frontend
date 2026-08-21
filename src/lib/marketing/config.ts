import type { MarketingBrand } from "@/lib/marketing/types";

const DEFAULT_LIST_ID = "901220539195";
const DEFAULT_TEAM_ID = "90121198081";

export function envTrim(name: string): string {
  const s = (process.env[name] || "").replace(/^\uFEFF/, "").trim();
  return s.replace(/^["']+|["']+$/g, "").trim();
}

/** Strip quotes, Bearer prefix, env-name paste, and whitespace from API keys. */
export function sanitizeSecret(raw: string): string {
  let s = raw.replace(/^\uFEFF/, "").trim();
  s = s.replace(/^["']+|["']+$/g, "").trim();
  s = s.replace(/^Bearer\s+/i, "").trim();
  s = s.replace(/^[A-Z][A-Z0-9_]{2,}\s*=\s*/i, "").trim();
  s = s.replace(/\s+/g, "");
  return s;
}

function secretEnv(name: string): string {
  return sanitizeSecret(process.env[name] || "");
}

export function geminiApiKey(): string {
  return secretEnv("GEMINI_API_KEY");
}

export function geminiModel(): string {
  return envTrim("GEMINI_MODEL") || "gemini-2.0-flash";
}

export function zernioApiKey(): string {
  return secretEnv("ZERNIO_API_KEY");
}

/** Prefix + length only — never the secret. */
export function zernioKeyFingerprint(): string | null {
  const key = zernioApiKey();
  if (!key) return null;
  const prefix = key.slice(0, key.indexOf("_") + 1) || key.slice(0, 3);
  return `${prefix}… (${key.length} chars)`;
}

export function zernioKeyShapeHint(): string | undefined {
  const key = zernioApiKey();
  if (!key) return undefined;
  if (/^sk_[a-f0-9]{64}$/i.test(key) || /^zrk_[a-f0-9]{64}$/i.test(key)) {
    return undefined;
  }
  return `ZERNIO_API_KEY shape looks off (${zernioKeyFingerprint()}). Zernio keys are sk_ or zrk_ plus 64 hex characters (67–68 chars). Paste the key only — no Bearer, no quotes — then redeploy.`;
}

export function zernioBaseUrl(): string {
  let base = (envTrim("ZERNIO_BASE_URL") || "https://zernio.com/api/v1").replace(
    /\/$/,
    "",
  );
  if (/^https:\/\/(www\.)?zernio\.com$/i.test(base)) {
    base = `${base.replace(/www\./i, "")}/api/v1`;
  }
  return base;
}

export function clickupApiKey(): string {
  return secretEnv("CLICKUP_API_KEY");
}

export function clickupTeamId(): string {
  return envTrim("CLICKUP_TEAM_ID") || DEFAULT_TEAM_ID;
}

export function clickupListId(): string {
  return envTrim("CLICKUP_LIST_ID") || DEFAULT_LIST_ID;
}

export function clickupWebhookSecret(): string {
  return secretEnv("CLICKUP_WEBHOOK_SECRET") || cronSecret();
}

export function clickupWebhookSecretDedicated(): boolean {
  return Boolean(secretEnv("CLICKUP_WEBHOOK_SECRET"));
}

export function cronSecret(): string {
  return secretEnv("CRON_SECRET");
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
