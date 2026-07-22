# Post-payment access & seats

**Locked with ADR-012.**  
**Override while active:** ADR-013 Platform Operator lockdown — see `docs/PLATFORM_OPERATOR.md`. Until lockdown is lifted, **do not** issue customer Plan Owner logins; only the Platform Operator uses live product access.

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

Aligned to marketing tiers (prices unchanged on site until you say otherwise):

| Plan | Owner | Additional seats | Notes |
|------|-------|------------------|-------|
| **Practitioner** (lower tier) | 1 × **admin** (purchaser) | **0** by default (optional later: +1–2 paid add-ons) | Single-user: owner does login, reporting, dashboard |
| **Project** | 1 × **admin** | Unlimited **per project environment** at client/contractor/community | Owner assigns people to projects |
| **Institutional** | 1+ owners (custom) | Custom roles/seats/regions | Sales-defined |

**Rule:** Only the Plan Owner is created automatically at payment. Everyone else is **invited by the Owner** with an explicit lower role.

## Plan entitlement matrix (what we limit)

| Limit | Practitioner | Project | Institutional |
|-------|--------------|---------|---------------|
| **Owner seats** | 1 admin | 1 admin | Custom |
| **Team seats** | 0 (owner only) | Unlimited **per project** | Custom |
| **Active projects** | Up to **2** | 1+ (per purchased project env) | Multi-region / many |
| **Roles invitees may get** | — (no invites) | client, contractor, community | Custom + extra admins if sold |
| **Reports / briefs** | Standard | Full project + predictive views | Deep / custom analytics |
| **AI assist** | Standard sentiment / triage | Full assist set | Custom / higher limits |
| **API / integrations** | No | No (or light) | Yes (custom) |
| **Hosting / compliance** | Shared | Shared | Dedicated options |
| **Support** | In-app + HubSpot | In-app + HubSpot | Named + Helpdesk |

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
4. System sends invite email with accept link.  
5. Invitee sets password (or receives temp password once) → `/login/live`.  
6. Seat counts against plan entitlement; over-limit → block invite + upgrade CTA.

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

## HubSpot → Frappe (ties to CRM_HANDOFF)

| Stage | Action |
|-------|--------|
| Lead / demo / assessment | HubSpot only |
| Payment or Commitment | Frappe Customer + **Owner admin** user |
| Ongoing team | Owner invites in-app → Frappe Users |

## Demo / trial tenancy (frontend packets T1–T5)

Until ADR-013 lockdown lifts and Frappe Customer/User is SoT:

- **Plan Owner org** is created in browser `localStorage` when trial/subscribe starts (`startTrialCookies` → `bootstrapPlanOwnerOrg`).
- **Settings → Team / Seats** lets the Owner invite juniors with role + desk exposure.
- **Seat caps:** Practitioner = 0 juniors; Project / Institutional = unlimited in demo.
- **Desk ranks (1 highest → 5 lowest):** Client/Board/funder → CEO/MD → Director/PM → Site foreman/supervisor → CLO. Plan Owner sits at the plan ceiling and may invite only **lower** ranks; higher desks stay greyed.
- **T3 data space:** org-scoped projects/cases (`tl-org-data`); CSV import; no demo seed in trial.
- **T4 media:** org media library + plan quotas (25 MB / 250 MB / 2 GB soft); Settings meter.
- **T5 prep:** Customer + Owner User drafts via `/api/frappe/provision-owner` (operator + `FRAPPE_OWNER_ISSUANCE`); see `docs/FRAPPE_SOT.md`.
- Invite accept at `/invite/accept` locks the invitee’s desk tier (cannot self-raise).
- Live Owner issuance for buyers remains gated by ADR-013 until you lift lockdown after smoke.

## Build sequence (after Paystack sandbox)

1. Entitlement DocType / fields on Customer (`plan`, `seat_limit`, `owner_user`)  
2. Payment webhook → provision Owner  
3. Settings → Team invites UI  
4. Invite accept + password set  
5. Seat enforcement middleware  

Launch week can still be **manual**: you create Owner in Frappe after Paystack/commitment using this model; automate next. See `docs/PAYMENTS_SETUP.md`.

