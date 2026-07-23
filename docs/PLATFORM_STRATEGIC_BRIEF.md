# TrustLedger — Platform Strategic Brief

**Status:** Living document (authoritative for plan packaging, agent training, and ongoing evaluation)  
**As of:** 2026-07-23  
**Deploy truth (Production):** `https://trustledger-frontend-pi.vercel.app` · `deploySha` tracked on `/api/health`  
**Cloud SoT:** `https://app.trustledger.co.za` (Frappe Cloud only — Interserv retired)  
**Product name in UI:** TrustLedger only  

> Use this brief when packaging plans, training public-facing agents, evaluating what to keep/improve/cut, and deciding upgrades. Code matrices in `src/config/entitlements.ts` and maturity in `src/lib/tedsMaturity.ts` override stale markdown if they diverge.

---

## 1. Executive summary — what we have achieved

TrustLedger has moved from a **demo-first Vercel prototype** to an **operational-grade commercial platform**:

1. **Version 001 resolution desk is live** for paying customers on Frappe Cloud (projects, incidents/grievance desk, AI suggest→apply→save, reports shell).
2. **Version 002 Stakeholder Intelligence is the SRM engine** — registry, engagements, and commitments now have Cloud DocTypes + live BFF CRUD (`TL Stakeholder` / `TL Engagement` / `TL Commitment`). Without this layer there is no durable Stakeholder Relationship Management.
3. **Commercial path works end-to-end:** marketing → assessment/quote/contact → `/trial` or Paystack `/pay` → email verification → trial workspace or live Owner login → Ops finance/billing.
4. **Sample demo desk is retired** (ADR-033). Public education is `/product`; buyers use own-data trial or live Cloud — never fictional `INC-*` bleed into customer desks.
5. **Platform Ops command centre** is real: readiness ladder, Owner provision, DocType ensure/smoke, charge-due, Executive Board view.
6. **GO LIVE Done (2026-07-23):** lockdown lifted for buyers (`PLATFORM_OPERATOR_ONLY=0`); auto-provision, Paystack, Resend OTP, cron, and Cloud reachability are green on Production health (reCAPTCHA keys still optional/deferred).

**Honest maturity:** TEDS MVP domains average ≈ **58%** realised in product (`src/lib/tedsMaturity.ts`). Market label stays **Version 001** for the desk; **Version 002** SI is Cloud-usable but not yet “full TEDS blueprint.”

---

## 2. Step-by-step journey (how we got here)

Agents and humans should understand this sequence — it explains *why* the architecture looks the way it does.

### Phase A — Demo-first proof (Packets 00–10)

| Step | Achievement | Why it mattered |
|------|-------------|-----------------|
| A1 | Full `/app` shell, four roles, mock domain | Prove the product story before Cloud |
| A2 | AI suggest→apply→save pattern | Locked human-in-the-loop (ADR-006) |
| A3 | Design system “Field ledger” | Brandable, non-generic UI (ADR-007) |
| A4 | Soft lead gate / assessment | Acquisition funnel without forcing signup |

### Phase B — Frappe-ready frontend (Packets 11–14)

| Step | Achievement | Why it mattered |
|------|-------------|-----------------|
| B1 | `dataMode` + Frappe client + method contract | Avoid rewrite when Cloud arrives |
| B2 | Live adapters with mock fallback (ADR-010) | Resilience; later refined so **customers never get mock INC-*** |
| B3 | Auth bridge stub → live login | Path to Cloud sessions |

### Phase C — Funnel, Ops, commercial shell (Packets 15–23)

| Step | Achievement | Why it mattered |
|------|-------------|-----------------|
| C1 | UTM, SEO, mobile nav | Marketable surface |
| C2 | Ops `/ops/*` allowlist plane | Operator control ≠ customer CRM |
| C3 | Paystack on Vercel (ZAR) | Money path without waiting for Frappe billing |
| C4 | `/trial`, `/pay`, `/quote`, Plan Owner model | Sellable wedge under soft launch |
| C5 | Capability entitlements (ADR-024) | Plan packaging switchboard separate from UI sprawl |

