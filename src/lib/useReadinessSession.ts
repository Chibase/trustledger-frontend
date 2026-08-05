"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ASSESSMENT_STORAGE_KEY } from "@/data/assessment";
import { ASSESSMENT_UNLOCK_KEY } from "@/lib/assessmentClient";
import type { AssessmentAnswers, AssessmentResult, RiskBand } from "@/types/assessment";

export type ReadinessSession = {
  email: string;
  name: string;
  overallScore: number;
  riskBand: RiskBand;
  result: AssessmentResult;
  answers: AssessmentAnswers;
};

/**
 * Require a server-validated grant token + local assessment result.
 * Clears a forged unlock flag and sends the visitor back to the quiz.
 */
export function useReadinessSession(): {
  session: ReadinessSession | null;
  ready: boolean;
} {
  const router = useRouter();
  const [session, setSession] = useState<ReadinessSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const grantToken = sessionStorage.getItem(ASSESSMENT_UNLOCK_KEY);
          const raw = sessionStorage.getItem(ASSESSMENT_STORAGE_KEY);
          if (!grantToken || !raw) {
            router.replace("/assessment");
            return;
          }
          const saved = JSON.parse(raw) as {
            result?: AssessmentResult;
            answers?: AssessmentAnswers;
          };
          if (!saved?.result) {
            sessionStorage.removeItem(ASSESSMENT_UNLOCK_KEY);
            router.replace("/assessment");
            return;
          }

          const res = await fetch("/api/assessment/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grantToken }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            email?: string;
            name?: string;
            overallScore?: number;
            riskBand?: RiskBand;
          };
          if (!res.ok || !data.ok || !data.email || !data.riskBand) {
            sessionStorage.removeItem(ASSESSMENT_UNLOCK_KEY);
            if (!cancelled) router.replace("/assessment");
            return;
          }

          if (cancelled) return;
          setSession({
            email: data.email,
            name: data.name || "",
            overallScore: data.overallScore ?? saved.result.overallScore,
            riskBand: data.riskBand,
            result: saved.result,
            answers: saved.answers ?? {},
          });
          setReady(true);
        } catch {
          if (!cancelled) router.replace("/assessment");
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [router]);

  return { session, ready };
}
