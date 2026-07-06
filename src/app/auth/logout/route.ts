import { NextResponse } from "next/server";
import { SESSION_ROLE_COOKIE } from "@/lib/auth.constants";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(SESSION_ROLE_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  return response;
}
