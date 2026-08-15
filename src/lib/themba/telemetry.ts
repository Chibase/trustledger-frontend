export type ThembaBugChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ThembaBugReport = {
  timestamp: string;
  user_query: string;
  page_url: string;
  browser_info: string;
  chat_history: ThembaBugChatTurn[];
};

const MAX_QUERY = 2000;
const MAX_URL = 500;
const MAX_UA = 400;
const MAX_TURN = 500;
const MAX_HISTORY = 5;

function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function asRole(value: unknown): "user" | "assistant" | null {
  if (value === "user" || value === "assistant") return value;
  return null;
}

export function normalizeBugReport(raw: unknown): ThembaBugReport | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const user_query = clip(body.user_query, MAX_QUERY);
  if (user_query.length < 2) return null;

  const historyRaw = Array.isArray(body.chat_history) ? body.chat_history : [];
  const chat_history: ThembaBugChatTurn[] = [];
  for (const turn of historyRaw.slice(-MAX_HISTORY)) {
    if (!turn || typeof turn !== "object") continue;
    const t = turn as Record<string, unknown>;
    const role = asRole(t.role);
    const content = clip(t.content, MAX_TURN);
    if (!role || !content) continue;
    chat_history.push({ role, content });
  }

  return {
    timestamp: clip(body.timestamp, 40) || new Date().toISOString(),
    user_query,
    page_url: clip(body.page_url, MAX_URL) || "/",
    browser_info: clip(body.browser_info, MAX_UA),
    chat_history,
  };
}
