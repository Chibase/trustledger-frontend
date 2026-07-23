# Operational delivery — real platform for customers

**Policy:** Delay public rollout until customers get durable Cloud-backed operations (not browser-only tenancy).  
**Locked:** ADR-032. Soft-launch marketing may continue for `/demo` / leads; **paid production** waits for Steps 1–4 green *(Steps 1–4 Done — 2026-07-23)*.

```text
Step 1  Frappe SoT ready (Customer + Plan Owner User smoke)
   ↓
Step 2  Product DocTypes + Cloud File (Project / Incident / Evidence / Media)
    10|   ↓
Step 3  Sync browser org → Cloud + auto-provision on Paystack
   ↓
Step 4  Billing scheduler + suspend/reopen + lift ADR-013 for buyers
   ↓
Step 5  V002 depth (engagements → commitments → grievance → ESG)  ← ACTIVE
   ↓
GO LIVE  Operational grade
```

    20|---

## Step 1 — Frappe SoT ready **(DONE — 2026-07-22)**

Customer + Owner User smoke passed (`nonunu@trustledger.co.za`). Lockdown remains ON.

---

## Step 2 — Product DocTypes + Cloud File **(DONE — 2026-07-22)**

    30|DocTypes + Project/Incident/Evidence smoke under `Step1 Smoke Test` passed.

---

## Step 3 — Sync + auto-provision **(DONE — 2026-07-23)**

Paystack creates Customer+User without Ops click; lockdown still ON.

---

    40|## Step 4 — Billing ops + lift lockdown **(DONE — 2026-07-23)**

Day-14 charge cron + entitlement gate live. `PLATFORM_OPERATOR_ONLY=0`; buyer `/login/live` smoke passed. Ops stay allowlist via `PLATFORM_OPERATOR_EMAILS`.

### Done when

- [x] Cron route + CRON_SECRET live
- [x] Charge-due updates entitlement
- [x] Buyer live login works with lockdown off (or past_due blocks)
- [x] Ops still allowlist-only

---

## Step 5 — V002 operational depth **(DEMO CORE DONE — 2026-07-23)**

**Goal:** Market-honest stakeholder intelligence (ADR-023).

- 24c Engagements · 24d Commitments · 24e Grievance lifecycle · 24g ESG indicators — **demo modules shipped**
- Follow-ups: Cloud DocTypes / Stats SA ingest / live Grok via srm-core

**Then tell the agent: “Step 5 complete”** after you accept demo depth (or after Cloud follow-ups) → GO LIVE criteria.

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
