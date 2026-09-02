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
- **Status:** **Superseded** by ADR-034 (2026-07-23)
- **Context:** Solo operator; HubSpot Free is already wired for assessment/demo/support intake but is limited for ongoing customer management. Frappe Cloud is the product system of record.
- **Decision:** Use HubSpot Free only for acquisition (leads, light tickets, early pipeline). At commitment (pilot signed, paid, or Closed Won), hand off to Frappe Customer/Contact/(User). No dual full-CRM maintenance.
- **Consequences:** Clear split of tools; see `docs/CRM_HANDOFF.md`. Automate provision later; manual handoff is fine at launch.
- **Alternatives considered:** All-in on HubSpot paid; all-in on Frappe CRM for top-of-funnel (rejected for time and Free-tier fit).

### ADR-038: Multi-tenant security ladder packaged on plans

- **Date:** 2026-07-27
- **Status:** Accepted
- **Context:** Clients (and law) fear data mixing and mining. TrustLedger already uses distinct Customers / org ids (L1) but lacks hard Desk User Permissions (L2), formal DPA/assurances (L4), and dedicated isolation (L5). Selling honesty requires an explicit ladder and plan packaging — not vague “enterprise security.”
- **Decision:**
  1. Adopt the ladder in `docs/SECURITY_TENANCY.md`: L1 tenant identity → L2 hard permissions → L3 ops privacy → L4 DPA/assurance → L5 dedicated isolation.
  2. **L2 (hard tenancy)** is a product credibility baseline for live paid plans over time — not a Solo upsell forever.
  3. **L4 Trust Pack** (DPA, subprocessors, purge SLA) is sold / included from **Project** upward; Institutional always.
  4. **L5 Isolation** (dedicated cloud site / residency options) is **Institutional** (or paid Project add-on once quoted) — recurring cost recovered in plan price.
  5. Sales language must match shipped controls; VIP beta continues mock/anonymised data (TOU v2).
  6. **Client-facing copy** names **TrustLedger** only; hosting is “cloud” / “private cloud workspace” (no Frappe/Vercel on marketing). Privacy depth beyond baseline is **optional extras** with a short protection blurb and foldable plan comparison on home pricing.
- **Consequences:** Pricing pages and ACCESS_MODEL gain explicit Trust & tenancy rows. SEC-1…SEC-5 packets schedule the climb. Isolation prices stay sales-scoped until host quotes lock.
- **Alternatives considered:** Charge all plans for dedicated sites (rejected — kills Solo/Practitioner); claim SOC2 before starting (rejected); stay silent on security in packaging (rejected — loses trust-sensitive buyers).

### ADR-036: In-app setup wizard + user manual (UG-1)

- **Date:** 2026-07-26 (deepened 2026-08-16)
- **Status:** Accepted
- **Context:** New clients (especially Solo / first Project Owners) land on an empty desk and need a guided seeding order. External video scripts alone do not change in-product behaviour. Explanations without navigation leave users stranded.
- **Decision:**
  1. Ship written **`docs/USER_MANUAL.md`** as the operator SoT (companion to `docs/ONBOARDING_VIDEO_SCRIPT.md`).
  2. On first trial/live entry, show a **plan-aware Setup wizard** (spine: Project → SI modules if entitled → Incidents → Capture → Reports). Persist progress in `tl-onboarding-v1`; “Later” snoozes for the session; “Don’t show again” dismisses until Settings/Guide reopen.
  3. Add **`/app/guide`** + nav **Guide** + Settings controls to relaunch the wizard and tick the checklist.
  4. Wizard waits behind the temporary-password prompt when that is open.
  5. **Guide behaviour:** every actionable step **title and CTA is a deep link** to the screen where the task is done (e.g. Create project → `/app/projects?new=1` opens the name form). The wizard closes when the user follows a task link so the destination is usable full-screen.
- **Consequences:** Solo skips SI steps; monthly reports remain available on Solo via `governanceReports` + pack rank. No sample INC-* seeding. Guide acts as a navigator, not only a checklist.
- **Alternatives considered:** Marketing-only PDF (rejected — unused); forced blocking tour every login (rejected — snooze/dismiss); third-party product tour SaaS (rejected — brand + cost); text-only checklist without destinations (rejected — users asked to be taken to the task).

### ADR-035: Solo entry plan (1 seat, essentials)

- **Date:** 2026-07-24
- **Status:** Accepted
- **Context:** Lone consultants and subcontractor practitioners often cannot justify Practitioner (R5,399 / owner-only with AI). Without an entry SKU they stay informal or under a larger firm’s Project seats — TrustLedger loses the bottom of the funnel and the “professionalise before you scale” story.
- **Decision:**
  1. Add commercial plan **`solo`** — **R1,999 / month**, **1 named seat** (owner only; **zero** junior seats), **1 active project**, **10 MB** media, **no AI Assist**, **no SI / governance packs**.
  2. Entitlements: dashboard, projects, incidents, issue intake, geo intake, Trust Pulse (+ monthly operational report). See `docs/SOLO_PLAN.md`.
  3. Ladder: **Solo → Practitioner → Project → Institutional**. Default entry UTM / marketing plan may be `solo`; Practitioner remains the AI / light-governance step-up.
  4. Paystack plan code: `solo` (+ `PAYSTACK_AMOUNT_SOLO_CENTS`). EFT / VIP / Customer `custom_plan_code` accept `solo`.
  5. No new DocType — reuse Customer + subscription plan code.
