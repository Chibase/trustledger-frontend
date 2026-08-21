import { siteBaseUrl } from "@/lib/hubspot";
import {
  clickupConfigured,
  ensureClickUpWebhook,
  getClickUpTask,
  listClickUpTasks,
  payloadFromTask,
  PUBLISHED_MARKER,
  taskAlreadyPublished,
  type ClickUpTask,
} from "@/lib/marketing/clickup";
import {
  clickupListUrl,
  clickupSetupTaskUrl,
  clickupTaskUrl,
  marketingEngineStatus,
} from "@/lib/marketing/config";
import { loadContentForBrand } from "@/lib/marketing/content";
import { publishApprovedTask, runDraftCycle } from "@/lib/marketing/engine";
import type {
  MarketingDeskAction,
  MarketingDeskActionResult,
  MarketingDeskSnapshot,
  MarketingDeskTask,
} from "@/lib/marketing/desk.types";
import { isoWeekKey } from "@/lib/marketing/voice";

const DESK_TASK_LIMIT = 20;

export const MARKETING_DESK_CRONS: MarketingDeskSnapshot["crons"] = [
  {
    brand: "chibase",
    label: "Chibase thought-leadership",
    scheduleUtc: "0 5 * * 1",
    sast: "Mon 07:00",
    path: "/api/cron/run-chibase-campaign",
  },
  {
    brand: "trustledger",
    label: "TrustLedger trial / product",
    scheduleUtc: "0 5 * * 3",
    sast: "Wed 07:00",
    path: "/api/cron/run-trustledger-outreach",
  },
];

function brandFromTaskName(name: string): MarketingDeskTask["brand"] {
  if (name.includes("[Chibase]")) return "chibase";
  if (name.includes("[TrustLedger]")) return "trustledger";
  return null;
}

function weekKeyFromTaskName(name: string): string | null {
  const m = name.match(/—\s+(\d{4}-W\d{2})\s*$/);
  return m?.[1] || null;
}

function toDeskTask(
  task: ClickUpTask,
  weekKey: string,
): MarketingDeskTask {
  const payload = payloadFromTask(task);
  const status = (task.status?.status || "").trim();
  const published = Boolean(
    payload?.publishedAt ||
      payload?.zernioPostId ||
      (task.markdown_description || task.description || "").includes(
        PUBLISHED_MARKER,
      ),
  );
  const body = payload?.asset.body?.trim() || "";
  return {
    id: task.id,
    name: task.name,
    status: status || "—",
    url: task.url || clickupTaskUrl(task.id),
    brand: payload?.brand || brandFromTaskName(task.name),
    weekKey: payload?.weekKey || weekKeyFromTaskName(task.name),
    thisWeek:
      (payload?.weekKey || weekKeyFromTaskName(task.name) || "") === weekKey,
    headline: payload?.asset.headline || null,
    bodyPreview: body ? body.slice(0, 280) : null,
    published,
    engineTask: Boolean(payload),
  };
}

function taskRecencyMs(task: ClickUpTask): number {
  return Number(task.date_updated || task.date_created || 0) || 0;
}

export async function buildMarketingDesk(): Promise<MarketingDeskSnapshot> {
  const weekKey = isoWeekKey();
  const status = marketingEngineStatus();
  const snapshot: MarketingDeskSnapshot = {
    ok: true,
    generatedAt: new Date().toISOString(),
    weekKey,
    status,
    links: {
      list: clickupListUrl(),
      setupTask: clickupSetupTaskUrl(),
    },
    crons: MARKETING_DESK_CRONS,
    content: {
      chibase: loadContentForBrand("chibase").length,
      trustledger: loadContentForBrand("trustledger").length,
    },
    tasks: [],
  };

  if (!clickupConfigured()) {
    snapshot.ok = false;
    snapshot.error =
      "ClickUp is not configured — set CLICKUP_API_KEY (list id defaults to Marketing Review).";
    return snapshot;
  }

  try {
    const listed = await listClickUpTasks();
    listed.sort((a, b) => taskRecencyMs(b) - taskRecencyMs(a));
    const sliced = listed.slice(0, DESK_TASK_LIMIT);
    const hydrated = await Promise.all(
      sliced.map(async (task) => {
        if (payloadFromTask(task) || !brandFromTaskName(task.name)) return task;
        return (await getClickUpTask(task.id)) || task;
      }),
    );
    snapshot.tasks = hydrated.map((t) => toDeskTask(t, weekKey));
  } catch (err) {
    snapshot.ok = false;
    snapshot.error =
      err instanceof Error ? err.message : "Could not load Marketing Review tasks.";
  }

  return snapshot;
}

