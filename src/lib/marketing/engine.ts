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
  ensureClickUpWebhook,
  findTaskForWeek,
  getClickUpTask,
  isApprovedStatus,
  latestPublishableComment,
  markTaskPublished,
  payloadFromTask,
  PUBLISHED_MARKER,
  taskAlreadyPublished,
  usedSlugsThisWeek,
} from "@/lib/marketing/clickup";
import { publishViaZernio } from "@/lib/marketing/zernio";
import { overlayHumanEdits } from "@/lib/marketing/payload";
import { isoWeekKey, scrubCampaignAsset } from "@/lib/marketing/voice";
import { siteBaseUrl } from "@/lib/hubspot";

export async function runDraftCycle(
  brand: MarketingBrand,
  options: { dryRun?: boolean } = {},
): Promise<DraftCycleResult> {
  const weekKey = isoWeekKey();
  if (clickupConfigured() && !options.dryRun) {
    await ensureClickUpWebhook(`${siteBaseUrl()}/api/webhooks/clickup`);
  }
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
  const stored = payloadFromTask(task);
  if (!stored) {
    return {
      ok: false,
      taskId,
      skipped: "not_engine_task",
      error: "No TL_MKT_PAYLOAD block — ignoring non-engine task.",
    };
  }
  const prior = stored.zernioPostId || (await taskAlreadyPublished(taskId));
  if (stored.publishedAt || prior) {
    return {
      ok: true,
      taskId,
      skipped: "already_published",
      zernioPostId: prior || stored.zernioPostId,
    };
  }

  const markdown = [task.markdown_description, task.description, task.text_content]
    .filter(Boolean)
    .join("\n");
  const payload = overlayHumanEdits(markdown, stored);
  payload.asset = scrubCampaignAsset(payload.asset);

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
  const persisted = await markTaskPublished(task, next);
  const markerOk = await addClickUpComment(
    taskId,
    `${PUBLISHED_MARKER} ${posted.postId}\nPublished via Zernio on ${posted.platforms
      .map((p) => p.platform)
      .join(", ")}. Trigger: ${trigger}. Email was not sent.`,
  );
  if (!persisted && !markerOk) {
    return {
      ok: false,
      taskId,
      zernioPostId: posted.postId,
      error:
        "Zernio published but ClickUp could not record the marker — check the live post before retrying.",
    };
  }

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
  comment?: { text?: string; comment_text?: string; text_content?: string };
  history_items?: Array<{
    field?: string;
    comment?: { text?: string; comment_text?: string; text_content?: string };
    after?: { status?: string } | string;
  }>;
};

function webhookCommentText(event: ClickUpWebhookEvent): string {
  const blobs = [
    event.comment?.text_content,
    event.comment?.comment_text,
    event.comment?.text,
    ...(event.history_items || []).flatMap((i) => [
      i.comment?.text_content,
      i.comment?.comment_text,
      i.comment?.text,
      typeof i.after === "string" ? i.after : "",
    ]),
  ];
  return blobs.map((s) => (s || "").trim()).find(Boolean) || "";
}

export async function handleClickUpWebhook(
  event: ClickUpWebhookEvent,
): Promise<PublishResult | { ok: true; ignored: string }> {
  const taskId = event.task_id || event.taskId || event.task?.id;
  if (!taskId) {
    return { ok: true, ignored: "missing_task_id" };
  }

  const ev = (event.event || "").toLowerCase();

  if (ev.includes("comment")) {
    const incoming = webhookCommentText(event);
    if (incoming) {
      if (!commentRequestsPublish(incoming)) {
        return { ok: true, ignored: "comment_not_publish_command" };
      }
      return publishApprovedTask(taskId, "slash-command");
    }
    const recent = await latestPublishableComment(taskId);
    if (!commentRequestsPublish(recent)) {
      return { ok: true, ignored: "comment_not_publish_command" };
    }
    return publishApprovedTask(taskId, "slash-command");
  }

  if (ev.includes("status") || ev.includes("taskstatus")) {
    const items = event.history_items || [];
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
