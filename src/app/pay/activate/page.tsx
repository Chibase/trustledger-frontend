"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isPlanId } from "@/config/plans";
import {
  clearTrialWorkspaceData,
  startTrialCookies,
} from "@/lib/trial";
import { ensureTrialSeedProject } from "@/lib/trialStore";
import {
  writeTrialBilling,
  setMustChangePassword,
} from "@/lib/trialBillingClient";
import {
  readStoredActivationToken,
  writeStoredActivationToken,
} from "@/lib/trialProvisionClient";

function ActivateBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token =
      searchParams.get("token") || readStoredActivationToken() || "";
    if (!token) {
      setError("Missing activation token.");
      return;
    }

    (async () => {
      // Token is self-contained; decode via login with empty password is wrong.
      // Activate by verifying token shape client-side through a lightweight ping:
      // we store token and ask user to set cookies from signed fields via /api/trial/login
      // only after password — for email deep-link we accept token-only activation
      // by posting to a dedicated decode isn't available without secret.
      // Use login route with a special header? Better: add GET activate API.
      try {
        const res = await fetch(
          `/api/trial/activate?token=${encodeURIComponent(token)}`,
        );
        const payload = (await res.json()) as {
          ok?: boolean;
          error?: string;
          email?: string;
          name?: string;
          planId?: string;
          organization?: string | null;
          startedAt?: string;
          billAt?: string;
          reference?: string;
          authorizationCode?: string | null;
        };
        if (!res.ok || !payload.ok || !payload.email || !payload.planId) {
          setError(payload.error || "Could not activate trial.");
          return;
        }
        if (!isPlanId(payload.planId)) {
          setError("Invalid plan on activation token.");
          return;
        }
        clearTrialWorkspaceData();
        startTrialCookies({
          email: payload.email,
          name: payload.name || payload.email,
          planId: payload.planId,
          startedAt: payload.startedAt
            ? new Date(payload.startedAt)
            : undefined,
          organization: payload.organization || undefined,
        });
        ensureTrialSeedProject();
        if (payload.organization) {
          window.localStorage.setItem("tl-trial-org", payload.organization);
        }
        window.localStorage.setItem("tl-lead-email", payload.email);
        writeStoredActivationToken(token);
        writeTrialBilling({
          email: payload.email,
          name: payload.name || payload.email,
          planId: payload.planId,
          organization: payload.organization || undefined,
          reference: payload.reference || "activate",
          billAt: payload.billAt || new Date().toISOString(),
          authorizationCode: payload.authorizationCode || undefined,
          status: "scheduled",
          activatedAt: new Date().toISOString(),
        });
        setMustChangePassword(true);
        router.replace("/app/dashboard");
        router.refresh();
      } catch {
        setError("Network error while activating.");
      }
    })();
  }, [searchParams, router]);

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">
        {error ? "Activation failed" : "Activating your trial…"}
      </h1>
      {error ? (
        <>
          <p className="mt-2 text-sm text-tl-ink-muted">{error}</p>
          <p className="mt-6">
            <Link href="/pay" className="font-medium text-tl-trust-ink underline">
              Subscribe again
            </Link>
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-tl-ink-muted">
          Opening your workspace.
        </p>
      )}
    </main>
  );
}

export default function PayActivatePage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">Activating…</h1>
        </main>
      }
    >
      <ActivateBody />
    </Suspense>
  );
}
