# AI Engineering Handoff

Task: V-03 — TrustLedger Differentiating Intelligence Verification

Assigned Agent: Cursor

Status: CLOSED

Owner closure: ChatGPT/owner independently **VERIFIED** V-03 against the COMPLETE handoff and merged PR #262 (`6a7a73f`), then formally **CLOSED** it. This handoff is the preserved historical record. `.ai/TASK.md` is **EMPTY** for the next assignment. Do not replace this handoff until the next task is CLOSED.

Cursor executed V-03. Scope was verification-only (`.ai/` task + handoff). No product code was changed. No `srm-core` changes occurred. VERIFIED / CLOSED were not set by the implementation agent.

## 1. Task

V-03 — TrustLedger Differentiating Intelligence Verification. Verification-only assessment of nine intelligence areas against `src/` implementation, BFF/API routes, Frappe DocTypes/contracts, and available production/runtime evidence. Do not build, fix, refactor, or start another packet. Do not modify `src/`, `srm-core`, or locked product documents. Do not set VERIFIED or CLOSED.

V-03 was not present on `origin/master` (EMPTY after V-02 CLOSED `#261`). Cursor initialised `.ai/TASK.md` from the ChatGPT/owner assignment in this run, then executed it. The prior V-02 CLOSED handoff is replaced here because V-03 is a new task after owner closure of V-02.

Git at assessment: branch `cursor/v-03-differentiating-intelligence-c06d`; `origin/master` = `672c342` (`chore(ai): close V-02 core product integrity verification (#261)`); Production `deploySha` = `672c342` (matches master). Cloud reachable via health check (app 200, Cloud 200).

## 2. Findings

### Cross-cutting (applies to every area)

* Live SI/product/trust BFFs require a Plan Owner session. Unauthenticated Production probes: `GET /api/frappe/si?kind=stakeholder` **401**, `GET /api/frappe/trust?kind=observation` **401**. Classifications therefore cannot be **Implemented + verified** for Cloud writes from this agent.
* Customer vs demo: `src/lib/workspaceMode.ts` `isCustomerWorkspaceClient()`; empty Cloud: `preferCloud*` in `src/lib/workspaceData.ts`; BFF comments on `src/app/api/frappe/si/route.ts`, `product/route.ts`, `sep/route.ts`, `trust/route.ts`.
* Entitlements: `src/config/entitlements.ts` — Solo has `trustPulse` + `geoIntake` but **no** `stakeholdersCrm` / `engagements` / `commitments` / `captureHub` / `esgIndicators` / `aiAssist`. Project+ has SI + ESG. Practitioner adds `aiAssist`.
* `srm-core/` is empty in this repo. Cloud AI method paths exist in `src/config/api.ts` (`srm_core.api.ai.*`) but Python methods are not in-tree. Live Grok is deferred (AGENTS.md / VERSIONING).
* Production `GET /api/health` (2026-09-08): `ok: true`, `deploySha: 672c342`, `lockdownLifted: true`, Cloud 200. AI mock flag is **not** exposed on health.

---

### 1. Stakeholder intelligence

| Item | Evidence |
|------|----------|
| **Routes** | `/app/stakeholders`, `/app/stakeholders/[id]` (`src/app/app/stakeholders/`) |
| **Client** | `src/services/stakeholderService.ts`; influence picker on list create (`stakeholders/page.tsx`) |
| **BFF** | `GET\|POST /api/frappe/si?kind=stakeholder` → `upsertCloudStakeholder` / `listCloudSiRows` (`src/lib/siCloud.ts`) |
| **DocType** | **`TL Stakeholder`** (`src/lib/frappeSiDocTypes.ts`); fields include `influence` |
| **Data** | Live Cloud; trial local (`tl-crm-stakeholders` / org); demo `src/data/mock/stakeholders.ts` only when not customer |
| **Runtime** | Production SI BFF 401 without live session |
| **Class** | **Implemented but runtime-dependent** |

Registry + place/project links + Cloud persist exist (V-02). This is genuine SI for live/trial, not a marketing mock. Gaps vs “intelligence”: no graph, create path sets `interests: []`.

### 2. Relationship / influence intelligence

| Item | Evidence |
|------|----------|
| **Registry field** | `Stakeholder.influence` (`high\|medium\|low\|unknown`) persisted on Cloud (`siCloud.ts` `influence`). UI select on `/app/stakeholders`. |
| **Related people** | `relatedStakeholderIds` on type + Cloud JSON (`related_stakeholder_ids`). **No editor or graph UI** under `/app/stakeholders`. Values appear in demo/VIP seed (`src/data/mock/stakeholders.ts`, `src/data/vipShowcase.ts`) only. |
| **SEP matrix** | `src/components/sep/SepMatrixBoard.tsx` + `src/lib/sepMatrix.ts` — power–interest **classes** on an engagement plan, not a live CRM relationship graph. |
| **Engagement links** | `engagement.stakeholderIds[]` Cloud JSON; Capture apply writes those ids (`capture/page.tsx` ~787–854). |
| **Maturity** | `tedsMaturity.ts` stillNeeded: “Relationship mapping graph”, “Influence / interest matrices”, “Merge / dedupe tooling”. |
| **Class** | **Partial** |

