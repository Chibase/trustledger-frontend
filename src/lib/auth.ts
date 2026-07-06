import { isUserRole, type UserRole } from "@/types/rbac";

export type { UserRole };

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
};

function resolveDevRole(): UserRole {
  const envRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  if (envRole && isUserRole(envRole)) {
    return envRole;
  }
  return "client";
}

export async function getCurrentUser(): Promise<AppUser | null> {
  // Placeholder: mock signed-in user from env. Swap for real session lookup.
  return {
    id: "dev-1",
    name: "Dev User",
    role: resolveDevRole(),
  };
}
