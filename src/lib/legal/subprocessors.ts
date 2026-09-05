/**
 * SEC-2 — public subprocessors note (L4 lite).
 * Legal/privacy page, not marketing. Product FAQ stays stack-brand-free.
 */

export type SubprocessorRow = {
  name: string;
  role: string;
  region: string;
};

export const SUBPROCESSORS: readonly SubprocessorRow[] = [
  {
    name: "Frappe Cloud",
    role: "TrustLedger Cloud desk, CRM Lead, Customer, and workspace records",
    region: "Site region as contracted for app.trustledgersrm.co.za",
  },
  {
    name: "Vercel Inc.",
    role: "Product application hosting and edge delivery",
    region: "As configured for the TrustLedger product app",
  },
  {
    name: "Resend",
    role: "Transactional email only (OTP, trial welcome, invite mail) — not marketing blasts",
    region: "Provider default",
  },
  {
    name: "Paystack",
    role: "Card checkout and subscription charges for entitled plans",
    region: "South Africa / provider default",
  },
  {
    name: "Webway",
    role: "Public marketing site and mailbox (MX) for trustledgersrm.co.za",
    region: "South Africa",
  },
];

export const PURGE_SLA_DAYS = 30;
export const PURGE_RUNBOOK_PATH = "docs/PURGE_RUNBOOK.md";