- **Consequences:** Pricing UI is four commercial columns (+ Institutional sales). Seat math and report-pack gates treat Solo below Practitioner. Ops must create Paystack plan `solo` before live charge.
- **Alternatives considered:** Discount Practitioner only (rejected — still oversells AI/governance); free forever tier (rejected — support cost); junior seats on Solo (rejected — that is Project’s commercial line).

### ADR-034: Frappe-only acquisition CRM (cut HubSpot)

- **Date:** 2026-07-23 (clarified 2026-07-24)
- **Status:** Accepted
- **Context:** HubSpot Free embeds and dual CRM hurt TrustLedger branding and solo-ops clarity. Vercel already owns branded forms; Frappe Cloud already receives **CRM Lead** when API keys exist. Soft launch no longer needs HubSpot as a required link in the chain.
- **Decision:** **Acquisition CRM = Frappe CRM Lead only.** Target chain:
  ```text
  WordPress (Webway)  →  CTAs only (no forms / no HubSpot embeds)
          ↓
  Vercel TrustLedger  →  branded forms + Paystack + product UI + Ops
          ↓
  Frappe Cloud        →  CRM Lead → (commitment/pay) Customer + Owner User
          ↓
  /login/live         →  product
  ```
  Operating rule: *Strangers fill Vercel forms → Frappe Leads; money/commitment → Frappe Customer + live login. WordPress never owns data. HubSpot is out.*
  - Production: set `LEAD_BACKEND=frappe` (or leave unset when Frappe keys exist — HS-1 defaults to frappe-only).
  - HubSpot is **not required**. Optional emergency only via explicit `LEAD_BACKEND=auto` or `hubspot` until HS-4 deletes the client.
  - WordPress cutover: `docs/WEBWAY_CUTOVER.md`. Full phases: `docs/HS_CUTOVER.md`.
- **Consequences:** No new HubSpot form embeds or sequences for product intake; Ops readiness + `/api/health` gate lead cutover; follow-ups via Frappe notifications or Webway mailbox (`info@trustledger.co.za`) using Lead comments; commitment still provisions Customer/Owner on Frappe (Paystack / Ops / VIP).
- **Alternatives considered:** Keep ADR-011 HubSpot-first forever (rejected); hard-delete HubSpot code before Production smoke (rejected — phased HS-2→HS-4).

### ADR-012: Plan Owner admin + Owner-confirmed lower seats

- **Date:** 2026-07-12
- **Status:** Accepted
- **Context:** After payment, buyers need login issued by plan. Solo ops cannot manually invent access rules per deal. Purchaser (e.g. lead consultant on lower tier) must own the plan with admin access and invite others only at lower levels they confirm.
- **Decision:** Payment/commitment provisions exactly one **Plan Owner** as org-scoped `admin` (dashboard, reporting, login, invites). Additional users are created only via Owner-confirmed invites at `client` | `contractor` | `community`. Seat limits follow plan (Practitioner ≈ owner-only; Project = unlimited per project; Institutional = custom). See `docs/ACCESS_MODEL.md`. **Institutional** Owners may assign desks **at or below** their Client/Board ceiling (peer Client/Board seats included). **Complimentary VIP** skips remaining paid desk-rank and seat-cap gates — see `docs/VIP_ACCESS.md`.
- **Consequences:** Clear post-payment provisioning; no auto-admin for teammates; HubSpot never issues product logins; paid Project cannot invite above its Owner desk; Institutional can seat Client/Board and CEO.
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
- **Decision:** Add allowlisted control surfaces under `/ops`: **`/ops/finance`**, **`/ops/staff`**, **`/ops/ai`**, **`/ops/issues`**, and (2026-08-21 addendum) **`/ops/marketing`** for the MKT-1 engine (ADR-052). Issues may read Support Ticket CRM signals now; finance books, staff HR/wellbeing telemetry, AI invocation metrics, and post-resolution client feeling land in later packets. **Staff wellbeing** is explicitly deferred (UI placeholder only). The marketing desk is operator HITL only — not a customer `/app` feature. See `docs/PLATFORM_OPS.md`.
- **Consequences:** Command centre gains control pillars with honest empty-states; no fabricated finance/HR numbers in production views. Marketing publish from Ops is the same human-apply gate as ClickUp `/tl-publish`.
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
- **Status:** Accepted — **navigation sequence superseded by ADR-049** (pack gates still apply on `/app/reports`)
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

### ADR-039: Public brand = TrustLedger only; voice = Trust

- **Date:** 2026-07-29
- **Status:** Accepted
- **Context:** FAQ/AEO copy drifted into naming Frappe/Vercel. Public buyers should hear TrustLedger and *trust*, not the implementation stack. ADR-038 §6 already banned Frappe/Vercel on marketing; this ADR locks the voice rule for all public agents and surfaces.
- **Decision:**
  1. **Public product name:** TrustLedger only.
  2. **Primary brand voice:** **Trust** dominates public-facing communications (hero, FAQ, assessment, emails, public agents, social). Lead with trust outcomes, auditability, social licence.
  3. **Vendor ban on public copy:** Do not name Frappe, Vercel, HubSpot, Interserv, AccordBridge (or similar stack brands) in marketing, FAQ, WP paste, `/faq`, `llms.txt` prose, or public agents. Say **TrustLedger Cloud** / **cloud** / **private cloud workspace**.
  4. **Chibase Consulting:** footer, legal, and ops allowlists only — never co-brand the product.
  5. **Checkout labels:** Prefer “Subscribe on TrustLedger”; payment-provider names only on checkout buttons where required for clarity.
  6. Internal docs, Ops, and engineer comments may name stack tools freely.
