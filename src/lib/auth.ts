import { cookies } from "next/headers";
import {
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
  id = "dev-1",
): AppUser {
  return { id, name, role, mode };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const sessionRole = cookieStore.get(SESSION_ROLE_COOKIE)?.value;
  const modeRaw = cookieStore.get(TL_MODE_COOKIE)?.value;
  const mode = modeRaw === "live" ? "live" : "demo";
  const name = cookieStore.get(TL_USER_NAME_COOKIE)?.value || "Dev User";

  if (sessionRole && isUserRole(sessionRole)) {
    return userFromRole(sessionRole, name, mode, mode === "live" ? "live-user" : "dev-1");
  }

  const envRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  if (envRole && isUserRole(envRole)) {
    return userFromRole(envRole, "Dev User", "demo");
  }

  return null;
}