### Phase D — Tenancy → Cloud operational grade (T1–T5 + OD-1→GO LIVE)

| Step | Achievement | Why it mattered |
|------|-------------|-----------------|
| D1 | Org store, seats, invites, media quotas | Browser tenancy while Cloud catches up |
| D2 | Customer/User SoT + Owner provision | ACCESS_MODEL reality on Frappe |
| D3 | TL Project / Incident / Evidence + File | Durable case artefacts |
| D4 | Paystack → auto-provision + migrate org | Multi-device durable ops |
| D5 | Day-14 charge-due cron + entitlement gate | Billing without babysitting |
| D6 | Lift buyer lockdown | GO LIVE Done |

### Phase E — Stakeholder Intelligence + public honesty (24a–24g + ADR-033)

| Step | Achievement | Why it mattered |
|------|-------------|-----------------|
| E1 | ZA geo pack, CRM, engagements, commitments, grievance UI, reports, indicators | V002 surfaces buyers expect |
| E2 | Cloud SI DocTypes + `/api/frappe/si` | SRM engine on Cloud — not just demo boards |
| E3 | Retire sample `/demo` → `/product` | Stop competing with trial; stop INC-* bleed |
| E4 | Access email verification (OTP / activate link) | Inbox proof before platform access |
| E5 | Launch hardening + watchlist | First-days operational discipline |

---

## 3. Architecture snapshot (frontend + backend)

### 3.1 Frontend (this repo)

| Layer | Location | Role |
|-------|----------|------|
| Marketing / funnel | `/`, `/product`, `/trial`, `/pay`, `/assessment`, `/quote`, `/contact` | Acquisition & education |
| Product shell | `/app/*` | Trial or live workspace |
| Ops plane | `/ops/*` | Platform Operator only (`PLATFORM_OPERATOR_EMAILS`) |
| BFF APIs | `/api/*`, `/auth/live/*` | Secrets stay server-side |
| Domain services | `src/services/*` | Mode-aware list/get/save |
| Entitlements | `src/config/entitlements.ts` | What each plan can open in nav |
| Design system | `docs/DESIGN_SYSTEM.md` | Field ledger tokens & type |

**Workspace modes (post ADR-033):**

| Mode | Meaning | Data |
|------|---------|------|
| `trial` | 14-day own-data browser workspace | `tl-org-data` / local stores — **no demo seed** |
| `live` | Frappe Cloud session (`sid`) | Cloud DocTypes + SI BFF; empty Cloud stays empty |
| `demo` | **Retired** for public entry | Lingering cookies cleared from `/app` → `/product` |

### 3.2 Backend (Frappe Cloud)

| Asset | Purpose |
|-------|---------|
| Customer + Plan Owner User | Commercial SoT + login |
| Custom entitlement fields | trial / active / past_due / cancelled |
| `TL Project`, `TL Incident`, `TL Evidence` | Resolution desk artefacts + File |
| `TL Stakeholder`, `TL Engagement`, `TL Commitment` | SRM engine (SI-Cloud) |
| Optional `srm_core` methods | Preferred when installed; frontend falls back / uses resource BFF |

**Hard rule:** LLM / Grok keys never in the browser. AI is suggest→apply→save; report briefs use local evidence composer (never Cloud month-end templates).

### 3.3 Production health gates (evaluate continuously)

From `GET /api/health` → `launch`:

| Gate | Meaning |
|------|---------|
| `lockdownLifted` | Buyers may use `/login/live` |
| `frappeOwnerIssuance` / `frappeAutoProvision` | Owner create path on |
| `paystack` | Checkout + webhooks possible |
| `cronSecret` | Day-14 charge-due schedulable |
| `resend` / `accessVerificationReady` | OTP / activation email path |
| `recaptcha` | Optional spam hardening (deferred if false) |

Ops mirror: `/ops/readiness`.

---

## 4. Platform inventory — evaluate on an ongoing basis

Use this section in monthly reviews. Update statuses; do not delete history — move rows between columns with a date note in `docs/CHANGELOG_INTERNAL.md`.

### 4.1 What works (keep, sell, train on)

