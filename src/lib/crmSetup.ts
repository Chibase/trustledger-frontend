import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";

const LEAD_SOURCES = [
  "Paystack Payment",
  "Trial Authorize",
  "Trial Opt-Out",
  "EFT Payment",
  "Quote Request",
  "Product Feedback",
  "Website Contact",
  "Website Demo",
  "Website Assessment",
  "Support Ticket",
] as const;

const LEAD_COLUMNS = [
  { label: "Name", type: "Data", key: "lead_name", width: "12rem" },
  { label: "Email", type: "Data", key: "email", width: "12rem" },
  {
    label: "Job Title",
    type: "Data",
    key: "job_title",
    width: "14rem",
  },
  {
    label: "Source",
    type: "Link",
    key: "source",
    options: "CRM Lead Source",
    width: "10rem",
  },
  {
    label: "Organization",
    type: "Data",
    key: "organization",
    width: "10rem",
  },
  {
    label: "Status",
    type: "Link",
    key: "status",
    options: "CRM Lead Status",
    width: "8rem",
  },
  {
    label: "Last Modified",
    type: "Datetime",
    key: "modified",
    width: "8rem",
  },
];

const LEAD_ROWS = [
  "name",
  "lead_name",
  "email",
  "job_title",
  "source",
  "organization",
  "status",
  "modified",
  "first_name",
  "image",
  "_assign",
];

type SetupResult = {
  ok: boolean;
  sources: Record<string, "created" | "exists" | "error">;
  views: Record<string, "created" | "exists" | "error" | string>;
  defaultColumns: "updated" | "error" | string;
  detail?: string;
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

async function ensureLeadSource(
  key: string,
  secret: string,
  sourceName: string,
): Promise<"created" | "exists" | "error"> {
  const encoded = encodeURIComponent(sourceName);
  const getRes = await frappeFetch(
    `/api/resource/CRM%20Lead%20Source/${encoded}`,
    { method: "GET", key, secret },
  );
  if (getRes.ok) return "exists";

  const createRes = await frappeFetch("/api/resource/CRM%20Lead%20Source", {
    method: "POST",
    key,
    secret,
    body: JSON.stringify({
      doctype: "CRM Lead Source",
      source_name: sourceName,
      details: `<p>TrustLedger website intake · ${sourceName}</p>`,
    }),
  });
  if (createRes.ok) return "created";

  // Race / duplicate name
  const text = await createRes.text().catch(() => "");
  if (/Duplicate|exists|Unique/i.test(text)) return "exists";
  console.error("[crm-setup] source failed", sourceName, text.slice(0, 300));
  return "error";
}

async function listViews(
  key: string,
  secret: string,
): Promise<Array<{ name: string | number; label?: string; pinned?: number }>> {
  const res = await frappeFetch(
    `/api/method/crm.api.views.get_views?doctype=${encodeURIComponent("CRM Lead")}`,
    { method: "GET", key, secret },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    message?: Array<{ name: string | number; label?: string; pinned?: number }>;
  };
  return Array.isArray(json.message) ? json.message : [];
}

async function createPinnedView(
  key: string,
  secret: string,
  label: string,
  filters: Record<string, unknown>,
): Promise<"created" | "exists" | "error" | string> {
  const existing = await listViews(key, secret);
  const found = existing.find((v) => v.label === label);
  if (found) {
    // Ensure pinned + public
    await frappeFetch(
      "/api/method/crm.fcrm.doctype.crm_view_settings.crm_view_settings.pin",
      {
        method: "POST",
        key,
        secret,
        body: JSON.stringify({ name: found.name, value: 1 }),
      },
    );
    await frappeFetch(
      "/api/method/crm.fcrm.doctype.crm_view_settings.crm_view_settings.public",
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
        view: {
          label,
          type: "list",
          doctype: "CRM Lead",
          route_name: "Leads",
          filters,
          order_by: "modified desc",
          columns: LEAD_COLUMNS,
          rows: LEAD_ROWS,
          load_default_columns: false,
        },
      }),
    },
  );
  const createText = await createRes.text();
  if (!createRes.ok) {
    console.error("[crm-setup] view create failed", label, createText.slice(0, 400));
    return `error:${createText.slice(0, 160)}`;
  }

  let name: string | number | undefined;
  try {
    const json = JSON.parse(createText) as { message?: { name?: string | number } };
    name = json.message?.name;
  } catch {
    /* ignore */
  }
  if (name === undefined) return "error:no-name";

  await frappeFetch(
    "/api/method/crm.fcrm.doctype.crm_view_settings.crm_view_settings.pin",
    {
      method: "POST",
      key,
      secret,
      body: JSON.stringify({ name, value: 1 }),
    },
  );
  await frappeFetch(
    "/api/method/crm.fcrm.doctype.crm_view_settings.crm_view_settings.public",
    {
      method: "POST",
      key,
      secret,
      body: JSON.stringify({ name, value: 1 }),
    },
  );
  return "created";
}

async function updateDefaultColumns(
  key: string,
  secret: string,
): Promise<"updated" | "error" | string> {
  const res = await frappeFetch(
    "/api/method/crm.fcrm.doctype.crm_view_settings.crm_view_settings.create_or_update_standard_view",
    {
      method: "POST",
      key,
      secret,
      body: JSON.stringify({
        view: {
          label: "List",
          type: "list",
          doctype: "CRM Lead",
          route_name: "Leads",
          filters: {},
          order_by: "modified desc",
          columns: LEAD_COLUMNS,
          rows: LEAD_ROWS,
          load_default_columns: false,
          is_default: 1,
        },
      }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    console.error("[crm-setup] default columns failed", text.slice(0, 400));
    return `error:${text.slice(0, 160)}`;
  }
  return "updated";
}

/** Idempotent CRM Desk bootstrap for TrustLedger intake views. */
export async function bootstrapCrmViews(): Promise<SetupResult> {
  const pair = frappeKeyPair();
  if (!pair) {
    return {
      ok: false,
      sources: {},
      views: {},
      defaultColumns: "error",
      detail: "FRAPPE_API_KEY / FRAPPE_API_SECRET missing",
    };
  }

  const sources: SetupResult["sources"] = {};
  for (const name of LEAD_SOURCES) {
    sources[name] = await ensureLeadSource(pair.key, pair.secret, name);
  }

  const views: SetupResult["views"] = {};
  views["Launch feedback"] = await createPinnedView(
    pair.key,
    pair.secret,
    "Launch feedback",
    {
      source: ["=", "Product Feedback"],
      status: ["=", "New"],
    },
  );
  views["Contact queue"] = await createPinnedView(
    pair.key,
    pair.secret,
    "Contact queue",
    { source: ["=", "Website Contact"] },
  );
  views.Support = await createPinnedView(pair.key, pair.secret, "Support", {
    source: ["=", "Support Ticket"],
  });

  const defaultColumns = await updateDefaultColumns(pair.key, pair.secret);

  const ok =
    Object.values(sources).every((v) => v === "created" || v === "exists") &&
    Object.values(views).every((v) => v === "created" || v === "exists") &&
    defaultColumns === "updated";

  return { ok, sources, views, defaultColumns };
}

export function crmSetupTokenOk(headerValue: string | null): boolean {
  const expected = cleanSecret(process.env.CRM_SETUP_TOKEN);
  if (!expected) return false;
  const got = cleanSecret(headerValue || undefined);
  if (!got || got.length !== expected.length) return false;
  // Constant-time-ish compare
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ got.charCodeAt(i);
  }
  return diff === 0;
}
