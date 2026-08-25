# Post-payment access & seats

**Locked with ADR-012.**  
**Override while active:** ADR-013 Platform Operator lockdown — see `docs/PLATFORM_OPERATOR.md`. **Lifted for buyers (Step 4 Done — 2026-07-23):** public live login allowed when `PLATFORM_OPERATOR_ONLY=0`. `/ops` remains allowlist-only via `PLATFORM_OPERATOR_EMAILS`.

After payment (or confirmed commitment), TrustLedger issues logins from **plan entitlements**. The **purchaser is Plan Owner**; they alone hold org **admin** and may invite others at **lower** roles.

```text
Paystack payment success / Commitment
        ↓
Create Frappe Customer + Contact
        ↓
Issue Plan Owner login (role: admin, org-scoped)
  · dashboard · reporting · settings · invite seats
        ↓
Owner invites people + chooses lower role
        ↓
Invitee accepts → User created at that role
```

Gateway setup: `docs/PAYMENTS_SETUP.md` (Paystack + Frappe Paystack on Cloud).

## Roles (existing four — org-scoped)

| Role | Typical who | Access (product) | Can invite? |
|------|-------------|------------------|-------------|
| **admin** (Plan Owner only at purchase) | Lead consultant / buyer | Full org desk: dashboard, projects, incidents, reports, settings, seat invites | **Yes** — lower roles only |
| **client** | Client / funder / sponsor on the account | Portfolio KPIs, reports, read-heavy governance views | No |
| **contractor** | Delivery / site teams | Assigned projects, incidents, field report | No |
| **community** | Community liaison / ward users | Ward-scoped status, report issue, limited case view | No |

There is **no** second “super-admin” above Owner for a customer org. **Platform Operator** (Chibase / you) is a separate, env-gated control plane for the whole product — not an org role. See ADR-013.

## Plan → seats (entitlements)

Aligned to marketing tiers (ADR-035 Solo entry):

| Plan | Owner | Additional seats | Notes |
|------|-------|------------------|-------|
| **Solo** (entry) | 1 × **admin** (purchaser) | **0** | Lone consultant essentials — no AI Assist, 1 project |
| **Practitioner** | 1 × **admin** (purchaser) | **0** by default (optional later: +1–2 paid add-ons) | Owner + AI Assist + light governance |
| **Project** | 1 × **admin** | Unlimited **per project environment** at client/contractor/community | Owner assigns people to projects |
| **Institutional** | 1+ owners (custom) | Custom roles/seats/regions | Sales-defined |

**Rule:** Only the Plan Owner is created automatically at payment. Everyone else is **invited by the Owner** with an explicit lower role.

## Plan entitlement matrix (what we limit)

| Limit | Solo | Practitioner | Project | Institutional |
|-------|------|--------------|---------|---------------|
| **Owner seats** | 1 admin | 1 admin | 1 admin | Custom |
| **Team seats** | 0 (owner only) | 0 (owner only) | Unlimited **per project** | Custom |
| **Active projects** | **1** | Up to **2** | 1+ (per purchased project env) | Multi-region / many |
| **Roles invitees may get** | — (no invites) | — (no invites) | client, contractor, community | Custom + extra admins if sold |
| **Reports / briefs** | Monthly operational | Standard + light governance | Full project + predictive views | Deep / custom analytics |
| **AI assist** | **No** | Standard sentiment / triage | Full assist set | Custom / higher limits |
| **API / integrations** | No | No | No (or light) | Yes (custom) |
| **Hosting / tenancy** | Shared Customer tenancy | Shared | Shared (+ Trust Pack target) | Dedicated / Isolation options |
| **DPA / subprocessors** | On request | On request | Target included | Contracted |
| **Support** | In-app | In-app | In-app | Named + Helpdesk |

Detail and ladder: `docs/SECURITY_TENANCY.md` (ADR-038).

Demo mode ignores paid entitlements (sample data only).

## How enforcement works (two layers)

