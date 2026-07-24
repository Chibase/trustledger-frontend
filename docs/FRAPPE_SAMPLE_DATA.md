# Frappe sample / seed data vs TrustLedger reports

## How to verify Create report is healthy

You are on the right build when **all** of these are true after **AI write the report**:

1. URL is `https://trustledger-frontend-pi.vercel.app/...` (not `app.trustledger.co.za` Frappe Desk)
2. Page shows **Data in scope:** with `INC-…` case ids
3. Suggestion footer: **Model: trustledger-evidence-evidence** (or `trustledger-evidence`)
4. Body cites cases like `INC-1001` — never `[Month/Year]` / `[Insert Topic Name]`

If you still see a “comprehensive monthly report” / `[Month/Year]` outline, you are either on a stale browser tab, or generating from **Frappe Desk AI** (`app.trustledger.co.za`), not TrustLedger Create report. Hard-refresh (`Ctrl/Cmd+Shift+R`) or clear site data for the Vercel host, then retry from `/demo` → Create report.

## Short answer

**Deleting Frappe Desk sample data will not fix Month-End / `[Insert …]` AI reports.**

Those templates come from the **Cloud LLM** (`srm_core.api.ai.*` → Grok), not from stored Customers, Items, or Sales Invoices. TrustLedger Create Report no longer calls those AI methods — it uses the local **evidence writer** grounded on demo `INC-*` cases.

## What *is* safe to clean on Frappe Cloud (optional)

If the Desk feels cluttered with ERPNext demo company noise, you may archive or delete **unrelated** sample masters on `app.trustledger.co.za`:

| Keep | Optional clear |
|------|----------------|
| Your real Company, Users, Roles | Demo Customers / Leads you did not create |
| Paystack / Payments configuration | Sample Items, Warehouses, Price Lists unused by TrustLedger |
| Any TrustLedger / `srm_core` DocTypes once live | Stock “Academic” / “Demo” company trees if unused |

Prefer **archive / disable** over hard delete until you are sure nothing references the row. Do **not** delete Payment Gateway / Mode of Payment / Fiscal Year needed for Paystack.

This cleanup is **CRM hygiene only**. It does not change frontend report compose.

## What to clear in the browser instead

Old bad drafts live in **this browser**, not Frappe:

1. Open TrustLedger → Report library (dashboard) or Create report.
2. The app auto-removes drafts that look like Month-End / placeholder guides.
3. Or use **Clear browser library**, or DevTools → Application → Local Storage → delete `tl-authored-reports`.
4. Hard-refresh (`Ctrl/Cmd+Shift+R`), open **Create a report**, run **AI write the report**.
5. Confirm the suggestion footer shows model **`trustledger-evidence`** (not a Grok/Frappe model id).
6. The body should cite **`INC-…`** case ids — never `[Insert Total Sales]`.

## Do not

- Expect wiping ERPNext sample DocTypes to change AI wording.
- Re-enable `srm_core.api.ai.compose_activity_report` / `generate_report_brief` from the frontend until those Cloud prompts are rewritten for SRM evidence.
- Point buyers at Frappe Desk AI for activity reports — use TrustLedger `/app/reports`.
