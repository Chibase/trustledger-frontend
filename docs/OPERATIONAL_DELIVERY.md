# Operational delivery — real platform for customers

**Policy:** Delay public rollout until customers get durable Cloud-backed operations (not browser-only tenancy).  
**Locked:** ADR-032. Soft-launch marketing may continue for `/demo` / leads; **paid production** waits for Steps 1–4 green.

```text
Step 1  Frappe SoT ready (Customer + Plan Owner User smoke)
   ↓
Step 2  Product DocTypes + Cloud File (Project / Incident / Evidence / Media)
   ↓
Step 3  Sync browser org → Cloud + auto-provision on Paystack
   ↓
Step 4  Billing scheduler + suspend/reopen + lift ADR-013 for buyers
   ↓
Step 5  V002 depth (engagements → commitments → grievance → ESG)
   ↓
GO LIVE  Operational grade
```

---

## Step 1 — Frappe SoT ready **(DONE — 2026-07-22)**

Customer + Owner User smoke passed (`nonunu@trustledger.co.za`). Lockdown remains ON.

---

## Step 2 — Product DocTypes + Cloud File **(ACTIVE)**

**Goal:** Org-scoped Project, Incident, Evidence on Frappe; File attach for media >2 MB.

### Split: agent vs you

| Who | What |
|-----|------|
| **Agent (this packet)** | DocType ensure API, product smoke create, `/api/frappe/upload-file`, Ops buttons, readiness Step 2 |
| **You** | Click Check/Create DocTypes → Smoke Project→Incident→Evidence → optional file upload → confirm in Desk |

### Your actions

1. Merge OD-2 PR → wait for Vercel.
2. Ops → Accounts (as Platform Operator):
   - Organization = Frappe **Customer** name (e.g. `Step1 Smoke Test`)
   - **Check product DocTypes** → **Create product DocTypes**
   - **Smoke Project→Incident→Evidence**
3. Optional: upload a file with `POST /api/frappe/upload-file` (or wait for case-desk wiring next).
4. Confirm rows in Desk: **TL Project**, **TL Incident**, **TL Evidence**.

### Done when

- [ ] Three DocTypes exist  
- [ ] One smoke Project + Incident + Evidence under the test Customer  
- [ ] Lockdown still ON  

**Then tell the agent: “Step 2 complete”** → Step 3 (sync + auto-provision).

### Outline (technical)

- DocTypes match `src/types/project.ts`, `incident.ts`, evidence  
- Customer link on every row  
- File upload BFF → Frappe `upload_file`  
- See `docs/PRODUCT_DOCTYPES.md` and `docs/FRAPPE_API_CONTRACT.md`

---

## Step 3 — Sync + auto-provision

**Goal:** Trial/subscribe writes Cloud, not only `localStorage`.

- Migrate `tl-org-data` / media → Cloud on first live login  
- Paystack webhook → `provision-owner` (no manual Ops click)  
- Invite accept creates Frappe User at lower role  

---

## Step 4 — Billing ops + lift lockdown

**Goal:** Day-14 charges scheduled; past_due suspends; buyers use `/login/live`.

- Cron / Ops scheduler for `charge-due`  
- Entitlement status drives access  
- Set `PLATFORM_OPERATOR_ONLY=0` after smoke of Steps 1–3  

---

## Step 5 — V002 operational depth

**Goal:** Market-honest stakeholder intelligence (ADR-023).

- 24c Engagements · 24d Commitments · 24e Grievance lifecycle · 24g ESG indicators  

---

## GO LIVE criteria

| Criterion | Required |
|-----------|----------|
| Owner provision automated or one-click Ops | Yes |
| Customer data on Cloud, not browser-only | Yes |
| Media on Cloud File | Yes |
| Day-14 billing without babysitting | Yes |
| ADR-013 lifted for buyers | Yes |
| Demo path still separate (`/demo`) | Yes |
| No demo `INC-*` in customer live workspace | Yes |

Until then: **do not** promise multi-device production to paying customers.
