import { API_BASE_URL, isLiveMode } from "@/config/api";

export class FrappeApiError extends Error {
  status: number;
  endpoint: string;

  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = "FrappeApiError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

type FrappeEnvelope<T> = {
  message?: T;
  exc?: string;
  error?: string;
  _server_messages?: string;
};

/**
 * Call a Frappe whitelisted method.
 * In live mode, routes through the same-origin BFF (`/api/frappe`) so the
 * httpOnly Frappe sid cookie stays on the Vercel host.
 */
export async function callFrappeMethod<T>(
  methodPath: string,
  body?: Record<string, unknown>,
  init?: RequestInit,
): Promise<T> {
  const useProxy = isLiveMode();
  const url = useProxy ? "/api/frappe" : `${API_BASE_URL}${methodPath}`;
  const payload = useProxy
    ? { method: methodPath, ...(body ?? {}) }
    : (body ?? {});

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(payload),
    ...init,
  });

  const text = await response.text();
  let parsed: FrappeEnvelope<T> | T | null = null;
  try {
    parsed = text ? (JSON.parse(text) as FrappeEnvelope<T> | T) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const detail =
      parsed && typeof parsed === "object"
        ? "error" in parsed && parsed.error
          ? String(parsed.error)
          : "exc" in parsed && parsed.exc
            ? String(parsed.exc)
            : text.slice(0, 200) || response.statusText
        : text.slice(0, 200) || response.statusText;
    throw new FrappeApiError(
      `Frappe call failed (${response.status}): ${detail}`,
      response.status,
      methodPath,
    );
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "message" in parsed &&
    parsed.message !== undefined
  ) {
    return parsed.message as T;
  }

  return parsed as T;
}
