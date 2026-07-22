"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isPlanId } from "@/config/plans";
import { formatZarFromCents } from "@/lib/paystackPlans";
import {
  clearTrialWorkspaceData,
  startTrialCookies,
} from "@/lib/trial";
import { ensureTrialSeedProject } from "@/lib/trialStore";
import {
  readTrialBilling,
  setMustChangePassword,
  writeTrialBilling,
} from "@/lib/trialBillingClient";
import { writeStoredActivationToken } from "@/lib/trialProvisionClient";

type VerifyState =
  | { phase: "loading" }
  | {
      phase: "done";
      ok: boolean;
      flow?: string;
      status?: string;
      planLabel?: string | null;
      planId?: string | null;
      amountCents?: number;
      planAmountCents?: number | null;
      reference?: string;
      email?: string | null;
      name?: string | null;
      organization?: string | null;
      billAt?: string | null;
      tempPassword?: string | null;
      activationToken?: string | null;
      emailSent?: boolean;
      emailDetail?: string | null;
      authorizationLast4?: string | null;
      error?: string;
    };

function SuccessBody() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("trxref") || "";
  const [state, setState] = useState<VerifyState>({ phase: "loading" });
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!reference) {
      setState({
        phase: "done",
        ok: false,
        error: "Missing payment reference.",
      });
      return;
    }

    const cacheKey = `tl-verify-cache:${reference}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Extract<VerifyState, { phase: "done" }>;
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
          `/api/paystack/verify?reference=${encodeURIComponent(reference)}`,
        );
        const payload = (await res.json()) as {
          ok?: boolean;
          status?: string;
          planLabel?: string | null;
          planId?: string | null;
          amountCents?: number;
          planAmountCents?: number | null;
          reference?: string;
          email?: string | null;
          name?: string | null;
          organization?: string | null;
          billAt?: string | null;
          tempPassword?: string | null;
          activationToken?: string | null;
          emailSent?: boolean;
          emailDetail?: string | null;
          authorizationLast4?: string | null;
          flow?: string;
          checkoutMode?: string;
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
        const done: Extract<VerifyState, { phase: "done" }> = {
          phase: "done",
          ok: Boolean(payload.ok),
          flow: payload.flow || payload.checkoutMode,
          status: payload.status,
          planLabel: payload.planLabel,
          planId: payload.planId,
          amountCents: payload.amountCents,
          planAmountCents: payload.planAmountCents,
          reference: payload.reference,
          email: payload.email,
          name: payload.name,
          organization: payload.organization,
          billAt: payload.billAt,
          tempPassword: payload.tempPassword,
          activationToken: payload.activationToken,
          emailSent: payload.emailSent,
          emailDetail: payload.emailDetail,
          authorizationLast4: payload.authorizationLast4,
        };
        setState(done);
        if (done.ok) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(done));
          } catch {
            /* ignore */
          }
        }
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

  useEffect(() => {
    if (state.phase !== "done" || !state.ok) return;
    if (state.flow !== "trial_authorize") return;
    if (!state.email || !state.planId || !isPlanId(state.planId)) return;
    if (activated) return;

    clearTrialWorkspaceData();
    startTrialCookies({
      email: state.email,
      name: state.name || state.email.split("@")[0] || "Trial user",
      planId: state.planId,
      organization: state.organization || undefined,
    });
    ensureTrialSeedProject();
    if (state.organization) {
      window.localStorage.setItem("tl-trial-org", state.organization);
    }
    window.localStorage.setItem("tl-lead-email", state.email);

    writeTrialBilling({
      email: state.email,
      name: state.name || state.email,
      planId: state.planId,
      planLabel: state.planLabel || undefined,
      organization: state.organization || undefined,
      reference: state.reference || reference,
      billAt: state.billAt || new Date().toISOString(),
      authorizationLast4: state.authorizationLast4 || undefined,
      status: "scheduled",
      activatedAt: new Date().toISOString(),
    });

    if (state.tempPassword) {
      setMustChangePassword(true);
    }
    if (state.activationToken) {
      writeStoredActivationToken(state.activationToken);
      // Pull authorization code into local billing state for opt-out deactivate.
      void fetch(
        `/api/trial/activate?token=${encodeURIComponent(state.activationToken)}`,
      )
        .then((r) => r.json())
        .then((payload: { authorizationCode?: string | null }) => {
          if (!payload.authorizationCode) return;
          const current = readTrialBilling();
          if (!current) return;
          writeTrialBilling({
            ...current,
            authorizationCode: payload.authorizationCode || undefined,
          });
        })
        .catch(() => undefined);
    }
    setActivated(true);
  }, [state, activated, reference]);

  const isTrial = state.phase === "done" && state.ok && state.flow === "trial_authorize";

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      {state.phase === "loading" ? (
        <>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Confirming…
          </h1>
          <p className="mt-2 text-sm text-tl-ink-muted">
            Verifying your banking details with Paystack.
          </p>
        </>
      ) : state.ok && isTrial ? (
        <>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Thank you — your trial is active
          </h1>
          <p className="mt-2 text-sm text-tl-ink-muted">
            Your banking details were verified and saved for the charge at the
            end of your 14-day trial. Cancel anytime before then to stop
            billing.
          </p>

          <dl className="mt-6 space-y-2 rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-tl-ink-muted">Plan</dt>
              <dd className="font-medium">{state.planLabel || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-tl-ink-muted">Card check</dt>
              <dd className="font-medium tabular-nums">
                {state.amountCents != null
                  ? formatZarFromCents(state.amountCents)
                  : "—"}
                {state.authorizationLast4
                  ? ` · ****${state.authorizationLast4}`
                  : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-tl-ink-muted">After trial</dt>
              <dd className="font-medium tabular-nums">
                {state.planAmountCents != null
                  ? `${formatZarFromCents(state.planAmountCents)}/mo`
                  : "—"}
              </dd>
            </div>
            {state.billAt ? (
              <div className="flex justify-between gap-3">
                <dt className="text-tl-ink-muted">First charge</dt>
                <dd className="font-medium">
                  {new Date(state.billAt).toLocaleDateString("en-ZA", {
                    dateStyle: "medium",
                  })}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-tl-ink-muted">Reference</dt>
              <dd className="font-medium break-all">{state.reference}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-lg border border-tl-line bg-tl-paper p-4 text-sm">
            <p className="font-medium text-tl-ink">Your login details</p>
            <p className="mt-1 text-tl-ink-muted">
              {state.emailSent
                ? "We also emailed these to you. Change the temporary password when you first sign in."
                : "Save these now. Change the temporary password when you first sign in."}
            </p>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs text-tl-ink-muted">Work email</dt>
                <dd className="font-medium break-all">{state.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-tl-ink-muted">Temporary password</dt>
                <dd className="font-mono text-base font-semibold tracking-wide">
                  {state.tempPassword || "See your email"}
                </dd>
              </div>
            </dl>
            {state.emailDetail && !state.emailSent ? (
              <p className="mt-2 text-xs text-tl-ink-muted">{state.emailDetail}</p>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app/dashboard"
              className="inline-flex justify-center rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Enter workspace
            </Link>
            <Link
              href="/login/trial"
              className="inline-flex justify-center rounded-md border border-tl-line px-4 py-2.5 text-sm font-medium text-tl-ink hover:bg-tl-surface"
            >
              Sign in later
            </Link>
          </div>
        </>
      ) : state.ok ? (
        <>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Thank you — payment received
          </h1>
          <p className="mt-2 text-sm text-tl-ink-muted">
            Your TrustLedger subscription payment cleared. Access continues on
            your plan.
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
          <p className="mt-8">
            <Link
              href="/app/dashboard"
              className="font-medium text-tl-trust-ink underline"
            >
              Open workspace
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Not confirmed
          </h1>
          <p className="mt-2 text-sm text-tl-ink-muted">
            {state.error ||
              `Paystack status: ${state.status || "unknown"}. If you completed checkout, retry with the same reference or start again from Subscribe.`}
          </p>
          {reference ? (
            <p className="mt-3 text-xs text-tl-ink-muted">
              Reference: {reference}
            </p>
          ) : null}
          <p className="mt-8">
            <Link href="/pay" className="font-medium text-tl-trust-ink underline">
              Back to Subscribe
            </Link>
          </p>
        </>
      )}
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
