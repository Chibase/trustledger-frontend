import { zernioAccountIds, zernioApiKey, zernioBaseUrl } from "@/lib/marketing/config";
import type { CampaignAsset, MarketingBrand } from "@/lib/marketing/types";

type ZernioPostPlatform = {
  platform?: string;
  accountId?: string;
  status?: string;
  error?: string;
};

type ZernioPost = {
  _id?: string;
  id?: string;
  status?: string;
  platforms?: ZernioPostPlatform[];
};

type ZernioEnvelope = {
  post?: ZernioPost;
  data?: { post?: ZernioPost };
  error?: string;
  message?: string;
  type?: string;
  code?: string;
  platform?: string;
  platformError?: { message?: string; error?: string; status?: number };
  accounts?: Array<{
    _id?: string;
    id?: string;
    accountId?: string;
    platform?: string;
    status?: string;
    canPost?: boolean;
    tokenValid?: boolean;
    needsReconnect?: boolean;
    issues?: string[];
    username?: string;
    displayName?: string;
  }>;
  summary?: { needsReconnect?: number; error?: number };
};

type PublishOutcome = {
  ok: boolean;
  skipped?: string;
  postId?: string;
  status?: string;
  platforms: Array<{ platform: string; accountId: string }>;
  error?: string;
};

