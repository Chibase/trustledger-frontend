import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  FRAPPE_SID_COOKIE,
  SESSION_ROLE_COOKIE,
  TL_DESK_TIER_COOKIE,
  TL_DESK_TIER_LOCKED_COOKIE,
  TL_MODE_COOKIE,
  TL_ORG_OWNER_COOKIE,
  TL_TRIAL_PLAN_COOKIE,
  TL_USER_EMAIL_COOKIE,
  TL_USER_NAME_COOKIE,
  TL_VIP_COOKIE,
} from "@/lib/auth.constants";
import { isUserRole } from "@/types/rbac";
import { getDataMode } from "@/config/api";
import {
  assertLiveOperatorAccess,
  assertOpsAccess,
  isPlatformOperatorIdentity,
  isPlatformOperatorLockPublic,
  isPlatformOperatorOnly,
} from "@/lib/platformOperator";
import {
  isChibaseHost,
  isChibasePreviewPath,
  TRUSTLEDGER_PRODUCT_URL,
} from "@/lib/security/hosts";
import { matchMaliciousProbe } from "@/lib/security/probes";
import {
  applySecurityHeaders,
  blockedProbeResponse,
  goneWpSpamResponse,
} from "@/lib/security/response";
import { recordSecurityEvent } from "@/lib/security/log";
import { matchRetiredWpSpam } from "@/lib/security/wpSpamPaths";

const WP_SLUG_REDIRECTS: Record<string, string> = {
  "/about-us-critical-involvement": "/about",
  "/social-licence-to-build-framework": "/practice",
  "/contact-us": "/contact",
  "/home-social-licence-to-build": "/",
};

const FIRM_MAP: Record<string, string> = {
  "/": "/firm",
  "/practice": "/firm/practice",
  "/packages": "/firm/packages",
  "/about": "/firm/about",
  "/contact": "/firm/contact",
  "/insights": "/firm/insights",
  "/trustledger": "/firm/trustledger",
};

const PRODUCT_ON_FIRM = [
  "/app",
  "/ops",
  "/pay",
  "/login",
  "/trial",
  "/product",
  "/assessment",
  "/quote",
  "/readiness",
  "/resources",
  "/faq",
  "/status",
  "/privacy",
  "/terms",
  "/cookies",
  "/legal",
  "/invite",
  "/auth",
  "/dashboard",
  "/projects",
  "/incidents",
  "/issues",
  "/reports",
];

/** Firm origin: contact, CSP reports, consulting checkout. Product Paystack stays on TrustLedger. */
const FIRM_API_ALLOW = [
  "/api/contact",
  "/api/security/csp-report",
  "/api/chibase/pay",
];

function safeNextPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function hasUserSignal(request: NextRequest): boolean {
  const sessionRole = request.cookies.get(SESSION_ROLE_COOKIE)?.value;
  if (sessionRole && isUserRole(sessionRole)) {
    return true;
  }

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
  response.cookies.set(TL_USER_EMAIL_COOKIE, "", { ...clear, httpOnly: true });
  response.cookies.set(TL_TRIAL_PLAN_COOKIE, "", clear);
  response.cookies.set(TL_VIP_COOKIE, "", clear);
  response.cookies.set(TL_ORG_OWNER_COOKIE, "", { ...clear, httpOnly: true });
  response.cookies.set(TL_DESK_TIER_COOKIE, "", clear);
  response.cookies.set(TL_DESK_TIER_LOCKED_COOKIE, "", clear);
}

function clearDemoSession(response: NextResponse) {
  const clear = { path: "/", maxAge: 0 };
  response.cookies.set(SESSION_ROLE_COOKIE, "", clear);
  response.cookies.set(TL_MODE_COOKIE, "", clear);
  response.cookies.set(TL_USER_NAME_COOKIE, "", clear);
}

function clientIp(request: NextRequest): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function emitProbe(request: NextRequest, reason: string, path: string) {
  recordSecurityEvent({
    kind: "probe_blocked",
    reason,
    path,
    ip: clientIp(request),
    host: request.headers.get("host") || "",
    ua: request.headers.get("user-agent") || "",
  });
}

