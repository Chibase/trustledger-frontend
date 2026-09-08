# AI Engineering Handoff

Task: V-02 — Core Product Integrity Verification

Assigned Agent: Cursor

Status: CLOSED

Owner closure: ChatGPT/owner independently **VERIFIED** V-02 against the COMPLETE handoff and merged PR #260 (`fb2eb6f`), then formally **CLOSED** it. This handoff is the preserved historical record. `.ai/TASK.md` is **EMPTY** for the next assignment. Do not replace this handoff until the next task is CLOSED.

Cursor executed V-02. Scope was verification-only (`.ai/` task + handoff). No product code was changed. No `srm-core` changes occurred. VERIFIED / CLOSED were not set by the implementation agent.

## 1. Task

V-02 — Core Product Integrity Verification. Verification-only assessment of the operational chain **Organisation → Project → Geographic Area → Stakeholders → Engagements → Commitments → Grievances → Reporting** against repository code, Frappe Cloud BFF integration, and available production/runtime evidence. No product development. No `src/` / `srm-core` / locked product-doc changes. Do not set VERIFIED or CLOSED.

V-02 was not present on `origin/master` (EMPTY after V-01 CLOSED). Cursor initialised `.ai/TASK.md` from the ChatGPT/owner assignment in this run, then executed it. The prior V-01 CLOSED handoff is replaced here because V-02 is a new task after owner closure of V-01.

Git at assessment: branch `cursor/v-02-core-product-integrity-c06d`; `origin/master` = `fe01d80` (`chore(ai): close V-01 current-state verification (#259)`); Production `deploySha` = `fe01d80` (matches master). Cloud reachable via health check.

## 2. Findings

### Cross-cutting persist / empty-Cloud rules

| Mode | Behaviour |
|------|-----------|
| **live** customer (`tl-mode=live`, not trial) | Cloud list is SoT. Overlay helpers keep **Cloud ids only** — empty `[]` wins (no demo `INC-*`). |
| **trial** / invitee customer | Browser `tl-org-data` / SI local keys; no mock seed. Trial SI may keep local rows when Cloud SI returns empty. |
| **demo** (retired sample path) | Mock seed allowed; ADR-033 retired public `/demo` → `/product`. |

Evidence: `preferCloudProjectList` / `preferCloudIncidentList` / `preferCloudSiList` / `overlayLocal*OntoCloud` in `src/lib/workspaceData.ts`, `src/services/{project,incident,commitment}Service.ts`, `src/lib/sepPersist.ts`. BFF comments: `GET /api/frappe/si`, `GET /api/frappe/product`, `GET /api/frappe/sep` — “empty Cloud stays empty (no mock seed)”.

Env: `NEXT_PUBLIC_DATA_MODE=live` enables Cloud paths (`src/config/api.ts` `isLiveMode`). `PLATFORM_OPERATOR_ONLY` gates live BFF when `1`; Production health reports `launch.lockdownLifted: true` (buyers open). Ops stay on `PLATFORM_OPERATOR_EMAILS`.

Entitlements: `src/config/entitlements.ts` + `FeatureGate` / `AppNav` `hasCapability`. Solo lacks SI (`stakeholdersCrm`, `engagements`, `commitments`, `captureHub`). Project+ / Institutional have full SI chain. SEP reuses `engagements` capability (no separate SKU).

### Capture hub (feeder into SI)

| # | Finding |
|---|---------|
| Routes | `src/app/app/capture/page.tsx`; BFF `POST /api/app/capture/extract-text` |
| Store | `src/lib/captureStore.ts` — `listCaptureRecords` / `saveCaptureRecord` (`tl-capture-records` localStorage) |
| Apply → SI | Capture narrative apply saves `stakeholderService.save` + `engagementService.save` with `projectIds` / `stakeholderIds` / `captureId` (`capture/page.tsx` ~787–854) |
| Gate | `captureHub` (Project+) |
| Class | **implemented but runtime-dependent** (apply hits live SI BFF when live) |

### SEP (chain sibling — briefing → registry/engagements/commitments)

