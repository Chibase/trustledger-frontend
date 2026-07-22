# TrustLedger Frontend — Architecture Decisions

Record significant decisions here. Agents must treat **Accepted** entries as locked.

---

### ADR-001: Demo-first on Vercel

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** Need a full functional frontend stakeholders can try before Frappe Cloud wiring and Cloudflare DNS work.
- **Decision:** Ship a complete Demo experience on Vercel using mock data and mock AI. Defer live Frappe integration to a later phase.
- **Consequences:** Faster public proof; services must be shaped like future Frappe APIs to avoid rewrite.
- **Alternatives considered:** Block UI on backend readiness; build WordPress-only demo.

### ADR-002: Official product name TrustLedger

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** AccordBridge was preferred but unavailable; domain trustledger.co.za is in use.
- **Decision:** All UI copy, metadata, and docs use **TrustLedger** only.
- **Consequences:** No dual branding in the app.
- **Alternatives considered:** Keep AccordBridge as marketing alias (rejected for clarity).

### ADR-003: Four stakeholder roles

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** Existing auth cookie already uses client / contractor / community / admin.
- **Decision:** Keep these four roles for Demo and live.
- **Consequences:** Dashboards and nav are role-gated; no extra roles without a new ADR.
- **Alternatives considered:** Merge client/admin; add “SRM Analyst” early (defer).

### ADR-004: App shell under `/app` with `/demo` entry

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** Need clear demo funnel and room for a marketing-lite home without mixing layouts.
- **Decision:** Product UI lives under `/app/*`. `/demo` is the public try-before-signup entry. Legacy routes redirect.
- **Consequences:** One shell component; easier demo banner and lead CTAs.
- **Alternatives considered:** Keep flat `/dashboard` routes only.

### ADR-005: Mock services mirror Frappe shapes

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** Frappe (`srm-core` on the product backend host) is the future system of record for live product DocTypes.
- **Decision:** TypeScript types and service methods use names/fields compatible with SRM Incident, projects, sentiment, etc. `NEXT_PUBLIC_AI_MOCK` / API base switch later without UI rewrite.
- **Consequences:** Slightly more structured mocks now; less churn later.
- **Alternatives considered:** Disposable demo-only schemas.

### ADR-006: AI assist is non-autonomous

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** Governance product; AI must be auditable and human-confirmed.
- **Decision:** All AI outputs are suggestions; user applies/confirms. No auto-send of community messages. No browser-side xAI keys.
- **Consequences:** Extra confirm UX; safer demos and future compliance.
- **Alternatives considered:** Autopilot triage (rejected).

### ADR-007: Design system locked in DESIGN_SYSTEM.md

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** Agents otherwise re-litigate aesthetics every packet; user asked to minimise interference.
- **Decision:** Colours, type, spacing, and component rules in `docs/DESIGN_SYSTEM.md` are mandatory.
- **Consequences:** No ad-hoc purple/glow SaaS templates; consistent Vercel Demo.
- **Alternatives considered:** Per-page styling freedom.

### ADR-008: Lead capture soft-gate in Demo

- **Date:** 2026-07-11
- **Status:** Superseded by ADR-021 for in-app explore
- **Context:** Demo should drive signups without blocking first exploration.
- **Decision:** Allow exploration; after 3 meaningful actions (or via header CTA) show email capture modal. Store lead locally / POST to configurable form endpoint later.
- **Consequences:** Funnel without forcing signup at the door.
- **Alternatives considered:** Mandatory email before demo (higher drop-off).

### ADR-009: Packet-driven autonomous delivery

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** User wants minimal human interference while building.
- **Decision:** Implement only the active packet in BUILD_PLAN; do not ask preference questions already decided; stop only on true blockers.
- **Consequences:** Predictable progress; requires BUILD_PLAN discipline.
- **Alternatives considered:** Open-ended “make it nice” prompts each session.

