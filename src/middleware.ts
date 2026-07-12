import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  FRAPPE_SID_COOKIE,
  SESSION_ROLE_COOKIE,
  TL_MODE_COOKIE,
  TL_USER_EMAIL_COOKIE,
  TL_USER_NAME_COOKIE,
} from "@/lib/auth.constants";
import { isUserRole } from "@/types/rbac";
import {
  assertLiveOperatorAccess,
  isPlatformOperatorIdentity,
  isPlatformOperatorLockPublic,
  isPlatformOperatorOnly,
} from "@/lib/platformOperator";

function hasUserSignal(request: NextRequest): boolean {
  const sessionRole = request.cookies.get(SESSION_ROLE_COOKIE)?.value;
  if (sessionRole && isUserRole(sessionRole)) {
    return true;
  }

  // Local-only bypass — never honour in Vercel production
  if (process.env.VERCEL_ENV === "production") {
    return false;
  }

  const envRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  return Boolean(envRole && isUserRole(envRole));
}

function clearLiveCookies(response: NextResponse) {
  const clear = { path: "/", maxAge: 0 };
  response.cookies.set(FRAPPE_SID_COOKIE, "", { ...clear, httpOnly: true });
  response.cookies.set(SESSION_ROLE_COOKIE, "", clear);
  response.cookies.set(TL_MODE_COOKIE, "", clear);
  response.cookies.set(TL_USER_NAME_COOKIE, "", clear);
  response.cookies.set(TL_USER_EMAIL_COOKIE, "", clear);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mode = request.cookies.get(TL_MODE_COOKIE)?.value;
  const signedIn = hasUserSignal(request);
  const email = request.cookies.get(TL_USER_EMAIL_COOKIE)?.value;
  const hasLiveSid = Boolean(request.cookies.get(FRAPPE_SID_COOKIE)?.value);
  const isLiveSession = mode === "live" || hasLiveSid;

  if ((pathname === "/login" || pathname === "/login/live") && signedIn) {
    if (isLiveSession && isPlatformOperatorOnly()) {
      const gate = assertLiveOperatorAccess(email);
      if (!gate.ok) {
        const dest = new URL("/login/live", request.url);
        dest.searchParams.set("error", gate.reason);
        const response = NextResponse.redirect(dest);
        clearLiveCookies(response);
        return response;
      }
    }
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
    if (isPlatformOperatorLockPublic()) {
      const dest = new URL("/login/live", request.url);
      dest.searchParams.set("error", "not_operator");
      dest.searchParams.set(
        "next",
        pathname.startsWith("/app") ? pathname : "/app/dashboard",
      );
      return NextResponse.redirect(dest);
    }
    const entry = mode === "live" ? "/login/live" : "/demo";
    const dest = new URL(entry, request.url);
    dest.searchParams.set(
      "next",
      pathname.startsWith("/app") ? pathname : "/app/dashboard",
    );
    return NextResponse.redirect(dest);
  }

  if (isProtected && signedIn && isPlatformOperatorLockPublic()) {
    if (!isLiveSession || !isPlatformOperatorIdentity(email)) {
      const dest = new URL("/login/live", request.url);
      dest.searchParams.set("error", "not_operator");
      const response = NextResponse.redirect(dest);
      clearLiveCookies(response);
      response.cookies.set(SESSION_ROLE_COOKIE, "", { path: "/", maxAge: 0 });
      return response;
    }
  } else if (isProtected && signedIn && isLiveSession && isPlatformOperatorOnly()) {
    const gate = assertLiveOperatorAccess(email);
    if (!gate.ok) {
      const dest = new URL("/login/live", request.url);
      dest.searchParams.set("error", gate.reason);
      const response = NextResponse.redirect(dest);
      clearLiveCookies(response);
      return response;
    }
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
