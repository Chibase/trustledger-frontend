import { createHmac, timingSafeEqual } from "node:crypto";
import {
  clickupApiKey,
  clickupListId,
  clickupTeamId,
  clickupWebhookSecret,
} from "@/lib/marketing/config";
import type { MarketingPayload } from "@/lib/marketing/types";
import { decodePayload, encodeTaskMarkdown } from "@/lib/marketing/payload";

const CLICKUP_BASE = "https://api.clickup.com/api/v2";

export type ClickUpTask = {
  id: string;
  name: string;
  status?: { status?: string };
  url?: string;
  markdown_description?: string;
  description?: string;
  text_content?: string;
};

type ClickUpList = {
  id?: string;
  name?: string;
  statuses?: Array<{ status: string; type?: string }>;
};

async function clickupFetch(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const key = clickupApiKey();
  if (!key) {
    return { ok: false, status: 0, json: { err: "CLICKUP_API_KEY missing" } };
  }
  const res = await fetch(`${CLICKUP_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: key,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = { err: "Invalid JSON from ClickUp" };
  }
  return { ok: res.ok, status: res.status, json };
}

export function clickupConfigured(): boolean {
  return Boolean(clickupApiKey() && clickupListId());
}

export function verifyClickUpSignature(rawBody: string, signature: string | null): boolean {
  const secret = clickupWebhookSecret();
  if (!secret || !signature) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function clickupSignatureRequired(): boolean {
  return Boolean(clickupWebhookSecret());
}

export async function getClickUpList(listId = clickupListId()): Promise<ClickUpList | null> {
  const { ok, json } = await clickupFetch(`/list/${listId}`);
  if (!ok) return null;
  return json as ClickUpList;
}

async function resolveStatus(
  preferred: string[],
  listId = clickupListId(),
): Promise<string | undefined> {
  const list = await getClickUpList(listId);
  const statuses = list?.statuses || [];
  const lower = statuses.map((s) => s.status.toLowerCase());
  for (const name of preferred) {
    const idx = lower.indexOf(name.toLowerCase());
    if (idx >= 0) return statuses[idx].status;
  }
  return undefined;
}

export async function listClickUpTasks(listId = clickupListId()): Promise<ClickUpTask[]> {
  const { ok, json } = await clickupFetch(
    `/list/${listId}/task?include_closed=true&subtasks=false`,
  );
  if (!ok) return [];
  const tasks = (json as { tasks?: ClickUpTask[] }).tasks;
  return Array.isArray(tasks) ? tasks : [];
}

export function taskNameFor(payload: Pick<MarketingPayload, "brand" | "sourceSlug" | "weekKey">): string {
  const brand = payload.brand === "chibase" ? "Chibase" : "TrustLedger";
  return `[${brand}] ${payload.sourceSlug} — ${payload.weekKey}`;
}

export async function findTaskForWeek(
  brand: MarketingPayload["brand"],
  weekKey: string,
  listId = clickupListId(),
): Promise<ClickUpTask | null> {
  const needle = `— ${weekKey}`;
  const brandTag = brand === "chibase" ? "[Chibase]" : "[TrustLedger]";
  const tasks = await listClickUpTasks(listId);
  return (
    tasks.find(
      (t) => t.name.includes(brandTag) && t.name.includes(needle),
    ) || null
  );
}

export async function usedSlugsThisWeek(
  brand: MarketingPayload["brand"],
  weekKey: string,
  listId = clickupListId(),
): Promise<Set<string>> {
  const tasks = await listClickUpTasks(listId);
  const slugs = new Set<string>();
  const brandTag = brand === "chibase" ? "[Chibase]" : "[TrustLedger]";
  for (const t of tasks) {
    if (!t.name.includes(brandTag) || !t.name.includes(`— ${weekKey}`)) continue;
    const m = t.name.match(/\]\s+([^\s—]+)(?:\s+—)/);
    if (m?.[1]) slugs.add(m[1]);
  }
  return slugs;
}

export async function createReviewTask(input: {
  payload: MarketingPayload;
  sourceTitle: string;
  synthesizer: string;
}): Promise<{ id: string; url?: string } | { error: string }> {
  const listId = clickupListId();
  const status = await resolveStatus(["review", "to do", "open", "in progress"]);
  const markdown_description = encodeTaskMarkdown({
    payload: input.payload,
    sourceTitle: input.sourceTitle,
    synthesizer: input.synthesizer,
  });
  const body: Record<string, unknown> = {
    name: taskNameFor(input.payload),
    markdown_description,
    description: markdown_description,
    tags: ["mkt-engine", input.payload.brand],
  };
  if (status) body.status = status;

  const { ok, status: http, json } = await clickupFetch(`/list/${listId}/task`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const created = json as ClickUpTask & { err?: string; ECODE?: string };
  if (!ok || !created.id) {
    // Retry without tags if the space does not have them yet.
    delete body.tags;
    const retry = await clickupFetch(`/list/${listId}/task`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const again = retry.json as ClickUpTask & { err?: string };
    if (!retry.ok || !again.id) {
      return {
        error:
          created.err ||
          again.err ||
          `ClickUp create task failed (${http})`,
      };
    }
    return { id: again.id, url: again.url };
  }
  return { id: created.id, url: created.url };
}

export async function getClickUpTask(taskId: string): Promise<ClickUpTask | null> {
  const { ok, json } = await clickupFetch(`/task/${taskId}`);
  if (!ok) return null;
  return json as ClickUpTask;
}

export function payloadFromTask(task: ClickUpTask): MarketingPayload | null {
  return decodePayload(
    [task.markdown_description, task.description, task.text_content]
      .filter(Boolean)
      .join("\n"),
  );
}

export const PUBLISHED_MARKER = "TL_MKT_PUBLISHED:";

export async function listTaskComments(taskId: string): Promise<
  Array<{ text: string; dateMs: number }>
> {
  const { ok, json } = await clickupFetch(`/task/${taskId}/comment`);
  if (!ok) return [];
  const comments = (json as {
    comments?: Array<{ comment_text?: string; text_content?: string; date?: string | number }>;
  }).comments;
  if (!Array.isArray(comments)) return [];
  return comments.map((c) => ({
    text: c.comment_text || c.text_content || "",
    dateMs: Number(c.date) || 0,
  }));
}

export async function taskAlreadyPublished(taskId: string): Promise<string | null> {
  const comments = await listTaskComments(taskId);
  for (const c of comments) {
    const m = c.text.match(new RegExp(`${PUBLISHED_MARKER}\\s*(\\S+)`));
    if (m?.[1]) return m[1];
  }
  return null;
}

export async function addClickUpComment(
  taskId: string,
  text: string,
): Promise<boolean> {
  const { ok } = await clickupFetch(`/task/${taskId}/comment`, {
    method: "POST",
    body: JSON.stringify({ comment_text: text }),
  });
  return ok;
}

export async function updateClickUpTask(
  taskId: string,
  patch: { status?: string; markdown_description?: string; description?: string },
): Promise<boolean> {
  const body: Record<string, unknown> = {};
  if (patch.markdown_description) {
    body.markdown_description = patch.markdown_description;
    body.description = patch.description || patch.markdown_description;
  }
  if (patch.status) {
    const resolved = await resolveStatus([patch.status, patch.status.toLowerCase()]);
    if (resolved) body.status = resolved;
  }
  if (Object.keys(body).length === 0) return true;
  const { ok } = await clickupFetch(`/task/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return ok;
}

export async function markTaskPublished(
  task: ClickUpTask,
  payload: MarketingPayload,
): Promise<boolean> {
  const markdown = encodeTaskMarkdown({
    payload,
    sourceTitle: payload.asset.headline,
    synthesizer: "published",
  });
  const updated = await updateClickUpTask(task.id, {
    status: "published",
    markdown_description: markdown,
  });
  await updateClickUpTask(task.id, { status: "complete" });
  return updated;
}

export function isApprovedStatus(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  if (s === "complete" || s === "closed" || s === "done") return false;
  return s === "approved" || s === "publishing";
}

export function commentRequestsPublish(text: string | undefined): boolean {
  if (!text) return false;
  return /^\s*\/tl-publish\b/i.test(text);
}

/** Newest /tl-publish comment only if posted in the last 5 minutes. */
export async function latestPublishableComment(taskId: string): Promise<string> {
  const comments = await listTaskComments(taskId);
  const newest = comments
    .filter((c) => commentRequestsPublish(c.text))
    .sort((a, b) => b.dateMs - a.dateMs)[0];
  if (!newest) return "";
  if (newest.dateMs && Date.now() - newest.dateMs > 5 * 60 * 1000) return "";
  return newest.text;
}

type ClickUpWebhookRow = {
  id?: string;
  endpoint?: string;
  health?: { status?: string };
};

export async function ensureClickUpWebhook(endpoint: string): Promise<{
  ok: boolean;
  webhookId?: string;
  action?: "created" | "updated" | "unchanged";
  error?: string;
}> {
  const secret = clickupWebhookSecret();
  const teamId = clickupTeamId();
  const target = endpoint.replace(/\/$/, "");
  if (!clickupApiKey()) {
    return { ok: false, error: "CLICKUP_API_KEY missing" };
  }
  if (!secret) {
    return {
      ok: false,
      error: "Set CLICKUP_WEBHOOK_SECRET (or CRON_SECRET as fallback)",
    };
  }

  const listed = await clickupFetch(`/team/${teamId}/webhook`);
  if (!listed.ok) {
    const err = listed.json as { err?: string };
    return {
      ok: false,
      error: err.err || `ClickUp list webhooks failed (${listed.status})`,
    };
  }
  const webhooks = (listed.json as { webhooks?: ClickUpWebhookRow[] }).webhooks;
  const matches = Array.isArray(webhooks)
    ? webhooks.filter((w) => (w.endpoint || "").replace(/\/$/, "") === target)
    : [];
  const existing = matches[0];

  const body = {
    endpoint: target,
    events: ["taskStatusUpdated", "taskCommentPosted"],
    secret,
    status: "active",
  };

  for (const extra of matches.slice(1)) {
    if (extra.id) {
      await clickupFetch(`/webhook/${extra.id}`, { method: "DELETE" });
    }
  }

  if (existing?.id) {
    const upd = await clickupFetch(`/webhook/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!upd.ok) {
      const err = upd.json as { err?: string; ECODE?: string };
      return {
        ok: false,
        webhookId: existing.id,
        error: err.err || `ClickUp update webhook failed (${upd.status})`,
      };
    }
    return { ok: true, webhookId: existing.id, action: "updated" };
  }

  const created = await clickupFetch(`/team/${teamId}/webhook`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const parsed = created.json as {
    id?: string;
    webhook?: { id?: string };
    err?: string;
  };
  const webhookId = parsed.id || parsed.webhook?.id;
  if (!created.ok || !webhookId) {
    const msg = (parsed.err || "").toLowerCase();
    if (created.status === 409 || msg.includes("already") || msg.includes("duplicate")) {
      return { ok: true, action: "unchanged", error: parsed.err };
    }
    return {
      ok: false,
      error: parsed.err || `ClickUp create webhook failed (${created.status})`,
    };
  }
  return { ok: true, webhookId, action: "created" };
}
