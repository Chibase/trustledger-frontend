"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatChibasePackagePrice } from "@/lib/chibase/packages";
import { firmPath } from "@/lib/security/hosts";

type VerifyState =
  | { phase: "loading" }
  | {
      phase: "done";
      ok: boolean;
      packageLabel?: string | null;
      amountCents?: number;
      currency?: string;
      reference?: string;
      email?: string | null;
      error?: string;
    };

function SuccessBody({ chibaseHost }: { chibaseHost: boolean }) {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("trxref") || "";
  const [state, setState] = useState<VerifyState>({ phase: "loading" });

  useEffect(() => {
    if (!reference) {
      setState({
        phase: "done",
        ok: false,
        error: "Missing payment reference.",
      });
      return;
    }

    const cacheKey = `cb-verify-cache:${reference}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Extract<
          VerifyState,
          { phase: "done" }
        >;
        if (parsed.ok) {
          setState(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/chibase/pay/verify?reference=${encodeURIComponent(reference)}`,
        );
        const payload = (await res.json()) as {
          ok?: boolean;
          packageLabel?: string | null;
          amountCents?: number;
          currency?: string;
          reference?: string;
          email?: string | null;
          error?: string;
        };
        if (cancelled) return;
        const next: Extract<VerifyState, { phase: "done" }> = {
          phase: "done",
          ok: Boolean(payload.ok),
          packageLabel: payload.packageLabel,
          amountCents: payload.amountCents,
          currency: payload.currency,
          reference: payload.reference || reference,
          email: payload.email,
          error: payload.error,
        };
        setState(next);
        if (next.ok) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }
      } catch {
        if (!cancelled) {
          setState({
            phase: "done",
            ok: false,
            error:
              "Could not confirm this payment. Email us with the reference.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (state.phase === "loading") {
    return (
      <p className="text-sm text-tl-ink-muted">
        Confirming your package payment…
      </p>
    );
  }

  if (!state.ok) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-semibold text-tl-ink">
          We could not confirm that payment
        </h1>
        <p className="text-sm leading-relaxed text-tl-ink-muted">
          {state.error ||
            "Try again from the packages page, or email us with the reference."}
        </p>
        <Link
          href={firmPath(chibaseHost, "/packages")}
          className="inline-flex text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
        >
          Back to packages
        </Link>
      </div>
    );
  }

  const amount =
    typeof state.amountCents === "number"
      ? formatChibasePackagePrice({ amountCents: state.amountCents })
      : null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold text-tl-ink">
        Package payment received
      </h1>
      <p className="text-sm leading-relaxed text-tl-ink-muted">
        Thank you. This is a <strong>Chibase Consulting</strong> engagement
        payment — not a TrustLedger software subscription, and it does not open
        a product workspace.
      </p>
      <ul className="space-y-1 rounded-lg border border-tl-line bg-tl-surface p-4 text-sm text-tl-ink">
        <li>Package: {state.packageLabel || "Consulting package"}</li>
        {amount ? <li>Amount: {amount}</li> : null}
        {state.reference ? <li>Reference: {state.reference}</li> : null}
        {state.email ? <li>Receipt email: {state.email}</li> : null}
      </ul>
      <p className="text-sm leading-relaxed text-tl-ink-muted">
        We will reply to that work email to schedule the work. If you also need
        the SRM desk, start a TrustLedger trial separately.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={firmPath(chibaseHost, "/contact")}
          className="inline-flex rounded-md bg-tl-trust px-4 py-2.5 text-sm font-semibold text-white hover:bg-tl-trust-ink"
        >
          Send a follow-up note
        </Link>
        <Link
          href={firmPath(chibaseHost, "/packages")}
          className="inline-flex rounded-md border border-tl-line px-4 py-2.5 text-sm font-semibold text-tl-ink hover:border-tl-trust"
        >
          All packages
        </Link>
      </div>
    </div>
  );
}

export function FirmPackageSuccess({ chibaseHost }: { chibaseHost: boolean }) {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-tl-ink-muted">
          Confirming your package payment…
        </p>
      }
    >
      <SuccessBody chibaseHost={chibaseHost} />
    </Suspense>
  );
}
