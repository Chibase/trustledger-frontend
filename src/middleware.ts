import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  FRAPPE_SID_COOKIE,
  SESSION_ROLE_COOKIE,
  TL_MODE_COOKIE,
} from "@/lib/auth.constants";
import { isUserRole } from "@/types/rbac";

function hasUserSignal(request: NextRequest): boolean {
  const sessionRole = request.cookies.get(SESSION_ROLE_COOKIE)?.value;
  if (sessionRole && isUserRole(sessionRole)) {
    return true;
  }

  const envRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  return Boolean(envRole && isUserRole(envRole));
}

function isLiveRequest(request: NextRequest): boolean {
  const mode = request.cookies.get(TL_MODE_COOKIE)?.value;
  const hasSid = Boolean(request.cookies.get(FRAPPE_SID_COOKIE)?.value);
  return mode === "live" || hasSid;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = hasUserSignal(request);
  const live = isLiveRequest(request);

  // Staff live session: skip login pages when already signed in.
  if ((pathname === "/login" || pathname === "/login/live") && signedIn) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  // Open trial: /demo always proceeds (page auto-enters). Live staff may revisit.
  if (pathname === "/demo" && signedIn && live) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  const protectedPrefixes = ["/app", "/dashboard", "/issues", "/incidents"];
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // Live mode still requires a Frappe session (staff). Demo/trial is open.
  if (isProtected && live && !request.cookies.get(FRAPPE_SID_COOKIE)?.value) {
    const dest = new URL("/login/live", request.url);
    dest.searchParams.set(
      "next",
      pathname.startsWith("/app") ? pathname : "/app/dashboard",
    );
    return NextResponse.redirect(dest);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/login/live",
    "/demo",
    "/app",
    "/app/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/issues",
    "/issues/:path*",
    "/incidents",
    "/incidents/:path*",
  ],
};