- **Consequences:** `src/lib/aeo/siteFacts.ts`, WP `page-home.txt`, Design System, and agent briefs stay scrubbed. Re-paste WP after FAQ fixes.
- **Alternatives considered:** Keep vendor names for “transparency” (rejected — dilutes TrustLedger); hide Chibase entirely including footer (rejected — legal/operator clarity).

### ADR-040: ZA baseline intel ships with South African plans

- **Date:** 2026-07-30
- **Status:** Accepted
- **Context:** SA buyers should not rebuild municipalities, wards, or traditional councils before they can run a desk. That baseline is platform reference data — distinct from retired sample INC-*/STK-* workspaces (ADR-033).
- **Decision:**
  1. Every SA commercial plan (Solo → Institutional) and SA trial includes **platform ZA place intel** via `geoIntake` + pack `za-mdb-2020` (provinces, districts, municipalities/metros, wards, traditional councils where seeded).
  2. Clients **only add situation data**: projects/sites, stakeholders, engagements, commitments, incidents, evidence. Optional custom villages/notes under the hierarchy.
  3. Platform packs are **shared reference**, never per-tenant fictional seed. Empty Cloud lists stay empty of cases/people — not empty of country geography.
  4. Sales / onboarding language: *baseline place intel included; you add the project.* Do not over-claim national TC completeness while the pack is partial.
  5. Detail + gaps: `docs/ZA_BASELINE_INTEL.md`. Enrich TC/wards/indicators in the pack; do not invent tenant geo seed files.
  6. **(2026-08-11)** Stats SA / Census socio-economic indicators on featured places are **platform baseline**, not “demo” figures. Product UI must not label ZA geo or Stats SA intelligence as demo/illustrative.
  7. **(2026-08-19)** Tenant **local community intel** (ward surveys, CLO tallies) and **project impact** (labour intake, training, local procurement — count + ZAR) may be uploaded via Capture and stored on the project dossier (`communityIntel.localIndicators`) **beside** platform Stats SA rows — for LED, ESG, M&E, and upward funder tracking (local → provincial → national / international). Never merge local rows into platform packs or `mockIndicators`.
- **Consequences:** Packaging and `/product` copy treat ZA geo + Stats SA baseline indicators as included; national TC expansion and broader indicator coverage remain enrichment packets. Never brand platform packs as demo seed. Local surveys remain tenant situation data.
- **Alternatives considered:** Charge for geo as an add-on (rejected — table stakes for SA SRM); seed sample stakeholders with each plan (rejected — ADR-033); wait for Cloud Geo DocTypes before shipping pickers (rejected — browser pack is launch SoT); keep “demo/illustrative” labels until a second ingest (rejected 2026-08-11 — undermines trust in Stats SA baseline); overwrite Stats SA with local survey values (rejected 2026-08-19 — baseline remains platform SoT).

### ADR-041: Site location cascade sequence (Country → … → Ward)

- **Date:** 2026-07-30
- **Status:** Accepted
- **Context:** Site population (issue intake and other place capture) drifted into any-order pickers and a City→DM→TC→Ward wizard that skipped Country/Province and lacked “add if missing.” Field teams need one agreed sequence backed by the ZA pack.
- **Decision:**
  1. Locked capture sequence: **Country → Province → Town → DM → TC → Ward**.
  2. Each step is a **dropdown** fed by platform pack data (`za-mdb-2020` for SA).
  3. Each step offers **Add if not listed** for tenant-authored places (browser workspace today; never invent INC-*/STK-* seed).
  4. TC may be **None / not applicable**; when the pack has no TCs for the DM, skip automatically and unlock wards.
  5. Canonical UI: `GeoCascadePicker`; issue report dialog wraps it via `GeoLocationWizard`. Reuse the picker anywhere site geo is collected.
  6. Supersedes “any-order” cascade behaviour for intake.
- **Consequences:** Report copy and validation use the full sequence. Custom places store under `tl-custom-geo-places` for the workspace browser.
- **Alternatives considered:** Keep any-order free pick (rejected — breaks training); town search only without province (rejected — harder audit trail); force TC always (rejected — metros / no-TC DMs).

### ADR-042: Themba (The Trust) — public visitor guide agent

- **Date:** 2026-08-13
- **Status:** Accepted
- **Context:** Buyers and visitors need a calm, on-brand guide for simple product Q&A without inventing a second stack brand or putting LLM keys in the browser. Desk AI Assist (suggest→apply→save) stays separate. Complex sales, legal, billing disputes, and account issues need a human path.
- **Decision:**
  1. **Name:** Customer-facing agent is **Themba** (subtitle **The Trust**). Voice = Trust (ADR-039). Never name Frappe/Vercel/HubSpot/Interserv/AccordBridge in replies.
  2. **Phase A (this ADR):** Visitor widget on public marketing routes `/`, `/product`, `/faq` only. Answers from canonical knowledge (`siteFacts` PUBLIC_FAQS + `docs/PLATFORM_STRATEGIC_BRIEF.md` §6, rewritten for public voice). BFF `POST /api/themba/chat` — no client API keys.
  3. **Behaviour:** Simple FAQ/objection Q&A + CTAs toward `/trial`, `/product`, `/pay`, `/contact`, `/assessment`. Unknown, out-of-scope, or escalate-intent → human handoff (contact + optional CRM Lead via existing leadCapture). Themba does **not** write desk/workspace data and does **not** auto-apply AI suggestions.
  4. **Later:** Authenticated in-app help for live/trial users remains a future packet (not THEMBA-B). Optional server-side LLM polish when a Themba key is configured — still grounded on the same knowledge corpus; never invent features.
  5. Detail runbook: `docs/THEMBA.md`. Packet: **THEMBA-A**. Marketing-guru deepening: **ADR-043** / **THEMBA-B**.