| # | Finding |
|---|---------|
| Routes | `/app/engagement-plan`, `/new`, `/[id]` under `src/app/app/engagement-plan/` |
| Persist | `src/lib/sepPersist.ts` → `GET\|POST\|DELETE /api/frappe/sep` → DocType **`TL Engagement Plan`** (`src/lib/sepCloud.ts`) |
| Apply | `src/lib/sepApply.ts` `applyEngagementPlanToSrm` → stakeholder / engagement / commitment services |
| Gate | `engagements` |
| Class | **implemented but runtime-dependent** |
| Gap | `tedsMaturity.ts` stillNeeded still says “Cloud document type for saved plans” — **stale**; SI-SEP Cloud persist is Done |

---

### 1. Organisation / Plan Owner / tenancy (T1–T5, OD-3/OD-4)

| Item | Evidence |
|------|----------|
| **Routes** | `/app/settings` (`src/app/app/settings/page.tsx`); org UI: `TeamSeatsPanel`, `DataSpacePanel`, `MediaLibraryPanel`, `PlanOwnerMasterPanel`, `EntitlementsSettingsPanel`. Invite: `/invite/accept`, `/invite/reject`. Live login `/login/live`. Pay/trial bootstrap. |
| **Client** | `orgStore.ts` (`ensureOwnerOrg`, `createOrgInvite`, `tl-orgs`); `orgSession.ts` (`bootstrapPlanOwnerOrg`, cookies); `orgDataSpace.ts` (`tl-org-data`); `entitlementCloud.ts` (`getCustomerEntitlementByOwnerEmail`, `entitlementAllowsLiveAccess`); `frappeSoT.ts` (Customer/User drafts); `planOwnerAccess.ts`; `tenantScope.ts` `bindSessionCustomer`; `migrateOrgClient.ts` → `POST /api/frappe/migrate-org` |
| **BFF** | `POST /api/frappe/provision-owner`; `POST /api/frappe/migrate-org`; invite APIs under `src/app/api/invite/*`; `POST /api/org/password`; Paystack + `GET\|POST /api/cron/charge-due` |
| **DocTypes** | Frappe **Customer** + **User** (custom_plan_code, custom_owner_email, custom_entitlement_status, custom_project_limit). Not a `TL Organisation` DocType. |
| **Persist** | Trial: localStorage org. Live: Cloud Customer/User SoT (T5/OD Done). OD-3 migrates projects/incidents/evidence/trust/SEP — **not** SI stakeholders/engagements/commitments. |
| **Empty Cloud** | N/A as list; tenancy bind drops unbound rows. No INC-* seed in customer/trial (`workspaceMode.ts`). |
| **Links** | Customer stamps all TL\* rows; Plan Owner invites seats; project create checks `projectLimit`. |
| **Gates** | Plan seats; `requireLivePlanOwner` for create project / invites; entitlement status trial\|active for live access; `PLATFORM_OPERATOR_ONLY` when set. |
| **Gaps** | Invite email operator sitting (Resend From apex); `tedsMaturity` administration stillNeeded “Plan Owner invites (post lockdown)” stale vs GO LIVE Done. Migrate omits SI CRM rows. |
| **Class** | **implemented but runtime-dependent** (Cloud provision + env); invite mail **blocked/operator-dependent** for remaining sitting items |

### 2. Project

| Item | Evidence |
|------|----------|
| **Routes** | `/app/projects` `page.tsx`; `/app/projects/[id]` → `ProjectDetailClient`, dossier, MEL, workspace dashboard |
| **Client** | `projectService.ts` — `list` / `get` / `save` / `overlayLocalProjectsOntoCloud`; `projectDossier.ts` (local overlay); `listWorkspaceProjects` |
| **BFF** | `GET\|POST /api/app/projects`; `GET\|PUT /api/app/projects/[id]`. Optional srm_core `list_projects` then resource API fallthrough. |
| **DocType** | **`TL Project`** (`productCloud.ts` / `frappeProductDocTypes.ts`) |
| **Persist** | Live: Cloud upsert; dossier stays local. Trial: `tl-org-data` / trialStore. Demo: mockProjects. |
| **Empty Cloud** | Yes — `overlayLocalProjectsOntoCloud` maps Cloud ids only; live list returns `[]` when empty. |
| **Links** | `ward` / `municipality` strings; dossier.geo.placeId (local); incidents/engagements/commitments/capture/reports filter by `projectId`. |
| **Gates** | `projects` capability (all commercial plans); create Plan Owner + projectLimit; Solo = 1. |
| **Gaps** | Programmes/milestones/teams; place id not a Cloud Link field (Data/JSON overlay). `tedsMaturity` score 40. |
| **Class** | **implemented but runtime-dependent** |

