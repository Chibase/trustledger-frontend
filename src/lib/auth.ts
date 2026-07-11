import { cookies } from "next/headers";
import {
  FRAPPE_SID_COOKIE,
  SESSION_ROLE_COOKIE,
  TL_MODE_COOKIE,
  TL_USER_NAME_COOKIE,
} from "@/lib/auth.constants";
import { isUserRole, type UserRole } from "@/types/rbac";

export type { UserRole };

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
  mode: "demo" | "live";
};

export { SESSION_ROLE_COOKIE } from "@/lib/auth.constants";

function userFromRole(
  role: UserRole,
  name: string,
  mode: "demo" | "live",
  id = "session-user",
): AppUser {
  return { id, name, role, mode };
}

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

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const sessionRole = cookieStore.get(SESSION_ROLE_COOKIE)?.value;
  const modeRaw = cookieStore.get(TL_MODE_COOKIE)?.value;
  const hasLiveSid = Boolean(cookieStore.get(FRAPPE_SID_COOKIE)?.value);
  // Prefer explicit live cookie; also treat httpOnly Frappe sid as live
  // so a leftover tl-mode=demo cannot keep the demo banner after live login.
  const mode: "demo" | "live" =
    modeRaw === "live" || hasLiveSid ? "live" : "demo";

  if (sessionRole && isUserRole(sessionRole)) {
    const name =
      cookieStore.get(TL_USER_NAME_COOKIE)?.value ||
      displayNameForRole(sessionRole);
    return userFromRole(
      sessionRole,
      name,
      mode,
      mode === "live" ? "live-user" : "demo-user",
    );
  }

  const envRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  if (envRole && isUserRole(envRole)) {
    return userFromRole(envRole, displayNameForRole(envRole), "demo");
  }

  return null;
}