- **Consequences:** One public agent identity; acquisition stays Frappe CRM Lead; desk AI Assist unchanged. Ops may add `THEMBA_XAI_API_KEY` later without changing the widget contract.
- **Alternatives considered:** Generic “chatbot” with no brand (rejected — weak Trust voice); wire desk Grok for marketing Q&A (rejected — wrong product surface + over-claim risk); HubSpot chat (rejected — ADR-034).

### ADR-043: Themba marketing guru + public conversion (THEMBA-B)

- **Date:** 2026-08-14
- **Status:** Accepted
- **Context:** Phase A answered FAQ on three routes. Buyers need role-aware guidance (funders, engineers, municipalities), an owned avatar, conversion chips, email-gated toolkits in-chat, and a way for “this page is broken” to reach engineering without putting LLM keys in the browser.
- **Decision:**
  1. Mount Themba once from the root layout on **all public landing pages**; hide on `/app`, `/ops`, `/login`, `/pay`, `/invite`, `/auth`.
  2. Profile early (funder / engineer / project manager / municipal / other) and tailor value props. Dual engine: marketing guru + SRM guide.
  3. **Social Licence to Build** is positioning mapped to shipped modules (advisory handoff, SRM/SI, rapid-response case desk). Do not sell an unshipped Rapid-Response Division or a public funder dashboard URL.
  4. Conversion chips: 14-day trial (`/trial`), book live demo (`/contact`), contact advisory (`/contact`). Lead magnets reuse `/api/resources/download`.
  5. Bug keywords POST `/api/telemetry/bug-report` (rate-limited). Product-defect language also opens human handoff. CRM sources: **Themba Guide**, **Themba Bug**.
  6. Avatar at `/assets/images/themba-avatar.png`. Markdown subset (bold + bullets) in assistant replies. No third-party chat watermarks.
- **Consequences:** One global public widget; acquisition still Frappe CRM Lead; in-app authenticated help still deferred.
- **Alternatives considered:** Third-party chat vendor (rejected — brand ownership + ADR-034); public funder-only dashboard route (rejected — no such surface; report packs live in entitled workspaces).

### ADR-044: No Version 001/002 or TEDS in public copy

- **Date:** 2026-08-14
- **Status:** Accepted
- **Context:** Version 001 / Version 002 and “still deepening versus a full TEDS blueprint” are engineering maturity labels. They leaked into FAQ, Themba, marketing footer, and the customer app, which reads as internal roadmap rather than product.
- **Decision:**
  1. Public and client-facing surfaces (marketing, FAQ, `/llms.txt`, Themba, resource packs, readiness report, `/app` shell and module pages) **must not** name Version 001, Version 002, V001, V002, or TEDS.
  2. Public language uses **modules and plans**: grievance resolution desk vs Stakeholder Intelligence (registry, engagements, commitments) on entitled plans.
  3. Internal docs, Ops (`/ops`), and `tedsMaturity.ts` may keep version/TEDS labels.
  4. Amends ADR-023 **public labelling** (the V001 badge / Available-now vs Coming-in-V002 copy). Engineering packet names stay Version 002 internally.
- **Consequences:** Themba sanitizer strips version/TEDS if an optional LLM polish reintroduces them. WordPress paste FAQ in `docs/wordpress/page-home.txt` matches `siteFacts`.
- **Alternatives considered:** Keep honest version badges on marketing (rejected — internal maturity, not buyer language).

### ADR-045: Themba audiences, Global South, document grounding (THEMBA-C)

- **Date:** 2026-08-14
- **Status:** Accepted
- **Context:** THEMBA-B profiled only funder / engineer / PM / municipal leader, so MEL, community members, and social facilitation practitioners collapsed to “other.” Copy and municipal CTAs read as South Africa-only even though the product definition is Global South. Themba answers were thin (single FAQ retrieve + 2–6 sentence polish) and did not cite operating procedures or the SRM blueprint. Published IKS papers were offered as training material but are not in the repo yet.
- **Decision:**
  1. **Audiences:** Profile chips include MEL / M&E, community member, social facilitator, and local government (Global South public sector), plus funder, engineer, PM. Do not collapse facilitation / community / MEL into “other.”
  2. **Geography:** Public Themba and marketing speak to South Africa **and** the Global South. ZA place packs remain included baseline for SA plans (ADR-040). Do not invent unshipped national geo packs.
  3. **Document grounding:** Themba retrieves multiple knowledge chunks and cites public-safe excerpts from operating procedures (`USER_MANUAL` spine/daily loop), the SRM blueprint (six assessment dimensions), and the Community Engagement Toolkit. Optional LLM polish must stay descriptive and faithful — not a two-sentence gloss.
  4. **IKS:** Until licensed excerpts are filed in `docs/themba/sources/IKS_PAPERS.md` and promoted into `src/lib/themba/sources/iksPractice.ts`, Themba uses a product practice frame (traditional authorities, place, participation trail, MEL evidence) and **must not invent paper titles or findings**.
  5. Packet: **THEMBA-C**. Runbook: `docs/THEMBA.md`. Source drop zone: `docs/themba/sources/`.