Influence as an enum on a person is implemented. Differentiating relationship intelligence (graph, matrices on named people, live related-ids UX) is not.

### 3. Trust and stability signals

| Item | Evidence |
|------|----------|
| **Desk pulse** | `TrustPulse` (`src/components/trust/TrustPulse.tsx`) uses `trustIndexFromIncidents` (`src/lib/grievanceProcess.ts`) on **workspace incident lists** (sentiment −100…100 + SLA pressure). Genuine when cases are genuine. |
| **Compose** | `src/lib/trust/composeSignals.ts` — incident pulse + `relationshipHealthFromLabels` + promise health from commitments. |
| **Note pulse** | `RelationshipHealthPulse` (`src/components/trust/RelationshipHealthPulse.tsx`) — heuristic early-warning from applied engagement sentiment. |
| **Trust layer Cloud** | DocTypes `TL Trust Observation`, `TL Trust Participation`, `TL Trust Community Context`, `TL Trust Claim Verification` (`src/lib/frappeTrustDocTypes.ts`). BFF `GET\|POST /api/frappe/trust` (`src/app/api/frappe/trust/route.ts`) — Production **401**. `omitCloudTrustOverlay` strips TE-1 overlay from SI/product Cloud writes. |
| **Advisory intel** | `src/lib/trust/intelligence.ts` — local rules, **no LLM**, suggestion → human apply, `autonomous: false`. |
| **Class** | **Implemented but runtime-dependent** |

Pulse is derived from desk evidence, not a fictional widget. TE-1 overlay remains frontend-optional and is omitted on Cloud mappers. Verification stamps are human-apply only (`frappeTrustDocTypes.ts` header).

### 4. Community risk intelligence

| Item | Evidence |
|------|----------|
| **Profiles** | `CommunityProfilesPanel` on `/app/intelligence` from `src/lib/trust/communityProfiles.ts` (trust community context / field capture). Empty until humans apply field extras. Cloud via `shouldUseTrustCloud()`. |
| **Local intel** | `src/lib/parseLocalCommunityIntel.ts` — tenant-owned baseline_compare vs project_impact; **never writes Stats SA packs** (ADR-040). Stored on project dossier overlay. |
| **Cases** | Complaint nature `community_disgruntlement` (`grievanceProcess.ts`); triage regex in `aiService.mockTriage`. |
| **SEP** | Social-risk / early-warning sections in `src/lib/sepRenderSections.ts` / `sepDocumentRenderer.ts` — plan prose, not a live risk register DocType. |
| **Class** | **Partial** |

Field-capture community context and local impact metrics exist. There is no Cloud community-risk DocType, no scored risk model, and SEP “early-warning” is document text unless applied into SI rows.

### 5. ESG / Social Performance intelligence

| Item | Evidence |
|------|----------|
| **Desk** | `/app/intelligence` (`src/app/app/intelligence/page.tsx`), `FeatureGate` `esgIndicators`. Production `HEAD /app/intelligence` → **307** `/login/live?next=%2Fapp%2Fintelligence`. |
| **Indicators** | Page reads `mockIndicators` / `FEATURED_INDICATOR_PLACES` (`src/data/mockIndicators.ts`) — hardcoded Gauteng, Eastern Cape, JHB, CPT, eThekwini; comment says platform Stats SA baseline (ADR-040), **not INC-* demo seed**. Filename is `mockIndicators`. |
| **Geo BFF** | Production `GET /api/geo?indicators=1&placeId=za-gp` **200**: unemployment 34.2% (Stats SA QLFS 2024), piped water 88.1%, youth NEET 42.5%. `geoService.indicatorsForPlace` merges pack + `mockIndicators`; live tries `srm_core.api.geo.list_indicators` then falls back. ZA pack notes say socio-econ ships via Intelligence baseline for **featured places**, not full ward ingest. |
| **Briefs** | `aiService.generateIndicatorBrief` — **always** `mockIndicatorBrief` (local heuristic; comment: never call LLM from browser). Saved `tl-esg-briefs` localStorage (`src/lib/indicatorBriefStore.ts`). **No Cloud ESG DocType.** |
| **Local SP** | Dossier `communityIntel.localIndicators` + Capture social_intel parse (`parseLocalCommunityIntel`). |
| **Class** | **Partial** |

