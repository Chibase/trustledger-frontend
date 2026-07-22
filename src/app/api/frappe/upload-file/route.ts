import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FRAPPE_SID_COOKIE, TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OD-2 — proxy file upload to Frappe Cloud (sid session preferred; API key fallback for Ops).
 * multipart/form-data: file (+ optional is_private, doctype, docname, fieldname)
 */
export async function POST(request: Request) {
  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertLiveOperatorAccess(email);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }

  const base = frappeBase();
  if (!base) {
    return NextResponse.json(
      { error: "FRAPPE_BASE_URL missing" },
      { status: 503 },
    );
  }

  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  const pair = frappeKeyPair();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) && typeof file !== "object") {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const outbound = new FormData();
  for (const [key, value] of form.entries()) {
    outbound.append(key, value);
  }

  const headers: HeadersInit = { Accept: "application/json" };
  if (sid) {
    headers.Cookie = `sid=${sid}`;
  } else if (pair) {
    headers.Authorization = `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`;
  } else {
    return NextResponse.json(
      { error: "No live session or API keys for upload" },
      { status: 401 },
    );
  }

  try {
    const res = await fetch(`${base}/api/method/upload_file`, {
      method: "POST",
      headers,
      body: outbound,
      cache: "no-store",
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = { raw: text.slice(0, 400) };
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upload failed (${res.status})`, detail: json },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, ...(typeof json === "object" && json ? json : { message: json }) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 502 },
    );
  }
}
