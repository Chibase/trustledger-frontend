import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_ROLE_COOKIE, TL_MODE_COOKIE } from "@/lib/auth.constants";
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
  const mode = request.cookies.get(TL_MODE_COOKIE)?.value;
  const signedIn = hasUserSignal(request);

  if ((pathname === "/login" || pathname === "/login/live") && signedIn) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  // Demo picker only auto-skips in demo mode; live users may revisit /demo intentionally.
  if (pathname === "/demo" && signedIn && mode !== "live") {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  const protectedPrefixes = ["/app", "/dashboard", "/issues", "/incidents"];
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !signedIn) {
    const entry = mode === "live" ? "/login/live" : "/demo";
    const dest = new URL(entry, request.url);
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
