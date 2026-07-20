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
- **Status:** Accepted
- **Context:** Launch requires clients to explore without login; capture email only when they print or save. Soft-gate and mandatory demo-entry forms raise drop-off.
- **Decision:** `/demo` auto-enters `/app` as a trial guest (default role `client`). Email modal gates print/save/export only. `/trial` and `/pay` remain for subscribe/quote funnels. Staff/operator live login stays at `/login/live`. Soft lead gate (ADR-008) is retired from the product shell.
- **Consequences:** Higher explore conversion; lead capture tied to intent. Role switch available in Settings. Operator lockdown still applies to live sessions only.
- **Alternatives considered:** Keep email-before-demo (rejected for launch UX); remove `/trial` (rejected — Paystack/quote path still needed).

### ADR-013: Platform Operator sole live control (until lifted)

- **Date:** 2026-07-12
- **Status:** Accepted
- **Context:** Solo founder/operator controls strategy, CRM, ops, and product end-to-end until advised otherwise. Customer Plan Owner (`admin`) must not be confused with platform-wide control.
- **Decision:** While `PLATFORM_OPERATOR_ONLY=1`, only identities in `PLATFORM_OPERATOR_EMAILS` may use live login, live `/app`, and the Frappe BFF. Demo/assessment stay public for leads unless `PLATFORM_OPERATOR_LOCK_PUBLIC=1`. Customer seat issuance stays paused until lockdown is lifted. See `docs/PLATFORM_OPERATOR.md`.
- **Consequences:** Clear sole-control posture for launch; env flip opens Plan Owner flow later.
- **Alternatives considered:** Hardcode a single email in source (rejected — use env allowlist); lock demo too by default (rejected — keep Wednesday lead funnel unless explicitly locked).