Featured-place baseline + local upload + local brief save. Not live municipal Stats SA ingest, not Cloud SoT, not Grok.

### 6. Early-warning / predictive intelligence

| Item | Evidence |
|------|----------|
| **Heuristic EW** | `RelationshipHealthPulse` (“leadership early-warning strip”); `collectTrustAlerts` / `TRUST_INTELLIGENCE_RULES` (`src/lib/trust/recommendations.ts`, `rules.ts`); SLA/TAT pressure on Trust pulse; `NoteSentimentAssist` copy. |
| **SEP** | Early-warning as plan section / QA (`sepQualityAssurance.ts`) — documentary. |
| **Predictive** | **No** forecast model, no time-series DocType, no predicted incident/risk API. `srm-core` Grok path unused for this. |
| **Class** | **Partial** |

Early-warning is rule/heuristic on already-scored notes and cases. Predictive intelligence is **missing** inside this combined area.

### 7. AI-assisted intelligence

| Item | Evidence |
|------|----------|
| **Locked pattern** | Suggest → human apply → save (`AiSuggestionPanel`, `NoteSentimentAssist`, Capture extract, SEP draft). Solo has no `aiAssist`. |
| **Mock vs Cloud** | `aiService.ts` `USE_MOCK` = `NEXT_PUBLIC_AI_MOCK` not false/0 (**defaults on**). `.env.example` `NEXT_PUBLIC_AI_MOCK=true`. Triage/sentiment/draft/stakeholder-extract **can** call `FRAPPE_METHODS` when mock off; `srm-core` empty here. Sentiment falls back to local heuristic on Cloud error. |
| **Never Cloud LLM** | `generateIndicatorBrief`, `generateReportBrief`, `composeActivityReport` — local only (Grok returns fill-in-the-blank templates; AGENTS.md reportComposer rule). Trust TE-4: `source: "local_rules"`. |
| **Themba** | Public Q&A; does not write desk data (`themba/prompt.ts`). |
| **Class** | **Partial** |

Human-gated assist is real. Differentiating “live model intelligence” is not: indicator/report paths are local heuristics by design; Cloud AI depends on env + missing in-repo `srm-core`.

### 8. Evidence → intelligence → decision/action chain

| Step | Evidence |
|------|----------|
| Evidence in | Capture (`tl-capture-records`), `POST /api/app/capture/extract-text`, incident evidence `POST /api/frappe/upload-file` / `TL Evidence`, SEP briefing → plan. |
| Intelligence | Trust pulse / relationship health / local ESG brief / reportComposer (`src/lib/reportComposer.ts`) from `loadReportWorkspaceLists()` (`src/lib/reportWorkspaceLists.ts`) — live lists when live; empty Cloud stays empty. |
| Decision/action | **Human apply only**: Capture apply → `stakeholderService.save` + `engagementService.save`; SEP `applyEngagementPlanToSrm` (`src/lib/sepApply.ts`); grievance `advanceIncidentStage` / `verifyAndCloseIncident`; commitment `promoteAction`; trust recs `decision: "suggestion_only"`. Indicator brief “recommendedActions” do **not** auto-create cases. Authored reports: `tl-authored-reports` localStorage. |
| **Class** | **Partial** |

Desk apply chain (evidence → saved SI/grievance/commitment) is implemented and runtime-dependent on live session. Intelligence artefacts (ESG briefs, trust advisory markdown) do not close the loop into Cloud decisions without a further human save on another desk.

### 9. Separation of genuine intelligence from mock/demo presentation

| Guard | Evidence |
|-------|----------|
| **Working** | ADR-033 `/demo` → `/product`; customer workspaces never merge `mockIncidents` (`workspaceData.ts`); live Cloud list wins; VIP leftover-Solo packaging does not seed INC-*. |
| **Platform baseline vs demo** | `mockIndicators` is labeled Stats SA featured-place baseline (ADR-040), served on Production `/api/geo`. Not fictional case seed — but **not tenant-measured** either. Intelligence page binds this file directly, not Cloud socio-econ. |
| **Bleed risk** | `aiService.incidentsForBrief` defaults to `INC-1001` / `INC-1004` from `mockIncidents` when `incidentIds` missing (`generateReportBrief` path). Customer report compose uses `reportComposer` + workspace facts (safer). |
| **Env** | `.env.example` still `NEXT_PUBLIC_DATA_MODE=demo` and `NEXT_PUBLIC_AI_MOCK=true`. Production health shows live Cloud 200 + lockdown lifted (data mode live in prod), but AI mock is opaque. |
| **Class** | **Partial** |

CRM/grievance empty-Cloud rules are strong. Intelligence/ESG presentation still mixes a shared hardcoded baseline and local heuristic briefs; one AI brief helper can still cite demo INC-* if called without workspace ids.