async function zernioFetch(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const key = zernioApiKey();
  if (!key) {
    return { ok: false, status: 0, json: { error: "ZERNIO_API_KEY missing" } };
  }
  const res = await fetch(`${zernioBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = { error: "Invalid JSON from Zernio" };
  }
  return { ok: res.ok, status: res.status, json };
}

function envelope(json: unknown): ZernioEnvelope {
  return (json || {}) as ZernioEnvelope;
}

function rawErrorText(status: number, json: unknown): string {
  const e = envelope(json);
  const platformMsg =
    e.platformError?.message || e.platformError?.error || "";
  const bits = [e.error, e.message, platformMsg].filter(Boolean);
  if (bits.length) return bits.join(" — ");
  return `Zernio request failed (${status})`;
}

function looksUnauthorised(status: number, json: unknown, extra = ""): boolean {
  if (status === 401 || status === 403) return true;
  const e = envelope(json);
  if (e.type === "authentication_error" || e.type === "permission_error") {
    return true;
  }
  if (e.code === "missing_credentials" || e.code === "invalid_credentials") {
    return true;
  }
  const blob = `${rawErrorText(status, json)} ${extra}`.toLowerCase();
  return /not authorised|not authorized|unauthorised|unauthorized|invalid.?credential|token expired|access token|oauth/i.test(
    blob,
  );
}

function explainZernioFailure(status: number, json: unknown): string {
  const e = envelope(json);
  const raw = rawErrorText(status, json);
  if (status === 401 || e.type === "authentication_error") {
    return (
      "Zernio rejected the API key (not authorised). On Vercel, set ZERNIO_API_KEY to a live sk_ key with no spaces, then redeploy. Create a new key at zernio.com if the old one was shown only once."
    );
  }
  if (
    e.type === "permission_error" ||
    status === 403 ||
    /not authorised|not authorized/i.test(raw)
  ) {
    return (
      `${raw} LinkedIn/X often means the connected account’s OAuth expired or the member never granted posting. Reconnect the account in Zernio (same profile as this API key), confirm ZERNIO_LINKEDIN_ACCOUNT_ID is the Zernio account _id (not a LinkedIn URN), then retry Publish. Copy stays in ClickUp.`
    );
  }
  return raw;
}

export function zernioConfigured(brand: MarketingBrand): boolean {
  return Boolean(zernioApiKey()) && zernioAccountIds(brand).length > 0;
}

export async function listZernioAccounts(): Promise<unknown> {
  const { json } = await zernioFetch("/accounts");
  return json;
}

export async function describeZernioReadiness(): Promise<string | undefined> {
  if (!zernioApiKey()) return undefined;
  const listed = await zernioFetch("/accounts");
  if (looksUnauthorised(listed.status, listed.json)) {
    return explainZernioFailure(listed.status, listed.json);
  }
  if (!listed.ok) {
    return `Could not list Zernio accounts: ${rawErrorText(listed.status, listed.json)}`;
  }
  const health = await zernioFetch("/accounts/health");
  if (!health.ok) return undefined;
  const e = envelope(health.json);
  const rows = e.accounts || [];
  const bad = rows.filter(
    (a) =>
      a.needsReconnect ||
      a.tokenValid === false ||
      a.canPost === false ||
      a.status === "error",
  );
  if (!bad.length && !e.summary?.needsReconnect) return undefined;
  const names = bad
    .map((a) => a.displayName || a.username || a.platform || a.accountId)
    .filter(Boolean)
    .slice(0, 4);
  return `Social account needs reconnect in Zernio${
    names.length ? ` (${names.join(", ")})` : ""
  }. Publish will stay blocked until OAuth is healthy.`;
}

function accountRecordId(row: NonNullable<ZernioEnvelope["accounts"]>[number]): string {
  return row._id || row.id || row.accountId || "";
}

async function assertAccountsUsable(
  usable: Array<{ platform: string; accountId: string }>,
): Promise<string | undefined> {
  const listed = await zernioFetch("/accounts");
  if (looksUnauthorised(listed.status, listed.json)) {
    return explainZernioFailure(listed.status, listed.json);
  }
  if (!listed.ok) {
    return `Could not verify Zernio accounts: ${rawErrorText(listed.status, listed.json)}`;
  }
  const known = new Set(
    (envelope(listed.json).accounts || [])
      .map(accountRecordId)
      .filter(Boolean),
  );
  if (known.size) {
    const missing = usable.filter((p) => !known.has(p.accountId));
    if (missing.length) {
      return `Zernio account ID ${missing
        .map((m) => `${m.platform}:${m.accountId}`)
        .join(", ")} is not on this API key. Use the account _id from GET /accounts (Zernio dashboard), not a LinkedIn profile or company URN.`;
    }
  }
  const health = await zernioFetch("/accounts/health");
  if (!health.ok) return undefined;
  const rows = envelope(health.json).accounts || [];
  const blocked = usable
    .map((p) => {
      const row = rows.find(
        (a) =>
          accountRecordId(a) === p.accountId ||
          a.platform === p.platform,
      );
      return { p, row };
    })
    .filter(
      ({ row }) =>
        row &&
        (row.needsReconnect ||
          row.tokenValid === false ||
          row.canPost === false),
    );
  if (!blocked.length) return undefined;
  const detail = blocked
    .map(({ p, row }) => {
      const why = (row?.issues || []).join("; ") || "reconnect OAuth";
      return `${p.platform} (${why})`;
    })
    .join("; ");
  return `Cannot publish — ${detail}. Reconnect that account in Zernio, then retry. Copy stays in ClickUp.`;
}

function composePostBody(asset: CampaignAsset, options?: { stripUrls?: boolean }): string {
  const tags = asset.hashtags
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ");
  const ctaLine = `\n\n${asset.cta.label}: ${asset.cta.url}`;
  let body = asset.body.trim();
  if (options?.stripUrls) {
    body = body.replace(/https?:\/\/\S+/gi, "").replace(/\n{3,}/g, "\n\n").trim();
    if (!/link in the first comment/i.test(body)) {
      body = `${body}\n\nLink in the first comment.`;
    }
  } else if (!body.includes(asset.cta.url)) {
    body = `${body}${ctaLine}`;
  }
  if (tags && !body.includes("#")) {
    body = `${body}\n\n${tags}`;
  }
  return body.slice(0, 3000);
}

function postPayload(
  asset: CampaignAsset,
  usable: Array<{ platform: string; accountId: string }>,
  publishNow: boolean,
  withFirstComment: boolean,
) {
  const firstComment =
    asset.firstComment?.trim() || `${asset.cta.label}: ${asset.cta.url}`;
  return {
    content: composePostBody(asset, { stripUrls: false }),
    publishNow,
    platforms: usable.map((p) => {
      const linkedin = p.platform === "linkedin";
      if (!linkedin) {
        return { platform: p.platform, accountId: p.accountId };
      }
      if (!withFirstComment) {
        return { platform: p.platform, accountId: p.accountId };
      }
      return {
        platform: p.platform,
        accountId: p.accountId,
        customContent: composePostBody(asset, { stripUrls: true }),
        platformSpecificData: { firstComment },
      };
    }),
  };
}

function readCreatedPost(json: unknown): ZernioPost | undefined {
  const e = envelope(json);
  return e.post || e.data?.post;
}

function platformFailure(post: ZernioPost | undefined): string | undefined {
  if (!post) return undefined;
  const st = (post.status || "").toLowerCase();
  const rows = post.platforms || [];
  const failed = rows.filter((p) => (p.status || "").toLowerCase() === "failed");
  if (st === "failed" || (failed.length && st !== "published" && st !== "partial")) {
    return (
      failed.map((p) => p.error).filter(Boolean).join(" — ") ||
      `Zernio post status ${post.status || "failed"}`
    );
  }
  if (st === "partial") {
    const err = failed.map((p) => `${p.platform}: ${p.error || "failed"}`).join("; ");
    return err || undefined;
  }
  return undefined;
}

async function createPost(
  body: unknown,
  usable: Array<{ platform: string; accountId: string }>,
): Promise<PublishOutcome> {
  const { ok, status, json } = await zernioFetch("/posts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const post = readCreatedPost(json);
  const postId = post?._id || post?.id;
  const platformErr = platformFailure(post);
  if (!ok || !postId || (post?.status || "").toLowerCase() === "failed") {
    const extra = platformErr || "";
    return {
      ok: false,
      platforms: usable,
      error: looksUnauthorised(status, json, extra)
        ? explainZernioFailure(status, json)
        : extra || explainZernioFailure(status, json) || rawErrorText(status, json),
    };
  }
  if (platformErr && (post?.status || "").toLowerCase() === "partial") {
    return {
      ok: true,
      postId,
      status: post?.status,
      platforms: usable,
      error: `Published with warnings: ${platformErr}`,
    };
  }
  return {
    ok: true,
    postId,
    status: post?.status,
    platforms: usable,
  };
}

export async function publishViaZernio(input: {
  brand: MarketingBrand;
  asset: CampaignAsset;
  publishNow?: boolean;
}): Promise<PublishOutcome> {
  const platforms = zernioAccountIds(input.brand).filter((p) => {
    if (!input.asset.platforms.length) return true;
    return input.asset.platforms.includes(p.platform);
  });
  const usable = platforms.length ? platforms : zernioAccountIds(input.brand);

  if (!zernioApiKey()) {
    return {
      ok: false,
      skipped: "zernio_unconfigured",
      platforms: [],
      error: "ZERNIO_API_KEY missing — copy stays in ClickUp for manual paste.",
    };
  }
  if (usable.length === 0) {
    return {
      ok: false,
      skipped: "zernio_no_accounts",
      platforms: [],
      error:
        "No Zernio account IDs set (ZERNIO_LINKEDIN_ACCOUNT_ID or brand-specific). Draft remains in ClickUp.",
    };
  }

  const blocked = await assertAccountsUsable(usable);
  if (blocked) {
    return { ok: false, skipped: "zernio_account_unhealthy", platforms: usable, error: blocked };
  }

  const asset = input.asset;
  const publishNow = input.publishNow !== false;
  const firstTry = await createPost(
    postPayload(asset, usable, publishNow, true),
    usable,
  );
  if (firstTry.ok) return firstTry;

  const mayRetryWithoutComment =
    usable.some((p) => p.platform === "linkedin") &&
    /not authorised|not authorized|permission|oauth|scope|comment/i.test(
      firstTry.error || "",
    ) &&
    !/ZERNIO_API_KEY|API key/i.test(firstTry.error || "");
  if (mayRetryWithoutComment) {
    const second = await createPost(
      postPayload(asset, usable, publishNow, false),
      usable,
    );
    if (second.ok) return second;
    return firstTry;
  }
  return firstTry;
}

/**
 * Direct outreach via Zernio inbox — only when a conversation id is supplied.
 * Cron never calls this; ClickUp approval of channel=outreach may.
 */
export async function sendZernioInboxMessage(input: {
  conversationId: string;
  accountId: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { ok, status, json } = await zernioFetch(
    `/inbox/conversations/${encodeURIComponent(input.conversationId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        accountId: input.accountId,
        message: input.message,
      }),
    },
  );
  if (!ok) {
    return {
      ok: false,
      error: looksUnauthorised(status, json)
        ? explainZernioFailure(status, json)
        : rawErrorText(status, json),
    };
  }
  return { ok: true };
}