### 3. Geographic Area

| Item | Evidence |
|------|----------|
| **Routes** | `/app/geo` `src/app/app/geo/page.tsx`. **Not** in `AppNav` — reached via dashboard quick actions / dossier / intelligence / stakeholder links. |
| **Client** | `geoService.ts` — pack seed via `geoSeed.ts`; live tries `FRAPPE_METHODS.listGeoPlaces` then falls back to seed. |
| **BFF** | `GET /api/geo` (client-safe pack queries). No `/api/frappe/geo` DocType BFF. |
| **DocType** | **None** in-repo. Platform ZA place packs (ADR-040), not tenant DocType. |
| **Persist** | Static/seed packs under `data/geo/`; indicators mock/pack. Project dossier.geo is local overlay. |
| **Empty Cloud** | N/A (not Cloud-backed tenant data). Does not invent INC-*. |
| **Links** | Project dossier placeId; stakeholder.placeId; incident.geo; engagement ward/placeLabel (strings). |
| **Gates** | `geoIntake` on all SA plans (Solo+). |
| **Gaps** | Frappe Geo DocTypes; Stats SA; lat/lng — `tedsMaturity` geo.stillNeeded. |
| **Class** | **partial** (strong seed baseline; no Cloud geo SoT) |

### 4. Stakeholders

| Item | Evidence |
|------|----------|
| **Routes** | `/app/stakeholders`, `/app/stakeholders/[id]` |
| **Client** | `stakeholderService.ts` — `list` / `get` / `save` / `createStakeholderId`; keys `tl-crm-stakeholders` + org stakeholders |
| **BFF** | `GET\|POST /api/frappe/si?kind=stakeholder` → `upsertCloudStakeholder` / `listCloudSiRows` |
| **DocType** | **`TL Stakeholder`** |
| **Persist** | Live Cloud; trial org+local; demo mockStakeholders. Live customer extras only `source==="live"`. |
| **Empty Cloud** | Yes for live customers. Trial may retain local non-seed when Cloud empty. |
| **Links** | `placeId`, `projectIds[]`; Capture/SEP apply create rows; engagement.stakeholderIds |
| **Gates** | `stakeholdersCrm` (Project+) |
| **Gaps** | Relationship graph / influence matrix / dedupe (`tedsMaturity`). OD-3 migrate does not push stakeholders. |
| **Class** | **implemented but runtime-dependent** |

### 5. Engagements

| Item | Evidence |
|------|----------|
| **Routes** | `/app/engagements`, `/app/engagements/[id]` |
| **Client** | `engagementService.ts`; local `tl-engagements` + sentiment/trust overlays |
| **BFF** | `GET\|POST /api/frappe/si?kind=engagement` |
| **DocType** | **`TL Engagement`** |
| **Persist** | Live Cloud (trust overlay omitted on write); trial local; demo seed. |
| **Empty Cloud** | Live: Cloud SoT + non-seed local extras overlay. Trial keeps local if BFF fails/empty. |
| **Links** | `projectId`, `stakeholderIds[]`, `captureId`, actionItems → commitment promote; SEP apply |
| **Gates** | `engagements` |
| **Gaps** | Structured attendance; geo place ids on engagement (`tedsMaturity`). |
| **Class** | **implemented but runtime-dependent** |

### 6. Commitments

| Item | Evidence |
|------|----------|
| **Routes** | `/app/commitments`, `/app/commitments/[id]` |
| **Client** | `commitmentService.ts` — `overlayLocalCommitmentsOntoCloud`; promote from engagement detail `promoteAction` |
| **BFF** | `GET\|POST /api/frappe/si?kind=commitment` |
| **DocType** | **`TL Commitment`** (MEL expected/actual fields) |
| **Persist** | Live Cloud; trial local `tl-commitments`; demo seed |
| **Empty Cloud** | Yes for live customers (id overlay only) |
| **Links** | `engagementId`, `projectId`, `stakeholderIds`, `sourceActionItem` |
| **Gates** | `commitments` |
| **Gaps** | Cloud evidence file attach; owner from seats (`tedsMaturity`). Migrate omits commitments. |
| **Class** | **implemented but runtime-dependent** |

