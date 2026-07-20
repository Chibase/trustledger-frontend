import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  FRAPPE_SID_COOKIE,
  SESSION_ROLE_COOKIE,
  TL_MODE_COOKIE,
  TL_TRIAL_PLAN_COOKIE,
  TL_USER_NAME_COOKIE,
} from "@/lib/auth.constants";
import { frappeLogout } from "@/lib/frappeServer";

export async function POST() {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  const mode = jar.get(TL_MODE_COOKIE)?.value;
  if (mode === "live" && sid) {
    await frappeLogout(sid);
  }

  const response = NextResponse.json({ ok: true });
  const clear = { path: "/", maxAge: 0, sameSite: "lax" as const };
  response.cookies.set(SESSION_ROLE_COOKIE, "", clear);
  response.cookies.set(TL_MODE_COOKIE, "", clear);
  response.cookies.set(TL_USER_NAME_COOKIE, "", clear);
  response.cookies.set(TL_TRIAL_PLAN_COOKIE, "", clear);
  response.cookies.set(FRAPPE_SID_COOKIE, "", { ...clear, httpOnly: true });
  return response;
}
