# CRM views — user feedback & lead relevance

Website contact, product feedback, demo, assessment, and support all create **Frappe CRM → CRM Lead** records. Structure them so you can scan **relevance** without opening every email.

## 0. Automated bootstrap (preferred)

Production can create sources, default Lead columns, and pinned filters via:

```bash
# set once in Vercel Production, then remove after success
CRM_SETUP_TOKEN=<random>

curl -sS -X POST "https://trustledger-frontend-pi.vercel.app/api/frappe/crm-setup" \
  -H "x-tl-crm-setup: $CRM_SETUP_TOKEN"
```

Hard-refresh Frappe CRM afterward. Remove `CRM_SETUP_TOKEN` from Vercel when done.

## 1. Create Lead Sources (once in Desk)

**CRM Lead Source** (exact names — used by the app by default):

| Source name | What lands here |
|-------------|-----------------|
| `Product Feedback` | Assessment + demo **Feedback** (rating + note) |
| `Website Contact` | `/contact` form |
| `Website Demo` | Demo entry + soft gate |
| `Website Assessment` | Assessment unlock lead |
| `Support Ticket` | In-app Support escalate |

If a source name is missing, intake still saves (source omitted) and Vercel logs a warning.

Optional Vercel overrides:

```bash
FRAPPE_LEAD_SOURCE_PRODUCT_FEEDBACK=Product Feedback
FRAPPE_LEAD_SOURCE_CONTACT=Website Contact
FRAPPE_LEAD_SOURCE_DEMO_ENTRY=Website Demo
FRAPPE_LEAD_SOURCE_ASSESSMENT=Website Assessment
FRAPPE_LEAD_SOURCE_SUPPORT_TICKET=Support Ticket
```

## 2. What to show in the Leads list

Add columns (CRM Lead list → menu → Edit Columns):

- **Full Name**
- **Email**
- **Job Title** ← list label (`Feedback · 4/5 · /assessment`, `Contact enquiry`, `Support · LOGIN_FAILED`, …)
- **Source**
- **Organization**
- **Status**
- **Modified**

## 3. Saved filters (recommended)

Create and pin:

1. **Launch feedback** — Source = `Product Feedback`, Status = `New`  
2. **Weak experience** — Source = `Product Feedback`, Job Title contains `· 1/` or `· 2/` (or open lead and check Rating in Activity)  
3. **Contact queue** — Source = `Website Contact`  
4. **Support** — Source = `Support Ticket`

Open a lead → **Activity / Comments** for the full **User view**, rating, path, and a `TL_META` line for search.

## 4. Relevance guide (product feedback)

| Rating | Job Title cue | Suggested action |
|--------|---------------|------------------|
| 1–2 | `Feedback · 1/5` / `2/5` | Treat as product risk; reply same day |
| 3 | `Feedback · 3/5` | Triage for gaps / copy confusion |
| 4–5 | `Feedback · 4/5` / `5/5` | Quote bank / case-study candidate |

Comment header also states relevance (“High attention…”, “Positive…”).

## 5. Status hygiene

Keep intake status **`New`**. After review:

- Convert or qualify sales-ready contacts  
- Close / mark lost noise  
- Leave feedback leads in a dedicated “Reviewed” status if you add one under **CRM Lead Status**

Do **not** mix product-feedback triage into HubSpot if `LEAD_BACKEND=frappe`.
