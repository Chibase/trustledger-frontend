import { NextResponse } from "next/server";

const FRAPPE_SITE =
  process.env.FRAPPE_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://app.trustledger.co.za";

async function probe(
  label: string,
  url: string,
  init?: RequestInit,
): Promise<{ label: string; ok: boolean; status?: number; ms: number }> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    return {
      label,
      ok: res.ok || res.status < 500,
      status: res.status,
      ms: Date.now() - started,
    };
  } catch {
    return { label, ok: false, ms: Date.now() - started };
  }
}

export async function GET() {
  const [app, frappe] = await Promise.all([
    probe("vercel_app", `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustledger-frontend-pi.vercel.app"}/`),
    probe("frappe_cloud", `${FRAPPE_SITE.replace(/\/$/, "")}/api/method/frappe.ping`),
  ]);

  const checks = [app, frappe];
  const ok = checks.every((c) => c.ok);

  return NextResponse.json(
    {
      ok,
      checkedAt: new Date().toISOString(),
      checks,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
