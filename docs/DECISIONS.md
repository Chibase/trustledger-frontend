# TrustLedger Frontend — Architecture Decisions

Record significant decisions here. Agents must treat **Accepted** entries as locked.

---

### ADR-001: Demo-first on Vercel

- **Date:** 2026-07-11
- **Status:** Accepted
- **Context:** Need a full functional frontend stakeholders can try before Frappe/Interserv wiring and Cloudflare DNS work.
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
- **Context:** Interserv Frappe (`srm-core`) is the future system of record.
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
- **Status:** Accepted
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
- **Context:** Demo is live on Vercel; Interserv Frappe is not required for every visitor.
- **Decision:** `NEXT_PUBLIC_DATA_MODE` defaults to `demo`. Live Frappe calls only when explicitly set to `live`. AI mock remains independent via `NEXT_PUBLIC_AI_MOCK`.
- **Consequences:** Safe public Demo; pilots can flip env without code forks.
- **Alternatives considered:** Always-on live API (breaks Demo without VPN/backend).

### ADR-011: HubSpot lead magnet → Frappe after commitment

- **Date:** 2026-07-12
- **Status:** Accepted
- **Context:** Solo operator; HubSpot Free is already wired for assessment/demo/support intake but is limited for ongoing customer management. Frappe on Interserv is the product system of record.
- **Decision:** Use HubSpot Free only for acquisition (leads, light tickets, early pipeline). At commitment (pilot signed, paid, or Closed Won), hand off to Frappe Customer/Contact/(User). No dual full-CRM maintenance.
- **Consequences:** Clear split of tools; see `docs/CRM_HANDOFF.md`. Automate provision later; manual handoff is fine at launch.
- **Alternatives considered:** All-in on HubSpot paid; all-in on Frappe CRM for top-of-funnel (rejected for time and Free-tier fit).

