import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { cronSecret } from "@/lib/marketing/config";
import { assertOpsAccess } from "@/lib/platformOperator";

export function cronAuthorized(request: Request): boolean {
  const secret = cronSecret();
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function authorizeCronOrOps(request: Request): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  if (cronAuthorized(request)) return { ok: true };
  const jar = await cookies();
  const operator = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertOpsAccess(operator);
  if (!gate.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true };
}

export async function readDryRunFlag(request: Request): Promise<boolean> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    return url.searchParams.get("dryRun") === "true";
  }
  try {
    const body = (await request.json()) as { dryRun?: boolean };
    return body.dryRun === true;
  } catch {
    return false;
  }
}