### ADR-010: Phase 2 keeps Demo as default

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** Demo is live on Vercel; Frappe Cloud live DocTypes are not required for every visitor.
- **Decision:** `NEXT_PUBLIC_DATA_MODE` defaults to `demo`. Live Frappe calls only when explicitly set to `live`. AI mock remains independent via `NEXT_PUBLIC_AI_MOCK`.
- **Consequences:** Safe public Demo; pilots can flip env without code forks.
- **Alternatives considered:** Always-on live API (breaks Demo without VPN/backend).

### ADR-011: HubSpot lead magnet → Frappe after commitment

- **Date:** 2026-07-12
- **Status:** Accepted
- **Context:** Solo operator; HubSpot Free is already wired for assessment/demo/support intake but is limited for ongoing customer management. Frappe Cloud is the product system of record.
- **Decision:** Use HubSpot Free only for acquisition (leads, light tickets, early pipeline). At commitment (pilot signed, paid, or Closed Won), hand off to Frappe Customer/Contact/(User). No dual full-CRM maintenance.
- **Consequences:** Clear split of tools; see `docs/CRM_HANDOFF.md`. Automate provision later; manual handoff is fine at launch.
- **Alternatives considered:** All-in on HubSpot paid; all-in on Frappe CRM for top-of-funnel (rejected for time and Free-tier fit).

### ADR-012: Plan Owner admin + Owner-confirmed lower seats

- **Date:** 2026-07-12
- **Status:** Accepted
- **Context:** After payment, buyers need login issued by plan. Solo ops cannot manually invent access rules per deal. Purchaser (e.g. lead consultant on lower tier) must own the plan with admin access and invite others only at lower levels they confirm.
- **Decision:** Payment/commitment provisions exactly one **Plan Owner** as org-scoped `admin` (dashboard, reporting, login, invites). Additional users are created only via Owner-confirmed invites at `client` | `contractor` | `community`. Seat limits follow plan (Practitioner ≈ owner-only; Project = unlimited per project; Institutional = custom). See `docs/ACCESS_MODEL.md`.
- **Consequences:** Clear post-payment provisioning; no auto-admin for teammates; HubSpot never issues product logins.
- **Alternatives considered:** All seats created by Chibase staff; auto-admin for anyone on the invoice domain (rejected).

### ADR-014: Paystack as SA payment gateway on Frappe Cloud

- **Date:** 2026-07-14
- **Status:** Accepted
- **Context:** Soft launch needs ZAR collection on TrustLedger Cloud. Stripe not usable for this entity path; Peach Payments closed new merchant intake. Frappe stock **Payments** app has no native SA PSP; Marketplace **Frappe Paystack** supports ZAR and ERPNext Sales Invoice links.
- **Decision:** Use **Paystack** (test → live) with **Frappe Paystack** on `app.trustledger.co.za`. Soft launch may collect via invoice payment links and **manual** Plan Owner provisioning per ADR-012. See `docs/PAYMENTS_SETUP.md`.
- **Consequences:** Peach references in older docs are superseded for gateway choice; entitlement webhook automation remains a later `srm-core` packet.
- **Alternatives considered:** PayFast/Ozow direct custom apps (more build); wait for Peach (blocked); Stripe (unavailable).

### ADR-015: Platform Ops command centre (not a CRM)

- **Date:** 2026-07-15
- **Status:** Accepted
- **Context:** Operator needs a full-platform overview and analysis surface (visitors, intent, readiness, accounts, support packs) without building a second CRM. Customer Plan Owner `admin` must stay org-scoped.
- **Decision:** Ship a separate **Platform Ops** area at `/ops`, allowlist-only (`PLATFORM_OPERATOR_EMAILS`). Frappe CRM/Customer/Paystack remain systems of record; Ops is the command centre for overview, reports, and controls. See `docs/PLATFORM_OPS.md`.
- **Consequences:** Clear split: CRM for relationship records, Ops for operator intelligence and control; no visitor intel inside customer `/app`.
- **Alternatives considered:** Ops-only inside Frappe Desk (rejected as daily cockpit — Desk stays SoR); fold into `/app/settings` (rejected — wrong audience).