- **Consequences:** Home “who it is for” strip and FAQ municipal copy match the wider audience. WordPress FAQ paste should be re-pasted when ops next update the marketing host.
- **Alternatives considered:** Wait for IKS papers before widening audiences (rejected — product already serves those roles); claim finished geo packs for every Global South country (rejected — dishonest).

### ADR-046: Chibase site on this app; dual-origin public hardening; MX stays Webway

- **Date:** 2026-08-14
- **Status:** Accepted
- **Context:** `chibaseconsulting.co.za` WordPress was compromised (casino injection + fake Terminal “Human Verification” / ClickFix). The brochure was also too long and asked for CAPEX on first contact. TrustLedger already runs on this Next.js app. Email for both domains is on Webway and must not move with the website.
- **Decision:**
  1. **Chibase Consulting public site** is rebuilt in this repo under `/firm`, same visual language as TrustLedger, **separate public identity** (ADR-039). Complement, do not merge brands. No TrustLedger `/pay` or Themba on the firm host. Consulting package checkout may live on the firm host (ADR-048).
  2. **Host routing:** After DNS cutover, `chibaseconsulting.co.za` (and www) serve the firm pages. Product paths (`/app`, `/pay`, `/trial`, …) 302 to the TrustLedger URL with `utm_source=chibase`. Until cutover, preview at `/firm` is **noindex**.
  3. **Retire WordPress; do not clean it.** Webway declined malware/forensic cleanup (out of hosting scope). Do **not** hire a WP specialist to disinfect the brochure. Delete/suspend the Chibase WP document root and database. **Do not import** posts, media, themes, or plugins. Point **website DNS only** (apex A + www CNAME) at this app. Set `NEXT_PUBLIC_CHIBASE_SITE_URL` only after this app is the public hostname.
  4. **Email:** MX for `chibaseconsulting.co.za` and `trustledger.co.za` **stays on Webway**. Do not change nameservers. `trustledger.co.za` WordPress is unchanged in this packet.
  5. **Security (both origins):** CSP + HSTS + probe block (no PHP/WordPress surface), form honeypot/reCAPTCHA/rate-limit with event log, CSP violation reports. Honest limit: this **hardens and detects**; it does not make either site unhackable (tenant ladder remains ADR-038). Request proxy lives in `src/proxy.ts` (Next.js 16; `middleware.ts` is deprecated).
  6. **Contact:** Short form only (name, work email, note). CRM Lead source **Chibase Consulting**. No CAPEX questionnaire. Rapid-response remains **human field intervention**, not a software division.
  7. Packet: **SEC-SITE**. Runbook: `docs/CHIBASE_SITE.md`, `docs/SITE_SECURITY.md`.
- **Consequences:** TrustLedger footer points at `/firm` instead of the compromised WordPress origin. Operators add the Chibase hostname on the existing app, ask Webway to delete WP + change website DNS only, then set the canonical env. Internal docs may name the host; public copy does not name stack vendors (ADR-039).
- **Alternatives considered:** Clean and keep WordPress (rejected — same attack surface; SP will not clean); wait for a WP specialist (rejected — replacement site exists; do not migrate malware); move MX with the site (rejected — mail stays Webway); claim the sites cannot be compromised (rejected — dishonest).

### ADR-047: Chibase hero preview desk (local mock, not a workspace)

- **Date:** 2026-08-14
- **Status:** Accepted
- **Context:** Buyers landing on Chibase Consulting need a feel of TrustLedger without reopening the retired public sample desk (ADR-033) or mixing a guest `/app` session into the consulting origin (ADR-046).
- **Decision:**
  1. The Chibase home hero includes an interactive **preview desk**: add mock cases / named people / promises; KPIs and a list update in place.
  2. Data lives in **this browser only** (`sessionStorage`). No Cloud, no cookies that enter `/app`, no `INC-*` seed, max 12 rows. Chrome is labelled preview.
  3. CTA for a real trail remains the TrustLedger **14-day own-data trial** (absolute product URL). Does not restore sample-demo entry.
  4. Packet: **CHIBASE-PREVIEW**.
- **Consequences:** Consulting site can demonstrate the desk without a fictional workspace. Trial/live lists stay empty-or-real.
- **Alternatives considered:** Link only to `/trial` with a static screenshot (rejected — user asked to add mock data and view a dashboard); restore `/demo` guest `/app` (rejected — ADR-033).

### ADR-048: Chibase Consulting packages stay independent of TrustLedger plans

