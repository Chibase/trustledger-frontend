import { cookies } from "next/headers";
import {
  FRAPPE_SID_COOKIE,
  SESSION_ROLE_COOKIE,
  TL_MODE_COOKIE,
  TL_TRIAL_PLAN_COOKIE,
  TL_USER_EMAIL_COOKIE,
  TL_USER_NAME_COOKIE,
  type TlMode,
} from "@/lib/auth.constants";
import { isPlanId, type PlanId } from "@/config/plans";
import { isUserRole, type UserRole } from "@/types/rbac";
import {
  computeTrialSnapshot,
  parseTrialStarted,
  type TrialSnapshot,
} from "@/lib/trial";
import { TL_TRIAL_STARTED_COOKIE } from "@/lib/auth.constants";

export type { UserRole };

export type AppUser = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  mode: TlMode;
  isGuest?: boolean;
  trialPlan?: PlanId;
  trial?: TrialSnapshot;
};

export { SESSION_ROLE_COOKIE } from "@/lib/auth.constants";

function displayNameForRole(role: UserRole): string {
  switch (role) {
    case "community":
      return "Community member";
    case "contractor":
      return "Contractor";
    case "client":
      return "Client";
    case "admin":
      return "Administrator";
  }
}

function resolveMode(
  modeRaw: string | undefined,
  hasLiveSid: boolean,
): TlMode {
  if (modeRaw === "trial") return "trial";
  if (modeRaw === "live" || hasLiveSid) return "live";
  return "demo";
}

function userFromRole(
  role: UserRole,
  name: string,
  mode: TlMode,
  id = "session-user",
  email: string | null = null,
  extras?: Pick<AppUser, "isGuest" | "trialPlan" | "trial">,
): AppUser {
  return { id, name, email, role, mode, ...extras };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const sessionRole = cookieStore.get(SESSION_ROLE_COOKIE)?.value;
  const modeRaw = cookieStore.get(TL_MODE_COOKIE)?.value;
  const hasLiveSid = Boolean(cookieStore.get(FRAPPE_SID_COOKIE)?.value);
  const mode = resolveMode(modeRaw, hasLiveSid);
  const emailRaw = cookieStore.get(TL_USER_EMAIL_COOKIE)?.value;
  const email = emailRaw ? emailRaw.trim().toLowerCase() : null;
  const planRaw = cookieStore.get(TL_TRIAL_PLAN_COOKIE)?.value;
  const trialPlan = planRaw && isPlanId(planRaw) ? planRaw : undefined;
  const started = parseTrialStarted(
    decodeURIComponent(cookieStore.get(TL_TRIAL_STARTED_COOKIE)?.value || ""),
  );
  const trial =
    mode === "trial" && started
      ? computeTrialSnapshot(started, trialPlan ?? "practitioner")
      : undefined;

  if (sessionRole && isUserRole(sessionRole)) {
    const name =
      cookieStore.get(TL_USER_NAME_COOKIE)?.value ||
      displayNameForRole(sessionRole);
    return userFromRole(
      sessionRole,
      name,
      mode,
      mode === "live" ? "live-user" : mode === "trial" ? "trial-user" : "demo-user",
      email,
      {
        trialPlan,
        trial,
        isGuest: mode === "demo",
      },
    );
  }

  const envRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  if (
    envRole &&
    isUserRole(envRole) &&
    process.env.VERCEL_ENV !== "production"
  ) {
    return userFromRole(
      envRole,
      displayNameForRole(envRole),
      "demo",
      "dev-user",
      email,
    );
  }

  // Sample demo guests only (not the 14-day product trial).
  if (mode === "demo" && modeRaw === "demo") {
    return userFromRole(
      "client",
      "Demo guest",
      "demo",
      "demo-guest",
      email,
      { isGuest: true },
    );
  }

  return null;
}

export async function isTrialWorkspaceSession(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.mode === "trial";
}