### ADR-016: Executive Board brief vs Ops activity desk

- **Date:** 2026-07-15
- **Status:** Accepted
- **Context:** Platform Owner needs a C-suite surface for board/investor overviews (insights + graphs). The `/ops` activity desk is suited to day-to-day junior ops, not executive presentation.
- **Decision:** Ship **`/ops/executive`** as the Executive Board brief (KPIs, trends, funnel, talking points, print-ready). Keep `/ops` + `/ops/activity` as the operational activity desk. Allowlisted operator login homes to **`/ops/executive`**. Same allowlist gate as ADR-015.
- **Consequences:** Two audiences under `/ops` without mixing customer product desks; junior staff can live in activity; owner presents from Executive.
- **Alternatives considered:** Replace Ops overview entirely (rejected — juniors still need the feed); put charts only in Reports (rejected — not presentation-first).

### ADR-017: Command-centre control pillars (finance, staff, AI, issues)

- **Date:** 2026-07-15
- **Status:** Accepted
- **Context:** Platform Owner needs operational control beyond visitor intel — budget/resource utilisation, staff capacity, AI tool governance, and client issue turnaround — without mixing these into the customer `/app` desk.
- **Decision:** Add allowlisted control surfaces under `/ops`: **`/ops/finance`**, **`/ops/staff`**, **`/ops/ai`**, **`/ops/issues`**. Issues may read Support Ticket CRM signals now; finance books, staff HR/wellbeing telemetry, AI invocation metrics, and post-resolution client feeling land in later packets. **Staff wellbeing** is explicitly deferred (UI placeholder only). See `docs/PLATFORM_OPS.md`.
- **Consequences:** Command centre gains four control pillars with honest empty-states; no fabricated finance/HR numbers in production views.
- **Alternatives considered:** Fold into Executive Board only (rejected — too dense for board print); put inside customer `/app` (rejected — wrong audience).

### ADR-018: Interserv retired — Frappe Cloud is the only backend host

- **Date:** 2026-07-15
- **Status:** Accepted
- **Context:** Backend previously planned/hosted via Interserv. Marketing email and web were always on Webway. Product UI is on Vercel. Owner needs to cancel Interserv before the next deduction; runtime already points at `app.trustledger.co.za`.
- **Decision:** **Frappe Cloud** (`https://app.trustledger.co.za`) is the sole TrustLedger backend host. Interserv is retired for this product. Future `srm-core` work installs on Cloud only. See `docs/INTERSERV_CANCEL.md` and `docs/FRAPPE_CLOUD_SETUP.md`.
- **Consequences:** Docs/config must not require Interserv; cancel checklist is owner-facing; no dual-host support.
- **Alternatives considered:** Keep Interserv until `srm-core` lands (rejected — Cloud already serves CRM/auth/payments; `srm-core` can be built on Cloud).

### ADR-019: Vercel Paystack checkout until Desk marketplace unlock

- **Date:** 2026-07-15
- **Status:** Accepted
- **Context:** Shared Frappe Cloud benches cannot install third-party **Frappe Paystack**. Soft launch still needs ZAR collection and Ops visibility.
- **Decision:** Collect via **Vercel `/pay`** → Paystack hosted checkout + webhook. Log payments as CRM Lead (`Paystack Payment`) for Executive/Finance notifications. CRM Customer / Plan Owner stay **manual**. Desk `frappe_paystack` remains the later path after private bench. See `docs/PAYMENTS_SETUP.md` §D.
- **Consequences:** WP CTAs point at Vercel; secrets only on Vercel; no auto-login from payment.
- **Alternatives considered:** Paystack Payment Pages only (rejected — weaker Ops feed); wait for private bench (rejected — blocks revenue).

### ADR-020: Quote + EFT bridge while Paystack finalises

