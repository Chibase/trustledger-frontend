import { API_BASE_URL } from "@/config/api";

export type FrappeSessionContext = {
  user: string;
  fullName: string;
  roles: string[];
  trustLedgerRole: string;
};

function parseSetCookieSid(setCookieHeaders: string[]): string | null {
  for (const header of setCookieHeaders) {
    const match = header.match(/(?:^|,\s*)sid=([^;]+)/i);
    if (match?.[1] && match[1] !== "Guest") {
      return match[1];
    }
  }
  // Node fetch may join cookies; also try simple sid=
  for (const header of setCookieHeaders) {
    const parts = header.split(/,(?=\s*[^;=]+=)/);
    for (const part of parts) {
      const m = part.trim().match(/^sid=([^;]+)/i);
      if (m?.[1] && m[1] !== "Guest") return m[1];
    }
  }
  return null;
}

export function getFrappeBaseUrl(): string {
  return (process.env.FRAPPE_BASE_URL || API_BASE_URL).replace(/\/$/, "");
}

export async function frappeLogin(
  usr: string,
  pwd: string,
): Promise<{ sid: string }> {
  const base = getFrappeBaseUrl();
  const response = await fetch(`${base}/api/method/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ usr, pwd }),
  });

  const setCookie =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  const raw = response.headers.get("set-cookie");
  const headers = setCookie.length ? setCookie : raw ? [raw] : [];
  const sid = parseSetCookieSid(headers);

  if (!response.ok || !sid) {
    const text = await response.text();
    throw new Error(
      `TrustLedger sign-in failed (${response.status}): ${text.slice(0, 200) || response.statusText}`,
    );
  }

  return { sid };
}

export async function frappeLogout(sid: string): Promise<void> {
  const base = getFrappeBaseUrl();
  await fetch(`${base}/api/method/logout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Cookie: `sid=${sid}`,
    },
  }).catch(() => undefined);
}

export async function frappeCallWithSid<T>(
  sid: string,
  methodPath: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const base = getFrappeBaseUrl();
  const path = methodPath.startsWith("/") ? methodPath : `/${methodPath}`;
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Cookie: `sid=${sid}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await response.text();
  let payload: { message?: T; exc?: string } | null = null;
  try {
    payload = text ? (JSON.parse(text) as { message?: T; exc?: string }) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.exc || text.slice(0, 200) || response.statusText;
    throw new Error(`TrustLedger call failed (${response.status}): ${detail}`);
  }

  if (payload && "message" in payload && payload.message !== undefined) {
    return payload.message;
  }
  return payload as T;
}

export async function fetchSessionContext(
  sid: string,
): Promise<FrappeSessionContext> {
  return frappeCallWithSid<FrappeSessionContext>(
    sid,
    "/api/method/srm_core.api.auth.get_session",
  );
}
