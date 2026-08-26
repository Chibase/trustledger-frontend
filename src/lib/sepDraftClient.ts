import type { EngagementPlan } from "@/types/engagementPlan";

export async function requestSepDocumentDraft(
  plan: EngagementPlan,
  briefing = "",
): Promise<{
  plan: EngagementPlan;
  synthesizer: "gemini" | "template";
  error?: string;
}> {
  try {
    const res = await fetch("/api/app/engagement-plan/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        briefing: briefing.slice(0, 12_000),
      }),
    });
    const json = (await res.json()) as {
      plan?: EngagementPlan;
      synthesizer?: "gemini" | "template";
      error?: string;
    };
    if (!res.ok || !json.plan) {
      return {
        plan: { ...plan, documentDrafter: plan.documentDrafter || "template" },
        synthesizer: "template",
        error: json.error || "Could not draft the document.",
      };
    }
    return {
      plan: json.plan,
      synthesizer: json.synthesizer === "gemini" ? "gemini" : "template",
    };
  } catch {
    return {
      plan: { ...plan, documentDrafter: plan.documentDrafter || "template" },
      synthesizer: "template",
      error: "Could not reach the drafting service.",
    };
  }
}
