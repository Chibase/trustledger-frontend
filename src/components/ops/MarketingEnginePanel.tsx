"use client";

import { useCallback, useState, startTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import type {
  MarketingDeskAction,
  MarketingDeskActionResult,
  MarketingDeskSnapshot,
  MarketingDeskTask,
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

type Props = {
  initial: MarketingDeskSnapshot;
};

export function MarketingEnginePanel({ initial }: Props) {
  const { pushToast } = useToast();
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

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
    options: { dryRun?: boolean; taskId?: string; label: string },
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
    const ok = window.confirm(
      `Publish “${label}” to connected social accounts?\n\nThis is the human apply step. It does not send email. Default Complete in ClickUp is not a publish signal.`,
    );
    if (!ok) return;
    void runAction("publish", { taskId: task.id, label: `publish-${task.id}` });
  }

  const flags = data.status;
  const thisWeek = data.tasks.filter((t) => t.thisWeek);
  const disabled = Boolean(busy);

  return (
    <div className="space-y-6">
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

      <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Marketing Review queue
            </h2>
            <p className="mt-1 text-sm text-tl-ink-muted">
              {thisWeek.length} this week · {data.tasks.length} shown. Publish
              from here is the same human gate as{" "}
              <code className="font-mono text-[11px]">/tl-publish</code> — never
              treat ClickUp Complete as publish.
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => void onRefresh()}
            className="text-xs font-medium text-tl-trust-ink underline disabled:opacity-50"
          >
            Refresh queue
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Week</th>
                <th className="py-2 pr-3 font-medium">Speaker</th>
                <th className="py-2 pr-3 font-medium">Draft</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tl-line">
              {data.tasks.map((task) => (
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
                    {openId === task.id && task.bodyPreview ? (
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-tl-ink-muted">
                        {task.bodyPreview}
                        {task.bodyPreview.length >= 280 ? "…" : ""}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="rounded-sm bg-tl-paper px-1.5 py-0.5 text-xs font-medium">
                      {task.published ? "Published" : task.status}
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
                      {task.engineTask && !task.published ? (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onPublish(task)}
                          className="text-xs font-medium text-tl-amber underline disabled:opacity-50"
                        >
                          Publish
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!data.tasks.length ? (
                <tr>
                  <td colSpan={5} className="py-6 text-tl-ink-muted">
                    No Marketing Review tasks yet. Stage this week to create
                    drafts.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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
