"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { API_BASE_URL, FRAPPE_METHODS } from "@/config/api";
import { parseLedgerChain, parsePublicKey } from "@/lib/ledger/parseChain";
import type { LedgerEntry, LedgerJson, VerifyStatus } from "@/lib/ledger/types";
import { verifyLedgerEntry } from "@/lib/ledger/verifyEntry";

export type AuditTrailViewerProps = {
  entityType: string;
  entityId: string;
  apiBaseUrl?: string;
  /** Storybook / tests: skip network. */
  initialEntries?: LedgerEntry[];
  initialPublicKey?: string | null;
};

function resolveBase(apiBaseUrl?: string): string {
  const raw =
    apiBaseUrl ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    API_BASE_URL;
  return raw.replace(/\/$/, "");
}

function shortHash(value: string | null | undefined): string {
  if (!value) return "∅ genesis";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function evidenceFields(entity: LedgerJson | undefined): {
  checksum?: string;
  gps_lat?: string;
  gps_lon?: string;
  timestamp?: string;
} | null {
  if (!entity || typeof entity !== "object" || Array.isArray(entity)) {
    return null;
  }
  const rec = entity;
  const checksum =
    typeof rec.checksum === "string"
      ? rec.checksum
      : typeof rec.file_hash === "string"
        ? rec.file_hash
        : undefined;
  const gps_lat =
    typeof rec.gps_lat === "number" || typeof rec.gps_lat === "string"
      ? String(rec.gps_lat)
      : undefined;
  const gps_lon =
    typeof rec.gps_lon === "number" || typeof rec.gps_lon === "string"
      ? String(rec.gps_lon)
      : undefined;
  const timestamp =
    typeof rec.timestamp === "string" ? rec.timestamp : undefined;
  if (!checksum && !gps_lat && !gps_lon && !timestamp) return null;
  return { checksum, gps_lat, gps_lon, timestamp };
}

function statusLabel(status: VerifyStatus, hasPublicKey: boolean): string {
  if (status === "verified") return "Verified";
  if (status === "hash_mismatch") return "Mismatch";
  if (status === "bad_signature") return "Mismatch";
  if (!hasPublicKey) return "Verification not available";
  if (status === "unavailable") return "Verification not available";
  return "Not verified";
}

export function AuditTrailViewer({
  entityType,
  entityId,
  apiBaseUrl,
  initialEntries,
  initialPublicKey,
}: AuditTrailViewerProps) {
  const headingId = useId();
  const skipFetch = initialEntries !== undefined;
  const [chain, setChain] = useState<LedgerEntry[] | null>(
    initialEntries ?? null,
  );
  const [publicKeyB64, setPublicKeyB64] = useState<string | null>(
    initialPublicKey === undefined ? null : initialPublicKey,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "verifying">(
    skipFetch ? "idle" : "loading",
  );
  const [verifications, setVerifications] = useState<
    Record<string, VerifyStatus>
  >({});
  const base = resolveBase(apiBaseUrl);

  useEffect(() => {
    if (skipFetch) return;
    const controller = new AbortController();

    async function load() {
      setPhase("loading");
      setLoadError(null);
      try {
        const chainUrl = `${base}${FRAPPE_METHODS.ledgerGetChain}?entity_id=${encodeURIComponent(entityId)}`;
        const chainRes = await fetch(chainUrl, {
          credentials: "include",
          method: "GET",
          signal: controller.signal,
        });
        const chainJson: unknown = await chainRes.json();
        const parsed = parseLedgerChain(chainJson);
        if (!parsed.ok) {
          setChain([]);
          setLoadError(parsed.error);
        } else {
          setChain(parsed.entries);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setChain([]);
        setLoadError(
          err instanceof Error ? err.message : "Could not load the audit trail.",
        );
      }

      try {
        const keyRes = await fetch(`${base}${FRAPPE_METHODS.ledgerPublicKey}`, {
          credentials: "include",
          method: "GET",
          signal: controller.signal,
        });
        const keyJson: unknown = await keyRes.json();
        const key = parsePublicKey(keyJson);
        setPublicKeyB64(key?.public_key ?? null);
      } catch {
        if (controller.signal.aborted) return;
        setPublicKeyB64(null);
      }

      if (!controller.signal.aborted) setPhase("idle");
    }

    void load();
    return () => controller.abort();
  }, [base, entityId, skipFetch]);

  const runVerify = useCallback(
    async (entry: LedgerEntry) => {
      const outcome = await verifyLedgerEntry(entry, publicKeyB64);
      setVerifications((prev) => ({ ...prev, [entry.id]: outcome.status }));
      return outcome.status;
    },
    [publicKeyB64],
  );

  async function verifyAll() {
    if (!chain?.length) return;
    setPhase("verifying");
    for (const entry of chain) {
      await runVerify(entry);
    }
    setPhase("idle");
  }

  const hasPublicKey = Boolean(publicKeyB64);

  return (
    <section
      className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm"
      aria-labelledby={headingId}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id={headingId} className="font-semibold text-tl-ink">
            Audit trail / verification
          </h3>
          <p className="mt-0.5 text-xs text-tl-ink-muted">
            {entityType} · {entityId}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void verifyAll()}
          disabled={!chain?.length || phase === "verifying" || phase === "loading"}
          className="rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {phase === "verifying" ? "Verifying…" : "Verify chain"}
        </button>
      </div>

      {!hasPublicKey && phase !== "loading" ? (
        <p
          className="mb-3 rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-xs text-tl-ink-muted"
          role="status"
        >
          Verification not available. Cloud has not published a public key;
          hash checks still run. Server-side verify_entry remains the fallback.
        </p>
      ) : null}

      {phase === "loading" ? (
        <p className="text-sm text-tl-ink-muted" role="status">
          Loading ledger…
        </p>
      ) : null}

      {loadError ? (
        <p className="text-sm text-tl-danger" role="alert">
          {loadError}
        </p>
      ) : null}

      {phase !== "loading" && !loadError && chain && chain.length === 0 ? (
        <p className="text-sm text-tl-ink-muted">
          No ledger entries found for this entity.
        </p>
      ) : null}

      {chain && chain.length > 0 ? (
        <ol className="space-y-3">
          {chain.map((entry) => {
            const status = verifications[entry.id] ?? "idle";
            const meta = evidenceFields(entry.canonical_entity);
            return (
              <li
                key={entry.id}
                className="rounded-md border border-tl-line bg-tl-paper p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-tl-ink-muted">
                      {entry.action || "entry"} · {entry.id}
                    </p>
                    <p className="mt-1 font-mono text-xs text-tl-ink">
                      <span className="text-tl-ink-muted">
                        {shortHash(entry.prev_hash)}
                      </span>
                      {" → "}
                      <span>{shortHash(entry.current_hash)}</span>
                    </p>
                    <p className="mt-1 text-xs text-tl-ink-muted">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString("en-ZA")
                        : "—"}{" "}
                      · Actor {entry.actor_id || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        status === "verified"
                          ? "text-xs font-medium text-tl-trust-ink"
                          : status === "hash_mismatch" ||
                              status === "bad_signature"
                            ? "text-xs font-medium text-tl-danger"
                            : "text-xs font-medium text-tl-amber"
                      }
                    >
                      {statusLabel(status, hasPublicKey)}
                    </p>
                    <button
                      type="button"
                      className="mt-2 rounded-md border border-tl-line bg-tl-surface px-2 py-1 text-xs font-medium text-tl-ink hover:bg-tl-paper"
                      onClick={() => void runVerify(entry)}
                    >
                      Verify
                    </button>
                  </div>
                </div>

                {meta || entry.current_hash ? (
                  <dl className="mt-3 grid gap-1 text-xs text-tl-ink-muted sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-tl-ink">Checksum</dt>
                      <dd className="break-all font-mono">
                        {meta?.checksum || entry.current_hash}
                      </dd>
                    </div>
                    {meta?.gps_lat ? (
                      <div>
                        <dt className="font-medium text-tl-ink">gps_lat</dt>
                        <dd>{meta.gps_lat}</dd>
                      </div>
                    ) : null}
                    {meta?.gps_lon ? (
                      <div>
                        <dt className="font-medium text-tl-ink">gps_lon</dt>
                        <dd>{meta.gps_lon}</dd>
                      </div>
                    ) : null}
                    {meta?.timestamp ? (
                      <div>
                        <dt className="font-medium text-tl-ink">Timestamp</dt>
                        <dd>{meta.timestamp}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}

export default AuditTrailViewer;