| Area | Evidence | Plan relevance |
|------|----------|----------------|
| Grievance / incident desk | Live UI + TL Incident path; verify/close stamps in UI | All plans (core) |
| Projects (light) | List/detail; Cloud DocType exists | All plans |
| Stakeholder registry | Create/list; Cloud SI BFF | Project + Institutional (+ addon_crm) |
| Engagements | List/detail/capture apply; Cloud SI | Project + Institutional (+ addon_commitments pack) |
| Commitments board | Promote from engagements; Cloud SI | Project + Institutional |
| Capture hub | Minutes → AI extract → apply | Project + Institutional |
| Trial own-data | `/trial` empty workspace | Acquisition |
| Paystack trial authorize | Card on file → day-14 charge | Practitioner + Project |
| Live login + email OTP | Resend when configured | Paying / provisioned Owners |
| Ops provision + DocType ensure/smoke | `/ops/accounts` | Operator only |
| Dual reports hub | Activity vs packs (ADR-028) | Pack tier by plan |
| Public `/product` onboarding | Replaces sample demo | All public agents |
| Brand / design system | TrustLedger field ledger | All surfaces |

### 4.2 Needs improvement (invest next)

| Area | Gap | Suggested action |
|------|-----|------------------|
| Stale “demo” copy in product UI | Capture/projects/settings still say demo | Copy sweep — say trial/live/Cloud |
| Project/incident continuous Cloud save | Stronger on migrate/smoke than every UI save | Wire save → productCloud / srm_core consistently |
| `srm_core` method dependency | Live list may 404 until app installed | Prefer resource BFF pattern (as SI) or install srm-core |
| Geo depth | ZA pack seeded; lat/lng & Frappe Geo DocTypes incomplete | Enrich wards; optional Cloud sync |
| Grievance Cloud stamps | UI stamps exist; TL Incident lifecycle fields incomplete | Mirror process stamps on Cloud |
| CRM relationships | No graph / merge / influence matrix | V002 deepening packet |
| Report packs from live SI/geo | Composer uses local evidence | Bind packs to Cloud lists |
| Ops analytics (23b–d) | Reports/accounts/support depth “Planned” | Schedule Ops packets |
| Invite multi-device | Browser seats until Cloud User seats | Cloud seat issuance |
| Doc drift | `TEDS_MATURITY_REPORT.md`, `VERSIONING.md`, `PUBLIC_LAUNCH.md` lag code | Sync after each GO packet |
| Partner logos / Ops staff wellbeing | Placeholders | Replace or hide from public |

### 4.3 Not working / not ready (do not claim in sales)

| Area | Status | Public language |
|------|--------|-----------------|
| Stats SA socio-economic ingest | Deferred | “Roadmap — indicators today are illustrative” |
| Live Grok via srm-core | Deferred / mock default | “AI assist — human applies every suggestion” |
| Full ESIP / GIS editing | V003+ | Never claim imminent |
| Public community portal | V003+ | Not available |
| Native mobile apps | None — responsive web only | “Works in mobile browser” |
| Offline-first field sync | Not shipped | Do not promise |
| Client co-branding exports | Future Institutional | Sales only if roadmap-dated |
| Ops CSV reports / wellbeing telemetry | Scaffold | Internal only |

### 4.4 Discontinue / do not revive

| Item | Decision | Reason |
|------|----------|--------|
| Public sample `/demo` guest desk | **Discontinued** (ADR-033) | Bleed risk; confuses trial; weakens SRM story |
| Interserv / alternate Frappe hosts | **Discontinued** | Single SoT: `app.trustledger.co.za` |
| AccordBridge dual branding | **Discontinued** | TrustLedger only |
| Auto-enter fictional INC-* for buyers | **Discontinued** | ADR-029 / launch hardening |
| Marketing Version 002 as “fully available” before domain is end-to-end | **Forbidden** | VERSIONING honesty rules |
| LLM keys in client bundles | **Forbidden** | Security + ADR-006 |
| Autonomous AI write without Apply | **Forbidden** | Trust & audit posture |

---

## 5. Plan packaging — features by commercial plan