### 7. Grievances (Incidents)

| Item | Evidence |
|------|----------|
| **Routes** | `/app/incidents`, `/app/incidents/[id]`; intake `/app/issues/report` |
| **Client** | `incidentService.ts`; stamps `grievanceProcess.ts` (`advanceIncidentStage`, `verifyAndCloseIncident`); UI `ProcessStageActions.tsx`; root cause `grievanceRootCause.ts`; MEL learn/adapt |
| **BFF** | `GET\|POST /api/frappe/product?kind=incident`; upload `POST /api/frappe/upload-file`; ensure DocTypes `POST /api/frappe/ensure-product-doctypes` |
| **DocType** | **`TL Incident`** (+ stage Datetimes, root_cause, adapt_json); **`TL Evidence`** |
| **Persist** | Live Cloud upsert (throws if push fails); also caches org. Trial org store. Demo mockIncidents only in non-customer. |
| **Empty Cloud** | Yes — `overlayLocalIncidentsOntoCloud`; customer never merges mockIncidents |
| **Links** | `projectId` / `projectName`; optional `geo`; reports bind cases; issue report can pass projectId |
| **Gates** | `incidents`, `issueIntake` (Solo+) |
| **Gaps** | Client TAT policy admin UI; live escalation queues by tier |
| **Class** | **implemented but runtime-dependent** |

### 8. Reporting

| Item | Evidence |
|------|----------|
| **Routes** | `/app/reports` → `ReportsHub`, `CreateReportWizard`, `ProjectReportStudio`, library |
| **Client** | `reportComposer.ts` (local evidence writer — never Frappe/Grok month-end); `src/lib/reportWorkspaceLists.ts` `loadReportWorkspaceLists()`; `reportStore.ts` (`tl-authored-reports` **localStorage only**); `reportPackAccess.ts` |
| **BFF** | None for report CRUD. Lists via project/incident/commitment BFFs. SEP PDF: `POST /api/app/engagement-plan/pdf` |
| **DocType** | None for saved reports |
| **Persist** | Authored reports browser-only. Packs bind to live Cloud lists when live. |
| **Empty Cloud** | Yes — `loadReportWorkspaceLists` uses preferCloud*; composer does not invent INC-* |
| **Links** | Project-first; cites workspace incidents/commitments/capture packs |
| **Gates** | `governanceReports` (all plans); pack depth by desk/plan |
| **Gaps** | No Cloud report DocType; deeper geo/CRM-bound packs; export/print maturity (`tedsMaturity` reporting score 40) |
| **Class** | **partial** (live list bind + local composer strong; report SoT not Cloud) |

### Production / env gates (probed 2026-09-08)

* `GET /api/health`: `ok: true`, `deploySha: fe01d80`, TrustLedger app 200, Cloud 200, `lockdownLifted: true`, Paystack/cron/Resend/auto-provision/owner issuance/L2 session bind true, `leadBackend: frappe`.
* Unauthenticated Cloud BFFs return **401** (expected; no live Owner session in this agent): `GET /api/frappe/si?kind=stakeholder`, `GET /api/app/projects`, `GET /api/frappe/product?kind=incident`, `GET /api/frappe/sep` — `"Not logged in to live session"` / `"Live sign-in required"`. Chain writes are therefore **runtime-dependent** on a live Plan Owner session; they are not missing.
* `GET /api/geo?counts=1` **200** (no login): `country: 1`, `province: 9`, `district: 52`, `local_municipality: 205`, `metro: 8` (213 munis/metros), `ward: 4468`, `traditional_council: 15` — matches ADR-040 ZA pack baseline.
* Operator sitting remains: reCAPTCHA keys, OTP kill-switch, Resend From legacy apex, Webway CTA, Desk SMTP.
* `srm-core/` empty in this repo — product CRUD uses Frappe **resource** DocTypes via BFF, not Python methods in-tree.

### Classification roll-up