```text
Frappe Customer.entitlement  ← source of truth (plan, seats, project_cap, flags)
        ↓
Session / get_session returns { role, customer, plan, entitlements }
        ↓
┌─────────────────────┬──────────────────────────────┐
│ UI (Vercel)         │ API (Frappe whitelisted)     │
│ Hide/disable nav,   │ Reject create/invite/report  │
│ upgrade CTAs        │ if over cap or flag off      │
└─────────────────────┴──────────────────────────────┘
```

1. **Source of truth (Frappe Cloud)**  
   On Customer (or Subscription DocType): `plan_code`, `seat_limit`, `project_limit`, `features` (JSON flags), `status` (active/past_due/cancelled).

2. **Session**  
   `get_session` (or BFF) includes entitlements so the app knows the plan without trusting the browser.

3. **UI gates**  
   - Practitioner: hide Team invites; block “3rd project” with upgrade message.  
   - Project: allow invites; scope users to project membership.  
   - Feature flags hide Reports depth / API settings if not entitled.

4. **API gates (must have — UI alone is not enough)**  
   Before `create_project`, `invite_user`, `generate_report_brief`, etc.:  
   `assert_entitlement(customer, action)`.  
   Over limit → `403` + `{ code: "PLAN_LIMIT", upgrade: "project" }`.

5. **Billing state**  
   Paystack webhook sets `status`. `past_due` / `cancelled` → read-only or login blocked after grace period (Owner still sees billing CTA).

## Live organisation boundary (SEC-1)

Live desks resolve the organisation from the Plan Owner sign-in (`Customer.custom_owner_email`). A client-supplied Customer name is **ignored** unless the caller is a Platform Operator (break-glass).

- **Plan Owner Cloud User** is stamped with a Customer User Permission (`apply_to_all_doctypes`). Desk + sid calls only see that organisation.
- **BFF lists/writes** (SI, migrate, uploads, project list) bind that Customer and drop rows not stamped to it.
- **Junior seats** remain browser-local until **SEC-5**. Do not tell buyers every teammate login is Cloud-permissioned.

Playbook: `docs/FRAPPE_USER_PERMISSIONS.md`. Ladder: `docs/SECURITY_TENANCY.md`.

## Practical checks (examples)

| Action | Practitioner | Project |
|--------|--------------|---------|
| Owner logs in | Allow | Allow |
| Invite teammate | **Deny** + upgrade | Allow if under seat rules |
| Create project #3 | **Deny** | Allow if within purchased project envs |
| Open Reports | Standard only | Full |
| Call custom API | Deny | Deny (unless sold) |

## Manual control before Paystack automation

Until webhooks exist, you set on the Customer in Frappe:

- `plan_code = practitioner | project | institutional`  
- `project_limit = 2` (practitioner) or N  
- `seat_limit = 1` or unlimited flag  
- `status = active`  

Owner login still works; limits are enforced as soon as API/UI checks read those fields.

1. Owner opens **Settings → Team / Seats** (to build).  
2. Enters name + work email + **suggested role** (`client` \| `contractor` \| `community`).  
3. Owner **confirms** role (cannot pick `admin` for invitees on Practitioner/Project without sales exception).  
4. System emails the invitee **Accept** and **Decline** links (`/invite/accept?invite=…` / `/invite/reject?invite=…`). Links are signed (14-day TTL) so they work on any device. Requires Resend (`RESEND_API_KEY`) and a **verified** From address (`RESEND_FROM_EMAIL`, or auto `noreply@` a verified Resend domain — not only `onboarding@resend.dev`, which can only reach the Resend account owner). `/api/health` → `launch.inviteEmailReady`; Owners see a Team / Seats banner when mail cannot reach colleagues. If mail is unset or blocked, the Owner still gets a portable share link.  
5. Invitee accepts (sets password) or declines; Plan Owner is emailed the decision. Until Cloud seats (SEC-5), acceptance is browser-local.  
6. **Passwords (live Plan Owner):** Settings → Passwords — change own Cloud password, or issue a temporary Cloud password for the Owner / Users linked to their Customer (lost-password recovery). Guest Forgot password remains on `/login/live`.  
7. Seat counts against plan entitlement; over-limit → block invite + upgrade CTA.

“Suggest” = Owner proposes person + role; **Confirm** = Owner submits invite (no auto-admin for colleagues).

