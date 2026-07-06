export type UserRole = "client" | "contractor" | "community" | "admin";

export const USER_ROLES: UserRole[] = [
  "client",
  "contractor",
  "community",
  "admin",
];

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}