- **Date:** 2026-07-16
- **Status:** Accepted (fallback) — primary path is `/pay` (ADR-019) as of 2026-07-20
- **Context:** Paystack KYC/go-live can stall; solo operator cannot manually chase every deal. Plan structure (Practitioner / Project / Institutional) and Plan Owner admin model stay locked (ADR-012). Lockdown still pauses auto customer logins (ADR-013).
- **Decision:** Soft-launch **fallback** is **`/quote` → Desk quotation/invoice → EFT → Ops Confirm EFT paid**. Website **pricing CTAs prefer `/pay?plan=…`**. Optional `OPS_ALERT_WEBHOOK_URL` for operator ping. **No** auto Plan Owner from quote or EFT confirm.
- **Consequences:** Quote remains for EFT/edge cases; marketing pricing shows real Paystack amounts.
- **Alternatives considered:** Wait only on Paystack (rejected earlier); auto-provision Owner on EFT confirm (rejected — integrity + lockdown).

### ADR-021: Open trial — email only on print/save

- **Date:** 2026-07-20
- **Status:** Superseded by ADR-022 for product trial entry
- **Context:** Launch requires clients to explore without login; capture email only when they print or save. Soft-gate and mandatory demo-entry forms raise drop-off.
- **Decision:** `/demo` auto-enters `/app` as a trial guest (default role `client`). Email modal gates print/save/export only. `/trial` and `/pay` remain for subscribe/quote funnels. Staff/operator live login stays at `/login/live`. Soft lead gate (ADR-008) is retired from the product shell.
- **Consequences:** Higher explore conversion; lead capture tied to intent. Role switch available in Settings. Operator lockdown still applies to live sessions only.
- **Alternatives considered:** Keep email-before-demo (rejected for launch UX); remove `/trial` (rejected — Paystack/quote path still needed).

### ADR-022: Product trial is own-data workspace; upgrade → Paystack

- **Date:** 2026-07-21
- **Status:** Accepted
- **Context:** Marketing “Start trial” must not dump users into sample `/demo`. Clients need their own workspace for 14 days, then a smooth path to pay. After expiry, access stops but data is retained briefly.
- **Decision:**
  1. **Start trial** → `/trial` (name + work email + plan lens) → `tl-mode=trial` workspace with **empty/own data** (not mock seed).
  2. In-app **Upgrade & pay** → `/pay?plan=…` directly (no subscribe form step).
  3. Trial length **14 days**; on expiry **access off**; data retained **90 days** then purged (wall UI + local retention clock; Frappe entitlement sync later).
  4. `/demo` remains **sample preview** only.
- **Consequences:** WP/home CTAs point at `/trial`. Browser-local trial store until Cloud tenancy ships. Operator lockdown unchanged for Frappe live.
- **Alternatives considered:** Keep demo-as-trial (rejected); require Frappe User create before any trial (blocked by lockdown — phase next).

### ADR-023: Version 001 desk live; Version 002 core before loud commercial launch

- **Date:** 2026-07-21
- **Status:** Accepted
- **Context:** Public messaging has compared TrustLedger to market tools on stakeholder intelligence capabilities that Version 001 does not yet ship (registry, engagements, commitments, geo, ESG depth). Over-claiming erodes trust.
- **Decision:**
  1. Label the current product **Version 001** (resolution desk + trial/pay).
  2. Prioritise **Version 002** TEDS core: geo → stakeholders → engagements → commitments → stronger grievance → reports → intelligence/ESG (`docs/ROADMAP_V002.md`).
  3. Soft commercial launch **may be delayed** until V002 geo + stakeholders + commitments + stronger grievance are demoable.
  4. Public copy must separate **Available now (V001)** vs **Coming in V002**.
- **Consequences:** Active packets shift to Phase 6 (24a+). Paystack/trial remain, but marketing honesty is mandatory.
- **Alternatives considered:** Ship soft launch first then build V002 quietly (rejected — trust risk); claim V002 as live (rejected).

### ADR-024: Capability entitlements (plan bundles + add-ons)