- **Date:** 2026-08-14
- **Status:** Accepted
- **Context:** Chibase Consulting is an independent entity with its own offerings. Folding those into TrustLedger Paystack plan IDs (Solo / Practitioner / Project / Institutional) would merge brands, mix invoices, and risk provisioning software seats from a consulting payment. Consulting should still be available as an add-on to any TrustLedger plan at the client’s request, on Chibase’s own pricing.
- **Decision:**
  1. **Separate catalogue** in `src/lib/chibase/packages.ts`: `facilitation`, `mel`, `iks`, `field`. Not `PaystackPlanId`. Not `AddonId` (those unlock desk modules).
  2. **Own pricing:** Listed starter fees in `CHIBASE_LAUNCH_PRICES_ZAR` (facilitation R95,000, IKS R110,000, MEL R125,000, field R185,000 — excl. VAT, one programme or site). Override with `CHIBASE_AMOUNT_*_CENTS`. `0` = request a package. Larger programmes stay quote.
  3. **Firm surface:** `/packages` (preview `/firm/packages`). Request → `/contact?package=`. Pay now only when cents > 0. Checkout API `/api/chibase/pay/*` is allowed on the firm host. TrustLedger `/pay` stays 302 off the firm host (ADR-046).
  4. **Paystack isolation:** Initialize metadata `{ catalogue: "chibase", package }`, reference prefix `cb_`. Same keys, same webhook URL. On `charge.success`, log CRM Lead source **Chibase Consulting** only — never `provisionAfterPaystackVerify`, Plan Owner, or trial seats.
  5. **TrustLedger:** One add-on line under home pricing (and FAQ / Themba). Link to Chibase packages with UTM. No fifth software column.
  6. Packet: **CHIBASE-PACK**. Runbook: `docs/CHIBASE_SITE.md`, `docs/PAYSTACK_SETUP.md`.
- **Consequences:** Operators can add Chibase SKUs on Paystack when cents are set. Software and consulting stay separately invoiced. A consulting payment cannot open a TrustLedger workspace.
- **Alternatives considered:** Fifth TrustLedger plan column (rejected — merges entities); software `AddonId` for facilitation (rejected — unlocks product capabilities); reuse `/api/paystack/initialize` (rejected — provision path is TrustLedger-plan-only).

### ADR-033: Retire public sample demo; SI Cloud is the SRM engine

- **Date:** 2026-07-23
- **Status:** Accepted
- **Context:** Public `/demo` auto-entered a sample INC-* workspace that competed with trial/live and risked bleed. Stakeholder Intelligence (registry → engagements → commitments) is the platform engine — without Cloud SI there is no durable SRM. GO LIVE is Done for the resolution desk; buyers need onboarding/feature education, not fictional data.
- **Decision:**
  1. **Retire** public sample-demo entry (`tl-mode=demo` guest workspace). `/demo` permanently redirects to `/product`.
  2. **`/product`** is the public onboarding + feature-purpose surface (what TrustLedger is for, SI core, how to start). CTAs → `/trial`, `/login/live`, `/pay`, `/contact`.
  3. Product workspaces are **trial** (browser) or **live** (Frappe Cloud only). Lingering `tl-mode=demo` sessions hitting `/app` are cleared and sent to `/product`.
  4. Mock seed remains only as ADR-010 live-unreachable fallback for non-customer exploratory paths — never for customer/trial lists.
  5. **Active north star:** Cloud Stakeholder Intelligence — DocTypes + BFF CRUD for TL Stakeholder / TL Engagement / TL Commitment so live Owners get empty-or-real Cloud lists (no seed) and create/update on Cloud.
  6. Supersedes ADR-001 and ADR-004 **entry** behaviour (Demo-first `/demo` funnel). App shell under `/app` stays.
- **Consequences:** No public fictional desk; marketing/assessment CTAs retarget `/product` or `/trial`. Ops still ensures SI DocTypes. Stats SA / live Grok deferred.
- **Alternatives considered:** Keep sample preview beside trial (rejected — bleed + confuses buyers); wait for srm-core methods before SI Cloud (rejected — resource API BFF unblocks Owners now).

### ADR-049: Portfolio → project workspace → kind-based reports

- **Date:** 2026-08-15
- **Status:** Accepted (supersedes ADR-028 navigation sequence for day-to-day use)
- **Context:** Users struggled to generate and view reports from the Activity + Reports split. They need an executive overview of all projects, then a project workspace for inputs and reporting.
- **Decision:**
  1. `/app/dashboard` = **Executive dashboard** — **active** projects (Active / Approved / OnHold) with empowerment budget / spent / available, targets, % achieved, ESG/employment signals, trust and open cases. Fed by project dashboards.
  2. `/app/projects/[id]` = **Project dashboard** — sole activity hub for that project: capture, monitor, edit; data **segmented by report category** (ESG, B-BBEE, employment/training, GRM/incidents, budget, stakeholders, CSI, issue log).
  3. Charts and category panels populate as Capture/case/stakeholder data is entered.
  4. Report generation = **kind + format + level only**; mapped category data auto-fills the template — **no topic/section picking**.
  5. `/app/reports` remains Plan Owner **pack seniority** hub (monthly / executive / board) — secondary; wizard also auto-maps topics by kind.
- **Consequences:** Nav label “Executive”; project dashboards roll up into the executive view. ADR-028 pack gates still apply on `/app/reports`.
- **Alternatives considered:** Keep Activity home only (rejected — user blocked on reports); single mega Reports page without project drill-in (rejected — mixed jobs); manual topic checkboxes (rejected — user asked for mapped auto-fill).

### ADR-052: Developer-owned marketing engine (Gemini + ClickUp HITL + Zernio)

