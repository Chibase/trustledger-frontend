import { zernioAccountIds, zernioApiKey, zernioBaseUrl } from "@/lib/marketing/config";
import type { CampaignAsset, MarketingBrand } from "@/lib/marketing/types";

type ZernioPost = {
  _id?: string;
  id?: string;
  status?: string;
};

type ZernioCreateResponse = {
  post?: ZernioPost;
  data?: { post?: ZernioPost };
  error?: string;
  message?: string;
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

export function zernioConfigured(brand: MarketingBrand): boolean {
  return Boolean(zernioApiKey()) && zernioAccountIds(brand).length > 0;
}

export async function listZernioAccounts(): Promise<unknown> {
  const { json } = await zernioFetch("/accounts");
  return json;
}

function composePostBody(asset: CampaignAsset): string {
  const tags = asset.hashtags
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ");
  const ctaLine = `\n\n${asset.cta.label}: ${asset.cta.url}`;
  let body = asset.body.trim();
  if (!body.includes(asset.cta.url)) {
    body = `${body}${ctaLine}`;
  }
  if (tags && !body.includes("#")) {
    body = `${body}\n\n${tags}`;
  }
  return body.slice(0, 3000);
}

export async function publishViaZernio(input: {
  brand: MarketingBrand;
  asset: CampaignAsset;
  publishNow?: boolean;
}): Promise<{
  ok: boolean;
  skipped?: string;
  postId?: string;
  status?: string;
  platforms: Array<{ platform: string; accountId: string }>;
  error?: string;
}> {
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

  const body = {
    content: composePostBody(input.asset),
    publishNow: input.publishNow !== false,
    platforms: usable.map((p) => ({
      platform: p.platform,
      accountId: p.accountId,
      ...(p.platform === "linkedin" && input.asset.firstComment
        ? { customContent: composePostBody(input.asset) }
        : {}),
    })),
  };

  const { ok, status, json } = await zernioFetch("/posts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const parsed = json as ZernioCreateResponse;
  const post = parsed.post || parsed.data?.post;
  const postId = post?._id || post?.id;
  if (!ok || !postId) {
    return {
      ok: false,
      platforms: usable,
      error:
        parsed.error ||
        parsed.message ||
        `Zernio createPost failed (${status})`,
    };
  }
  return {
    ok: true,
    postId,
    status: post?.status,
    platforms: usable,
  };
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
    const parsed = json as { error?: string; message?: string };
    return {
      ok: false,
      error: parsed.error || parsed.message || `Zernio inbox failed (${status})`,
    };
  }
  return { ok: true };
}
