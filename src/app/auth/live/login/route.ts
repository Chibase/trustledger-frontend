import { NextResponse } from "next/server";
import { isUserRole } from "@/types/rbac";
import {
  FRAPPE_SID_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  SESSION_ROLE_COOKIE,
  TL_MODE_COOKIE,
  TL_USER_NAME_COOKIE,
} from "@/lib/auth.constants";
import { fetchSessionContext, frappeLogin } from "@/lib/frappeServer";

export async function POST(request: Request) {
  let body: { usr?: string; pwd?: string };
  try {
    body = (await request.json()) as { usr?: string; pwd?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const usr = (body.usr || "").trim();
  const pwd = body.pwd || "";
  if (!usr || !pwd) {
    return NextResponse.json(
      { error: "usr and pwd are required" },
      { status: 400 },
    );
  }

  try {
    const { sid } = await frappeLogin(usr, pwd);
    const session = await fetchSessionContext(sid);
    if (!isUserRole(session.trustLedgerRole)) {
      return NextResponse.json(
        { error: "Could not map Frappe roles to TrustLedger role" },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: session.user,
      fullName: session.fullName,
      role: session.trustLedgerRole,
      roles: session.roles,
    });

    const cookieBase = {
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };

    response.cookies.set(FRAPPE_SID_COOKIE, sid, {
      ...cookieBase,
      httpOnly: true,
    });
    response.cookies.set(SESSION_ROLE_COOKIE, session.trustLedgerRole, cookieBase);
    response.cookies.set(TL_MODE_COOKIE, "live", cookieBase);
    response.cookies.set(
      TL_USER_NAME_COOKIE,
      session.fullName.replace(/[;\r\n]/g, "").slice(0, 80),
      cookieBase,
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
