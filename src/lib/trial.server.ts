import { cookies } from "next/headers";
import {
  TL_MODE_COOKIE,
  TL_TRIAL_PLAN_COOKIE,
  TL_TRIAL_STARTED_COOKIE,
} from "@/lib/auth.constants";
import { isPlanId } from "@/config/plans";
import {
  computeTrialSnapshot,
  parseTrialStarted,
  type TrialSnapshot,
} from "@/lib/trial";

/** Server-only: read trial snapshot from request cookies. */
export async function readTrialSnapshot(): Promise<TrialSnapshot | null> {
  const jar = await cookies();
  if (jar.get(TL_MODE_COOKIE)?.value !== "trial") return null;
  const started = parseTrialStarted(
    decodeURIComponent(jar.get(TL_TRIAL_STARTED_COOKIE)?.value || ""),
  );
  if (!started) return null;
  const planRaw = jar.get(TL_TRIAL_PLAN_COOKIE)?.value;
  const planId = planRaw && isPlanId(planRaw) ? planRaw : "practitioner";
  return computeTrialSnapshot(started, planId);
}