## What the Owner gets at issuance (email pack)

- Login URL: `/login/live`  
- Username (email)  
- Temporary password **or** set-password link  
- Plan name + seat summary  
- Link to invite teammates (if plan allows)

## Allow / deny (security)

**Allowed automated actions after payment**
- Create Customer + Owner User with `admin`  
- Send Owner credentials  
- Create invited Users only after Owner-confirmed invite  
- Enforce seat caps from plan  

**Never automated**
- Promoting invitee to `admin` without Owner + (for Institutional) sales rules  
- Cross-tenant access  
- Creating users from HubSpot without payment/commitment trigger  

## HubSpot → Frappe (ties to CRM_HANDOFF / HS_CUTOVER)

| Stage | Action |
|-------|--------|
| Lead / assessment / contact / quote / support | **Frappe CRM Lead** (Vercel forms; ADR-034) |
| Payment or Commitment | Frappe Customer + **Owner admin** user |
| Ongoing team | Owner invites in-app → Frappe Users |

HubSpot is cutover fallback only (`docs/HS_CUTOVER.md`). Never create product logins from HubSpot.

## Demo / trial tenancy (frontend packets T1–T5)

Until ADR-013 lockdown lifts and Frappe Customer/User is SoT:

- **Plan Owner org** is created in browser `localStorage` when trial/subscribe starts (`startTrialCookies` → `bootstrapPlanOwnerOrg`).
- **Settings → Team / Seats** lets the Owner invite juniors with role + desk exposure; **Create invite & email** sends Accept/Decline via Resend when configured.
- **Seat caps:** Practitioner = 0 juniors; Project / Institutional = unlimited in demo.
- **Desk ranks (1 highest → 5 lowest):** Client/Board/funder → CEO/MD → Director/PM → Site foreman/supervisor → CLO. On **paid** plans, Plan Owner sits at the plan ceiling: Project may invite only **strictly lower** ranks; **Institutional** may invite **at or below** Owner (Client/Board peers + juniors). Higher desks stay greyed. **VIP** skips seat caps and remaining desk-level gates — see `docs/VIP_ACCESS.md`.
- **T3 data space:** org-scoped projects/cases (`tl-org-data`); CSV import; no demo seed in trial.
- **T4 media:** org media library + plan quotas (25 MB / 250 MB / 2 GB soft); Settings meter.
- **T5 prep:** Customer + Owner User drafts via `/api/frappe/provision-owner` (operator + `FRAPPE_OWNER_ISSUANCE`); see `docs/FRAPPE_SOT.md`.
- **OD / GO LIVE (Done 2026-07-23):** Operational delivery complete — Cloud SoT + billing + buyer live. Ladder: `docs/OPERATIONAL_DELIVERY.md` / `/ops/readiness` (ADR-032). Keep `/demo` separate. Launch runbook: `docs/LAUNCH_WATCHLIST.md`.
- Invite accept at `/invite/accept` (portable `?invite=` or legacy `?token=&org=`) locks the invitee’s desk tier (cannot self-raise). Decline at `/invite/reject`. Invitees use **trial** (customer) mode so demo `INC-*` never appears.
- Buyer live login is open (`PLATFORM_OPERATOR_ONLY=0`); `/ops` stays allowlist-only.

## Client branding (future)

Product chrome stays **TrustLedger** only. Optional client co-brand is plan-density dependent and **not shipped yet**:

| Plan | Density |
|------|---------|
| Practitioner | None |
| Project | Optional later (report footer co-name) |
| Institutional | Co-brand on exports/PDF headers only (capability TBD) |

Never replace the TrustLedger wordmark in app nav. Owner legal mark **Chibase Consulting** remains footer/ops attribution only.

## Build sequence (after Paystack sandbox)

1. Entitlement DocType / fields on Customer (`plan`, `seat_limit`, `owner_user`)  
2. Payment webhook → provision Owner  
3. Settings → Team invites UI  
4. Invite accept + password set  
5. Seat enforcement middleware  

Launch week can still be **manual**: you create Owner in Frappe after Paystack/commitment using this model; automate next. See `docs/PAYMENTS_SETUP.md`.