- **Date:** 2026-08-21
- **Status:** Accepted
- **Context:** Acquisition needs a repeatable Chibase thought-leadership and TrustLedger trial/product cadence without locking the brand into a third-party social dashboard, without HubSpot mail, and without auto-publishing unreviewed copy (ADR-006). Email already has a locked path (Frappe Newsletter + EM-2 ClickUp cadence).
- **Decision:**
  1. **Own the loop in this repo.** Serverless cron + webhook on the Next.js app (`src/app/api/cron/run-chibase-campaign`, `run-trustledger-outreach`, `src/app/api/webhooks/clickup`). Source markdown lives in `content/`. Wrappers in `src/lib/marketing/`. No marketing-vendor UI embeds or watermarks in the product.
  2. **Gemini** synthesizes drafts server-side only (`GEMINI_API_KEY` never `NEXT_PUBLIC_`). Missing key → deterministic template from the markdown. Voice bans in `voice.ts` (ADR-039 / ADR-044).
  3. **ClickUp Marketing Review** (`901220539195`) is the command centre and human gate. Cron stages; humans edit. Publish only on status **Approved** or comment `/tl-publish`. Default `complete` is not a publish signal.
  4. **Zernio** is the distribution API (`ZERNIO_API_KEY` + connected account IDs). If accounts are unset, approval leaves copy in ClickUp for manual paste.
  5. **Never email from this engine.** Fortnightly newsletters stay EM-2 → Frappe Newsletter. No Resend blasts, no HubSpot, no ClickUp SMTP.
  6. **Two speakers.** Chibase posts are Chibase Consulting thought-leadership (TrustLedger mentioned at most once as a complementary product). TrustLedger posts are Trust voice and do not hero-co-brand Chibase.
  7. **(2026-08-21 addendum)** Operators may brief **topic, length, and destination** from `/ops/marketing` (LinkedIn post / article / comment, Reddit, ESG community, website blog). Cron cadence is unchanged. Long-form and site copy are paste-ready; the engine does not auto-publish WordPress or Insights.
  8. **(2026-08-21 addendum)** `/ops/marketing` is the review **inbox**: only unpublished engine drafts. Archive is explicit (or automatic after live publish). Default ClickUp `complete` is still not a publish signal.
- **Consequences:** Operators set Vercel secrets, connect Zernio accounts, and add ClickUp statuses + webhook. Day-to-day interaction is the Platform Ops desk **`/ops/marketing`** (packets **MKT-2** / **MKT-3**), not the customer dashboard. Packet **MKT-1**. Runbook: `docs/MARKETING_ENGINE.md`.
- **Alternatives considered:** Buffer/Hootsuite dashboards (rejected — UI lock-in / watermarks); auto-publish from cron (rejected — ADR-006); ClickUp as blast engine (rejected — EM-2); HubSpot social (rejected — ADR-034).

### ADR-051: Viewer discussion & feedback on reports and issues

- **Date:** 2026-08-16
- **Status:** Accepted
- **Context:** Report and issue viewers need a place to give feedback, request information, or propose a meeting without using the product-level Feedback drawer (CRM). Meeting suggestions must leave a calendar stamp; given/responded times must be auditable per commercial plan.
- **Decision:**
  1. Ship a browser **Discussion & feedback** space on report presentation, report library, and incident case desk (`tl-discussions`).
  2. Thread kinds: `feedback` | `info_request` | `meeting_request`. Each thread stores `givenAt`, `respondedAt`, and `planId`.
  3. Meeting proposals capture calendar items (date/time, venue). On plans with `engagements`, optionally create a draft Engagement (`source: discussion`).
  4. Available on **every** plan that can view reports/issues — not a separate paid capability. Product Feedback drawer stays for CRM ratings.
- **Consequences:** Viewers can collaborate on a specific report/case; Cloud DocType sync is a later packet.
- **Alternatives considered:** Extend product FeedbackDrawer (rejected — wrong audience/SoT); require Project plan for all discussion (rejected — Solo/Practitioner also view reports/cases).

### ADR-053: Stakeholder Engagement Plan from briefing / RFP

- **Date:** 2026-08-26
- **Status:** Accepted
- **Context:** Proposal and inception work often starts as a tender, RFP, or briefing — not as already-named registry rows. Teams need a client-presentable SEP and a process map that can seed the SRM desk once the assignment is approved, across sectors, without inventing counterparts or auto-writing live data.
- **Decision:**
  1. Ship **Engagement plan** under `/app/engagement-plan`, gated on the existing `engagements` capability (Project+ / CRM add-on). No new entitlement SKU.
  2. **Local composer** (`sepComposer`) maps the extract **or a facts pack (no file)** onto a sector playbook (seven phases: inception → close-out). **Gemini** drafts the presentable nine-section document from those facts (`src/lib/sepGemini.ts`, `POST /api/app/engagement-plan/draft`). `GEMINI_API_KEY` stays server-side (never `NEXT_PUBLIC_`). Missing key or a rejected payload → playbook template (`buildSepDocument`). Pattern remains suggest → human apply → save (ADR-006). Activity reports and compliance briefs still use `reportComposer` — they do not call Gemini, Grok, or Frappe.
  3. Outputs: an operator **dashboard** (power–interest; Social Licence to Build™ → shipped desks — internal only) and a client-presentable **report** in tender layout: cover block (project name, procuring entity, implementing entity, duration, framework), numbered sections with subsections, and tables (stakeholder matrix, engagement schedule, risks, KPIs). The report states what this project is, what this document is, and what the plan will do — what, how, when, and by whom. Letterhead is Chibase Consulting + TrustLedger. **Do not** include a TrustLedger Protocol / SL2B annex. TrustLedger and Social Licence to Build (SL2B) may be named only as tools in methodology (record + sequencing frame). No desks, Themba, Capture, Apply, or execution protocols in anything a client will read.
  4. After approval, **Apply to SRM** creates prospect stakeholders, draft engagements, and open commitments via existing services. Duplicate names/titles are skipped. Plans stay org-scoped in the browser until a Cloud DocType exists; applied rows follow the live SI path.
  5. Do not over-claim statutes or unshipped channels: instruments appear only when cited in the brief or named in the playbook as “if cited”. Map SLB labels to **shipped** modules (Stakeholders, Incidents, Engagements, Capture, Intelligence, Themba-public). Do not claim a public SMS/WhatsApp portal, GIS editing, or a staffed 24/7 division. Not legal advice.
  6. When the brief is a **physical or economic move** (relocation / RAP / PS5 / cut-off / host community **together with** a move of households), overlay a relocation programme. Bare “host community”, “project-affected”, or utility “relocation” do not trigger it. The presentable document is the operating plan for that move (census → entitlements → host → move → restoration). It is **not** a product-architecture essay about Social Licence to Build™ pillars. Counts, sites, and package values are not invented.
