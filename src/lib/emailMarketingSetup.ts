/**
 * EM-1 — push TrustLedger bulk email templates / groups to Frappe Desk.
 * Uses FRAPPE_API_KEY pair. Does not send campaigns or set mailbox passwords.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";

export type EmailMarketingTemplateSpec = {
  /** Desk Email Template name (unique). */
  name: string;
  subject: string;
  file: string;
};

export const EMAIL_MARKETING_TEMPLATES: EmailMarketingTemplateSpec[] = [
  {
    name: "TL Soft Launch",
    subject: "TrustLedger is ready for early partners",
    file: "01-soft-launch.html",
  },
  {
    name: "TL Trial Invite",
    subject: "Your 14-day TrustLedger trial",
    file: "02-trial-invite.html",
  },
  {
    name: "TL Quote Follow-up",
    subject: "Your TrustLedger quote conversation",
    file: "03-quote-followup.html",
  },
  {
    name: "TL Assessment Nudge",
    subject: "SRM readiness diagnostic — TrustLedger",
    file: "04-assessment-nudge.html",
  },
];

export const EMAIL_MARKETING_GROUPS = [
  "TL Warm Contacts",
  "TL Quote Pipeline",
  "TL Trial Invites",
] as const;

export type EmailMarketingStatusRow =
  | "created"
  | "updated"
  | "exists"
  | "missing"
  | "error"
  | "skipped";

export type EmailMarketingProbe = {
  ok: boolean;
  generatedAt: string;
  frappeBase: string;
  apiKeysPresent: boolean;
  emailDeliveryServiceInstalled: boolean | null;
  emailAccounts: Array<{
    name: string;
    emailId: string;
    enableOutgoing: boolean;
    defaultOutgoing: boolean;
  }>;
  salesAccountReady: boolean;
  templates: Record<string, EmailMarketingStatusRow | string>;
  groups: Record<string, EmailMarketingStatusRow | string>;
  humanOnly: string[];
  detail?: string;
};