**Source of truth for switches:** `src/config/entitlements.ts` + `src/types/entitlements.ts`  
**Prices:** `src/lib/paystackPlans.ts` / `LAUNCH_PRICES_ZAR` (env-overridable)  
**Seats / storage:** `docs/ACCESS_MODEL.md`, `src/config/mediaQuotas.ts`, `src/lib/orgSeats.ts`

### 5.1 Catalogue (launch)

| Plan | Price (ZAR/mo excl. VAT) | Who it is for | Seat model | Storage soft cap |
|------|--------------------------|---------------|------------|------------------|
| **Practitioner** | R5,399 | Solo SRM / consultant / small desk | Owner only (0 juniors) | 25 MB |
| **Project** | R14,999 | Active project / site team | Owner + juniors | 250 MB |
| **Institutional** | Contact sales | Multi-project / public sector / enterprise | Custom | 2 GB soft |

**Trial:** 14 days; default Paystack path `trial_authorize` (small verify charge, bill day 14) — ADR-025.

### 5.2 Capability matrix (what to package)

| Capability | Practitioner | Project | Institutional | Notes for packaging |
|------------|:------------:|:-------:|:-------------:|---------------------|
| Dashboard / activity | ✓ | ✓ | ✓ | Core wedge |
| Projects | ✓ | ✓ | ✓ | Light PM — not full PMO |
| Incidents / grievance desk | ✓ | ✓ | ✓ | **V001 sellable heart** |
| Issue intake | ✓ | ✓ | ✓ | Field reporting |
| AI assist (suggest→apply) | ✓ | ✓ | ✓ | Never “auto-resolve” in sales |
| Geo intake / place fields | ✓ | ✓ | ✓ | ZA pack; not full GIS |
| Trust pulse | ✓ | ✓ | ✓ | Desk signal |
| Governance reports | ✓ | ✓ | ✓ | Pack depth differs (below) |
| Capture hub | — | ✓ | ✓ | V002 field evidence |
| Stakeholder CRM | — | ✓ | ✓ | **SRM engine — do not undersell** |
| Engagements | — | ✓ | ✓ | SI core |
| Commitments | — | ✓ | ✓ | SI core |
| ESG / intelligence cards | — | ✓ | ✓ | Illustrative until Stats SA |
| Desk graphs | — | ✓ | ✓ | |
| Supervisor queue | — | ✓ | ✓ | |

**Report packs (ADR-028):**

| Pack | Practitioner | Project | Institutional |
|------|:------------:|:-------:|:-------------:|
| Monthly | ✓ | ✓ | ✓ |
| Executive | — | ✓ | ✓ |
| Board presentation | — | — | ✓ |

### 5.3 Sellable add-ons (typed)

From `src/types/entitlements.ts` — useful when a Practitioner needs one V002 slice without jumping to Project:

| Addon | Grants |
|-------|--------|
| `addon_capture` | Capture hub |
| `addon_crm` | Stakeholder CRM |
| `addon_commitments` | Commitments + Engagements |
| `addon_esg` | ESG indicators |
| `addon_graphs` | Desk graphs + trust pulse |
| `addon_supervisor` | Supervisor queue |

**Packaging guidance:**

1. **Practitioner** = resolution desk + light governance. Do **not** promise full SI registry as included.
2. **Project** = default “real SRM” SKU — desk + Stakeholder Intelligence modules.
3. **Institutional** = Project capabilities + board pack + commercial/custom (sales-led).
4. Keep **add-ons** for upsell; do not silently unlock Institutional-only toggles on lower plans (ADR-024).
5. Revisit prices only with evidence from Ops Finance + win/loss — matrix above is the feature switchboard.

### 5.4 What each plan should *not* include in the box (yet)

- Stats SA certified indicator feeds  
- Live Grok-authored board packs without human apply  
- Native offline app  
- Unlimited Cloud storage (quotas exist for a reason — upgrade signal)  
- Sample demo data as “your workspace”

---

## 6. Agent training brief (especially public-facing)

### 6.1 Identity & voice