- **Date:** 2026-07-22
- **Status:** Accepted (amended 2026-07-22)
- **Context:** Commercial packaging will combine seats with functional modules. Features must be switchable per plan or sold as optional add-ons without rewriting each screen later.
- **Decision:**
  1. Maintain a capability catalogue (`src/types/entitlements.ts`) separate from seat/pricing (`plans.ts`).
  2. Each plan has a default capability matrix (`src/config/entitlements.ts`).
  3. UI gates via `hasCapability` / `FeatureGate` / nav `capability` fields.
  4. **Settings → Plan capabilities** is **Plan Owner only**. Juniors never see the switchboard.
  5. Plan Owner sees the **full catalogue**. Capabilities outside the current plan are visible but **locked** (upgrade CTA). Only **Institutional** may toggle every capability on/off. Lower plans may only toggle modules included in their matrix; they cannot force-enable missing features (overrides that turn missing caps on are ignored).
  6. Sellable add-on SKUs remain in types for future packaging; they do not unlock above-plan features from Settings.
  7. Pricing and public plan copy may be revisited later; the switchboard stays.
- **Consequences:** New modules register a capability id and check it at nav + page entry. Ops accounts page can later sync live entitlements.
- **Alternatives considered:** Hardcode plan checks in each page (rejected — brittle); feature flags only in env (rejected — not client-packagable); let any admin freely override every switch (rejected — breaks packaging).

### ADR-025: Subscribe = card verify + 14-day trial + deferred charge

- **Date:** 2026-07-22
- **Status:** Accepted
- **Context:** Buyers must not be charged the full plan on Subscribe. Banking details verify the trial, stay on file for day-14 billing, and support standard opt-out before charge. After confirmation the trial must start immediately with login details (temporary password) — no “contact us” CTA on the thank-you screen.
- **Decision:**
  1. Default `/pay` checkout mode is **`trial_authorize`**: Paystack charges a small verification amount (`PAYSTACK_TRIAL_VERIFY_CENTS`, default R1.00), stores a reusable authorization, and schedules the plan amount for trial end.
  2. Optional **`pay_now`** mode charges the first month immediately (no deferred trial billing).
  3. On verify success: CRM Lead `Trial Authorize`, mint temp password + signed activation token, email when `RESEND_API_KEY` is set, always show credentials on `/pay/success`, activate browser trial workspace immediately.
  4. Banner **Cancel before you are charged** → `/api/billing/opt-out` (CRM `Trial Opt-Out` + Paystack `deactivate_authorization` when code available).
  5. Ops charges due trials via `/api/paystack/charge-due` (allowlist). Frappe Plan Owner creation stays gated by ADR-013 lockdown.
- **Consequences:** Subscribe CTAs mean trial-with-card-on-file. Success page has thank-you + login details only. Day-14 collection is operator-triggered until a scheduler lands.
- **Alternatives considered:** Full charge on Subscribe (rejected — contradicts trial promise); free trial with no card (kept as `/trial` explore only); auto Frappe User create (blocked by lockdown).

### ADR-013: Platform Operator lockdown

- **Date:** 2026-07-12
- **Status:** Accepted
- **Context:** Solo founder/operator controls strategy, CRM, ops, and product end-to-end until advised otherwise. Customer Plan Owner (`admin`) must not be confused with platform-wide control.
- **Decision:** While `PLATFORM_OPERATOR_ONLY=1`, only identities in `PLATFORM_OPERATOR_EMAILS` may use live login, live `/app`, and the Frappe BFF. Demo/assessment stay public for leads unless `PLATFORM_OPERATOR_LOCK_PUBLIC=1`. Customer seat issuance stays paused until lockdown is lifted. See `docs/PLATFORM_OPERATOR.md`.
- **Consequences:** Clear sole-control posture for launch; env flip opens Plan Owner flow later.
- **Alternatives considered:** Hardcode a single email in source (rejected — use env allowlist); lock demo too by default (rejected — keep Wednesday lead funnel unless explicitly locked).

### ADR-026: Demo org tenancy before Frappe User SoT