export type EmailMarketingSetupResult = EmailMarketingProbe & {
  wrote: boolean;
  dryRun: boolean;
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

function packDir(): string {
  return join(process.cwd(), "docs", "exports", "email-marketing");
}

export function readMarketingHtml(file: string): string {
  const path = join(packDir(), file);
  if (!existsSync(path)) {
    throw new Error(`Missing email pack file: ${file}`);
  }
  return readFileSync(path, "utf8");
}

function humanOnlySteps(probe: {
  emailDeliveryServiceInstalled: boolean | null;
  salesAccountReady: boolean;
}): string[] {
  const steps: string[] = [];
  if (probe.emailDeliveryServiceInstalled === true) {
    steps.push(
      "Frappe Cloud → site Apps → uninstall Email Delivery Service (blocks sales@ SMTP).",
    );
  } else if (probe.emailDeliveryServiceInstalled === null) {
    steps.push(
      "Confirm Email Delivery Service is not installed on app.trustledger.co.za (Cloud → Apps).",
    );
  }
  if (!probe.salesAccountReady) {
    steps.push(
      "Desk → Email Account for sales@trustledger.co.za: enter mailbox password, SMTP 465 SSL, enable Outgoing + Default Outgoing, Send Test to yourself.",
    );
  }
  steps.push(
    "Confirm SPF/DKIM/DMARC for trustledger.co.za on Webway DNS (Email Domain green in Desk).",
  );
  steps.push(
    "Import a permissioned warm-contact CSV into Email Group “TL Warm Contacts” (email, first_name).",
  );
  steps.push(
    "Newsletter → TL Soft Launch → test to yourself → send small batch. Do not blast from Resend.",
  );
  return steps;
}

async function listEmailAccounts(
  key: string,
  secret: string,
): Promise<EmailMarketingProbe["emailAccounts"]> {
  const res = await frappeFetch(
    "/api/resource/Email%20Account?fields=%5B%22name%22%2C%22email_id%22%2C%22enable_outgoing%22%2C%22default_outgoing%22%5D&limit_page_length=50",
    { method: "GET", key, secret },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    data?: Array<{
      name?: string;
      email_id?: string;
      enable_outgoing?: number | boolean;
      default_outgoing?: number | boolean;
    }>;
  };
  return (data.data || []).map((row) => ({
    name: String(row.name || ""),
    emailId: String(row.email_id || ""),
    enableOutgoing: Boolean(row.enable_outgoing),
    defaultOutgoing: Boolean(row.default_outgoing),
  }));
}

async function detectEmailDeliveryService(
  key: string,
  secret: string,
): Promise<boolean | null> {
  const candidates = [
    "email_delivery_service",
    "frappe_email_delivery_service",
    "email_delivery",
  ];
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
  // Also try Module Def / apps list via method if resource empty
  const ping = await frappeFetch("/api/method/frappe.utils.change_log.get_versions", {
    method: "GET",
    key,
    secret,
  });
  if (ping.ok) {
    const body = (await ping.json()) as {
      message?: Record<string, unknown>;
    };
    const versions = body.message || {};
    for (const name of Object.keys(versions)) {
      if (/email.?delivery/i.test(name)) return true;
    }
    return false;
  }
  return null;
}

async function ensureEmailTemplate(
  key: string,
  secret: string,
  spec: EmailMarketingTemplateSpec,
  dryRun: boolean,
): Promise<EmailMarketingStatusRow | string> {
  let html: string;
  try {
    html = readMarketingHtml(spec.file);
  } catch (err) {
    return err instanceof Error ? err.message : "missing file";
  }

  const encoded = encodeURIComponent(spec.name);
  const getRes = await frappeFetch(`/api/resource/Email%20Template/${encoded}`, {
    method: "GET",
    key,
    secret,
  });

  if (dryRun) {
    return getRes.ok ? "exists" : "missing";
  }

  const payload = {
    doctype: "Email Template",
    name: spec.name,
    subject: spec.subject,
    use_html: 1,
    response: html,
  };

  if (getRes.ok) {
    const putRes = await frappeFetch(
      `/api/resource/Email%20Template/${encoded}`,
      {
        method: "PUT",
        key,
        secret,
        body: JSON.stringify(payload),
      },
    );
    if (!putRes.ok) {
      const text = await putRes.text();
      return `error: ${text.slice(0, 180)}`;
    }
    return "updated";
  }

  const createRes = await frappeFetch("/api/resource/Email%20Template", {
    method: "POST",
    key,
    secret,
    body: JSON.stringify(payload),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    return `error: ${text.slice(0, 180)}`;
  }
  return "created";
}

async function ensureEmailGroup(
  key: string,
  secret: string,
  title: string,
  dryRun: boolean,
): Promise<EmailMarketingStatusRow | string> {
  const encoded = encodeURIComponent(title);
  const getRes = await frappeFetch(`/api/resource/Email%20Group/${encoded}`, {
    method: "GET",
    key,
    secret,
  });
  if (getRes.ok) return "exists";
  if (dryRun) return "missing";

  const createRes = await frappeFetch("/api/resource/Email%20Group", {
    method: "POST",
    key,
    secret,
    body: JSON.stringify({
      doctype: "Email Group",
      title,
      name: title,
    }),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    return `error: ${text.slice(0, 180)}`;
  }
  return "created";
}

function salesAccountReady(
  accounts: EmailMarketingProbe["emailAccounts"],
): boolean {
  return accounts.some(
    (a) =>
      /sales@trustledger\.co\.za/i.test(a.emailId || a.name) &&
      a.enableOutgoing,
  );
}

export async function probeEmailMarketing(): Promise<EmailMarketingProbe> {
  const pair = frappeKeyPair();
  const generatedAt = new Date().toISOString();
  if (!pair) {
    const empty = {
      ok: false,
      generatedAt,
      frappeBase: frappeBase(),
      apiKeysPresent: false,
      emailDeliveryServiceInstalled: null as boolean | null,
      emailAccounts: [],
      salesAccountReady: false,
      templates: Object.fromEntries(
        EMAIL_MARKETING_TEMPLATES.map((t) => [t.name, "skipped" as const]),
      ),
      groups: Object.fromEntries(
        EMAIL_MARKETING_GROUPS.map((g) => [g, "skipped" as const]),
      ),
      humanOnly: [] as string[],
      detail: "FRAPPE_API_KEY / FRAPPE_API_SECRET missing on this deployment",
    };
    empty.humanOnly = humanOnlySteps(empty);
    return empty;
  }

  try {
    const [emailAccounts, emailDeliveryServiceInstalled] = await Promise.all([
      listEmailAccounts(pair.key, pair.secret),
      detectEmailDeliveryService(pair.key, pair.secret),
    ]);

    const templates: Record<string, EmailMarketingStatusRow | string> = {};
    for (const spec of EMAIL_MARKETING_TEMPLATES) {
      templates[spec.name] = await ensureEmailTemplate(
        pair.key,
        pair.secret,
        spec,
        true,
      );
    }
    const groups: Record<string, EmailMarketingStatusRow | string> = {};
    for (const g of EMAIL_MARKETING_GROUPS) {
      groups[g] = await ensureEmailGroup(pair.key, pair.secret, g, true);
    }

    const salesReady = salesAccountReady(emailAccounts);
    const base = {
      ok: salesReady && emailDeliveryServiceInstalled !== true,
      generatedAt,
      frappeBase: frappeBase(),
      apiKeysPresent: true,
      emailDeliveryServiceInstalled,
      emailAccounts,
      salesAccountReady: salesReady,
      templates,
      groups,
      humanOnly: [] as string[],
    };
    base.humanOnly = humanOnlySteps(base);
    return base;
  } catch (err) {
    const fail = {
      ok: false,
      generatedAt,
      frappeBase: frappeBase(),
      apiKeysPresent: true,
      emailDeliveryServiceInstalled: null as boolean | null,
      emailAccounts: [],
      salesAccountReady: false,
      templates: {},
      groups: {},
      humanOnly: [] as string[],
      detail: err instanceof Error ? err.message : "probe failed",
    };
    fail.humanOnly = humanOnlySteps(fail);
    return fail;
  }
}

export async function ensureEmailMarketing(options?: {
  dryRun?: boolean;
}): Promise<EmailMarketingSetupResult> {
  const dryRun = options?.dryRun !== false;
  const pair = frappeKeyPair();
  const probe = await probeEmailMarketing();
  if (!pair) {
    return { ...probe, wrote: false, dryRun };
  }

  if (dryRun) {
    return { ...probe, wrote: false, dryRun: true };
  }

  const templates: Record<string, EmailMarketingStatusRow | string> = {};
  for (const spec of EMAIL_MARKETING_TEMPLATES) {
    templates[spec.name] = await ensureEmailTemplate(
      pair.key,
      pair.secret,
      spec,
      false,
    );
  }
  const groups: Record<string, EmailMarketingStatusRow | string> = {};
  for (const g of EMAIL_MARKETING_GROUPS) {
    groups[g] = await ensureEmailGroup(pair.key, pair.secret, g, false);
  }

  const refreshed = await probeEmailMarketing();
  return {
    ...refreshed,
    templates: { ...refreshed.templates, ...templates },
    groups: { ...refreshed.groups, ...groups },
    wrote: true,
    dryRun: false,
  };
}

export function emailMarketingSetupTokenOk(
  headerValue: string | null,
): boolean {
  const expected =
    cleanSecret(process.env.EMAIL_MARKETING_SETUP_TOKEN) ||
    cleanSecret(process.env.CRM_SETUP_TOKEN);
  if (!expected || !headerValue) return false;
  return cleanSecret(headerValue) === expected;
}