export async function runMarketingDeskAction(input: {
  action: MarketingDeskAction;
  dryRun?: boolean;
  taskId?: string;
}): Promise<MarketingDeskActionResult> {
  const { action, dryRun = false, taskId } = input;

  if (action === "register-webhook") {
    const endpoint = `${siteBaseUrl()}/api/webhooks/clickup`;
    const webhook = await ensureClickUpWebhook(endpoint);
    return {
      ok: webhook.ok,
      action,
      message: webhook.ok
        ? `Webhook ${webhook.action || "ready"}`
        : webhook.error,
      error: webhook.ok ? undefined : webhook.error,
      result: { endpoint, webhook },
    };
  }

  if (action === "setup") {
    const endpoint = `${siteBaseUrl()}/api/webhooks/clickup`;
    const webhook = dryRun
      ? { ok: true as const, action: "unchanged" as const }
      : await ensureClickUpWebhook(endpoint);
    const chibase = await runDraftCycle("chibase", { dryRun });
    const trustledger = await runDraftCycle("trustledger", { dryRun });
    const ok = webhook.ok && chibase.ok && trustledger.ok;
    return {
      ok,
      action,
      message: dryRun
        ? "Dry-run complete — no ClickUp writes."
        : ok
          ? "Webhook checked and this week’s drafts staged."
          : "Setup finished with errors — see result.",
      error: ok
        ? undefined
        : webhook.error || chibase.error || trustledger.error,
      result: { endpoint, webhook, chibase, trustledger },
    };
  }

  if (action === "stage-chibase" || action === "stage-trustledger") {
    const brand = action === "stage-chibase" ? "chibase" : "trustledger";
    const result = await runDraftCycle(brand, { dryRun });
    return {
      ok: result.ok,
      action,
      message: result.skipped
        ? `Already staged this week (${result.weekKey}).`
        : dryRun
          ? `Dry-run synthesized ${result.sourceSlug || brand}.`
          : result.ok
            ? `Staged ${result.sourceSlug || brand} for ${result.weekKey}.`
            : result.error,
      error: result.ok ? undefined : result.error,
      result,
    };
  }

  if (action === "publish") {
    const id = (taskId || "").trim();
    if (!id) {
      return { ok: false, action, error: "taskId is required to publish." };
    }
    const task = await getClickUpTask(id);
    if (!task) {
      return { ok: false, action, error: "ClickUp task not found." };
    }
    const payload = payloadFromTask(task);
    if (!payload) {
      return {
        ok: false,
        action,
        error: "Not an engine task (no TL_MKT_PAYLOAD block).",
      };
    }
    const prior = payload.zernioPostId || (await taskAlreadyPublished(id));
    if (payload.publishedAt || prior) {
      return {
        ok: true,
        action,
        message: "Already published — skipped.",
        result: { skipped: "already_published", zernioPostId: prior },
      };
    }
    const published = await publishApprovedTask(id, "ops-desk");
    return {
      ok: published.ok,
      action,
      message: published.ok
        ? published.skipped
          ? `Publish skipped: ${published.skipped}`
          : `Published${published.platforms?.length ? ` to ${published.platforms.join(", ")}` : ""}.`
        : published.error,
      error: published.ok ? undefined : published.error,
      result: published,
    };
  }

  return { ok: false, action, error: "Unknown action" };
}
