"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { TenancySmokeResult } from "@/lib/tenancySmoke";

/**
 * SEC-1 — Ops check that Plan Owners are bound to their organisation
 * and not to a peer organisation.
 */
export function TenancySmokePanel() {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState<"check" | "apply" | null>(null);
  const [smoke, setSmoke] = useState<TenancySmokeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(applyMissing: boolean) {
    setBusy(applyMissing ? "apply" : "check");
    setError(null);
    try {
      const res = await fetch("/api/ops/tenancy-smoke", {
        method: applyMissing ? "POST" : "GET",
        credentials: "include",
        headers: applyMissing
          ? { "Content-Type": "application/json", Accept: "application/json" }
          : { Accept: "application/json" },
        body: applyMissing ? JSON.stringify({ applyMissing: true }) : undefined,
        cache: "no-store",
      });
      const json = (await res.json()) as {
        error?: string;
        smoke?: TenancySmokeResult;
      };
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      if (!json.smoke) {
        throw new Error("No smoke result");
      }
      setSmoke(json.smoke);
      pushToast(
        json.smoke.ok
          ? "Organisation permissions look bound."
          : json.smoke.detail,
        json.smoke.ok ? "success" : "error",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Tenancy smoke failed.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
      <h2 className="font-display text-lg font-semibold text-tl-ink">
        Organisation permission smoke (SEC-1)
      </h2>
      <p className="mt-1 text-sm text-tl-ink-muted">
        Confirms Plan Owner Cloud Users are bound to their own organisation and
        not a peer organisation. Invitee Cloud seats are provisioned on accept
        (SEC-5), not by this smoke.
        See{" "}
        <code className="font-mono text-xs text-tl-ink">
          docs/FRAPPE_USER_PERMISSIONS.md
        </code>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void run(false)}
          className="rounded-md border border-tl-line px-3 py-1.5 text-xs font-semibold text-tl-ink hover:bg-tl-paper disabled:opacity-60"
        >
          {busy === "check" ? "Checking…" : "Check bindings"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void run(true)}
          className="rounded-md bg-tl-trust px-3 py-1.5 text-xs font-semibold text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {busy === "apply" ? "Applying…" : "Stamp missing permissions"}
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-tl-danger">{error}</p>
      ) : null}
      {smoke ? (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3 rounded-md border border-tl-line px-3 py-2">
            <dt className="text-tl-ink-muted">Result</dt>
            <dd className={smoke.ok ? "font-semibold text-tl-trust-ink" : "font-semibold text-tl-danger"}>
              {smoke.ok ? "pass" : "fail"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-md border border-tl-line px-3 py-2">
            <dt className="text-tl-ink-muted">Owners bound</dt>
            <dd className="font-mono text-xs">
              {smoke.bound}/{smoke.ownersChecked}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-md border border-tl-line px-3 py-2">
            <dt className="text-tl-ink-muted">A≠B peers</dt>
            <dd>{smoke.peerCustomers ? "yes" : "need second org"}</dd>
          </div>
          <div className="flex justify-between gap-3 rounded-md border border-tl-line px-3 py-2">
            <dt className="text-tl-ink-muted">Permission API</dt>
            <dd>{smoke.userPermissionApi ? "reachable" : "down"}</dd>
          </div>
          {smoke.unbound.length ? (
            <div className="sm:col-span-2 rounded-md border border-tl-amber/40 bg-tl-amber/10 px-3 py-2 text-xs text-tl-ink">
              Unbound: {smoke.unbound.join(", ")}
            </div>
          ) : null}
          {smoke.foreignBinds.length ? (
            <div className="sm:col-span-2 rounded-md border border-tl-danger/40 bg-tl-danger/10 px-3 py-2 text-xs text-tl-danger">
              Peer binds: {smoke.foreignBinds.join("; ")}
            </div>
          ) : null}
          <p className="sm:col-span-2 text-xs text-tl-ink-muted">{smoke.detail}</p>
        </dl>
      ) : null}
    </section>
  );
}
