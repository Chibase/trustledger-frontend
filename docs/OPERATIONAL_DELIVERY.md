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

## Step 1 — Frappe SoT ready **(ACTIVE)**

**Goal:** One real Customer + Plan Owner User on `app.trustledger.co.za`; operator can provision via Ops; buyer live login works for that Owner only after smoke (lockdown still on for the public).

### Split: agent vs you

| Who | What |
|-----|------|
| **Agent (done in repo)** | Ops `/ops/readiness`, `POST /api/frappe/ensure-custom-fields`, provision auto-creates Desk fields on live create, User custom fields on create |
| **You (cannot automate from here)** | Vercel env + merge/deploy + one Ops click smoke + controlled live login |

There are **no Frappe/Vercel secrets in the agent environment**, so Desk writes and production smoke must run on your Vercel deployment after you flip the flag.

### Your actions only (short)

1. **Merge** the OD-1 PR and wait for Vercel deploy.
2. On **Vercel** set/confirm:

```bash
FRAPPE_OWNER_ISSUANCE=1
FRAPPE_API_KEY=…          # must create Customer, User, Custom Field
FRAPPE_API_SECRET=…
FRAPPE_BASE_URL=https://app.trustledger.co.za
PLATFORM_OPERATOR_ONLY=1
PLATFORM_OPERATOR_EMAILS=admin@chibaseconsulting.co.za
```

Redeploy after env changes.

3. Live-login as Platform Operator → **Ops → Accounts**:
   - Optional: **Check Desk fields** / **Create Desk fields**
   - **Dry-run draft** for a **test** buyer email you control
   - **Create on Cloud** (auto-ensures custom fields, then creates Customer + User)
   - Confirm Customer + User in Desk

4. Smoke `/login/live` as that Owner (temporarily add their email to `PLATFORM_OPERATOR_EMAILS` if needed). Confirm `/app` with **no demo `INC-*` seed**.

### Fallback — manual Desk fields (only if API ensure fails)

| Fieldname | Label | Type | Options |
|-----------|-------|------|---------|
| `custom_plan_code` | Plan code | Select | `practitioner\nproject\ninstitutional` |
| `custom_seat_limit` | Seat limit | Int | — |
| `custom_project_limit` | Project limit | Int | — |
| `custom_entitlement_status` | Entitlement status | Select | `trial\nactive\npast_due\ncancelled` |
| `custom_tl_org_id` | TrustLedger org id | Data | — |
| `custom_owner_email` | Owner email | Data | — |

User (recommended): `custom_tl_desk_tier`, `custom_tl_plan_owner`, `custom_tl_customer` (Link → Customer).

### Done when

- [ ] Vercel issuance + keys live  
- [ ] Dry-run returns drafts  
- [ ] Live create succeeds once (fields exist or were auto-created)  
- [ ] Owner can live-login in a controlled smoke  
- [ ] `PLATFORM_OPERATOR_ONLY` still **ON**  

**Then tell the agent: “Step 1 complete”** → we start Step 2.

---

## Step 2 — Product DocTypes + Cloud File

**Goal:** Org-scoped Project, Incident, Evidence on Frappe; File attach for media >2 MB.

### Outline (detail when Step 1 done)

- DocTypes (or `srm_core` methods) matching `src/types/project.ts`, `incident.ts`, evidence  
- Customer link / permission on every row  
- File upload API + frontend switch from `tl-org-media` data URLs to Cloud File  
- `FRAPPE_API_CONTRACT.md` methods: create/list/update for projects, incidents, evidence  

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