| Area | Classification |
|------|----------------|
| Organisation / Plan Owner | implemented but runtime-dependent (+ invite mail operator-dependent) |
| Project | implemented but runtime-dependent |
| Geographic Area | partial |
| Stakeholders | implemented but runtime-dependent |
| Engagements (+ Capture feeder) | implemented but runtime-dependent |
| Commitments | implemented but runtime-dependent |
| Grievances | implemented but runtime-dependent |
| Reporting | partial |
| SEP (sibling) | implemented but runtime-dependent |

No chain stage is **missing**. None are **demo/local-only** as the sole customer path (demo seed exists only for non-customer sessions). Geo and Reporting are the clearest **partial** SoT gaps.

## 3. Changes

* `.ai/TASK.md` — V-02 assignment ended **COMPLETE**; owner close reset it to canonical **EMPTY**.
* `.ai/HANDOFF.md` — V-02 integrity assessment preserved; Status **CLOSED** with owner VERIFIED + CLOSED.

No other files. No `src/`, no `srm-core`, no `docs/BUILD_PLAN.md` / `DECISIONS.md` / `DESIGN_SYSTEM.md`.

## 4. Validation

* `git fetch origin master`; master `fe01d80`.
* Read-only inspection of desks, services, BFF routes, DocType helpers (`frappeProductDocTypes.ts`, `frappeSiDocTypes.ts`, `sepCloud.ts`), entitlements, `workspaceData.ts` empty-Cloud rules, `migrate-org` body (projects/incidents/evidence/trust/SEP — not SI CRM).
* Production health + unauthenticated BFF/geo probes (see Findings).
* Diff limited to `.ai/TASK.md` and `.ai/HANDOFF.md`.
* Did not modify application code; did not run lint/build as product gate (verification-only; AGENTS packet gate applies to product packets).
* Lifecycle: EMPTY (master after V-01) → owner-assigned V-02 → IN PROGRESS → COMPLETE. VERIFIED / CLOSED not set by the implementation agent.
* ChatGPT/owner independent review (2026-09-08): PR **#260** is **MERGED** (`fb2eb6f`, merged by Chibase at 2026-09-08T08:46:29Z). Merge touched only `.ai/TASK.md` and `.ai/HANDOFF.md`. COMPLETE findings remain consistent with `origin/master`. Status set **VERIFIED**, then **CLOSED**, then TASK reset to **EMPTY**.

## 5. Behaviour

No product behaviour change. Implementation agents must STOP on EMPTY / COMPLETE / VERIFIED / CLOSED. Next work requires a new ChatGPT/owner ASSIGNED TASK. Do not start Packet 24c, HS-3/HS-4, lint remediation, or geo/reporting product work from this assessment.

## 6. Risks

* `tedsMaturity.ts` stillNeeded rows for SEP Cloud DocType, Plan Owner invites, ADR-013 lift are **stale** vs BUILD_PLAN / GO LIVE — can mislead if treated as assignments.
* OD-3 `migrate-org` does not migrate SI stakeholders/engagements/commitments — trial SI can stay browser-only after first live login unless users re-save via SI BFF.
* Reporting authored bodies have no Cloud DocType — live desks lose library on new browser/device.
* Geo has no Cloud DocType — place binding on projects is dossier overlay only.
* Operator sitting (reCAPTCHA, OTP, Webway, Desk SMTP, Resend apex) cannot be finished from this repo.
* Open PRs noted in V-01 (#257/#241/#238/#194/#195) may still be unmerged; not re-executed here.

## 7. Git Status

* V-02 execution merged: `fb2eb6f` (`chore(ai): complete V-02 core product integrity verification (#260)`).
* Owner close: ChatGPT/owner VERIFIED then CLOSED V-02 and reset `.ai/TASK.md` to EMPTY. Diff vs `fb2eb6f`: `.ai/TASK.md`, `.ai/HANDOFF.md` only. `src/`, `srm-core/`, and locked product documents untouched.

## 8. Remaining Work

V-02 is **VERIFIED** and **CLOSED**. No further execution of V-02. Product development may resume only when ChatGPT/owner writes a new ASSIGNED TASK. Do not start Packet 24c, HS-3/HS-4, lint remediation, geo/reporting Cloud SoT, or operator sitting from this handoff.