function withSecurity(response: NextResponse, noindex = false): NextResponse {
  applySecurityHeaders(response);
  if (noindex) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

function withSite(
  request: NextRequest,
  site: "chibase" | "product",
  noindex = false,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tl-site", site);
  requestHeaders.set(
    "x-tl-public-path",
    request.nextUrl.pathname.replace(/\/$/, "") || "/",
  );
  return withSecurity(
    NextResponse.next({ request: { headers: requestHeaders } }),
    noindex,
  );
}

function chibaseRewritePath(pathname: string): string | null {
  const trimmed = pathname.replace(/\/$/, "") || "/";
  if (trimmed.startsWith("/firm")) return trimmed === "/firm" ? "/firm" : trimmed;
  if (trimmed.startsWith("/insights/") || trimmed.startsWith("/packages/")) {
    return `/firm${trimmed}`;
  }
  return FIRM_MAP[trimmed] ?? FIRM_MAP[pathname] ?? null;
}

function handleChibaseHost(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    const allowed = FIRM_API_ALLOW.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (allowed) return null;
    return withSecurity(
      new NextResponse("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }),
    );
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/marketing/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return null;
  }

  const spam = matchRetiredWpSpam(pathname);
  if (spam) {
    recordSecurityEvent({
      kind: "probe_blocked",
      reason: spam.reason,
      path: spam.path,
      ip: clientIp(request),
      host: request.headers.get("host") || "",
      ua: request.headers.get("user-agent") || "",
    });
    return goneWpSpamResponse();
  }

  const slug = pathname.replace(/\/$/, "") || "/";
  if (slug === "/firm" || slug.startsWith("/firm/")) {
    const dest = slug.replace(/^\/firm/, "") || "/";
    return withSecurity(NextResponse.redirect(new URL(dest, request.url), 308));
  }

  const legacy = WP_SLUG_REDIRECTS[slug];
  if (legacy) {
    return withSecurity(
      NextResponse.redirect(new URL(legacy, request.url), 308),
    );
  }

  if (PRODUCT_ON_FIRM.some((p) => slug === p || slug.startsWith(`${p}/`))) {
    const dest = `${TRUSTLEDGER_PRODUCT_URL}${pathname}${request.nextUrl.search || ""}`;
    const url = new URL(dest);
    if (!url.searchParams.get("utm_source")) {
      url.searchParams.set("utm_source", "chibase");
      url.searchParams.set("utm_medium", "firm_host");
    }
    return withSecurity(NextResponse.redirect(url, 302));
  }

  const mapped = chibaseRewritePath(pathname);
  if (mapped) {
    const url = request.nextUrl.clone();
    url.pathname = mapped;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tl-site", "chibase");
    requestHeaders.set("x-tl-public-path", pathname.replace(/\/$/, "") || "/");
    return withSecurity(
      NextResponse.rewrite(url, { request: { headers: requestHeaders } }),
    );
  }

  return withSecurity(
    new NextResponse("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    }),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const probe = matchMaliciousProbe(pathname, request.nextUrl.search);
  if (probe) {
    emitProbe(request, probe.reason, probe.path);
    return blockedProbeResponse();
  }

  const chibase = isChibaseHost(request.headers.get("host"));
  if (chibase) {
    const hosted = handleChibaseHost(request);
    if (hosted) return hosted;
  }

  if (isChibasePreviewPath(pathname) && !chibase) {
    const previewIndex =
      (process.env.NEXT_PUBLIC_CHIBASE_INDEX_PREVIEW || "").trim() === "1";
    return withSite(request, "chibase", !previewIndex);
  }

  const mode = request.cookies.get(TL_MODE_COOKIE)?.value;
  const signedIn = hasUserSignal(request);
  const email = request.cookies.get(TL_USER_EMAIL_COOKIE)?.value;
  const hasLiveSid = Boolean(request.cookies.get(FRAPPE_SID_COOKIE)?.value);
  const isLiveSession = mode === "live" || hasLiveSid;
  const wantsLiveProduct =
    isLiveSession ||
    (getDataMode() === "live" && mode !== "demo" && mode !== "trial");

  if (pathname === "/login") {
    const signedOutIntent =
      request.nextUrl.searchParams.get("signedOut") === "1" ||
      request.nextUrl.searchParams.get("repaired") === "1";
    if (signedOutIntent) {
      const response = withSite(request, "product");
      clearLiveCookies(response);
      return response;
    }
  }

  if ((pathname === "/login" || pathname === "/login/live") && signedIn) {
    if (isLiveSession && isPlatformOperatorOnly()) {
      const gate = assertLiveOperatorAccess(email);
      if (!gate.ok) {
        const dest = new URL("/login/live", request.url);
        dest.searchParams.set("error", gate.reason);
        const response = NextResponse.redirect(dest);
        clearLiveCookies(response);
        return withSecurity(response);
      }
    }
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const opsGate = assertOpsAccess(email);

    if (isLiveSession && opsGate.ok) {
      if (next?.startsWith("/ops")) {
        return withSecurity(NextResponse.redirect(new URL(next, request.url)));
      }
      if (next?.startsWith("/app")) {
        return withSecurity(NextResponse.redirect(new URL(next, request.url)));
      }
      return withSecurity(
        NextResponse.redirect(new URL("/ops/executive", request.url)),
      );
    }

    if (next?.startsWith("/ops")) {
      const dest = new URL("/login/live", request.url);
      dest.searchParams.set(
        "error",
        opsGate.ok ? "not_operator" : opsGate.reason,
      );
      dest.searchParams.set("next", "/ops/executive");
      return withSecurity(NextResponse.redirect(dest));
    }
    return withSecurity(
      NextResponse.redirect(
        new URL(
          next && next.startsWith("/app") ? next : "/app/dashboard",
          request.url,
        ),
      ),
    );
  }

  if (pathname === "/ops" || pathname.startsWith("/ops/")) {
    if (!signedIn || !hasLiveSid) {
      const dest = new URL("/login/live", request.url);
      dest.searchParams.set(
        "next",
        pathname.startsWith("/ops") ? pathname : "/ops/executive",
      );
      return withSecurity(NextResponse.redirect(dest));
    }
    const opsGate = assertOpsAccess(email);
    if (!opsGate.ok) {
      const dest = new URL("/login/live", request.url);
      dest.searchParams.set("error", opsGate.reason);
      dest.searchParams.set("next", "/ops/executive");
      return withSecurity(NextResponse.redirect(dest));
    }
  }

  const protectedPrefixes = ["/app", "/dashboard", "/issues", "/incidents"];
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && mode === "demo" && !isLiveSession) {
    const dest = new URL("/product", request.url);
    dest.searchParams.set("retired", "1");
    const response = NextResponse.redirect(dest);
    clearDemoSession(response);
    return withSecurity(response);
  }

  if (
    signedIn &&
    isLiveSession &&
    assertOpsAccess(email).ok &&
    (pathname === "/app" ||
      pathname === "/app/dashboard" ||
      pathname === "/dashboard")
  ) {
    return withSecurity(
      NextResponse.redirect(new URL("/ops/executive", request.url)),
    );
  }

  if (isProtected && !signedIn) {
    if (wantsLiveProduct) {
      if (isPlatformOperatorLockPublic()) {
        const dest = new URL("/login/live", request.url);
        dest.searchParams.set("error", "not_operator");
        dest.searchParams.set(
          "next",
          pathname.startsWith("/app") ? pathname : "/app/dashboard",
        );
        return withSecurity(NextResponse.redirect(dest));
      }
      const dest = new URL("/login/live", request.url);
      dest.searchParams.set(
        "next",
        pathname.startsWith("/app") ? pathname : "/app/dashboard",
      );
      return withSecurity(NextResponse.redirect(dest));
    }
    const dest = new URL("/trial", request.url);
    dest.searchParams.set(
      "next",
      pathname.startsWith("/app") ? pathname : "/app/dashboard",
    );
    return withSecurity(NextResponse.redirect(dest));
  }

  if (isProtected && signedIn && isPlatformOperatorLockPublic()) {
    if (mode === "trial") {
      return withSite(request, "product");
    }
    if (!isLiveSession || !isPlatformOperatorIdentity(email)) {
      const dest = new URL("/login/live", request.url);
      dest.searchParams.set("error", "not_operator");
      const response = NextResponse.redirect(dest);
      clearLiveCookies(response);
      response.cookies.set(SESSION_ROLE_COOKIE, "", { path: "/", maxAge: 0 });
      return withSecurity(response);
    }
  } else if (
    isProtected &&
    signedIn &&
    isLiveSession &&
    isPlatformOperatorOnly()
  ) {
    const gate = assertLiveOperatorAccess(email);
    if (!gate.ok) {
      const dest = new URL("/login/live", request.url);
      dest.searchParams.set("error", gate.reason);
      const response = NextResponse.redirect(dest);
      clearLiveCookies(response);
      return withSecurity(response);
    }
  }

  return withSite(request, "product");
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
