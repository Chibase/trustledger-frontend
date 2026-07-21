"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth.constants";
import { captureUtmFromSearchParams } from "@/lib/utm";

function sanitizeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/app/dashboard";
}

function SamplePreviewEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureUtmFromSearchParams(
      new URLSearchParams(searchParams.toString()),
      "/demo",
    );
    const maxAge = SESSION_MAX_AGE_SECONDS;
    document.cookie = `session-role=client; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `tl-mode=demo; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `tl-user-name=Demo guest; path=/; max-age=${maxAge}; samesite=lax`;
    const next = sanitizeNext(searchParams.get("next"));
    router.replace(next.startsWith("/app") ? next : "/app/dashboard");
  }, [searchParams, router]);

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">Sample preview</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Opening sample data…
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        This is a walkthrough on fictional data. For a 14-day workspace with your
        own projects,{" "}
        <Link href="/trial" className="font-medium text-tl-trust-ink underline">
          start a trial
        </Link>
        .
      </p>
    </main>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">Sample preview</h1>
        </main>
      }
    >
      <SamplePreviewEntry />
    </Suspense>
  );
}
