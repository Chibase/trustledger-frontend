import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_ROLE_COOKIE } from "@/lib/auth.constants";
import { isUserRole } from "@/types/rbac";

function hasUserSignal(request: NextRequest): boolean {
  const sessionRole = request.cookies.get(SESSION_ROLE_COOKIE)?.value;
  if (sessionRole && isUserRole(sessionRole)) {
    return true;
  }

  const envRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  return Boolean(envRole && isUserRole(envRole));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" && hasUserSignal(request)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!hasUserSignal(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard", "/dashboard/:path*"],
};
