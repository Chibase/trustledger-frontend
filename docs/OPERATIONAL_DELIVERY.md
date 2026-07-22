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

## Step 3 — Sync + auto-provision **(ACTIVE)**

**Goal:** Trial/subscribe writes Cloud Customer+User without Ops click; browser `tl-org-data` migrates on first live login.

### Split: agent vs you

| Who | What |
|-----|------|
| **Agent (this packet)** | `provisionOwnerOnCloud` shared lib; Paystack → Cloud when `FRAPPE_AUTO_PROVISION=1`; `POST /api/frappe/migrate-org`; `/login/live` one-shot migrate |
| **You** | Set env flag, redeploy, smoke one Paystack path, confirm Desk Customer+User |

### Your actions

1. Merge OD-3 PR → wait for Vercel.
2. Vercel env (then redeploy):

```bash
FRAPPE_AUTO_PROVISION=1
# keep existing:
FRAPPE_OWNER_ISSUANCE=1
FRAPPE_API_KEY=…
FRAPPE_API_SECRET=…
FRAPPE_BASE_URL=https://app.trustledger.co.za
PLATFORM_OPERATOR_ONLY=1
```

3. Smoke Paystack `/pay` (trial authorize or pay now) with a **new** test email you control.
4. Confirm **Customer + User** appear in Desk **without** clicking Ops Create on Cloud.
5. Optional: with browser org data present, `/login/live` as that Owner (temp allowlist) → projects/incidents migrate once.

### Done when

- [ ] `FRAPPE_AUTO_PROVISION=1` live  
- [ ] One Paystack success creates Cloud Owner without Ops  
- [ ] Lockdown still ON  

**Then tell the agent: “Step 3 complete”** → Step 4 (billing scheduler + lift ADR-013).

---

## Step 3 — Sync + auto-provision

_(Superseded by ACTIVE section above when Step 2 is Done.)_

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