- **Date:** 2026-07-22
- **Status:** Accepted
- **Context:** ADR-012 requires Plan Owner + invite seats, but ADR-013 still blocks live Customer/User issuance. Buyers on trial/demo need a master desk and junior invites now.
- **Decision:** Ship **browser-local org tenancy** (packets T1–T2): `localStorage` org + invite records; cookies for `orgId`, Plan Owner flag, desk tier, and desk-tier lock. Trial/subscribe bootstraps the Owner org. Invitees accept at `/invite/accept` with Owner-assigned role + locked desk. Seat caps follow ACCESS_MODEL (Practitioner = 0 juniors). T3–T5 cover data space, media quotas, and Frappe SoT when lockdown lifts.
- **Consequences:** Demo/trial Owners can manage seats without Cloud Users; invite links only work on the same browser store until Cloud sync; no change to ADR-013 lockdown.
- **Alternatives considered:** Wait for lockdown lift (rejected — blocks product learning); fake multi-user without seat model (rejected — contradicts ACCESS_MODEL).

### ADR-027: Soft public launch (live Paystack, operator-gated Frappe)

- **Date:** 2026-07-22
- **Status:** Accepted
- **Context:** Product is ready to offer to clients with plan-gated modules and ranked desks. Live Paystack must collect trial authorizations; Frappe Customer/User SoT (T5) is not ready. Full ADR-013 lift would expose live `/app` + BFF without Owner issuance.
- **Decision:**
  1. **Public:** marketing, demo, assessment, `/trial`, `/pay` (live Paystack keys), invite accept (demo tenancy).
  2. **Keep `PLATFORM_OPERATOR_ONLY=1`** for `/login/live`, live `/app`, and `/api/frappe` until T5.
  3. `/ops` remains allowlist-only always.
  4. Quality gates: Bugbot on client-facing PRs; Security Agents on payment/auth changes; Cloud Agents for packets (`docs/CURSOR_AGENTS.md`, `docs/PUBLIC_LAUNCH.md`).
- **Consequences:** Clients subscribe/trial without Frappe logins; Plan Owner Cloud users stay manual/paused; messaging must say modules expand by plan over time.
- **Alternatives considered:** Full lockdown lift now (rejected — no SoT Owner issuance); stay on Paystack test forever (rejected — blocks real clients).

### ADR-028: Dual dashboards — Activity + Reports packs

- **Date:** 2026-07-22
- **Status:** Accepted
- **Context:** Plan Owner (primary user) needs one surface for navigation/project activity and another for choosing report forms (monthly text+graphs, executive risk graphs, board/client/funder presentation). Formats must follow plan seniority; who may open them is Owner-controlled.
- **Decision:**
  1. `/app/dashboard` = **Activity dashboard** (overall nav + project activity pulse).
  2. `/app/reports` = **Reports dashboard** with three packs: `monthly`, `executive`, `board_presentation`.
  3. Plan matrix: Practitioner → monthly; Project → monthly+executive; Institutional → all three (demo uses Project lens).
  4. Plan Owner grants desks per pack in Settings (`tl-report-pack-access`); cannot grant below pack `minDesk` or off-plan packs.
  5. Evidence AI writer remains local (no Cloud Month-End templates).
- **Consequences:** Nav label “Reports”; Create report wizard nests under a chosen pack; juniors only see packs Owner enabled for their desk.
- **Alternatives considered:** Single mega-dashboard (rejected — mixed jobs); unlock all packs on every plan (rejected — contradicts commercial seniority).

### ADR-029: Org data space before Frappe SoT (T3)

- **Date:** 2026-07-22
- **Status:** Accepted
- **Context:** Paying / trial customers must not see TrustLedger demo `INC-*` sample data. Cloud DocTypes (T5) are not ready; buyers still need a place to deposit and work their own projects and cases.
- **Decision:**
  1. **Customer workspace** = `tl-mode=trial` or non-demo session with `orgId`.
  2. Domain data lives in org-scoped browser store `tl-org-data` (projects, incidents, evidence, stakeholders), migrating legacy `tl-trial-*` once.
  3. Activity / Reports / evidence writer **never merge** static mocks in customer mode.
  4. Plan Owner deposits via Settings → **Org data space** (CSV import) or normal UI create flows; rows stamp `orgId`.
  5. T5 later moves the same shapes to Frappe Customer-scoped DocTypes.
