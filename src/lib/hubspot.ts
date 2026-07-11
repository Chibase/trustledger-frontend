export type HubSpotField = { name: string; value: string };

export type HubSpotLeadInput = {
  email: string;
  name?: string;
  company?: string;
  message: string;
  pageUri: string;
  pageName: string;
};

function firstNameFrom(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || fullName;
}

function lastNameFrom(fullName: string): string | undefined {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return undefined;
  return parts.slice(1).join(" ");
}

export function hubspotConfigured(): boolean {
  return Boolean(
    process.env.HUBSPOT_PORTAL_ID && process.env.HUBSPOT_FORM_ID,
  );
}

export function siteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://trustledger-frontend-pi.vercel.app"
  ).replace(/\/$/, "");
}

export async function submitHubSpotLead(
  input: HubSpotLeadInput,
): Promise<Response> {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formId = process.env.HUBSPOT_FORM_ID;
  const region = (process.env.HUBSPOT_REGION || "eu1").toLowerCase();

  if (!portalId || !formId) {
    throw new Error("HubSpot portal/form not configured");
  }

  const host =
    region === "na1" || region === "us1"
      ? "api.hsforms.com"
      : `api-${region}.hsforms.com`;

  const url = `https://${host}/submissions/v3/integration/submit/${portalId}/${formId}`;

  const fields: HubSpotField[] = [{ name: "email", value: input.email }];

  if (input.name?.trim()) {
    fields.push({ name: "firstname", value: firstNameFrom(input.name) });
    const lastname = lastNameFrom(input.name);
    if (lastname) fields.push({ name: "lastname", value: lastname });
  }

  if (input.company?.trim()) {
    fields.push({ name: "company", value: input.company.trim() });
  }

  fields.push({ name: "message", value: input.message });

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields,
      context: {
        pageUri: input.pageUri,
        pageName: input.pageName,
      },
    }),
  });
}

export function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}
