import { cookies } from "next/headers";
import { SESSION_ROLE_COOKIE } from "@/lib/auth.constants";
import { isUserRole, type UserRole } from "@/types/rbac";

export type { UserRole };

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
};

export { SESSION_ROLE_COOKIE } from "@/lib/auth.constants";

function userFromRole(role: UserRole): AppUser {
  return {
    id: "dev-1",
    name: "Dev User",
    role,
  };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const sessionRole = cookieStore.get(SESSION_ROLE_COOKIE)?.value;

  if (sessionRole && isUserRole(sessionRole)) {
    return userFromRole(sessionRole);
  }

  const envRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  if (envRole && isUserRole(envRole)) {
    return userFromRole(envRole);
  }

  return null;
}
