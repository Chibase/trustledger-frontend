import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isUserRole } from "@/types/rbac";

function hasUserSignal(request: NextRequest): boolean {
  // Future: validate session/JWT from auth provider cookie.
  const sessionRole = request.cookies.get("session-role")?.value;
  if (sessionRole && isUserRole(sessionRole)) {
    return true;
  }

  // Dev placeholder: explicit env role only (no fallback here).
  const envRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  return Boolean(envRole && isUserRole(envRole));
}

export function middleware(request: NextRequest) {
  if (!hasUserSignal(request)) {
    // Dev mode: allow through for now. Later, redirect unauthenticated users:
    // return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
