export type SupportCategoryCode =
  | "LOGIN_FAILED"
  | "SESSION_EXPIRED"
  | "SYSTEM_DOWN"
  | "DATA_MISSING"
  | "REPORT_FAIL"
  | "AI_ASSIST_FAIL"
  | "UPLOAD_FAIL"
  | "PERMISSION_DENIED"
  | "PERF_SLOW"
  | "BILLING_ACCESS"
  | "BROWSER_CACHE"
  | "NOTIFY_FAIL"
  | "OTHER";

export type SupportCategory = {
  code: SupportCategoryCode;
  label: string;
  selfServe?: string;
};

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  {
    code: "LOGIN_FAILED",
    label: "Unable to log in",
    selfServe:
      "Use live sign-in, confirm work email, or request a password reset from your admin.",
  },
  {
    code: "SESSION_EXPIRED",
    label: "Logged out / session problems",
    selfServe: "Use Repair session below, then sign in again.",
  },
  {
    code: "SYSTEM_DOWN",
    label: "System appears down",
    selfServe: "Check Status. If red, we are already notified — retry shortly.",
  },
  {
    code: "DATA_MISSING",
    label: "Cannot see my projects or cases",
    selfServe: "Confirm you are in the right role and project filter is cleared.",
  },
  {
    code: "REPORT_FAIL",
    label: "Cannot generate reports",
    selfServe: "Retry once. If it fails again, submit a ticket with the report type.",
  },
  {
    code: "AI_ASSIST_FAIL",
    label: "AI assist not working",
    selfServe:
      "Retry the suggestion. Demo mode uses sample AI until TrustLedger Cloud AI is enabled.",
  },
  {
    code: "UPLOAD_FAIL",
    label: "File / evidence upload failed",
  },
  {
    code: "PERMISSION_DENIED",
    label: "Permission denied / wrong access",
    selfServe: "Access is role-based. We will not auto-elevate permissions.",
  },
  {
    code: "PERF_SLOW",
    label: "Pages are slow or timing out",
  },
  {
    code: "BILLING_ACCESS",
    label: "Paid but still blocked / demo mode",
  },
  {
    code: "BROWSER_CACHE",
    label: "UI looks broken after an update",
    selfServe: "Hard-refresh (Ctrl+Shift+R) or try a private window.",
  },
  {
    code: "NOTIFY_FAIL",
    label: "Not receiving email notifications",
  },
  {
    code: "OTHER",
    label: "Something else",
  },
];
