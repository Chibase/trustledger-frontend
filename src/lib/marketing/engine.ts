import type {
  DraftCycleResult,
  MarketingBrand,
  MarketingPayload,
  PublishResult,
} from "@/lib/marketing/types";
import { loadContentForBrand, pickContentDoc } from "@/lib/marketing/content";
import { synthesizeCampaign } from "@/lib/marketing/gemini";
import {
  addClickUpComment,
  clickupConfigured,
  commentRequestsPublish,
  createReviewTask,
  findTaskForWeek,
  getClickUpTask,
  isApprovedStatus,
  listTaskComments,
  markTaskPublished,
  payloadFromTask,
  usedSlugsThisWeek,
} from "@/lib/marketing/clickup";
import { publishViaZernio } from "@/lib/marketing/zernio";
import { isoWeekKey } from "@/lib/marketing/voice";

export async function runDraftCycle(
  brand: MarketingBrand,
  options: { dryRun?: boolean } = {},
): Promise<DraftCycleResult> {
  const weekKey = isoWeekKey();
  const docs = loadContentForBrand(brand);
  if (docs.length === 0) {
    return {
      ok: false,
      dryRun: Boolean(options.dryRun),
      weekKey,
      error: `No markdown sources under content/${brand === "chibase" ? "chibase-papers" : "trustledger-campaigns"}`,
    };
  }

  let used = new Set<string>();
  if (clickupConfigured()) {
    used = await usedSlugsThisWeek(brand, weekKey);
    const existing = await findTaskForWeek(brand, weekKey);
    if (existing && !options.dryRun) {
      return {
        ok: true,
        dryRun: false,
        skipped: "already_staged_this_week",
        weekKey,
        clickupTaskId: existing.id,
        clickupTaskUrl: existing.url,
        synthesizer: "template",
      };
    }
  }

  const doc = pickContentDoc(docs, weekKey, used);
  if (!doc) {
    return {
      ok: false,
      dryRun: Boolean(options.dryRun),
      weekKey,
      error: "No content document available",
    };
  }

  const { asset, synthesizer, violations } = await synthesizeCampaign(doc);
  const payload: MarketingPayload = {
    v: 1,
    brand: doc.brand,
    kind: doc.kind,
    channel: doc.channel,
    sourceSlug: doc.slug,
    weekKey,
    asset,
  };

  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      weekKey,
      sourceSlug: doc.slug,
      synthesizer,
      asset,
    };
  }

  if (!clickupConfigured()) {
    return {
      ok: false,
      dryRun: false,
      weekKey,
      sourceSlug: doc.slug,
      synthesizer,
      asset,
      error:
        "CLICKUP_API_KEY / CLICKUP_LIST_ID missing — draft synthesized but not staged.",
    };
  }

  const created = await createReviewTask({
    payload,
    sourceTitle: doc.title,
    synthesizer,
  });
  if ("error" in created) {
    return {
      ok: false,
      dryRun: false,
      weekKey,
      sourceSlug: doc.slug,
      synthesizer,
      asset,
      error: created.error,
    };
  }

  if (violations.length) {
    await addClickUpComment(
      created.id,
      `Voice check: scrubbed vendor terms (${violations.join(", ")}). Re-read before approve.`,
    );
  }

  return {
    ok: true,
    dryRun: false,
    weekKey,
    sourceSlug: doc.slug,
    clickupTaskId: created.id,
    clickupTaskUrl: created.url,
    synthesizer,
    asset,
  };
}

export async function publishApprovedTask(
  taskId: string,
  trigger: "approved" | "slash-command",
): Promise<PublishResult> {
  const task = await getClickUpTask(taskId);
  if (!task) {
    return { ok: false, taskId, error: "ClickUp task not found" };
  }
  const payload = payloadFromTask(task);
  if (!payload) {
    return {
      ok: false,
      taskId,
      skipped: "not_engine_task",
      error: "No TL_MKT_PAYLOAD block — ignoring non-engine task.",
    };
  }
  if (payload.publishedAt) {
    return {
      ok: true,
      taskId,
      skipped: "already_published",
      zernioPostId: payload.zernioPostId,
    };
  }

  const posted = await publishViaZernio({
    brand: payload.brand,
    asset: payload.asset,
    publishNow: true,
  });

  if (posted.skipped) {
    await addClickUpComment(
      taskId,
      `Approval noted (${trigger}) but Zernio did not publish: ${posted.error}\nPaste the post body manually. Outreach DMs are never auto-sent.`,
    );
    return {
      ok: true,
      taskId,
      skipped: posted.skipped,
      error: posted.error,
    };
  }

  if (!posted.ok) {
    await addClickUpComment(
      taskId,
      `Publish failed (${trigger}): ${posted.error}`,
    );
    return { ok: false, taskId, error: posted.error };
  }

  const next: MarketingPayload = {
    ...payload,
    publishedAt: new Date().toISOString(),
    zernioPostId: posted.postId,
  };
  await markTaskPublished(task, next);
  await addClickUpComment(
    taskId,
    `Published via Zernio (\`${posted.postId}\`) on ${posted.platforms
      .map((p) => p.platform)
      .join(", ")}. Trigger: ${trigger}. Email was not sent.`,
  );

  return {
    ok: true,
    taskId,
    zernioPostId: posted.postId,
    platforms: posted.platforms.map((p) => p.platform),
  };
}

export type ClickUpWebhookEvent = {
  event?: string;
  task_id?: string;
  taskId?: string;
  task?: { id?: string };
  history_items?: Array<{
    field?: string;
    comment?: { text?: string; comment_text?: string };
    after?: { status?: string } | string;
  }>;
};

export async function handleClickUpWebhook(
  event: ClickUpWebhookEvent,
): Promise<PublishResult | { ok: true; ignored: string }> {
  const taskId = event.task_id || event.taskId || event.task?.id;
  if (!taskId) {
    return { ok: true, ignored: "missing_task_id" };
  }

  const ev = (event.event || "").toLowerCase();
  const items = event.history_items || [];

  if (ev.includes("comment")) {
    const text = items
      .map(
        (i) =>
          i.comment?.text ||
          i.comment?.comment_text ||
          (typeof i.after === "string" ? i.after : ""),
      )
      .join("\n");
    if (!commentRequestsPublish(text)) {
      const comments = await listTaskComments(taskId);
      if (!comments.some((c) => commentRequestsPublish(c))) {
        return { ok: true, ignored: "comment_not_publish_command" };
      }
    }
    return publishApprovedTask(taskId, "slash-command");
  }

  if (ev.includes("status") || ev.includes("taskstatus")) {
    const after = items
      .map((i) =>
        typeof i.after === "string" ? i.after : i.after?.status || "",
      )
      .join(" ");
    const task = await getClickUpTask(taskId);
    const status = after || task?.status?.status || "";
    if (!isApprovedStatus(status)) {
      return { ok: true, ignored: `status_${status || "unknown"}` };
    }
    return publishApprovedTask(taskId, "approved");
  }

  return { ok: true, ignored: ev || "unhandled_event" };
}