- **Consequences:** Capture after award is shorter because the plan already named classes, methods, and standing promises. Packet **SI-SEP**. Relocation assignments no longer export a municipal LED consultation pack with SLB three-anchor copy.
- **Alternatives considered:** New paid capability (rejected — same SI seat); Cloud Grok for activity reports (rejected — reportComposer / ADR-006); auto-write on compose (rejected — governance). Gemini for the **client SEP document only** is accepted because the operator already uses it for marketing drafts and the user directed that Gemini write this document.

### ADR-054: Focused SKUs on one TrustLedger workspace (not standalone products)

- **Date:** 2026-08-31
- **Status:** Accepted
- **Context:** Smaller civil firms, Tier-2 contractors, municipalities, and independent CLOs often need one compliance headache solved (grievance logging, local ED/B-BBEE evidence, field registers) before they will buy full Stakeholder Relationship Management. A land-and-expand funnel and persona marketing are commercially sound. Splitting the platform into separately licensed SaaS products (Grievance Logger, Supplier Portal, Field Companion) with their own Git repos, Frappe apps, and Cloud sites would fork tenancy, billing, security, and the TrustLedger brand — and would promise WhatsApp portals and native offline apps that are explicitly later (`docs/VERSIONING.md` V003+).
- **Decision:**
  1. **One product, focused desks.** TrustLedger remains the only customer-facing software brand (ADR-002 / ADR-039). Grievance, local-spend evidence, and field capture are **entry stories** on the existing plan ladder and entitlement switchboard (ADR-024 / ADR-035) — not independent products.
  2. **Do not** create standalone Git repositories, a “core + plugin” Frappe install set for customers, or per-SKU Cloud sites as the default. Dedicated sites stay **L5 Isolation** (ADR-038). A future `srm-core` module split is engineering, not a catalogue.
  3. **Upgrade = entitlement change** on the same Customer. Do not build migration scripts as if standalone databases will later merge into SRM. Trial → live `tl-org-data` migrate remains the durable path (OD-3).
  4. **Honest mapping** (runbook `docs/MODULAR_SKUS.md`): Desk A grievance = Solo/Practitioner (WhatsApp/public portal **not** shipped). Desk B local procurement = Capture / Intelligence **evidence** on Project+ (not a vendor marketplace). Desk C field companion = Capture hub + templates in the **browser** (no native offline app).
  5. Public agents, FAQ, and `/product` may market personas and focused desks. They must not name separate SKU brands, promise a supplier self-registration portal, or promise offline-first mobile.
  6. Packet: **CP-2**. Candidate future capability (vendor register) waits for a new `CapabilityId` / price — do not add `AddonId` until DocTypes exist.
- **Consequences:** Land-and-expand is the Solo → Practitioner → Project ladder plus add-ons. Persona UTM (`grievance_desk`, `local_procurement`, `field_companion`) maps onto existing Paystack plans. North star stays Stakeholder Intelligence deepening — this ADR is packaging, not a new product line.
- **Alternatives considered:** Three separately licensed Frappe apps (rejected — ops, tenancy, and brand cost; `srm-core` is not even the live SoT for every desk); hide TrustLedger on standalone sites (rejected — ADR-002); build WhatsApp intake / native offline now to make the SKUs “complete” (rejected — V003+; over-claim).

### ADR-055: Plan-centric SEP execution dashboard

- **Date:** 2026-09-02
- **Status:** Accepted
- **Context:** The SEP process dashboard mixed SLB product mapping with the assignment. Clients need a single-plan execution view from submission, with tasks, hurdles, mitigations, and an on-demand snapshot.
- **Decision:**
  1. Default tab is **Plan dashboard** (`SepExecutionDashboard`), scoped to `EngagementPlan.id`.
  2. Overlay lives in the browser (`tl-sep-execution`) until a Cloud DocType exists — same as the composer (ADR-053).
  3. Practitioner / Plan Owner edit outcomes and interventions. Client / Board / CEO get snapshot + charts read-only.
  4. Operator **Process map** (SLB → desks) stays on a separate tab.
- **Consequences:** No new Paystack SKU. No SQL. Cloud persistence is a later packet.
- **Alternatives considered:** Frappe DocType in this packet (rejected — not on Cloud yet); cross-plan programme roll-up (rejected — user asked plan-only).


