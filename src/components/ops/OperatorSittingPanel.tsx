"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  OPERATOR_SITTING_DOCS,
  RECAPTCHA_SITTING_DOMAINS,
  VERCEL_SITTING_VALUES,
  type OperatorSittingSnapshot,
} from "@/lib/operatorSitting.constants";
import { TRUSTLEDGER_PRODUCT_URL } from "@/lib/security/hosts";

type HealthPayload = {
  launch?: {
    operatorSitting?: OperatorSittingSnapshot;
  };
  error?: string;
};

type Props = {
  initial: OperatorSittingSnapshot;
};

function smokeHref(path: string): string {
  if (path.startsWith("http")) return path;
  if (path.startsWith("/") && !path.includes(" ")) {
    return `${TRUSTLEDGER_PRODUCT_URL}${path}`;
  }
  return path;
}

const STATUS_CLASS: Record<"pass" | "sitting", string> = {
  pass: "border-tl-trust/40 bg-tl-trust/10 text-tl-trust-ink",
  sitting: "border-tl-amber/50 bg-tl-amber/10 text-tl-ink",
};

export function OperatorSittingPanel({ initial }: Props) {
  const { pushToast } = useToast();
  const [snapshot, setSnapshot] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/health", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const json = (await res.json()) as HealthPayload;
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      if (!json.launch?.operatorSitting) {
        throw new Error("Health did not include operator sitting.");
      }
      setSnapshot(json.launch.operatorSitting);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not read /api/health.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  const envItems = snapshot.items.filter((row) => row.lane === "env");
  const operatorItems = snapshot.items.filter((row) => row.lane === "operator");

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
      <h2 className="font-display text-lg font-semibold text-tl-ink">
        Operator sitting (not engineering)
      </h2>
      <p className="mt-1 text-sm text-tl-ink-muted">
        This deployment cannot set Vercel Production secrets, create Google
        reCAPTCHA keys, verify Resend domains, paste Webway CTAs, or configure
        Desk SMTP. Runbook{" "}
        <code className="font-mono text-xs text-tl-ink">{OPERATOR_SITTING_DOCS}</code>
        . Env lane can go green from health. Operator lane stays sitting until
        a human with those logins finishes it.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          className="rounded-md border border-tl-line px-3 py-1.5 text-xs font-semibold text-tl-ink hover:bg-tl-paper disabled:opacity-60"
        >
          {busy ? "Reading health…" : "Refresh from /api/health"}
        </button>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
            snapshot.envClear
              ? "border-tl-trust/40 bg-tl-trust/10 text-tl-trust-ink"
              : "border-tl-amber/50 bg-tl-amber/10 text-tl-ink"
          }`}
        >
          {snapshot.envClear
            ? "Env lane clear on this deploy"
            : `${snapshot.remainingEnv.length} env sitting`}
        </span>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-tl-danger">{error}</p>
      ) : null}

      <h3 className="mt-5 font-display text-sm font-semibold text-tl-ink">
        This deploy (env)
      </h3>
      <ul className="mt-2 divide-y divide-tl-line rounded-md border border-tl-line">
        {envItems.map((row) => (
          <li key={row.id} className="space-y-2 px-3 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-tl-ink">{row.label}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[row.status]}`}
              >
                {row.status}
              </span>
            </div>
            <p className="text-sm text-tl-ink-muted">{row.detail}</p>
            {row.vercelValue ? (
              <pre className="overflow-x-auto rounded-md bg-tl-paper px-3 py-2 font-mono text-xs text-tl-ink">
                {row.vercelValue}
              </pre>
            ) : null}
            <p className="text-xs text-tl-ink-muted">{row.docs}</p>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 font-display text-sm font-semibold text-tl-ink">
        Vercel Production (copy, no secrets)
      </h3>
      <p className="mt-1 text-xs text-tl-ink-muted">
        reCAPTCHA domains: {RECAPTCHA_SITTING_DOMAINS.join(", ")}. After env
        edits, Redeploy. Never paste API keys here.
      </p>
      <pre className="mt-2 overflow-x-auto rounded-md bg-tl-paper px-3 py-2 font-mono text-xs text-tl-ink">
        {`${VERCEL_SITTING_VALUES.recaptchaSite}
${VERCEL_SITTING_VALUES.recaptchaSecret}
${VERCEL_SITTING_VALUES.recaptchaRequire}
${VERCEL_SITTING_VALUES.recaptchaScore}
# delete ACCESS_EMAIL_VERIFICATION=0, or:
${VERCEL_SITTING_VALUES.accessVerifyOn}
${VERCEL_SITTING_VALUES.resendFrom}`}
      </pre>

      <h3 className="mt-5 font-display text-sm font-semibold text-tl-ink">
        Still a human (operator)
      </h3>
      <ul className="mt-2 divide-y divide-tl-line rounded-md border border-tl-line">
        {operatorItems.map((row) => (
          <li key={row.id} className="space-y-2 px-3 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-tl-ink">{row.label}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS.sitting}`}
              >
                sitting
              </span>
            </div>
            <p className="text-sm text-tl-ink-muted">{row.detail}</p>
            <p className="text-xs text-tl-ink-muted">{row.docs}</p>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 font-display text-sm font-semibold text-tl-ink">
        Production click-smoke URLs
      </h3>
      <ul className="mt-2 divide-y divide-tl-line rounded-md border border-tl-line text-sm">
        {snapshot.smokeForms.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2"
          >
            <span>{row.label}</span>
            <code className="font-mono text-xs text-tl-ink-muted">
              {smokeHref(row.path)}
            </code>
          </li>
        ))}
      </ul>
    </section>
  );
}