- **Consequences:** Trial/pay workspaces start empty (plus optional blank `PRJ-TRIAL` scaffold); demo path (`/demo`) keeps sample data. Multi-device sync waits for T5.
- **Alternatives considered:** Keep demo seed in trial for “something to click” (rejected — contaminates paid path); block all product use until T5 (rejected — cannot sell).

### ADR-030: Browser media library with plan quotas (T4)

- **Date:** 2026-07-22
- **Status:** Accepted
- **Context:** Customers need registers, minutes, photos, and video on cases without Cloud File yet. Storage must follow plan seniority and push upgrades.
- **Decision:**
  1. Org media store `tl-org-media` with kinds register / minutes / photo / video / other.
  2. Soft quotas: Practitioner 25 MB, Project 250 MB, Institutional 2 GB (browser soft cap).
  3. Files ≤2 MB may store as data URL; larger files store metadata only until T5 Cloud File.
  4. Over-quota blocks add; Settings meter + upgrade CTA.
  5. Case desk upload writes media + evidence stub for customer workspaces.
- **Consequences:** Real file picker in trial/org; demo can still use filename stubs. Not multi-device until Cloud File.
- **Alternatives considered:** Wait for S3/Frappe File (rejected — blocks field evidence now); unlimited browser storage (rejected — no upgrade signal).

### ADR-031: Frappe SoT prep without lifting ADR-013 (T5)

- **Date:** 2026-07-22
- **Status:** Accepted
- **Context:** ACCESS_MODEL requires Customer + Plan Owner User on Cloud. Soft launch (ADR-027) must keep buyers off `/login/live` until issuance works.
- **Decision:**
  1. Document Customer/User field contract in `docs/FRAPPE_SOT.md`.
  2. Operator-only `POST /api/frappe/provision-owner` behind `FRAPPE_OWNER_ISSUANCE` (default off) + Platform Operator allowlist.
  3. Default `dryRun: true` returns drafts + checklist; live create only when flag + keys + `dryRun: false`.
  4. **Do not** set `PLATFORM_OPERATOR_ONLY=0` in this packet.
- **Consequences:** Ops Accounts can prepare Owner issuance; buyers remain on `/pay` + `/trial` browser tenancy.
- **Alternatives considered:** Auto-provision on Paystack webhook now (rejected — lockdown + untested User create); lift lockdown without issuance path (rejected — ADR-027).

### ADR-032: Delay paid production until Cloud operational grade

- **Date:** 2026-07-22
- **Status:** Accepted
- **Context:** Soft launch (ADR-027) + browser tenancy (T1–T5) can sell trials, but multi-device durable ops for paying customers still needs Frappe SoT, DocTypes, File, sync, and billing. Operator chose **real product over early rollout**.
- **Decision:**
  1. Treat `docs/OPERATIONAL_DELIVERY.md` as the master path: Steps 1→5→GO LIVE.
  2. Soft marketing (`/demo`, leads, `/pay`/`/trial`) may continue; **do not** promise multi-device production until GO LIVE criteria.
  3. Active work = **Step 1** (Customer/User smoke) before DocTypes, sync, or lifting ADR-013.
  4. Ops UI `/ops/readiness` surfaces env gates; Desk/smoke remain human checklist.
  5. Lift `PLATFORM_OPERATOR_ONLY` only at Step 4 after Steps 1–3 smoke.
- **Consequences:** Rollout may slip; customers who pay early stay on browser tenancy until Cloud catch-up. Agents lead one step at a time and wait for “Step N complete”.
- **Alternatives considered:** Ship browser-only as “production” (rejected — not durable); lift lockdown now without DocTypes (rejected — incomplete SoT).

