import { createHmac, timingSafeEqual } from "node:crypto";
import {
  clickupApiKey,
  clickupListId,
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

export async function listTaskComments(taskId: string): Promise<string[]> {
  const { ok, json } = await clickupFetch(`/task/${taskId}/comment`);
  if (!ok) return [];
  const comments = (json as { comments?: Array<{ comment_text?: string; text_content?: string }> })
    .comments;
  if (!Array.isArray(comments)) return [];
  return comments.map((c) => c.comment_text || c.text_content || "").filter(Boolean);
}

export async function addClickUpComment(taskId: string, text: string): Promise<void> {
  await clickupFetch(`/task/${taskId}/comment`, {
    method: "POST",
    body: JSON.stringify({ comment_text: text }),
  });
}

export async function updateClickUpTask(
  taskId: string,
  patch: { status?: string; markdown_description?: string },
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (patch.markdown_description) {
    body.markdown_description = patch.markdown_description;
  }
  if (patch.status) {
    const resolved = await resolveStatus([patch.status, patch.status.toLowerCase()]);
    if (resolved) body.status = resolved;
  }
  if (Object.keys(body).length === 0) return;
  await clickupFetch(`/task/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function markTaskPublished(
  task: ClickUpTask,
  payload: MarketingPayload,
): Promise<void> {
  const markdown = encodeTaskMarkdown({
    payload,
    sourceTitle: payload.asset.headline,
    synthesizer: "published",
  });
  await updateClickUpTask(task.id, {
    status: "published",
    markdown_description: markdown,
  });
  // Default lists only have "complete" as a closed type.
  await updateClickUpTask(task.id, { status: "complete" });
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
