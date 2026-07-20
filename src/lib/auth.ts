import { cookies } from "next/headers";
import {
  FRAPPE_SID_COOKIE,
  SESSION_ROLE_COOKIE,
  TL_MODE_COOKIE,
  TL_TRIAL_PLAN_COOKIE,
  TL_USER_EMAIL_COOKIE,
  TL_USER_NAME_COOKIE,
  TRIAL_DEFAULT_ROLE,
} from "@/lib/auth.constants";
import { isPlanId, type PlanId } from "@/config/plans";
import { isUserRole, type UserRole } from "@/types/rbac";

export type { UserRole };

export type AppUser = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  mode: "demo" | "live";
  /** Open trial guest (no login). */
  isGuest?: boolean;
  trialPlan?: PlanId;
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

function userFromRole(
  role: UserRole,
  name: string,
  mode: "demo" | "live",
  id = "session-user",
  email: string | null = null,
  extras?: Pick<AppUser, "isGuest" | "trialPlan">,
): AppUser {
  return { id, name, email, role, mode, ...extras };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const sessionRole = cookieStore.get(SESSION_ROLE_COOKIE)?.value;
  const modeRaw = cookieStore.get(TL_MODE_COOKIE)?.value;
  const hasLiveSid = Boolean(cookieStore.get(FRAPPE_SID_COOKIE)?.value);
  const mode: "demo" | "live" =
    modeRaw === "live" || hasLiveSid ? "live" : "demo";
  const emailRaw = cookieStore.get(TL_USER_EMAIL_COOKIE)?.value;
  const email = emailRaw ? emailRaw.trim().toLowerCase() : null;
  const planRaw = cookieStore.get(TL_TRIAL_PLAN_COOKIE)?.value;
  const trialPlan = planRaw && isPlanId(planRaw) ? planRaw : undefined;

  if (sessionRole && isUserRole(sessionRole)) {
    const name =
      cookieStore.get(TL_USER_NAME_COOKIE)?.value ||
      displayNameForRole(sessionRole);
    return userFromRole(
      sessionRole,
      name,
      mode,
      mode === "live" ? "live-user" : "demo-user",
      email,
      trialPlan ? { trialPlan } : undefined,
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
      { trialPlan: trialPlan ?? "practitioner" },
    );
  }

  // Open trial: no login required for demo product UI.
  if (mode === "demo") {
    return userFromRole(
      TRIAL_DEFAULT_ROLE,
      "Trial guest",
      "demo",
      "trial-guest",
      email,
      { isGuest: true, trialPlan: trialPlan ?? "practitioner" },
    );
  }

  return null;
}
