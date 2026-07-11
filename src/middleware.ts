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
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  if (pathname === "/demo" && hasUserSignal(request)) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  const protectedPrefixes = ["/app", "/dashboard", "/issues", "/incidents"];
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasUserSignal(request)) {
    const demoUrl = new URL("/demo", request.url);
    demoUrl.searchParams.set("next", pathname.startsWith("/app") ? pathname : "/app/dashboard");
    return NextResponse.redirect(demoUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
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
