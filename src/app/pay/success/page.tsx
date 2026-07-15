"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatZarFromCents } from "@/lib/paystackPlans";

type VerifyState =
  | { phase: "loading" }
  | {
      phase: "done";
      ok: boolean;
      status?: string;
      planLabel?: string | null;
      amountCents?: number;
      reference?: string;
      error?: string;
    };

function SuccessBody() {
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

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/paystack/verify?reference=${encodeURIComponent(reference)}`,
        );
        const payload = (await res.json()) as {
          ok?: boolean;
          status?: string;
          planLabel?: string | null;
          amountCents?: number;
          reference?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setState({
            phase: "done",
            ok: false,
            error: payload.error || "Could not verify payment",
          });
          return;
        }
        setState({
          phase: "done",
          ok: Boolean(payload.ok),
          status: payload.status,
          planLabel: payload.planLabel,
          amountCents: payload.amountCents,
          reference: payload.reference,
        });
      } catch {
        if (!cancelled) {
          setState({
            phase: "done",
            ok: false,
            error: "Network error while verifying payment",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm font-medium text-tl-trust">TrustLedger checkout</p>
      {state.phase === "loading" ? (
        <>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Confirming payment…
          </h1>
          <p className="mt-2 text-sm text-tl-ink-muted">
            Please wait while we verify with Paystack.
          </p>
        </>
      ) : state.ok ? (
        <>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Payment received
          </h1>
          <p className="mt-2 text-sm text-tl-ink-muted">
            Thank you. Our team will confirm your TrustLedger access shortly.
            Soft launch provisioning is manual after CRM review.
          </p>
          <dl className="mt-6 space-y-2 rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-tl-ink-muted">Plan</dt>
              <dd className="font-medium">{state.planLabel || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-tl-ink-muted">Amount</dt>
              <dd className="font-medium tabular-nums">
                {state.amountCents != null
                  ? formatZarFromCents(state.amountCents)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-tl-ink-muted">Reference</dt>
              <dd className="font-medium break-all">{state.reference}</dd>
            </div>
          </dl>
        </>
      ) : (
        <>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Payment not confirmed
          </h1>
          <p className="mt-2 text-sm text-tl-ink-muted">
            {state.error ||
              `Paystack status: ${state.status || "unknown"}. If you were charged, contact us with your reference.`}
          </p>
          {reference ? (
            <p className="mt-3 text-xs text-tl-ink-muted">Reference: {reference}</p>
          ) : null}
        </>
      )}

      <p className="mt-8 text-sm">
        <Link href="/contact" className="font-medium text-tl-trust-ink underline">
          Contact TrustLedger
        </Link>
        {" · "}
        <Link href="/" className="font-medium text-tl-trust-ink underline">
          Home
        </Link>
      </p>
    </main>
  );
}

export default function PaySuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">Confirming…</h1>
        </main>
      }
    >
      <SuccessBody />
    </Suspense>
  );
}