- Product: **TrustLedger** — “Resolution you can audit.”
- Operator company (footer/ops only): Chibase Consulting — not a second product brand.
- Tone: clear, calm, institutional; Global South infrastructure & community trust.
- Never invent features. If unsure, point to `/product` or `/ops/readiness` truth.

### 6.2 What to say (approved)

| Topic | Approved line |
|-------|----------------|
| What it is | TrustLedger helps operators run **grievance resolution** and **Stakeholder Intelligence** for projects where social licence decides whether work moves. |
| Version | **Version 001** is the live resolution desk. **Version 002** Stakeholder Intelligence (registry, engagements, commitments) is in active use on Cloud for entitled plans — still deepening vs full TEDS blueprint. |
| How to start | Start a **14-day trial** (`/trial`) with your own data, or **Subscribe** (`/pay`). Learn features on `/product`. |
| Live access | After provision, sign in at `/login/live` (email OTP when Resend is on). |
| AI | Suggestions only — a human **applies** before anything is saved. |
| Data | Paying / trial workspaces never show fictional sample incidents. |

### 6.3 What never to say

- “Full ESIP / GIS editing / public portal available today.”  
- “No signup needed sample desk” (retired).  
- “AI closes cases automatically.”  
- “Works offline as a native app.”  
- Dual names (AccordBridge, Interserv as product host).  
- Promising multi-device durable ops for unpaid browser-only trial without Cloud provision.

### 6.4 Objection handling (agents)

| Objection | Response |
|-----------|----------|
| “Is the CRM real?” | On **Project/Institutional** (or CRM add-on), stakeholders/engagements/commitments persist to **Frappe Cloud** when you are live. Trial keeps your own browser data until you go live. |
| “Can I try without paying?” | Yes — `/trial` for 14 days with your own projects; or assessment for readiness scoring. |
| “Where is the demo?” | Sample preview retired. Use `/product` for feature purpose, then trial or live. |
| “Mobile?” | Responsive web in the browser; no separate App Store app yet. |
| “Is GO LIVE done?” | Yes for operational grade (2026-07-23). Continuous improvement continues on SI depth and data feeds. |

### 6.5 Internal agents (coding / ops)

Follow `AGENTS.md`: active packet only; DECISIONS locked; Design System; lint+build+changelog; Cloud host only; AI keys server-side; customer lists never mock-bleed.

---

## 7. Ongoing evaluation framework

Run this cadence. Record outcomes in `docs/CHANGELOG_INTERNAL.md` and adjust §4 / §5 of this brief.

### 7.1 Weekly (operator)

| Check | Where | Pass criteria |
|-------|-------|---------------|
| Production health | `/api/health` | `ok: true`; launch gates expected |
| Readiness ladder | `/ops/readiness` | No unexpected regressions |
| Sign-in smoke | `/login/live` | OTP email arrives; session opens |
| SI smoke | `/ops/accounts` | Ensure DocTypes + Stakeholder→Engagement→Commitment smoke |
| Lead forms | assessment/contact/quote | Submissions land in CRM/Ops activity |

### 7.2 Monthly (product + commercial)

| Question | Method | Outcome feeds |
|----------|--------|---------------|
| Which capabilities are used? | Ops activity + customer interviews | Plan matrix tweaks |
| Where do buyers stall? | Funnel: `/product` → `/trial`/`/pay` → live | UX packets |
| What support tickets repeat? | `/ops/issues` + Resend | Fix vs discontinue |
| Is TEDS % moving? | `tedsMaturity.ts` / Executive Board | Roadmap priority |
| Are quotas hitting upgrades? | Media meters / seat caps | Price or limit changes |

### 7.3 Scorecard template (copy per review)

```text
Date:
Reviewer:
Health SHA:
TEDS MVP % (from app):

Keep (working):
Improve (next 1–2 packets):
Not ready (do not sell):
Discontinue / defer:

Plan packaging changes proposed: none / list
Agent script changes proposed: none / list
```

---

## 8. Future of the platform — upgrades & additional features

Prioritise by **SRM engine strength** and **operational honesty**, not feature count.

### 8.1 Near-term (necessary upgrades)

