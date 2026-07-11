import { API_BASE_URL } from "@/config/api";

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
  _server_messages?: string;
};

/**
 * Call a Frappe whitelisted method.
 * Expects JSON body; returns `message` from the standard Frappe envelope when present.
 */
export async function callFrappeMethod<T>(
  methodPath: string,
  body?: Record<string, unknown>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${methodPath}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body ?? {}),
    ...init,
  });

  const text = await response.text();
  let payload: FrappeEnvelope<T> | T | null = null;
  try {
    payload = text ? (JSON.parse(text) as FrappeEnvelope<T> | T) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "exc" in payload && payload.exc
        ? String(payload.exc)
        : text.slice(0, 200) || response.statusText;
    throw new FrappeApiError(
      `Frappe call failed (${response.status}): ${detail}`,
      response.status,
      methodPath,
    );
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    payload.message !== undefined
  ) {
    return payload.message as T;
  }

  return payload as T;
}