### Classification roll-up

| # | Area | Classification |
|---|------|----------------|
| 1 | Stakeholder intelligence | Implemented but runtime-dependent |
| 2 | Relationship / influence intelligence | Partial |
| 3 | Trust and stability signals | Implemented but runtime-dependent |
| 4 | Community risk intelligence | Partial |
| 5 | ESG / Social Performance intelligence | Partial |
| 6 | Early-warning / predictive intelligence | Partial |
| 7 | AI-assisted intelligence | Partial |
| 8 | Evidence → intelligence → decision/action chain | Partial |
| 9 | Separation of genuine intelligence from mock/demo | Partial |

No area is **Implemented + verified** (no live Owner session to prove Cloud writes). None of the nine is wholly **Missing** or solely **Demo-local only**. **Blocked or operator-dependent**: live Grok / `srm_core.api.ai.*` and `list_indicators` need Cloud `srm-core` that is not in this repo (not HS-3/HS-4; not started).

## 3. Changes

* `.ai/TASK.md` — V-03 assignment ended **COMPLETE**; owner close reset it to canonical **EMPTY**.
* `.ai/HANDOFF.md` — V-03 intelligence assessment preserved; Status **CLOSED** with owner VERIFIED + CLOSED.

No other files. No `src/`, no `srm-core`, no `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, `docs/DESIGN_SYSTEM.md`.

## 4. Validation

* `git fetch origin master`; master `672c342` EMPTY before this assignment.
* Read-only inspection of desks, services, BFF routes, DocType helpers, entitlements, trust/ESG/AI modules, empty-Cloud helpers.
* Production probes: `/api/health`, unauthenticated SI/trust 401, `/api/geo?indicators=1&placeId=za-gp` 200, `/app/intelligence` 307 to live login.
* Diff limited to `.ai/TASK.md` and `.ai/HANDOFF.md`.
* Did not run lint/build as a product gate (verification-only).
* Lifecycle: EMPTY (master after V-02 close) → owner-assigned V-03 → IN PROGRESS → COMPLETE. VERIFIED / CLOSED not set by the implementation agent.
* ChatGPT/owner independent review (2026-09-08): PR **#262** is **MERGED** (`6a7a73f`, merged by Chibase at 2026-09-08T09:05:45Z). Merge touched only `.ai/TASK.md` and `.ai/HANDOFF.md`. COMPLETE findings remain consistent with `origin/master`. Status set **VERIFIED**, then **CLOSED**, then TASK reset to **EMPTY**.

## 5. Behaviour

No product or user-facing behaviour change. Implementation agents must STOP on EMPTY / COMPLETE / VERIFIED / CLOSED. Next work requires a new ChatGPT/owner ASSIGNED TASK. Do not start V-04, HS-3/HS-4, Packet 24c, Stats SA ingest, relationship graph, Grok wiring, or lint remediation from this assessment.

## 6. Risks

* Treating `/app/intelligence` + `mockIndicators` as tenant-verified ESG will over-claim Version 002 (ADR-044). Featured Stats SA cells are a **shared baseline**, not project M&E.
* `generateReportBrief` can cite demo `INC-1001` if invoked without workspace incident ids.
* `relatedStakeholderIds` on Cloud without UI will drift unused; agents may assume a graph exists.
* Trust overlay omitted on SI Cloud writes — live Owners will not see TE-1 attitudes on Frappe rows.
* ESG briefs (`tl-esg-briefs`) and authored reports are browser-local; new device loses them.
* Default `NEXT_PUBLIC_AI_MOCK=true` means Production may still be heuristic AI even when Frappe Cloud is up; health does not report the flag.
* Predictive “early warning” copy on Relationship health is thresholding of applied sentiment, not a forecast.
* Operator sitting (reCAPTCHA, OTP, Webway, Desk SMTP) is unchanged and out of scope.

## 7. Git Status

* V-03 execution merged: `6a7a73f` (`chore(ai): complete V-03 differentiating intelligence verification (#262)`).
* Owner close: ChatGPT/owner VERIFIED then CLOSED V-03 and reset `.ai/TASK.md` to EMPTY. Diff vs `6a7a73f`: `.ai/TASK.md`, `.ai/HANDOFF.md` only. `src/`, `srm-core/`, and locked product documents untouched. Pull request: https://github.com/Chibase/trustledger-frontend/pull/263.

## 8. Remaining Work

V-03 is **VERIFIED** and **CLOSED**. No further execution of V-03. Product development may resume only when ChatGPT/owner writes a new ASSIGNED TASK. Do not start V-04, HS-3/HS-4, Packet 24c, relationship-graph, Stats SA ingest, live Grok, or product development from this handoff.
