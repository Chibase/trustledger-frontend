"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function sanitizeNext(value: string | null): string {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    (value.startsWith("/app") || value.startsWith("/ops"))
  ) {
    return value;
  }
  // Operators home to Executive Board; customers use /app.
  return "/ops/executive";
}

function gateErrorCopy(code: string | null): string | null {
  if (code === "lockdown_misconfigured") {
    return "Live access is locked to the Platform Operator, but the allowlist is not configured on the server.";
  }
  if (code === "not_operator") {
    return "Live access is limited to the Platform Operator. Customer and staff logins are paused until lockdown is lifted.";
  }
  return null;
}

function LiveLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const gateError = gateErrorCopy(searchParams.get("error"));
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(gateError);
  const [pending, setPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function finishLogin(payload: {
    home?: string;
    platformOperator?: boolean;
  }) {
    document.cookie = "tl-mode=live; path=/; max-age=604800; samesite=lax";

    try {
      const { migrateActiveOrgToCloud } = await import("@/lib/migrateOrgClient");
      await migrateActiveOrgToCloud();
    } catch {
      /* non-blocking */
    }

    const dest =
      payload.home ||
      (payload.platformOperator ? "/ops/executive" : null) ||
      (next.startsWith("/ops") || next.startsWith("/app")
        ? next
        : "/ops/executive");
    router.push(dest);
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResetMessage(null);
    setInfo(null);
    try {
      const response = await fetch("/auth/live/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ usr, pwd }),
      });
      const payload = (await response.json()) as {
        error?: string;
        role?: string;
        home?: string;
        platformOperator?: boolean;
        needsVerification?: boolean;
        emailHint?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Login failed");
      }
      if (payload.needsVerification) {
        setStep("otp");
        setEmailHint(payload.emailHint || null);
        setInfo(payload.message || "Enter the code we emailed you.");
        setOtp("");
        return;
      }
      await finishLogin(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const response = await fetch("/auth/live/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ code: otp.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        home?: string;
        platformOperator?: boolean;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Verification failed");
      }
      await finishLogin(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setPending(false);
    }
  }

  async function handleResendCode() {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const response = await fetch("/auth/live/verify", {
        method: "PUT",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Could not resend code");
      }
      setInfo(payload.message || "A new code was sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setPending(false);
    }
  }

  async function handleForgotPassword() {
    setResetPending(true);
    setError(null);
    setResetMessage(null);
    try {
      const email = usr.trim();
      if (!email.includes("@")) {
        throw new Error("Enter your email above first, then request a reset.");
      }
      const response = await fetch("/api/auth/live/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Could not start password reset");
      }
      setResetMessage(
        payload.message ||
          "If this email is registered, reset instructions were sent.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-sm font-medium text-tl-trust">Live session</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-tl-ink">
        {step === "otp" ? "Verify it’s you" : "Sign in with TrustLedger"}
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        {step === "otp"
          ? `Enter the 6-digit code we sent${emailHint ? ` to ${emailHint}` : ""}.`
          : "Use your TrustLedger Cloud email and password. We email a one-time code before opening the live product."}
      </p>

      {step === "credentials" ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
        >
          <div>
            <label htmlFor="usr" className="mb-1 block text-sm font-medium">
              Email / User
            </label>
            <input
              id="usr"
              type="text"
              autoComplete="username"
              value={usr}
              onChange={(e) => setUsr(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="pwd" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              id="pwd"
              type="password"
              autoComplete="current-password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {resetMessage ? (
            <p className="text-sm text-tl-trust-ink" role="status">
              {resetMessage}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Continue"}
          </button>
          <button
            type="button"
            disabled={resetPending || pending}
            onClick={() => void handleForgotPassword()}
            className="w-full text-sm font-medium text-tl-trust-ink underline disabled:opacity-50"
          >
            {resetPending ? "Sending reset…" : "Forgot password?"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleVerifyOtp}
          className="mt-6 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
        >
          <div>
            <label htmlFor="otp" className="mb-1 block text-sm font-medium">
              Verification code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm tracking-[0.3em]"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="text-sm text-tl-trust-ink" role="status">
              {info}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending || otp.length !== 6}
            className="w-full rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
          >
            {pending ? "Verifying…" : "Verify & sign in"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleResendCode()}
            className="w-full text-sm font-medium text-tl-trust-ink underline disabled:opacity-50"
          >
            Resend code
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setStep("credentials");
              setOtp("");
              setInfo(null);
              setError(null);
            }}
            className="w-full text-sm text-tl-ink-muted underline disabled:opacity-50"
          >
            Back to email &amp; password
          </button>
        </form>
      )}
      <p className="mt-4 text-xs text-tl-ink-muted">
        New to TrustLedger?{" "}
        <Link href="/product" className="text-tl-trust-ink underline">
          Product &amp; onboarding
        </Link>
        . Reset links go to TrustLedger Cloud (
        <span className="font-mono">app.trustledger.co.za</span>
        ); set a new password there, then return here to sign in.
      </p>
    </main>
  );
}

export default function LiveLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">Sign in</h1>
        </main>
      }
    >
      <LiveLoginForm />
    </Suspense>
  );
}
