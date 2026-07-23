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

## Step 2 — Product DocTypes + Cloud File **(DONE — 2026-07-22)**

DocTypes + Project/Incident/Evidence smoke under `Step1 Smoke Test` passed.

---

## Step 3 — Sync + auto-provision **(DONE — 2026-07-23)**

Paystack creates Customer+User without Ops click; lockdown still ON.

---

## Step 4 — Billing ops + lift lockdown **(ACTIVE)**

**Goal:** Day-14 charges run on a schedule; `past_due` blocks buyer live login; then lift ADR-013.

### Split: agent vs you

| Who | What |
|-----|------|
| **Agent (this packet)** | `vercel.json` cron → `/api/cron/charge-due`; entitlement fields + login gate; Ops Finance charge-due panel |
| **You** | `CRON_SECRET`, Desk fields refresh, charge smoke, then `PLATFORM_OPERATOR_ONLY=0` |

### Your actions

1. Merge OD-4 PR → wait for Vercel.
2. Ops → Accounts → **Create Desk fields** (adds `custom_bill_at`, `custom_authorization_code`, `custom_plan_amount_cents`).
3. Vercel:
   ```bash
   CRON_SECRET=<long-random-string>
   # keep PLATFORM_OPERATOR_ONLY=1 until charge smoke passes
   ```
4. Ops → Finance → **Dry-run due list** (empty is OK until a trial is due).
5. Smoke (optional forced): on a test Customer set `custom_bill_at` to past + valid authorization → **Charge due now** → status `active` or `past_due`.
6. When green, set `PLATFORM_OPERATOR_ONLY=0`, redeploy, smoke buyer `/login/live`. Keep `PLATFORM_OPERATOR_EMAILS` for `/ops`.

### Done when

- [ ] Cron route + CRON_SECRET live  
- [ ] Charge-due updates entitlement  
- [ ] Buyer live login works with lockdown off (or past_due blocks)  
- [ ] Ops still allowlist-only  

**Then tell the agent: “Step 4 complete”** → Step 5 (V002 depth) or GO LIVE criteria.

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