1. **Buyer-verified Cloud SI** — empty CRM → create stakeholder → list from Cloud on Production.  
2. **Copy hygiene** — remove leftover “demo” language from Capture/Projects/Settings.  
3. **Continuous Cloud write** for projects/incidents (parity with SI BFF).  
4. **Grievance Cloud stamps** on `TL Incident`.  
5. **Doc sync** — maturity report, VERSIONING, PUBLIC_LAUNCH aligned to ADR-033 / GO LIVE.  
6. **Cloud seats** for invitees (multi-device juniors).  

### 8.2 Mid-term (high value)

1. Stats SA / socio-economic ingest on geo places.  
2. Live Grok via `srm-core` (server-only) for stronger briefs — still suggest→apply.  
3. CRM relationship graph, influence/interest matrices, merge/dedupe.  
4. Report packs bound to live SI + geo evidence; export formats.  
5. Ops packets 23b–d (filterable reports, deeper accounts, support packs).  
6. Optional reCAPTCHA fail-closed when traffic warrants.  

### 8.3 Later (V003+ — do not package as imminent)

- Public community portal  
- Offline / native mobile  
- Full GIS editing  
- Marketplace / multi-tenant ISV channel  
- Client co-branding as default Institutional export  

### 8.4 Decision test for any new feature

Before building or selling:

1. Does it strengthen **resolution desk** or **Stakeholder Intelligence**?  
2. Can it run on **Frappe Cloud** without browser-only dead ends for paying customers?  
3. Is there a **plan switch** (entitlement) so packaging stays honest?  
4. Can public agents explain it in one sentence without over-claiming?  
5. What do we **discontinue** or defer to make room?

If three or more answers are “no,” do not ship in the current plan box.

---

## 9. Build-process lessons (front + back) worth keeping

| Lesson | Practice |
|--------|----------|
| Packet-sized delivery | One active packet; changelog + lint + build |
| Demo proved UX; Cloud proved durability | Never confuse the two in sales |
| Entitlements before UI sprawl | Nav gated by capability ids |
| Ops ≠ customer | Separate `/ops` allowlist |
| Empty Cloud ≠ mock seed | Customer trust depends on this |
| Secrets in Vercel / Cloud only | Truncated keys with `…` break login headers — paste full keys |
| Version honesty | 001 desk live; 002 SI deepening; 003+ later |
| Design system locked | Field ledger — no generic AI purple/cream clichés |
| Human applies AI | Auditability is the product promise |

---

## 10. Related documents (index)

| Doc | Use |
|-----|-----|
| `docs/BUILD_PLAN.md` | Active packets & IA |
| `docs/DECISIONS.md` | Locked ADRs |
| `docs/OPERATIONAL_DELIVERY.md` | GO LIVE ladder history |
| `docs/ROADMAP_V002.md` | V002 priority order |
| `docs/ACCESS_MODEL.md` | Seats, Owner, entitlements narrative |
| `docs/LAUNCH_WATCHLIST.md` | First-days ops runbook |
| `docs/PUBLIC_LAUNCH.md` | Public posture (sync if drift) |
| `docs/DESIGN_SYSTEM.md` | Visual / UX law |
| `docs/FRAPPE_API_CONTRACT.md` | Method expectations for srm-core |
| `docs/CHANGELOG_INTERNAL.md` | What changed when |
| `src/config/entitlements.ts` | Plan feature switchboard |
| `src/lib/tedsMaturity.ts` | Living maturity scores |
| `AGENTS.md` | Coding agent rules |

---

## 11. Maintenance of this brief

1. After every meaningful packet: update §4 statuses and §8 priorities; one line in `CHANGELOG_INTERNAL.md`.  
2. After commercial packaging changes: update §5 and `src/config/entitlements.ts` together.  
3. After public script changes: update §6 and train support/sales agents from this file only.  
4. Quarterly: full scorecard (§7.3) with Executive Board / Ops.  
5. If code and this brief disagree, **fix the brief within the same PR** that changes packaging or public claims.

---

*End of brief — TrustLedger Platform Strategic Brief (living).*
