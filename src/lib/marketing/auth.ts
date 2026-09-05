import { NextResponse } from "next/server";
import { cronSecret } from "@/lib/marketing/config";
import { opsDenied, requireOpsLiveSession } from "@/lib/opsSession";

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
  const session = await requireOpsLiveSession();
  if (!session.ok) {
    return { ok: false, response: opsDenied(session) as NextResponse };
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
