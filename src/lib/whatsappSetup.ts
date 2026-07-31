/**
 * WA-1 — Frappe WhatsApp readiness + CRM Lead Source "WhatsApp".
 * Does not store Meta tokens. Chat stays on Desk (ADR-039).
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
  submitProductLead,
  type ProductLeadInput,
} from "@/lib/leadCapture";

export type WhatsAppStatusRow =
  | "created"
  | "exists"
  | "missing"
  | "error"
  | "skipped"
  | "updated";

export type WhatsAppProbe = {
  ok: boolean;
  generatedAt: string;
  frappeBase: string;
  apiKeysPresent: boolean;
  appInstalled: boolean | null;
  accounts: Array<{ name: string; detail?: string }>;
  settingsFound: boolean | null;
  leadSourceWhatsApp: WhatsAppStatusRow | string;
  humanOnly: string[];
  detail?: string;
};

export type WhatsAppSetupResult = WhatsAppProbe & {
  wrote: boolean;
  dryRun: boolean;
  views?: Record<string, string>;
};

function authHeader(key: string, secret: string): HeadersInit {
  return {
    Authorization: `token ${key}:${secret}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function frappeFetch(
  path: string,
  init: RequestInit & { key: string; secret: string },
): Promise<Response> {
  const { key, secret, ...rest } = init;
  return fetch(`${frappeBase()}${path}`, {
    ...rest,
    headers: {
      ...authHeader(key, secret),
      ...(rest.headers || {}),
    },
    cache: "no-store",
  });
}

function humanOnlySteps(probe: {
  appInstalled: boolean | null;
  accounts: unknown[];
  settingsFound: boolean | null;
}): string[] {
  const steps: string[] = [];
  if (probe.appInstalled === false) {
    steps.push(
      "Frappe Cloud → Apps → install Frappe WhatsApp (frappe_whatsapp) if not already installed.",
    );
  } else if (probe.appInstalled === null) {
    steps.push(
      "Confirm Frappe WhatsApp is installed on app.trustledger.co.za (Cloud → Apps).",
    );
  }
  if (!probe.accounts.length && probe.settingsFound !== true) {
    steps.push(
      "Desk → WhatsApp Account / WhatsApp Settings: paste Meta token, Phone ID, Business ID, App ID, webhook verify token (never in git).",
    );
  }
  steps.push(
    "Meta Developer → webhook URL https://app.trustledger.co.za/api/method/frappe_whatsapp.utils.webhook.webhook + same verify token; subscribe messages.",
  );
  steps.push(
    "Approve at least one WhatsApp Template in Meta; Sync from Meta in Desk.",
  );
  steps.push(
    "Smoke: CRM Lead with mobile_no → WhatsApp tab → template → reply appears in Desk.",
  );
  steps.push("See docs/exports/whatsapp/HUMAN_ONLY.md");
  return steps;
}

async function detectWhatsAppApp(
  key: string,
  secret: string,
): Promise<boolean | null> {
  const candidates = ["frappe_whatsapp", "whatsapp"];
  for (const app of candidates) {
    const res = await frappeFetch(
      `/api/resource/Installed%20Application?filters=${encodeURIComponent(
        JSON.stringify([["app_name", "=", app]]),
      )}&fields=${encodeURIComponent(JSON.stringify(["name", "app_name"]))}&limit_page_length=5`,
      { method: "GET", key, secret },
    );
    if (!res.ok) continue;
    const data = (await res.json()) as { data?: unknown[] };
    if ((data.data || []).length > 0) return true;
  }

  const versions = await frappeFetch(
    "/api/method/frappe.utils.change_log.get_versions",
    { method: "GET", key, secret },
  );
  if (versions.ok) {
    const body = (await versions.json()) as {
      message?: Record<string, unknown>;
    };
    for (const name of Object.keys(body.message || {})) {
      if (/whatsapp/i.test(name)) return true;
    }
    return false;
  }
  return null;
}

async function listWhatsAppAccounts(
  key: string,
  secret: string,
): Promise<WhatsAppProbe["accounts"]> {
  const paths = [
    "/api/resource/WhatsApp%20Account?fields=%5B%22name%22%5D&limit_page_length=20",
    "/api/resource/WhatsApp%20Settings?fields=%5B%22name%22%5D&limit_page_length=5",
  ];
  const out: WhatsAppProbe["accounts"] = [];
  for (const path of paths) {
    const res = await frappeFetch(path, { method: "GET", key, secret });
    if (!res.ok) continue;
    const data = (await res.json()) as { data?: Array<{ name?: string }> };
    for (const row of data.data || []) {
      if (row.name) out.push({ name: String(row.name) });
    }
  }
  return out;
}

async function ensureWhatsAppLeadSource(
  key: string,
  secret: string,
  dryRun: boolean,
): Promise<WhatsAppStatusRow | string> {
  const name = "WhatsApp";
  const encoded = encodeURIComponent(name);
  const getRes = await frappeFetch(
    `/api/resource/CRM%20Lead%20Source/${encoded}`,
    { method: "GET", key, secret },
  );
  if (getRes.ok) return "exists";
  if (dryRun) return "missing";

  const createRes = await frappeFetch("/api/resource/CRM%20Lead%20Source", {
    method: "POST",
    key,
    secret,
    body: JSON.stringify({
      doctype: "CRM Lead Source",
      source_name: name,
      details:
        "<p>TrustLedger WhatsApp / Frappe WhatsApp intake (ADR-039).</p>",
    }),
  });
  if (createRes.ok) return "created";
  const text = await createRes.text().catch(() => "");
  if (/Duplicate|exists|Unique/i.test(text)) return "exists";
  return `error: ${text.slice(0, 160)}`;
}

async function ensureWhatsAppView(
  key: string,
  secret: string,
  dryRun: boolean,
): Promise<string> {
  if (dryRun) return "skipped";
  const listRes = await frappeFetch(
    `/api/method/crm.api.views.get_views?doctype=${encodeURIComponent("CRM Lead")}`,
    { method: "GET", key, secret },
  );
  if (!listRes.ok) return `error: views ${listRes.status}`;
  const json = (await listRes.json()) as {
    message?: Array<{ name: string | number; label?: string }>;
  };
  const views = Array.isArray(json.message) ? json.message : [];
  const label = "WhatsApp queue";
  const found = views.find((v) => v.label === label);
  if (found) {
    await frappeFetch(
      "/api/method/crm.fcrm.doctype.crm_view_settings.crm_view_settings.pin",
      {
        method: "POST",
        key,
        secret,
        body: JSON.stringify({ name: found.name, value: 1 }),
      },
    );
    return "exists";
  }

  const createRes = await frappeFetch(
    "/api/method/crm.fcrm.doctype.crm_view_settings.crm_view_settings.create",
    {
      method: "POST",
      key,
      secret,
      body: JSON.stringify({
        label,
        filters: {
          source: ["=", "WhatsApp"],
          status: ["=", "New"],
        },
        doctype: "CRM Lead",
        type: "list",
        columns: [],
        rows: [],
        is_default: false,
        pinned: true,
        public: true,
      }),
    },
  );
  if (!createRes.ok) {
    const text = await createRes.text();
    return `error: ${text.slice(0, 160)}`;
  }
  return "created";
}

export async function probeWhatsApp(): Promise<WhatsAppProbe> {
  const pair = frappeKeyPair();
  const generatedAt = new Date().toISOString();
  if (!pair) {
    const empty: WhatsAppProbe = {
      ok: false,
      generatedAt,
      frappeBase: frappeBase(),
      apiKeysPresent: false,
      appInstalled: null,
      accounts: [],
      settingsFound: null,
      leadSourceWhatsApp: "skipped",
      humanOnly: [],
      detail: "FRAPPE_API_KEY / FRAPPE_API_SECRET missing on this deployment",
    };
    empty.humanOnly = humanOnlySteps(empty);
    return empty;
  }

  try {
    const [appInstalled, accounts] = await Promise.all([
      detectWhatsAppApp(pair.key, pair.secret),
      listWhatsAppAccounts(pair.key, pair.secret),
    ]);
    const leadSourceWhatsApp = await ensureWhatsAppLeadSource(
      pair.key,
      pair.secret,
      true,
    );
    const settingsFound = accounts.length > 0 ? true : null;
    const base: WhatsAppProbe = {
      ok: appInstalled === true && accounts.length > 0,
      generatedAt,
      frappeBase: frappeBase(),
      apiKeysPresent: true,
      appInstalled,
      accounts,
      settingsFound,
      leadSourceWhatsApp,
      humanOnly: [],
    };
    base.humanOnly = humanOnlySteps(base);
    return base;
  } catch (err) {
    const fail: WhatsAppProbe = {
      ok: false,
      generatedAt,
      frappeBase: frappeBase(),
      apiKeysPresent: true,
      appInstalled: null,
      accounts: [],
      settingsFound: null,
      leadSourceWhatsApp: "error",
      humanOnly: [],
      detail: err instanceof Error ? err.message : "probe failed",
    };
    fail.humanOnly = humanOnlySteps(fail);
    return fail;
  }
}

export async function ensureWhatsAppCrm(options?: {
  dryRun?: boolean;
}): Promise<WhatsAppSetupResult> {
  const dryRun = options?.dryRun !== false;
  const pair = frappeKeyPair();
  const probe = await probeWhatsApp();
  if (!pair) {
    return { ...probe, wrote: false, dryRun };
  }

  const leadSourceWhatsApp = await ensureWhatsAppLeadSource(
    pair.key,
    pair.secret,
    dryRun,
  );
  const views: Record<string, string> = {
    "WhatsApp queue": await ensureWhatsAppView(pair.key, pair.secret, dryRun),
  };

  return {
    ...probe,
    leadSourceWhatsApp,
    views,
    wrote: !dryRun,
    dryRun,
    ok: probe.appInstalled === true && !dryRun
      ? leadSourceWhatsApp === "created" || leadSourceWhatsApp === "exists"
      : probe.ok,
  };
}

/** Normalise SA / intl mobile toward digits with country code hint. */
export function normaliseWhatsAppMobile(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length === 10) {
    return `+27${digits.slice(1)}`;
  }
  if (digits.startsWith("27") && digits.length >= 11) return `+${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export async function createWhatsAppCrmLead(input: {
  name: string;
  mobile: string;
  email?: string;
  message?: string;
  organization?: string;
}): Promise<{ ok: boolean; detail: string; status?: number }> {
  const name = input.name.trim();
  const mobile = normaliseWhatsAppMobile(input.mobile);
  if (name.length < 2) {
    return { ok: false, detail: "Name required" };
  }
  if (mobile.replace(/\D/g, "").length < 8) {
    return { ok: false, detail: "Valid mobile required" };
  }

  const email =
    input.email?.trim().toLowerCase() ||
    `whatsapp.${mobile.replace(/\D/g, "")}@lead.trustledger.pending`;

  const message = [
    input.message?.trim() || "WhatsApp inbound interest (Ops log).",
    `Mobile: ${mobile}`,
    "Source: WhatsApp · update email when known.",
  ].join("\n");

  const payload: ProductLeadInput = {
    email,
    name,
    company: input.organization,
    message,
    sourceTag: "whatsapp",
    crmSource: "WhatsApp",
    jobTitle: `WhatsApp · ${mobile}`,
    pageName: "whatsapp_ops",
    pageUri: "/ops/accounts",
    mobileNo: mobile,
  };

  try {
    const res = await submitProductLead(payload);
    if (!res.ok) {
      return {
        ok: false,
        detail: res.detail || `HTTP ${res.status || 502}`,
        status: res.status,
      };
    }
    return {
      ok: true,
      detail: `CRM Lead created via ${res.backend} (source WhatsApp)`,
    };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "create failed",
    };
  }
}

export function whatsappSetupTokenOk(headerValue: string | null): boolean {
  const expected =
    cleanSecret(process.env.WHATSAPP_SETUP_TOKEN) ||
    cleanSecret(process.env.CRM_SETUP_TOKEN);
  if (!expected || !headerValue) return false;
  return cleanSecret(headerValue) === expected;
}
