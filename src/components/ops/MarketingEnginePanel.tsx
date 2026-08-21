"use client";

import { useCallback, useState, startTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import type {
  MarketingBriefInput,
  MarketingDeskAction,
  MarketingDeskActionResult,
  MarketingDeskBrand,
  MarketingDeskSnapshot,
  MarketingDeskTask,
  MarketingLengthId,
  MarketingPlacementId,
} from "@/lib/marketing/desk.types";
import {
  MARKETING_LENGTHS,
  MARKETING_PLACEMENTS,
} from "@/lib/marketing/desk.types";

const FLAG_LABELS: Array<{
  key: keyof MarketingDeskSnapshot["status"];
  label: string;
}> = [
  { key: "gemini", label: "Gemini" },
  { key: "zernio", label: "Zernio" },
  { key: "zernioAccounts", label: "Social accounts" },
  { key: "clickup", label: "ClickUp" },
  { key: "webhookSecret", label: "Webhook HMAC" },
];

type ComposePreview = {
  headline: string;
  body: string;
  firstComment?: string;
  synthesizer?: string;
};

type Props = {
  initial: MarketingDeskSnapshot;
};

const FIELD =
  "mt-1 w-full rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink";

export function MarketingEnginePanel({ initial }: Props) {
  const { pushToast } = useToast();
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [speaker, setSpeaker] = useState<MarketingDeskBrand>("trustledger");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [placement, setPlacement] =
    useState<MarketingPlacementId>("linkedin-post");
  const [length, setLength] = useState<MarketingLengthId>("standard");
  const [sourceSlug, setSourceSlug] = useState("");
  const [preview, setPreview] = useState<ComposePreview | null>(null);
  const [lane, setLane] = useState<"inbox" | "archive">("inbox");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/ops/marketing", {
      cache: "no-store",
      credentials: "include",
    });
    const json = (await res.json()) as MarketingDeskSnapshot & { error?: string };
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
    startTransition(() => {
      setData(json);
    });
    return json;
  }, []);

  async function runAction(
    action: MarketingDeskAction,
    options: {
      dryRun?: boolean;
      taskId?: string;
      label: string;
      brief?: MarketingBriefInput;
    },
  ) {
    setBusy(options.label);
    setResult("");
    try {
      const res = await fetch("/api/ops/marketing", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          action,
          dryRun: options.dryRun === true,
          taskId: options.taskId,
          brief: options.brief,
        }),
      });
      const json = (await res.json()) as MarketingDeskActionResult & {
        error?: string;
      };
      setResult(JSON.stringify(json, null, 2));
      if (!res.ok || !json.ok) {
        pushToast(json.error || json.message || "Action failed", "error");
        return;
      }
      pushToast(json.message || "Done", "success");
      const asset = (
        json.result as { asset?: ComposePreview; synthesizer?: string } | undefined
      )?.asset;
      if (action === "compose" && asset?.body) {
        setPreview({
          headline: asset.headline,
          body: asset.body,
          firstComment: asset.firstComment,
          synthesizer: (json.result as { synthesizer?: string }).synthesizer,
        });
      }
      if (!options.dryRun) {
        await refresh();
      }
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusy(null);
    }
  }

  async function onRefresh() {
    setBusy("refresh");
    try {
      await refresh();
      pushToast("Queue refreshed", "success");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Could not refresh",
        "error",
      );
    } finally {
      setBusy(null);
    }
  }

  function onPublish(task: MarketingDeskTask) {
    const label = task.headline || task.name;
    const paste = task.publishMode === "paste";
    const ok = window.confirm(
      paste
        ? `Mark “${label}” paste-ready?\n\nThis format is not auto-posted. Copy the body into LinkedIn / Reddit / ESG / the website after you edit.`
        : `Publish “${label}” to connected social accounts?\n\nThis is the human apply step. It does not send email. Default Complete in ClickUp is not a publish signal.`,
    );
    if (!ok) return;
    void runAction("publish", { taskId: task.id, label: `publish-${task.id}` });
  }

  function briefPayload(): MarketingBriefInput | null {
    const t = topic.trim();
    if (t.length < 8) {
      pushToast("Add a topic (at least 8 characters).", "error");
      return null;
    }
    return {
      brand: speaker,
      topic: t,
      notes: notes.trim() || undefined,
      placement,
      length,
      sourceSlug: sourceSlug || undefined,
    };
  }

  function onCompose(dryRun: boolean) {
    const brief = briefPayload();
    if (!brief) return;
    void runAction("compose", {
      dryRun,
      brief,
      label: dryRun ? "compose-preview" : "compose-stage",
    });
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      pushToast("Copied", "success");
    } catch {
      pushToast("Could not copy", "error");
    }
  }

  function onArchive(task: MarketingDeskTask) {
    const label = task.headline || task.name;
    const ok = window.confirm(
      `Archive “${label}”?\n\nIt leaves the review inbox. This does not publish and does not send email.`,
    );
    if (!ok) return;
    void runAction("archive", { taskId: task.id, label: `archive-${task.id}` });
  }

  const flags = data.status;
  const inbox = data.inbox || [];
  const archive = data.archive || [];
  const disabled = Boolean(busy);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Marketing content
            </h2>
            <p className="mt-1 text-sm text-tl-ink-muted">
              Only drafts that still need your review and publish sit in{" "}
              <strong>To review</strong>. After you publish, paste, or skip,
              archive them. This space is not the customer dashboard and never
              sends bulk email.
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => void onRefresh()}
            className="text-xs font-medium text-tl-trust-ink underline disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <LaneButton
            active={lane === "inbox"}
            onClick={() => setLane("inbox")}
            label={`To review (${inbox.length})`}
          />
          <LaneButton
            active={lane === "archive"}
            onClick={() => setLane("archive")}
            label={`Archive (${archive.length})`}
          />
        </div>
        <ContentTable
          lane={lane}
          rows={lane === "inbox" ? inbox : archive}
          openId={openId}
          setOpenId={setOpenId}
          disabled={disabled}
          onPublish={onPublish}
          onArchive={onArchive}
          onCopy={(text) => void copyText(text)}
        />
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Engine status</h2>
          <p className="text-xs text-tl-ink-muted">
            Week {data.weekKey}
            {data.generatedAt
              ? ` · ${new Date(data.generatedAt).toLocaleString()}`
              : ""}
          </p>
        </div>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Drafts stage here for review. Humans edit, then publish. Cron never
          auto-posts. Bulk email stays on the Frappe Newsletter path — not this
          list.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {FLAG_LABELS.map((flag) => {
            const on = Boolean(flags[flag.key]);
            return (
              <li
                key={flag.key}
                className={`rounded-sm px-2 py-1 text-xs font-medium ${
                  on
                    ? "bg-tl-trust/10 text-tl-trust-ink"
                    : "bg-tl-amber/10 text-tl-amber"
                }`}
              >
                {flag.label}: {on ? "ready" : "missing"}
              </li>
            );
          })}
        </ul>
        {!flags.webhookSecretDedicated ? (
          <p className="mt-2 text-xs text-tl-ink-muted">
            HMAC is using the cron secret as fallback. A dedicated webhook
            secret is optional.
          </p>
        ) : null}
        {data.error ? (
          <p className="mt-3 rounded-md border border-tl-amber/40 bg-tl-amber/10 px-3 py-2 text-sm">
            {data.error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a
            href={data.links.list}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-tl-trust-ink underline"
          >
            Open Marketing Review
          </a>
          <a
            href={data.links.setupTask}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-tl-trust-ink underline"
          >
            Setup card
          </a>
        </div>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
        <h2 className="font-display text-lg font-semibold">Compose a brief</h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Suggest a topic, length, and destination. Preview first, then stage
          for review. LinkedIn feed posts can publish after you apply; articles,
          comments, ESG, Reddit (unless connected), and website blogs stay
          paste-ready. Nothing auto-posts from this form.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Speaker
            <select
              className={FIELD}
              value={speaker}
              onChange={(e) => {
                const next = e.target.value as MarketingDeskBrand;
                setSpeaker(next);
                setSourceSlug("");
              }}
            >
              <option value="trustledger">TrustLedger</option>
              <option value="chibase">Chibase Consulting</option>
            </select>
          </label>
          <label className="text-sm">
            Destination
            <select
              className={FIELD}
              value={placement}
              onChange={(e) => {
                const next = e.target.value as MarketingPlacementId;
                setPlacement(next);
                const meta = MARKETING_PLACEMENTS.find((p) => p.id === next);
                if (meta) setLength(meta.defaultLength);
              }}
            >
              {MARKETING_PLACEMENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Length
            <select
              className={FIELD}
              value={length}
              onChange={(e) => setLength(e.target.value as MarketingLengthId)}
            >
              {MARKETING_LENGTHS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Ground in source pack (optional)
            <select
              className={FIELD}
              value={sourceSlug}
              onChange={(e) => setSourceSlug(e.target.value)}
            >
              <option value="">None — topic only</option>
              {(data.sources || [])
                .filter((s) => s.brand === speaker)
                .map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.title}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-tl-ink-muted">
          {MARKETING_PLACEMENTS.find((p) => p.id === placement)?.hint}
        </p>
        <label className="mt-3 block text-sm">
          Topic
          <input
            className={FIELD}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Why grievance trails beat attendance registers"
            maxLength={240}
          />
        </label>
        <label className="mt-3 block text-sm">
          Notes / angle (optional)
          <textarea
            className={`${FIELD} min-h-[5.5rem]`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Facts you have the right to use. Do not invent paper findings."
            maxLength={6000}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton
            disabled={disabled}
            onClick={() => onCompose(true)}
          >
            Preview draft
          </ActionButton>
          <ActionButton
            disabled={disabled}
            tone="attention"
            onClick={() => onCompose(false)}
          >
            Stage to review
          </ActionButton>
        </div>
        {preview ? (
          <div className="mt-4 rounded-md border border-tl-line bg-tl-paper/60 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">{preview.headline}</h3>
              <button
                type="button"
                className="text-xs font-medium text-tl-trust-ink underline"
                onClick={() =>
                  void copyText(
                    `${preview.headline}\n\n${preview.body}${
                      preview.firstComment
                        ? `\n\n${preview.firstComment}`
                        : ""
                    }`,
                  )
                }
              >
                Copy markdown
              </button>
            </div>
            {preview.synthesizer ? (
              <p className="mt-1 text-[11px] uppercase tracking-wide text-tl-ink-muted">
                {preview.synthesizer}
              </p>
            ) : null}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-tl-ink">
              {preview.body}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
        <h2 className="font-display text-lg font-semibold">Stage this week</h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Sources: {data.content.chibase} Chibase papers ·{" "}
          {data.content.trustledger} TrustLedger campaigns. Dry-run synthesizes
          without writing ClickUp. Live stage is idempotent per brand per week.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton
            disabled={disabled}
            onClick={() =>
              void runAction("setup", { dryRun: true, label: "setup-dry" })
            }
          >
            Dry-run both brands
          </ActionButton>
          <ActionButton
            disabled={disabled}
            tone="attention"
            onClick={() => void runAction("setup", { label: "setup-live" })}
          >
            Stage both + register webhook
          </ActionButton>
          <ActionButton
            disabled={disabled}
            onClick={() =>
              void runAction("stage-chibase", { label: "stage-chibase" })
            }
          >
            Stage Chibase
          </ActionButton>
          <ActionButton
            disabled={disabled}
            onClick={() =>
              void runAction("stage-trustledger", { label: "stage-trustledger" })
            }
          >
            Stage TrustLedger
          </ActionButton>
          <ActionButton
            disabled={disabled}
            onClick={() =>
              void runAction("register-webhook", { label: "webhook" })
            }
          >
            Register webhook
          </ActionButton>
        </div>
        <ul className="mt-4 space-y-1 text-sm text-tl-ink-muted">
          {data.crons.map((cron) => (
            <li key={cron.path}>
              <span className="font-medium text-tl-ink">{cron.label}</span>
              {" · "}
              {cron.sast} SAST
              <span className="font-mono text-[11px]"> ({cron.path})</span>
            </li>
          ))}
        </ul>
      </section>

      {busy ? (
        <p className="text-xs text-tl-ink-muted">Working: {busy}…</p>
      ) : null}
      {result ? (
        <pre className="max-h-64 overflow-auto rounded-md border border-tl-line bg-tl-paper/50 p-3 font-mono text-[11px] text-tl-ink">
          {result}
        </pre>
      ) : null}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "attention";
}) {
  const cls =
    tone === "attention"
      ? "rounded-md border border-tl-amber/50 bg-tl-amber/10 px-3 py-2 text-sm font-medium hover:bg-tl-amber/20 disabled:opacity-50"
      : "rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50";
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function LaneButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        active
          ? "bg-tl-trust text-white"
          : "border border-tl-line bg-tl-paper text-tl-ink hover:border-tl-trust/40"
      }`}
    >
      {label}
    </button>
  );
}

function ContentTable({
  lane,
  rows,
  openId,
  setOpenId,
  disabled,
  onPublish,
  onArchive,
  onCopy,
}: {
  lane: "inbox" | "archive";
  rows: MarketingDeskTask[];
  openId: string | null;
  setOpenId: (updater: string | null | ((id: string | null) => string | null)) => void;
  disabled: boolean;
  onPublish: (task: MarketingDeskTask) => void;
  onArchive: (task: MarketingDeskTask) => void;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[48rem] text-left text-sm">
        <thead className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
          <tr>
            <th className="py-2 pr-3 font-medium">Week</th>
            <th className="py-2 pr-3 font-medium">Speaker</th>
            <th className="py-2 pr-3 font-medium">Where</th>
            <th className="py-2 pr-3 font-medium">Draft</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-tl-line">
          {rows.map((task) => (
            <tr key={task.id}>
              <td className="py-2.5 pr-3 text-xs text-tl-ink-muted">
                {task.weekKey || "—"}
                {task.thisWeek ? (
                  <span className="ml-1 text-tl-trust-ink">now</span>
                ) : null}
              </td>
              <td className="py-2.5 pr-3">
                {task.brand === "chibase"
                  ? "Chibase"
                  : task.brand === "trustledger"
                    ? "TrustLedger"
                    : "—"}
              </td>
              <td className="py-2.5 pr-3 text-xs text-tl-ink-muted">
                {MARKETING_PLACEMENTS.find((p) => p.id === task.placement)
                  ?.label || (task.publishMode === "zernio" ? "LinkedIn post" : "—")}
              </td>
              <td className="py-2.5 pr-3">
                <p className="font-medium">{task.headline || task.name}</p>
                {task.headline ? (
                  <p className="text-xs text-tl-ink-muted">{task.name}</p>
                ) : null}
                {task.bodyPreview ? (
                  <button
                    type="button"
                    className="mt-1 text-left text-xs text-tl-trust-ink underline"
                    onClick={() =>
                      setOpenId((id) => (id === task.id ? null : task.id))
                    }
                  >
                    {openId === task.id ? "Hide preview" : "Preview copy"}
                  </button>
                ) : null}
                {openId === task.id && (task.body || task.bodyPreview) ? (
                  <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-tl-ink-muted">
                    {task.body || task.bodyPreview}
                  </p>
                ) : null}
              </td>
              <td className="py-2.5 pr-3">
                <span className="rounded-sm bg-tl-paper px-1.5 py-0.5 text-xs font-medium">
                  {task.archived
                    ? "Archived"
                    : task.published
                      ? "Published"
                      : task.pasteReady
                        ? "Paste-ready"
                        : task.status}
                </span>
              </td>
              <td className="py-2.5">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={task.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-tl-trust-ink underline"
                  >
                    Open
                  </a>
                  {lane === "inbox" &&
                  task.engineTask &&
                  !task.published &&
                  !task.pasteReady ? (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onPublish(task)}
                      className="text-xs font-medium text-tl-amber underline disabled:opacity-50"
                    >
                      {task.publishMode === "paste"
                        ? "Mark paste-ready"
                        : "Publish"}
                    </button>
                  ) : null}
                  {task.body ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-tl-trust-ink underline"
                      onClick={() =>
                        onCopy(
                          [task.headline, task.body, task.firstComment]
                            .filter(Boolean)
                            .join("\n\n"),
                        )
                      }
                    >
                      Copy
                    </button>
                  ) : null}
                  {lane === "inbox" ? (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onArchive(task)}
                      className="text-xs font-medium text-tl-ink-muted underline disabled:opacity-50"
                    >
                      Archive
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={6} className="py-6 text-tl-ink-muted">
                {lane === "inbox"
                  ? "Nothing waiting. Compose a brief or stage this week’s drafts — they appear here until you publish or archive."
                  : "Archive is empty. Published and skipped drafts land here."}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
