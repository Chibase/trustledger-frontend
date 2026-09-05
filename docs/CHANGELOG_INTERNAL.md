# Internal changelog

## 2026-09-05 — P3 acquisition / ops track (HS-2 in-repo + EM-1 ops surface)

- Canonical Vercel form → CRM Lead inventory (`src/lib/leadFormInventory.ts`) stays in lockstep with `resolveCrmSource`. Ops `/ops/readiness` shows the HS-2 checklist and writes one smoke CRM Lead (`hs2-smoke@trustledgersrm.co.za`, job title **HS-2 smoke**) via `GET|POST /api/ops/lead-smoke` (operators only).
- Quote requests classify as their own ops activity (not “other”). EM-1 templates/runbook stay as they are; the panel lists remaining Desk steps (uninstall Email Delivery Service, SMTP `sales@`, Send Test). Do not blast from Resend OTP keys. No Newsletter composer in this repo.
- HS-3/HS-4 stay planned — HubSpot client and `HUBSPOT_*` are not deleted. WordPress/Webway CMS edits remain an operator sitting (`docs/WEBWAY_CUTOVER.md`). Not a buyer-desk packet.

## 2026-09-05 — SI-SEP Cloud persist

- Live entitled workspaces persist Stakeholder Engagement Plans on **`TL Engagement Plan`** (`GET|POST|DELETE /api/frappe/sep`). Indexed columns plus JSON `payload` (composed plan) and `execution_json` (plan-centric overlay). Customer Link required (SEC-1).
- Local `tl-engagement-plans` / `tl-sep-execution` stay the trial / VIP-seed store and a live cache. Empty Cloud stays empty (no local-only append). PUT omits `execution_json` unless the client sent the overlay. Blank created/updated times stay blank.
- First live login migrates browser plans + overlays (`tl-sep-migrated` flag, independent of the org-bucket flag). Ops ensure + product-smoke include SEP. Gemini still drafts the presentable document only. Apply to SRM still uses existing SI services. Not a sealed ledger.

## 2026-09-05 — SEC-5 Cloud invitee seats

- Portable email invites provision a **Cloud User on the Owner’s Customer** when the invitee accepts (`POST /api/invite/accept-seat`). Same Customer User Permission as SEC-1. `custom_tl_plan_owner` stays `0`. Desk + `custom_tl_app_role` (`community|contractor|client`) are stamped from the invite. Password is the one chosen on accept, then `/login/live` (OTP still applies on later logins; first accept skips OTP because the signed invite is proof). Accept is **one-shot**: an existing Cloud User is not a password-reset path. Desk rank is re-checked against the live Customer plan, not only the signed token.
- Live BFF `resolveSessionCustomer` binds invitees from `User.custom_tl_customer` after Owner `custom_owner_email`. Matching an invitee Customer does not set Plan Owner. Unbound invitees get 403 (operators exempt). Desk cookie is locked for non-owners. Live `isPlanOwner` ignores a client-writable `session-role=admin`.
- Trial orgs without a Cloud Customer keep today’s browser-local accept (`cloud: false`). Empty Cloud stays empty. Do not claim SOC 2, dedicated isolation, or that trial/browser-only invites are Cloud Users.

## 2026-09-05 — P0b Project Cloud save

- Live project edits upsert **`TL Project`** through `PUT /api/app/projects/[id]` (any live session bound to the Customer). Create stays Plan Owner-only on `POST /api/app/projects`.
- `createCloudProject` aliases upsert so migrate/smoke re-runs do not fail when the row already exists. Mapper omits `dossier` (not a Cloud column). Blank `start_date` / `target_end_date` stay blank — updates do not invent “today”.
- Live list/detail prefer the projects BFF. Empty Cloud stays empty (no local-only append). Dossier extras overlay onto Cloud ids only. Local org cache is written after a successful Cloud upsert.
- Honest limit: programme dossier / geo pack stays a local overlay, not a Cloud DocType.

## 2026-09-04 — 24e-cloud grievance lifecycle stamps

- Live cases persist reported → deployed → investigated → resolved → verified → closed timestamps on **`TL Incident`**. Advance / Verify & close / intake upsert through `GET|POST /api/frappe/product?kind=incident`.
- Blank Cloud times stay blank — the mapper does not fill in “now”. Overlay keys and SRM sentiment are not Cloud columns. Empty Cloud stays empty (no demo `INC-*`).
- Ops ensure adds the six Datetime fields on existing DocTypes (Custom Field). Local org store is a cache; Cloud process stamps win on live list. Live save throws if Cloud upsert fails.
- PUT omits blank stage fields so a partial client row cannot clear `verified_at` / `closed_at`.
- Not a sealed ledger. Project continuous save and Cloud invitee seats stay later packets.

## 2026-09-04 — TE-12 trust-movement companion reading

- Lists **later-half companions** that co-occur with trust movement (later signals, improving/declining dimensions, explicit low willingness). They are **not causes**.
- Not statistical causality. Attendance, mixed motive, SRM sentiment, verification stamps, and Trust pulse are never used as causes.
- Later-half membership uses the same chronological id split as the period chart (tied timestamps cannot leak earlier-half rows). Returned later-half rows stay in chronological order. Low-willingness companions use `participationIds`, not observation ids.
- Proof markdown, intelligence notes, and the dashboard hub surface the mix. Empty Cloud stays empty. Trust pulse unchanged.

## 2026-09-04 — TE-11 follow-up: no invented verification times

- Cloud rows drop a missing `verified_at`; local cache drops a missing `verifiedAt`. Neither fills in “now”. Persist requires an explicit apply timestamp.
- BFF and Cloud upsert errors now list `verifiedAt` with id, dimension, fingerprint, and `source=human_apply`.

## 2026-09-04 — TE-11 Cloud SoT for claim-verification stamps

- Live customer/trial workspaces persist human-apply stamps on **`TL Trust Claim Verification`** (`GET|POST /api/frappe/trust` kind `verification` / bucket). Local `tl-trust-claim-verifications` is a cache.
- Human apply is still required. Linked evidence, attendance, participation quality, and Trust pulse still do not verify. Cloud persist never infers `source` — only `human_apply`.
- Empty Cloud stays empty (no demo bleed). Not a sealed ledger. Overlay keys and SRM sentiment are not Cloud columns.
- Hub apply resets “Applying…” if reload fails. Proof and intelligence read the active org once per load.

## 2026-09-04 — TE-10 trust-claim verification

- Classifies scored trust claims as **unevidenced / evidenced / verified**. Linked `evidenceIds` make a claim evidenced, not verified.
- Attendance, participation quality, and Trust pulse never verify a claim. Verified requires **human apply** (suggest → apply → save) on a matching fingerprint.
- Stamps stay in a local key (`tl-trust-claim-verifications`), not Cloud DocTypes and not SI overlay posts.
- Hub, proof markdown, and intelligence notes show the mix. Empty Cloud stays empty. Trust pulse unchanged.

## 2026-09-04 — TE-9 participation-quality reading

- Classifies stored participation as **trust / obligation / livelihood / mixed / unknown**. Stored motive is the class; high willingness and attendance never infer trust.
- Mixed, obligation, and livelihood are **not** treated as weak. Weak-participation alerts use explicit low willingness only (`notTrustDriven` no longer invents the alert).
- Attendance / presence is never read as consent. Quality mix is a **count of classes**, not Trust pulse and not a 0–100 score.
- Proof markdown, intelligence notes, community profiles, and the dashboard hub show the mix. Capture stays optional. No new DocType.
- Trust pulse unchanged. Empty Cloud stays empty.

## 2026-09-04 — Dashboard Copilot follow-up (chart keys + open KPI)

- Bar charts key rows by index + label (duplicate names no longer collide). Overview series keep full labels; horizontal overflow is CSS-truncated; vertical axis labels crop in the SVG with the full name on hover.
- Executive headline KPI is **Open projects** (`totals.projectCount`), matching empowerment / cases / trust on that row. Status mix still includes completed/closed. Parked-only empty copy unchanged.

## 2026-09-04 — TE-8 Copilot follow-up

- Cloud SI engagement POST strips `trustResponse` (client + BFF). Overlay is kept in a local key (`tl-engagement-trust-response`) like note sentiment, and still written to the trust layer. Local `tl-engagements` rows are stored without `trustResponse` so a cleared overlay cannot stale-read from the main payload.
- Capture / desk apply pass `getActiveOrgId() || "local"` into `applyEngagementToTrustLayer` so drafts are not cleared without a trust-layer write.

## 2026-09-04 — UX-1 dashboard overviews (graph-first)

- Executive, project, client, activity, and desk dashboards lead with **overall graphs**: four KPIs, a chart grid (status, case funnel, priority, spend/fill), then compact module/trust charts. Operational tables, SEP, capture, and case lists sit in `<details>`.
- Product overview chrome uses TrustLedger tokens (`OverviewChartCard`, compact toolbar). Capture is plan-gated (`captureHub`). No “SaaS” copy, no purple generic dashboard skin. Trust pulse formula unchanged. Empty Cloud stays empty.
- Budget mix is never relabelled as stakeholder share. Completed/closed workspaces keep a path to the project list (not “No projects yet”).
- Next trust packet remains **TE-9**. UX-1 stays Active for the reports path.

## 2026-09-04 — TE-8 engagement apply → trust participation

- Capture apply saves the engagement first, then writes **one participation row** keyed to that engagement id (upsert). Optional field extras (motive, presence, willingness, attendance≠consent) merge onto that row. Community extras still upsert by place.
- Engagement desk: optional **Trust overlay** (local `prepareTrustResponseHints` only). Suggest → review → apply & save writes overlay observations. **Note sentiment assist does not create trust observations.**
- Overlay stays optional and is not posted on the SI Engagement record. Mixed motive does not invent weak participation. Attendance is not inferred as consent.
- Re-applying an explicit overlay replaces that engagement’s overlay observations (clearing unknown dimensions). Capture apply without an overlay does not wipe prior overlay rows. `trustDriven` from an overlay is kept on later field-only upserts.
- Next packet remains **TE-9** (participation-quality reading). Trust pulse unchanged.

## 2026-09-04 — TE-7 Cloud trust DocTypes

- Live customer/trial workspaces use **TL Trust Observation**, **TL Trust Participation**, and **TL Trust Community Context** as the trust source of record (`docs/TRUST_DOCTYPES.md`). `customer` is required (SEC-1). Dimension status stays computed.
- BFF: `GET|POST /api/frappe/trust`. Ops ensure is on `ensure-product-doctypes` (includeTrust). Product smoke and live-login migrate push trust rows. Local `tl-trust-layer` is a cache / demo store.
- SRM `sentiment_label` / `sentiment_score` are not copied. TE-1 overlay keys are not Cloud columns. Empty Cloud stays empty.

## 2026-09-04 — Trust semantic gap inventory

- `docs/TRUST_MVP.md` is the living current-state inventory for the frontend trust stack. Semantic gaps (dimensions, participation, evidence↔claims, longitudinal proof, workspace, AI, engagements, docs, operational vs product MVP) are marked **fixed / partial / split / still true** — not TEDS-complete.
- Corrected the stale claim that proof UI lives only on `/app/reports`. Hub is on `/app/dashboard` and the desk; optional proof/recs remain on reports. Not a monthly pack or community-facing summary.
- `docs/FRAPPE_API_CONTRACT.md`: live SI Engagement BFF is the desk path; `list_meeting_notes` stays a **legacy** alias. Named `engagements.py` is not in this repo.

## 2026-09-04 — TE-3c trust workspace trend and comparison

- Trust proof workspace now charts **period trend** (earlier vs later mean) and **all four comparison axes** (community / location / group / phase proxy), plus the six blueprint dimensions. Mean −1…+1 is mapped 0–100 for bars only — not Trust pulse.
- Hub sits on `/app/dashboard` (above SEP) and on the desk workspace panels. Shortcuts, risk list, and proof narrative stay. Still **not** impact-trend or SLA dashboards. Frappe `stakeholder_relations_hub.json` is not in this frontend repo.

## 2026-09-04 — TE-5b community profiles and language support

- Field extras **persist to `tl-trust-layer` on Capture apply** (upsert by place + project). Typing still does not auto-save. Low-connectivity capture keeps a local field draft until apply.
- `/app/intelligence` shows **Community profiles**: history, power context, language, participation interpretation (attendance ≠ consent). Empty state has a Capture shortcut.
- Issue triage records preferred language and shows language support. `translatedDescription` is still not invented. Working language is not defaulted to English.
- Named charter / Frappe files (`TRUSTLEDGER_PLATFORM_BLUEPRINT.md`, `geographic_area.json`, `srm_incident.py`, `ai.py`) are not in this frontend repo. Geo hierarchy and IKS-sensitive Cloud fields stay on Cloud. Full UI i18n and native offline remain future.

## 2026-09-04 — TE-3b trust proof workspace on the desk

- `/app/dashboard` now shows a **Trust proof workspace**: number cards (movement, scored observations, risk flags, evidence-backed claims), a comparison bar, risk list, proof narrative, and shortcuts to reports / cases / engagements / capture.
- Uses the existing TE-3 engine (`buildTrustProofFromSrm`). Not impact-trend or SLA dashboards (still deferred). Trust pulse and monthly packs unchanged. Frappe Desk workspace JSON is not in this repo.

## 2026-09-04 — TE-2b blueprint trust dimensions

- First-class trust model now matches the six blueprint dimensions: project, implementing entity, process, people, fairness, and whether concerns will be acted upon. Stored `intentions` rows alias to `concerns_acted_upon`.
- `deriveTrustLayer` no longer copies SRM `sentimentLabel` / `sentimentScore` into trust observations. Generic sentiment stays on the case/engagement; observations come from TE-1 overlay attitudes, evidence `trustSupport`, and kept/broken commitments.
- Optional overlay fields `confidenceInFairness` and `confidenceConcernsActedUpon`. Cloud trust DocTypes remain future (`docs/TRUST_MVP.md`).

## 2026-09-04 — VIP showcase mailbox (sirthoz@)

- Default `/login/vip` allowlist is `sirthoz@trustledgersrm.co.za`. `thozi@chibaseconsulting.co.za` stays on its other plan and uses `/login/live` (not intercepted to the showcase).
- Supersedes earlier entries below that name `thozi@` as the showcase mailbox.
- Packaging / onboarding / SetupWizard tests use `VIP_SHOWCASE_DEFAULT_EMAIL` so seed and walkthrough assertions follow the dedicated mailbox.

## 2026-09-04 — SEC-1 organisation permissions (L2)

- Plan Owner Cloud Users are stamped with a Customer User Permission on provision. Live SI / migrate / upload / projects bind the organisation from the Cloud sid — a spoofed `customer=` or email cookie does not switch workspaces (operators may break-glass). Buyer `customer=` is ignored so first-login migrate still works when the browser org label differs from the Cloud Customer name.
- Product and SI lists drop rows not stamped to that organisation. Ops `/ops/readiness` can check and stamp missing binds (`GET|POST /api/ops/tenancy-smoke`).
- Cloud write tools (provision, product-smoke, ensure fields/DocTypes, ops set-password) stay allowlisted even when buyer lockdown is off.
- Sales comparison: “Access enforced per organisation on the server.” Honest limit: junior Cloud seats remain SEC-5. Playbook: `docs/FRAPPE_USER_PERMISSIONS.md`.

## 2026-09-04 — TE-6 MVP packaging and readiness

- Internal presentation posture for TE-1…TE-5: `docs/TRUST_MVP.md`. Completes / partial / future / do-not-promise lists are explicit. No new trust model, pack, nav, or DocType.
- `composeTrustMvpPackage` concatenates existing proof + recommendations + context hints. Does not persist, does not call a remote model, does not change Trust pulse.
- Cross-module tests confirm evidence-backed claims, suggestion-only recs, community hints, and unchanged monthly `reportComposer` output.

## 2026-09-04 — TE-5 Global South operating adaptations

- Optional community context (history, power structure, social sensitivity, barrier tags, language, oral source) on the parallel trust layer. `docs/TRUST_GLOBAL_SOUTH.md`.
- Field capture: collapsed **Field context (optional)** for rapid / oral / low-connectivity notes, spoken vs working language (not defaulted to English), and participation realism (mixed motives, presence ≠ consent). Existing dropdowns stay. Drafts do not auto-save to `tl-trust-layer`.
- Authority roles derived from existing stakeholder `kind` + tags (traditional, ward, community leader, informal influencer, institutional). High influence is not treated as informal influence.
- TE-1–TE-4 scoring, alerts, Trust pulse, and SRM save paths unchanged. Context can feed later analytics via `summarizeCommunityContextForIntel`.

## 2026-09-04 — TE-4 trust intelligence and recommendations

- Optional rule-based suggestions (repair, next engagement, follow-up, consider senior review) plus alerts for declining trust, missing evidence, weak participation, and unresolved cases. `docs/TRUST_INTELLIGENCE.md`.
- Every item is `suggestion_only` with a published `ruleId` and trace (observations, evidence, cases). Nothing auto-applies, auto-escalates, or calls a remote model. Local advisory wording only.
- Collapsed panel on `/app/reports` under Trust proof. Packs, writer, Trust pulse, and incident workflow unchanged.
- `buildTrustProofFromSrm` now dedupes stored + derived participation/community rows by id so TE-4 alerts are not inflated when `tl-trust-layer` already holds derived rows.

## 2026-09-04 — TE-3 trust analytics and proof reporting

- Optional, explainable trust analytics on the TE-2 layer: period movement (improving / declining / stable / mixed / insufficient), comparisons by community / location / stakeholder group / project-phase proxy, and risk flags (declining, at-risk, low confidence, insufficient evidence). `docs/TRUST_PROOF.md`.
- Proof summaries (`composeTrustProofReport` / `buildTrustProofFromSrm`) cite claims, evidence ids, history, and participation. No LLM. Does not persist. Does not change monthly / executive / board packs or `trustIndexFromIncidents`.
- Opt-in collapsed panel on `/app/reports` only — not a pack, not in nav, not required. Customer/trial lists stay own-data (no demo INC-* bleed).

## 2026-09-04 — TE-2 parallel trust-native layer

- New first-class trust models (dimensions, observations, explainable status, participation, community context) live **beside** SRM — `docs/TRUST_LAYER.md`.
- `deriveTrustLayer` reads incidents / engagements / commitments / evidence / stakeholders and does not mutate them. Persist only via `tl-trust-layer` (not `tl-org-data`).
- No new screens, nav, mandatory forms, DocTypes, or analytics dashboards. Trust pulse formula unchanged.

## 2026-09-04 — TE-1 trust overlay (non-breaking)

- Additive frontend overlay only (`docs/TRUST_OVERLAY.md`). No new DocTypes, routes, nav, or workflow changes. Trust pulse formula (`trustIndexFromIncidents`) is unchanged and not wired to the overlay.
- Optional `trustResponse` on incidents, engagements, and stakeholders; optional `trustSupport` on evidence. Cloud resource mappers still post explicit fields only.
- Helpers: `composeTrustSignals` (measurement), trust-by-place / by-kind grouping, evidence claim filter, opt-in AI overlay (`includeTrustOverlay`, stripped from srm-core payloads).
- Current AI mock output is identical unless a caller sets the flag. No UI uses the flag yet.

## 2026-09-03 — Public domain trustledgersrm.co.za

- Public apex is **trustledgersrm.co.za** (was trustledger.co.za). Cloud host **app.trustledgersrm.co.za**. Mailboxes `info@` / `sales@` / `noreply@` follow the new apex. Product name stays TrustLedger. Chibase domain unchanged. MX stays Webway.
- Runtime constants in `src/lib/security/hosts.ts` (marketing CTA fallbacks and Themba copy included). Footer, AEO FAQ, login/settings Cloud host, Resend preference, WordPress paste packs, `public/llms.txt`, and operational docs updated. CSP still allows the retired apex during cutover. Demo import tools still refuse both Cloud hostnames.
- Historical changelog lines and captured CRM contact CSVs were left as recorded. Ops must still set Webway DNS, Frappe Cloud custom domain, Vercel `FRAPPE_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` / `RESEND_FROM_EMAIL`, Resend + reCAPTCHA hostnames, and paste the WP packs. ADR-057.

## 2026-09-03 — Report pack Copilot nits

- Funder layout renders both chart groups (delivery position and assurance), not only the first.
- Executive / funder writer shows a locked brief outline instead of catalogue topic chips that were not composed. Monthly still honours included sections.
- Evidence writer accepts real workspace case ids (e.g. `INC-NCGR-01`), not only `INC-` plus digits. The old check blocked valid drafts with “Composer did not cite workspace case evidence (INC-*).”

## 2026-09-03 — Report packs are distinct lenses

- Monthly, executive risk brief, and client/funder pack no longer share one “category signals” view plus the same narrative.
- **Monthly** is the detailed operational pack (activity, issues, meetings, evidence). **Executive risk brief** lists identified issues with project impact, impact level, mitigation in progress, process stage, expected outcome, and what executives can expedite. **Board / client / funder** is a high-level assurance snapshot (trust, material items, asks).
- Local `reportComposer` writes those lenses; Cloud month-end templates stay blocked. Executive pack default kind is `executive_risk`. Switching kind on the project studio **or** the pack writer clears a stale draft so View matches the selected pack. Funder briefs still cite `INC-*` when every case is closed. Saved monthly narratives are kept; executive/funder library cards prefer cases cited in the saved body.
- ADR-028 decision 6.

## 2026-09-02 — NCGR-B seed is Thozamile only

- Illustrative NCGR-B preload is **Thozamile KaDlanga** (`thozi@chibaseconsulting.co.za`, `/login/vip`, admin · VIP · trial) only. Other complimentary VIP sessions (Cloud `/login/live` guests) are Institutional and start empty.
- Seed/purge resolve one mailbox (`email` argument or session cookie) so an empty early render still seeds Thozamile and never seeds a Cloud guest. Showcase pack ids are built once.
- Ops **C-Suite** board (`/ops/executive`) is unchanged. Cloud VIP Customer rows cannot be cancelled from this environment (no Frappe keys here) — keep the Nomcebo guest; cancel leftover test VIP Pilot Customers in Desk if any remain.

## 2026-09-02 — VIP setup wizard unlocked

- VIP showcase no longer disables the UG-1 setup wizard or hides the executive checklist. Seed does not mark onboarding complete; a one-time restore reopens Guide/Settings launch after older sessions that had been auto-dismissed. The modal still skips auto-open so NCGR-B stays visible. Institutional walkthrough copy (not “desk starts empty”). Leftover Solo cookies still resolve Institutional steps via `packagingPlanId`.

## 2026-09-02 — Plan-as-container dashboards (VIP demo only)

- Commercial plan packages **module dashboards** in a fixed tier sequence (`TIER_FLOW` + advisory gates). SEP is a module, not the plan. Executive landing shows per-module contribution and aggregate progress. Persistent **Plan modules** switcher (executive ↔ module in two clicks). Unauthorized module URLs show the plan upsell. Empty module desks show a guided banner (no preload).
- VIP illustrative showcase seeds all included desks (including SEP-NCGR-B and ESG-NCGR-B) on login / session sync. Non-VIP and live Cloud VIP stay unseeded. Incidents desk copy does not tell the showcase that nothing is preloaded. `GET /api/app/plans/dashboards` and `GET /api/plans/:id/dashboards`. Legacy `/plans/:id/sep` → `/app/engagement-plan`. ADR-056.
- Packaging review: `planId` is always a commercial SKU (no `"demo"` sentinel); switcher recomputes suggested-next after owner toggles; SEP list has no dead loading flag; indicator brief upsert returns the stored row.

## 2026-09-02 — SEP plan execution dashboard

- `/app/engagement-plan/[id]` **Plan dashboard** is scoped to that plan: snapshot KPIs, roadmap from submission, task/activity charts, success/hurdle/failure log, mitigations, practitioner snapshot for client/superior. Process map moved to its own tab.
- Overlay `tl-sep-execution` backfills from the composed plan. Linked SRM rows (applied ids / project) normalise to success/hurdle/failure/mitigated. Runbook: `docs/SEP_EXECUTION.md`.

## 2026-09-02 — VIP showcase vs live Cloud login

- `thozi@chibaseconsulting.co.za` on `/login/live` is sent to `/login/vip` (409 + client redirect). Cloud 401 was Frappe rejecting the showcase mailbox.
- Split client-safe showcase constants (`vipShowcaseIdentity`) from server-only password/rate-limit (`vipShowcaseAuth` + `server-only`) so Node crypto and the documented password stay off the client bundle. Extra allowlist addresses: `VIP_SHOWCASE_EMAILS` or `VIP_SHOWCASE_EMAIL`.

## 2026-09-02 — VIP showcase login email

- `/login/vip` allowlist default is `thozi@chibaseconsulting.co.za` so it does not share the Platform Operator / master-plan mailbox. Extra addresses: `VIP_SHOWCASE_EMAILS` or `VIP_SHOWCASE_EMAIL`.
- Rate-limit IP prefers `x-vercel-forwarded-for` (else last `x-forwarded-for` hop); attempt map is pruned/capped. Showcase seed `setItem` is quota-safe. INC-NCGR-01 SLA flag matches the 48-hour acknowledge.
- Showcase login stays on unless `VIP_SHOWCASE_LOGIN=0`, including Production, so the documented password works without a Vercel env round-trip. Operator mailboxes get a distinct 401.

## 2026-09-02 — VIP Institutional showcase workspace

- Packaged complimentary **VIP · Institutional** workspace with illustrative NCGR-B corridor programme (project, 10 stakeholders, 5 engagements, 4 commitments, 3 cases + evidence, capture minutes, activity pack).
- Gated sign-in `/login/vip` + `POST /api/auth/vip-showcase` (allowlisted emails). Off only with `VIP_SHOWCASE_LOGIN=0`; password is `VIP_SHOWCASE_PASSWORD` or the documented default in `vipShowcaseAuth`.
- Own-data ids (`PRJ-NCGR-B` / `INC-NCGR-*`) — not retired public `INC-1001` seed. Showcase banner only on trial+VIP sessions (live Cloud VIP guests keep their own workspace, no NCGR-B strip).
- Runbook: `docs/VIP_ACCESS.md` (showcase section). Paying Cloud VIPs still use Ops provision + `/login/live`.

## 2026-09-01 — srm-core Postman + curl examples

- `tools/demo/api-examples/`: Postman collection folders (Create Plan, Create entity, Evidence upload, Ledger) with `BASE_URL` / `API_KEY` placeholders; readable curl in README; `curl-examples.sh` prints or `--execute` (staging only).
- Auth documented as Frappe `Authorization: token ${API_KEY}`. `plans.create` marked proposed. Human must confirm method names and auth before a real import. No live calls in this packet.

## 2026-09-01 — SRM demo import pack (offline zip)

- `tools/demo/srm-import/`: medium CSVs (5/20/50/200/30/80/400/500), 30 royalty-free JPEGs with injected EXIF GPS/time, `import_script.py --dry-run|--run|--create-ledger`, Postman collection with `BASE_URL` / `API_KEY` placeholders.
- Zip: `tools/demo/trustledger-srm-demo.zip`. TEST keypair labelled `TEST-KEYPAIR-DO-NOT-USE-IN-PROD`. Script refuses production host and `--run` without `--i-approve-staging`.
- Do not import into customer workspaces. Human must supply a scoped staging key before `--run`.

## 2026-09-01 — Ledger key management (KMS mock)

- `docs/KEY_MANAGEMENT.md`: no private keys in git; TEST keys only in demo ZIP `TEST-KEYPAIR-DO-NOT-USE-IN-PROD/`; AWS/GCP Sign call shapes; rotation/audit checklist.
- `examples/python/sign_via_kms_example.py`: mocked KMS client, key **handle** from env, default `TRUSTLEDGER_KMS_MOCK=1`. Does not persist or print a private key. Human security review before production.

## 2026-09-01 — CI ledger acceptance + import dry-run

- `.github/workflows/ledger-acceptance.yml` on pull_request (`src/`, `docs/`, `tests/**`, `tools/**`). Checkout, Node 20, Python 3.12, `tools/ci_run.sh`.
- Jest (`test:ledger`, `test:audit`) + pytest ledger vectors + `tools/import_script.py --dry-run`. Fails the job if those checks fail. No staging secrets; skip dry-run only when the demo import pack is not in the tree.
- Local Docker instructions: `tools/ci/README.md`.

## 2026-09-01 — AuditTrailViewer chain UI follow-up

- Preview / Storybook mock chain is hash-stable (vector-1 + vector-3). File **Checksum** renders only when `canonical_entity.checksum` is present — `current_hash` stays on the prev → current line.
- Jest covers a two-entry prev_hash → current_hash chain plus Verify chain. Endpoints read from `FRAPPE_METHODS`.
- Human must still confirm Incident / Evidence placement from #188 before treating that desk as final.

## 2026-09-01 — AuditTrailViewer on incident / evidence desks

- Reusable `AuditTrailViewer` fetches `get_chain` + `public_key`, shows prev_hash → current_hash, actor, timestamp, evidence GPS/checksum, and Verify / Verify chain.
- Collapsible `AuditTrailPanel` proposed on `/app/incidents/[id]` (case + per-evidence). UX must confirm copy and placement before treating this as the production layout.
- Jest + Testing Library: `npm run test:audit`. Story: `src/stories/AuditTrailViewer.stories.tsx`. No private keys.

## 2026-09-01 — Ledger canonicalization vectors (6) + pytest/Jest

- `tests/ledger_vectors/test_vectors.json` now has **six** locked entities (`entity`, `canonical_json`, `prev_hash` including JSON `null`, `timestamp`, `actor_id`, `expected_hash_hex`).
- pytest: `tests/test_ledger_vectors.py`. Jest: `tests/ledgerVectors.test.ts` via `npm run test:ledger` (`jest.ledger.config.cjs`).
- Run book: `tests/ledger_vectors/README.md`. Human review of domain correctness before merge.

## 2026-09-01 — Ledger API spec + canonicalization vectors

- Publish-ready `docs/LEDGER_API.md`: create_entry / get_chain / verify_entry / public_key, byte-level canonical JSON, SHA-256 concat order, ed25519 over ASCII-hex `current_hash`, Base64 signature + public key.
- Reference implementations: `examples/python/canonicalize_hash_sign.py` (Python 3.10+) and `examples/typescript/canonicalizeHashSign.ts` (Node Web Crypto Ed25519). No private keys in git; ephemeral TEST-ONLY keypairs at runtime.
- Locked acceptance vectors in `tests/ledger_vectors/test_vectors.json` (three entities; Python and TypeScript MUST emit the same hex). Run steps: `docs/LEDGER_API_EXAMPLES_README.md`.
- Human review required before merge to `master` (canonicalization + signature scheme are breaking).

## 2026-08-31 — Focused SKUs on one workspace (ADR-054 / CP-2)

- Commercial land-and-expand for smaller organisations is **packaging**, not three standalone products. Runbook: `docs/MODULAR_SKUS.md`.
- Grievance desk = Solo/Practitioner; local procurement = Capture/Intelligence **evidence** (not a vendor marketplace); field companion = Capture hub in the browser (no native offline app).
- Public FAQ, Themba, `/product`, and `llms.txt` say one TrustLedger workspace — upgrade is a plan change. Persona UTM maps onto existing Paystack plans.
- Do not provision per-SKU Cloud sites or split Git product repos. Dedicated isolation remains ADR-038 L5.

## 2026-08-29 — Communication-note sentiment (SANRAL SRM)

- One-click **Analyze sentiment** on engagement communication notes and incident case notes. Classifies **positive / neutral / negative**, then **apply → save** (ADR-006).
- Saved labels feed a **Relationship health** early-warning pulse on Engagements, the executive dashboard, and desk trust panels.
- Heuristic analyzer (`src/lib/sentimentAnalysis.ts`) when Cloud AI is mocked or unreachable; live `suggest_sentiment` still normalises to a label. Sentiment overlay persists if Cloud DocType fields are not yet present.
- Incident assist now saves the applied score (it previously suggested only). Smoke: `npx tsx scripts/sentiment-smoke.ts`.

## 2026-08-27 — SEP output: academic format, logged references, no trailing blank pages

- PDF generation stops at the last page that has body text (pdfkit no longer auto-paginates leftover empty sheets). Structured tables are drawn; markdown pipes are parsed if they remain in a body.
- Sections 4, 5, 6 and 8 (both the 25-section analysis SEP and the nine-section client report) use numbered academic subsections and captioned tables (Tables 4.1 / 5.1–5.2 / 6.1 / 8.1).
- Mandatory references logged at `docs/sep-references/`: SEP Generation Specification v1.0 and the Participatory Methodologies Framework. Generation cites those documents via `src/data/sepCanon.ts` and does not invent methods, processes or sequences.
- Activity sequence is selected from the assignment (displacement, sector, research intensity, duration). A road upgrade does not inherit a relocation census / host-consent calendar (Framework s.1).
- The SEP is an SRM feature: issuer is the implementing organisation (workspace / appointed entity). Chibase Consulting is not the default letterhead or author.
- Appendix L — References. Cover / Word / Markdown / on-desk view use TrustLedger Social Engagement & Participation, not a consulting-firm brand.

## 2026-08-27 — SEP generation engine Phases D–G

- **Phase D:** PRA / PLA / CBPR method library (`src/lib/sepMethodLibrary.ts`) and tender compliance matrix (requirement → SEP response → evidence → covered/partial/missing) (`src/lib/sepComplianceMatrix.ts`).
- **Phase E:** Participation planner — every major stakeholder gets an explicit objective and decision linkage; activities, communications, GRM (48-hour acknowledgement), commitments, and input/process/output/outcome indicators (`src/lib/sepParticipationPlanner.ts`).
- **Phase F:** Fourteen automated QA tests plus approval blockers (`src/lib/sepQualityAssurance.ts`).
- **Phase G:** 25-section tender-grade SEP renderer plus appendices (stakeholder register, engagement matrix, risk register, GRM, tools, indicators, reporting templates, consultation record, commitment register, compliance matrix, QA report). Markdown / Word HTML / PDF export for the analysis document. End-to-end pipeline: tender → parse → classify → social context → plan → compliance → QA → render (`src/lib/sepGenerationPipeline.ts`).
- Smoke tests: `scripts/sep-compliance-smoke.ts`, `scripts/sep-participation-smoke.ts`, `scripts/sep-qa-smoke.ts`, `scripts/sep-renderer-smoke.ts`.
- Provenance and no-fabrication rules unchanged: tender estimates stay estimates; household counts, budgets, and sites are not invented. Client voice remains bid-grade (ADR-053).

## 2026-08-26 — Stakeholder engagement plan (SI-SEP)

- New **Engagement plan** desk (`/app/engagement-plan`): paste or upload an RFP / tender / briefing (PDF text layer or .txt / .md / .csv), or pick a sector playbook with no file.
- Local composer maps a seven-phase process (inception → close-out) for infrastructure, housing, mining, energy, water, education, health, agriculture, municipal, conservation, logistics, or generic. Suggestion only. Gemini drafts the presentable document.
- Outputs: process dashboard (power–interest, SLB → shipped desks) and a seven-section tender-grade SEP with execution protocols (Print / PDF cover, Markdown, Word).
- After client approval, **Apply to SRM** seeds prospect stakeholders, draft engagements, and open commitments; duplicates skipped. Humans apply.
- Tender-grade presentable SEP: cover page; Social Licence to Build™ philosophy mapped to shipped desks; regulatory mapping; power–interest / vulnerability; methods; grievance lifecycle (reported → deploy → investigate → resolve → verify → close); M&E from saved work. Each substantive section has a **TrustLedger SRM execution protocol**.
- Compose **without a document**: facts pack (title, municipality/ward, client, timeline, named PAP/I&AP, ticked instruments such as NEMA/IFC/SLP/WULA) + sector playbook.
- Export: branded **PDF** (cover, tables), Markdown, Word-compatible `.doc`, and print layout. Gemini drafts the document; playbook template if the key is missing. No invented portals.
- Live extract preview after paste/PDF upload (project, place, client, timeline, instruments) with human overrides before compose.
- **Ops Executive Board** (`/ops/executive`): same module as a C-suite card under the brief heading, sidebar **Engagement plan** / **Open SEP desk**, and a TEDS domain row with Open → `/app/engagement-plan`.
- Plans org-scoped by org id cookie / email (not a shared `session` bucket). Re-apply toasts only newly created rows.
- Gated on existing `engagements` capability. Client gates also read the trial cookie / active org when the page did not pass a plan id. ADR-053.
- **Relocation / RAP overlay:** briefs that are a physical or economic move (relocation, migration plan, RAP, cut-off, host community) compose an operating plan — census, entitlements, host consultation, move-week helpdesk, livelihood restoration — not a Social Licence to Build™ architecture essay. Municipality names keep the full Local Municipality string; “The Municipality” fragments are dropped. Saved architecture SEPs upgrade on reopen. ADR-053.
- **Client report voice:** the exported SEP is a bid-grade report (what / how / when / who, CBPR, risks, GRM, M&E, conclusion). TrustLedger and Chibase Consulting appear as letterhead only. No execution-protocol boxes, Themba, Capture, Apply, or product architecture in client-facing copy. Operator dashboard still maps SLB → shipped desks. ADR-053.
- **Tender layout:** cover block (project, procuring entity, implementing entity, duration, framework), numbered sections with 1.1-style subsections, and tables for stakeholders, engagement schedule, risks, and KPIs — matching a funder-readable SEP, not a wall of product copy. Junk titles such as “Inception report” are skipped. Municipality name fragments are collapsed.
- **Gemini drafts the document:** extract + sector/RAP playbook stay local; Gemini writes the nine-section client SEP (server `GEMINI_API_KEY`, same model as marketing). Suggest → human save. Missing key or a rejected payload falls back to the playbook template. Product voice, invented counts, and portals are stripped. Activity reports still use `reportComposer` (no Grok/Frappe). ADR-053.
- **No TrustLedger Protocol / SL2B annex:** that paragraph is stripped from the client document. TrustLedger and Social Licence to Build (SL2B) appear only as tools in methodology (record + sequencing frame). Operator dashboard still maps SLB → desks. ADR-053.

## 2026-08-25 — ClickUp diary live on Chibase Workspace

- Google Calendar and Email ClickApp are connected as `admin@chibaseconsulting.co.za`. `trustledger.co.za` verification stays parked until Admin shows Active. No MX change.

## 2026-08-24 — ClickUp diary via Google Workspace

- Inbox & diary list: trust ClickUp in Google Admin, then connect Workspace Gmail + Google Calendar. Webway IMAP is not used. Frappe Newsletter stays the bulk path.

## 2026-08-22 — Marketing team workstream desks

- ClickUp TrustLedger Marketing now has Sales, Content, Outreach, Ads, Analytics, and Customer research lists with owner-hat charters (two-person team: Thozi / Thozamile). Newsletter Cadence and Marketing Review stay the send / publish gates.

## 2026-08-22 — Chibase LinkedIn duplicate in Zernio

- Engine status only warns on configured `ZERNIO_*_LINKEDIN_ACCOUNT_ID` rows. An inaccessible duplicate (Chibase Consulting vs Chibase Consulting1) no longer looks like a publish block.
- Pin Chibase publish to the accessible account `_id` via `ZERNIO_CHIBASE_LINKEDIN_ACCOUNT_ID`. See `docs/MARKETING_ENGINE.md`.

## 2026-08-21 — Marketing publish “not authorised”

- Publish now checks Zernio account health before posting, maps 401/“not authorised” to a reconnect-or-key message, and does not mark a ClickUp task published when LinkedIn/X rejects the token.
- `/ops/marketing` shows a Zernio hint when the API key or a connected account is unhealthy. ClickUp 401 is no longer reported as “task not found”.
- `ZERNIO_API_KEY` is sanitised (quotes / `Bearer ` / env-name paste). Desk and Publish call `/auth/verify` first and report key prefix + length only — never the secret.

## 2026-08-21 — Cockroach theory 45-second scene

- `/firm/insights/cockroach-theory/play` plays a timed two-column explainer (rigid corporate maps vs informal / customary / ward structures) with play, pause, replay, and a 0:00 / 0:45 clock.
- Article keeps the static figure and links to the scene. Field-ledger tokens only; caption stays dual-governance.
- 1920×1080 editor pack in `docs/exports/video/cockroach-theory/`: stills, 45s H.264, HTML source.

## 2026-08-21 — Cockroach theory insight visualisation

- `/firm/insights/cockroach-theory` shows a field-ledger comparison: formal organogram vs customary / ward / grievance structures already moving on the ground.
- Tokens only (no cream/gold brochure chrome). Caption stays dual-governance, not a product dump.

## 2026-08-21 — Marketing review inbox (MKT-4)

- `/ops/marketing` is the marketing content space: **To review** holds only drafts that still need human review and publish.
- After live publish, items leave the inbox. Skip or finish paste with **Archive** (ClickUp `parked` / marker — not a publish signal).
- Archive lane lists finished and skipped drafts.

## 2026-08-21 — Operator marketing briefs (MKT-3)

- `/ops/marketing` compose: topic, length, speaker, and destination (LinkedIn post / article / comment, Reddit, ESG platform, website blog).
- Preview then stage to Marketing Review. Feed posts can still human-apply publish; long-form, comments, ESG, Reddit (unless connected), and blogs are paste-ready — the desk does not write WordPress or `/firm/insights`.
- Weekly cron idempotency ignores operator `brief-*` tasks so a Reddit draft cannot block Wednesday’s TrustLedger campaign.

## 2026-08-21 — Ops marketing desk (MKT-2)

- Platform Operator cockpit at `/ops/marketing` (Command control) — not the customer `/app/dashboard`.
- Queue, engine flags, dry-run / stage, webhook register, and human-apply publish via `GET|POST /api/ops/marketing`.
- Executive Board + activity overview link into the desk. ClickUp remains the full editor.

## 2026-08-21 — Marketing engine webhook auto-register

- `GET /api/webhooks/clickup` creates/updates the ClickUp webhook (HMAC secret = `CLICKUP_WEBHOOK_SECRET` or fallback `CRON_SECRET`).
- Operator one-shot `GET|POST /api/cron/setup-marketing` stages this week’s Chibase + TrustLedger drafts.
- Health adds `zernioAccounts` and `webhookSecretDedicated` (no secret values).

## 2026-08-21 — Autonomous marketing engine (MKT-1 / ADR-052)

- Developer-owned loop in this repo: Gemini synthesizes drafts from `content/chibase-papers/` and `content/trustledger-campaigns/`; ClickUp **Marketing Review** (`901220539195`) is the human gate; Zernio publishes after **Approved** or `/tl-publish`.
- Crons: Monday Chibase thought-leadership, Wednesday TrustLedger trial/product (`vercel.json`). Webhook `POST /api/webhooks/clickup` (HMAC). Never sends bulk email (Frappe Newsletter remains EM-2).
- Secrets stay server-side (`GEMINI_API_KEY`, `ZERNIO_API_KEY`, `CLICKUP_*`). Health exposes `launch.marketingEngine` flags only.
- Runbook: `docs/MARKETING_ENGINE.md`.

## 2026-08-19 — Local intel: project impact for LED / ESG / M&E / funders

- Local community intel now captures **project impact**: labour intake & wages, training beneficiaries & spend, local / preferential procurement, SME/ESD, households benefiting, income injected — **people + ZAR**.
- Domains: `baseline_compare` (vs Stats SA) and `project_impact` (LED/ESG/M&E). Dossier shows category panels + **funder ladder** (local → municipal → provincial → national → international).
- Apply feeds empowerment spent ZAR and report packs (employment / B-BBEE / ESG) without overwriting platform baseline packs.

## 2026-08-19 — Local community intel beside Stats SA

- Capture → **Local community intel**: upload / paste ward surveys, CLO tallies, household samples (.txt / .csv / .pdf); Arrange into indicator form; Apply attaches **tenant-owned** `localIndicators` on the project dossier.
- Mapped beside platform Stats SA / Census baseline (same keys → Δ for verify / support / local impact). Never writes into `mockIndicators` / geo packs (ADR-040).
- Project dossier dual panel + Intelligence page project roll-up; report composer cites local rows in ESG community notes.

## 2026-08-19 — Feedback form text colour readable

- Experience feedback inputs, labels, and drawer title use `text-tl-ink` so typed text stays visible on white fields (was inheriting light colour in some contexts).

## 2026-08-19 — Capture: upload / arrange rough minutes & late handover

- Capture hub had no real file upload — “blank” was Insert blank form / PDF only.
- Minutes & attendance: **Upload notes** (.txt / .md / .csv / **.pdf**), **Arrange rough notes into form**, paste still works.
- PDF text extracted server-side (`POST /api/app/capture/extract-text` via `unpdf`); scanned image-only PDFs prompt for typed paste.
- Field meta: **Date of meeting** + **Captured after the meeting** (SF/CLO not on site; notes handed over later) → engagement `heldOn` and summary stamp.
- Apply uses agenda Action rows when present; product/resources copy aligned.

## 2026-08-18 — ClickUp Marketing lists seeded (EM-2)

- Team Space: folder **TrustLedger Marketing** with **Newsletter Cadence** + **Newsletter Themes** (6 theme cards, first fortnightly task, AI prompt reference).
- **Platform Ops** list: Resend smoke-after-#153 + EM-1 Desk readiness tasks.
- List URLs recorded in `docs/CLICKUP_NEWSLETTER_OPS.md` (statuses/custom fields still UI).

## 2026-08-18 — Production Resend cutover runbook

- Added `docs/RESEND_PRODUCTION.md`: verify `trustledger.co.za` in Resend (DKIM + SPF merge; keep Webway MX), set Vercel `RESEND_FROM_EMAIL`, Redeploy, confirm `inviteEmailReady`.
- Domain auto-pick accepts Resend `partially_verified` (send-capable); failed domains probes are no longer cached empty for 5 minutes.
- Stale docs no longer recommend leaving Production on `onboarding@resend.dev`.

## 2026-08-18 — Invite email: verified Resend From (third-party inboxes)

- Root cause: Production From was still `onboarding@resend.dev`. Resend accepts those sends but typically only delivers to the Resend account owner — invitees never see the mail.
- Outbound mail now **resolves From**: explicit `RESEND_FROM_EMAIL` when not a test sender → else auto `TrustLedger <noreply@verified-domain>` (prefers `trustledger.co.za`) → else test fallback.
- `POST /api/invite/send` preflights third-party readiness; on test From returns portable Accept link + clear error (never claims sent).
- `GET /api/invite/email-status` + Team / Seats banner when invite mail cannot reach colleagues; `/api/health` → `launch.inviteEmailReady`.
- Ops: verify domain in Resend, set `RESEND_FROM_EMAIL=TrustLedger <noreply@trustledger.co.za>`, Redeploy. Confirm `inviteEmailReady: true`.

## 2026-08-18 — Plan Owner password rights

- Settings → **Passwords**: package Plan Owner can **change their own** TrustLedger Cloud password, and **issue a temporary password** for themselves or Cloud Users on their Customer (lost-password recovery).
- `POST /api/org/password` (`change-own` via live sid; `reset-member` via API keys + Customer ownership check). Temp passwords emailed when Resend is configured.
- Browser-only invite seats without a Cloud User still need provisioning / invite re-send (SEC-5).

## 2026-08-18 — Invite email delivery (live Owners + Resend domain)

- Live Plan Owners never received `tl-org-id` from Cloud login, so `/api/invite/send` returned 401 and no Resend mail left. Team / Seats now stamps org cookies; send API allows Owner email match when org cookie is still missing.
- Clearer Resend errors when still on `onboarding@resend.dev` (test sender only delivers to the Resend account owner). Invite mail sets Reply-To to the Plan Owner.
- Ops: verify `trustledger.co.za` (or your mail domain) in Resend and set `RESEND_FROM_EMAIL` to a verified address, then Redeploy.

## 2026-08-17 — SRM live showcase demo plan

- Added `docs/DEMO_PLAN_SRM_SHOWCASE.md`: 30-minute consortium / DFI (NILF-style) live demo run sheet with platform click-paths (`/app/projects` → stakeholders → engagements → commitments → incidents → reports), fixtures, talk tracks, and objections.

## 2026-08-17 — Chibase SEO: 410 retired WP spam + firm sitemap

- Firm host returns **410 Gone** (+ `noindex`) for known WordPress casino/adult/togel spam slugs and path heuristics (`wpSpamPaths`) — Search Console still showed those URLs after DNS cutover to Vercel.
- Firm host now serves `/sitemap.xml` (was 404 via proxy catch-all) with only clean brochure paths; `/robots.txt` lists the firm sitemap and disallows spam-shaped patterns.
- Runbook: Search Console removals + re-index steps in `docs/CHIBASE_SITE.md` / `docs/SITE_SECURITY.md`.

## 2026-08-16 — Invite email Accept / Decline

- Creating an invite from **Settings → Team / Seats** emails the invitee (Resend) with **Accept** and **Decline** CTAs.
- Portable signed invite token (`?invite=…`, 14-day TTL) works on any device; Owner notified when the invitee accepts or declines (deduped).
- Owner decision mail includes a **sync link** (`/invite/owner-sync`) so their browser seat list updates to accepted/declined.
- Send requires Plan Owner session cookies; desk VIP bypass uses VIP cookie / VIP Pilot name only (not a client flag).
- Revoke calls `/api/invite/revoke` so email links stop accepting after Owner revoke (process-local until Cloud seats).
- New routes: `POST /api/invite/send`, `/peek`, `/respond`, `/revoke`, `/owner-sync`; pages `/invite/accept`, `/invite/reject`, `/invite/owner-sync`.
- If Resend is unset, invite still creates and a portable share link is returned for manual copy.

## 2026-08-16 — Institutional invites include Client/Board desk

- Institutional (incl. VIP Institutional) Owners sit at Client/Board — invite desk list is now **at or below** Owner so Client/Board is selectable, not greyed. Project stays strictly-below; VIP still unlocks every desk.
- **Desk privileges** Rank 1 Client column opens on VIP + Institutional (same gate as invites); Solo / Practitioner / Project keep Rank 1 greyed. Session plan syncs into the local org so a stale Project workspace cannot re-grey Institutional desks.

## 2026-08-16 — VIP invites: no paid seat/desk gates

- Complimentary VIP (Institutional) may invite **any** desk — including Client/Board and CEO/MD — with unlimited seats.
- Paid plans alone apply desk-below-Owner and seat-cap rules (`orgSeats` `vip` option; Settings Team + Desk privileges panels).
- Invite create does **not** accept a client `vip` flag; bypass uses org `complimentaryVip` / `VIP Pilot` name (stamped after Cloud VIP login).

## 2026-08-16 — Viewer discussion & feedback space

- Report presentation, report library, and issue case desk gain a **Discussion & feedback** space: feedback, information requests, and meeting/engagement proposals.
- Each thread stamps **given** and **responded** date/time and the workspace **plan**.
- Meeting proposals capture calendar items; on Project+ they can create a draft Engagement (`source: discussion`).
- Threads are scoped to the current workspace (customer vs demo / org id) so sample discussion never bleeds into customer desks.

## 2026-08-16 — Guide deep-links to task screens (ADR-036)

- Setup wizard + `/app/guide` checklist: each actionable step **title and CTA** navigate to where the work is done (create project, add stakeholder, capture engagement, log issue, reports path, etc.).
- Deep links open the create form where applicable (`/app/projects?new=1`, `/app/stakeholders?new=1`; Capture `?source=minutes|attendance`).
- Wizard closes when following a task link so the destination is usable; dashboard setup banner links the next incomplete step.

## 2026-08-16 — Project report presentation view / download / print

- Project dashboard reports: **View** opens a full-screen presentation in the chosen format (charts / details / charts+details); format can be switched while presenting.
- **Download** (markdown) and **Print** available for any chosen format from the studio, presentation chrome, and saved-report rows.
- Generate opens presentation automatically; saved drafts remember `preferredFormat`.
- View / download / print **auto-compose details** from mapped project evidence when no draft body exists — no empty “narrative body yet” placeholder in presentation or exports.

## 2026-08-15 — Minutes & attendance field templates restructured

- **Meeting minutes:** project details, date of meeting, time, venue; mandatory agenda rows Item · Description · Action · Date. No distribution list (attendance register covers people).
- **Attendance register:** nature of the meeting, venue, time; rows for Initials and Surname, organisation/structure, contact details, address, signature. No ID number.
- Capture paste parser accepts the new labels (keeps legacy `Name:` for older pastes).

## 2026-08-15 — Multi-dashboard: category-mapped project hub (ADR-049 deepen)

- **Executive dashboard** lists all open projects (Draft / Approved / Active / OnHold); Completed/Closed listed separately. Open → **project dashboard**.
- Project dashboard segments data by report category (overview, GRM/incidents, issue log, employment/training, B-BBEE, ESG, budget, stakeholders, CSI) with capture/edit and monitor charts.
- Report generation = **kind + format + level** only; mapped categories auto-fill the template (no topic checkboxes). Create-report wizard aligns.
- Nav label **Executive**.

## 2026-08-15 — Portfolio → project workspace → kind-based reports (ADR-049)

- `/app/dashboard` is the **Executive portfolio**: all projects with empowerment budget / spent / available, % achieved, local hire, B-BBEE, trust, open cases, and portfolio charts.
- Click a project → **project workspace** (`/app/projects/[id]`): KPIs, live charts from Capture data, input shortcuts, and Generate/view/print reports by **kind** (ESG, GRM, …) + **format** (charts / details / both) + audience level; related topics auto-include.
- Nav label **Portfolio**; `/app/reports` remains pack-seniority hub with pointer to the project path.
- Capture deep-links `?projectId=&source=` from project input cards.

## 2026-08-15 — Issue log sequenced pathway (report → close)

- Capture **Issue log** pack records each matter in fixed order: title → category → person reporting → date/time reported → follow-ups (action, outcomes, date/time; add more steps) → escalated (to whom + date/time) → feedback → resolved → closed.
- Pathways persist in the pack, roll up open/closed/escalated counts, surface as Create report evidence stubs, and draft via the new **Issue log pathway** topic (also enrich GRM lifecycle).
- Report evidence uses the **latest** Issue log pack only (no duplicate pathways across re-saves); rollups apply only once titled pathways exist (legacy manual counts preserved otherwise).

## 2026-08-15 — Report create is project-first; pack drafts no longer fail INC-* check

- Create report: choose project first (same list path as Capture, including Cloud/VIP), then type/topics; evidence summary shows dossier + Capture packs for that project.
- `composeActivityReport` only requires INC-* citations when the selected project actually has cases — pack/dossier-only drafts no longer error.

## 2026-08-15 — Reports from dossier / Capture packs without cases

- Customer workspaces can draft reports from project dossier + Capture packs when there are zero org cases (no more hard stop requiring CSV import / INC-* only).
- Wizard no longer requires INC-* citations when the draft is pack/dossier-grounded; data-in-scope shows dossier/packs when case count is 0.
- Skip demo photo evidence stubs in customer mode.

## 2026-08-15 — Issue log pack + empowerment spent auto-roll

- Capture hub adds **Issue log** beside GRM / employment packs: desk case list + period log fields; feeds GRM / issue-handling / MEL sections.
- **Budget spent = empowerment utilisation only** — Employment adds training spend next to training days; saving Employment or B-BBEE rolls skills + training + preferential procurement + ESD into `Project.budgetSpent`.
- Budget pack retitled **Empowerment budget**; dossier exposes empowerment envelope + skills target; project detail labels Empowerment budget / spent.

## 2026-08-15 — Capture report pack save no longer silent-fails

- Remount `EmailCaptureGate` + `SessionEmailBridge` in `AppShell` so authenticated desks seed `tl-lead-email` and Save is not dropped when the gate UI was missing.
- `requireEmailThen` proceeds if no gate listeners (never silent no-op).
- Report packs keep form values after Save; reopening a pack/project reloads the latest `CaptureRecord`.
- Project profile pack Save persists into the project dossier (`persistProjectWithDossier`), not only flat project fields.

## 2026-08-15 — Project dossier geo cascade + attach community intel

- `ProjectDossierForm` uses `GeoCascadePicker` (Country → Province → Town → DM → TC → Ward) instead of free-text province/muni/ward.
- Dossier `geo` stores cascade IDs (`provinceId`, `municipalityId`, `wardId`, `placeId`, …); issue intake prefills full geo from dossier.
- Community intelligence: load Stats SA / Census platform baseline for cascade place or featured packs, select indicators, **Attach selected to project** (unemployment autofill; tenant business/structure notes remain free-text).
- `GET /api/geo?indicators=1&placeId=` exposes `geoService.indicatorsForPlace`; report composer ESG baseline includes attached indicators.

## 2026-08-15 — Capture hub project-first workflow

- Capture hub requires a project first (`projectChipLabel`). Thin dossiers open compact `ProjectDossierForm` and block field notes / period packs until basics are saved.
- Field notes use `CaptureFieldNoteMeta` dropdowns; AI extract/brief and saved body prepend `fieldNoteMetaPreamble`. Stakeholder Apply still saves an engagement (narrative `EngagementSource` only), with place from meta when set.
- Period packs prefill employment / B-BBEE (and light profile/budget) targets from `project.dossier`. Projects load via `listWorkspaceProjects` + `projectService.list` (customer: no demo seed).
- Durable `ProjectDossier` (funder, geo, budget, empowerment targets, promises, community intel) persists in `tl-project-dossiers` and merges onto Project lists.
- Issue intake: project first; dossier geo skips re-entry. Reports: pick project → type → topics; composer uses dossier baselines so programme facts are not retyped.

## 2026-08-15 — Capture hub report packs (ESG / B-BBEE / employment / CSI / GRM / budget)

- Capture hub adds **Project report packs** beside field notes: Project profile, B-BBEE / Empowerment, Employment, CSI, ESG period, GRM period, Budget / spend — structured fields mapped to report kinds.
- Packs save as `CaptureRecord.structured` and feed `reportComposer` sections (ESG scorecard, B-BBEE, CSI, MEL, budget, GRM lifecycle, H&S/environment).
- Project profile Save syncs budget/geo/contractor into the linked trial/org project.

## 2026-08-15 — Project detail opens Cloud / VIP projects (no 404)

- `/app/projects/[id]` loads via Cloud resource API (`GET /api/app/projects/[id]`) when `srm_core` get is unavailable — fixes VIP/live projects created from Add project.
- Detail page is client-side (trial localStorage + live Cloud), matching incident desk pattern.

## 2026-08-15 — VIP package label + add projects (live)

- Shell / Settings / Reports no longer show **Demo** for live or VIP packages — VIP badge via `packageLabel` / `tl-vip` cookie (Customer `VIP Pilot — …`).
- Live login + OTP stamp plan + VIP cookies from Cloud Customer; logout clears them. Plan Owner cookie only when User flag **or** Customer `custom_owner_email` matches (invitees stay juniors). Institutional plan default only for VIP Pilot Customers.
- `/app/projects`: Plan Owners (incl. VIP) get **Add project**; `POST/GET /api/app/projects` creates/lists TL Project on Cloud. Project-cap bypass uses Cloud VIP name only (not forgeable cookie); list failure fails closed.
- Customer workspaces no longer merge sample demo project seed into the list.

## 2026-08-15 — ClickUp newsletter ops playbook (EM-2)

- `docs/CLICKUP_NEWSLETTER_OPS.md`: fortnightly cadence, AI draft prompts, human approve gates, Frappe Newsletter handoff.
- Defaults: audience `TL Marketing`; ClickUp never blasts — Desk send only.
- Linked from `docs/FRAPPE_EMAIL_MARKETING.md`; packet EM-2 Done (playbook).

## 2026-08-15 — Resource packs download as PDF, no product CTA in the file

- `/api/resources/file` streams a PDF (not HTML). Packs have no TrustLedger “with us” paragraph, next-step CTAs, or product filename — so teams can use them as they see fit.
- Each pack is a separate PDF. The grievance checklist is titled **Grievance Checklist** (`Grievance-Checklist.pdf`) and is not bundled with the community engagement toolkit. Library and preview pages say “choose one pack”.
- **Field templates** (Meeting Minutes, Attendance Register, Field Note) use labeled fields that Capture maps on first paste. Project and Institutional include them in Capture hub (insert blank form + in-app PDF). Same PDFs are free on `/resources`.


## 2026-08-07 — Hosting contingency runbook (pre–paying client)

- `docs/HOSTING_CONTINGENCY.md`: free uptime watches on `/api/health` + Cloud ping; Resend Production fix; env checklist; $0 Node standby (Render/Railway/Fly) — not Frappe frontend failover; DNS/VIP message; first-paying-client upgrade trigger.
- Linked from PLATFORM_STRATEGIC_BRIEF + LAUNCH_CHECKLIST. Clarifies: Vercel pause ≠ data wipe; Frappe holds SoT only.

## 2026-08-14 — Chibase: keep the preview desk in the hero

- Hero is two columns from the `md` breakpoint (not only `lg`). On small screens the preview desk sits first, above the copy, so it is not pushed below the fold by the header and CTAs.

## 2026-08-14 — Chibase: packages on the home page, nav always visible

- Home now lists all four priced packages (including field). Header nav wraps instead of scrolling off-screen; Packages is first.

## 2026-08-14 — Chibase footer: drop mail-host note

- Removed “Mail stays on the existing host. This site is the public brochure.” from the public footer (and the matching contact-form aside). MX still stays on Webway in ops docs.

## 2026-08-14 — Chibase listed starter fees

- Public packages: facilitation R95,000, IKS R110,000, MEL R125,000, field R185,000 (excl. VAT, one programme or site). Env still overrides; `0` = request-only. Pay now appears when cents > 0.
- Shown on `/packages`, home service cards, and the TrustLedger pricing add-on line.

## 2026-08-14 — Chibase About: drop public “what we will not do”

- Removed the editorial don’ts (homepage length, CAPEX form, software-vs-facilitation) from the public About page. That list stays in `docs/CHIBASE_SITE.md` for operators. Contact copy no longer mentions CAPEX to visitors.

## 2026-08-14 — Chibase Consulting packages (CHIBASE-PACK)

- Independent consulting catalogue (`facilitation`, `mel`, `iks`, `field`) — not TrustLedger plan IDs and not desk `AddonId`s. Own env prices `CHIBASE_AMOUNT_*_CENTS`; default 0 = request a package.
- Firm `/packages`: request via contact, Pay now only when cents are set. Checkout `/api/chibase/pay/*` allowed on the firm host. Metadata `catalogue=chibase`; webhook logs CRM **Chibase Consulting** and never provisions a Plan Owner.
- TrustLedger home pricing: one add-on line to the Chibase packages URL. ADR-048. ADR-046 amended: TrustLedger `/pay` stays off the firm host; consulting checkout may live there.

## 2026-08-14 — Chibase hero preview desk (CHIBASE-PREVIEW)

- Consulting home hero: interactive TrustLedger **preview desk** — add mock cases, named people, and promises; KPIs and list update in this browser only (`sessionStorage`).
- Not a workspace: no `/app` session, no `INC-*` seed. CTA to 14-day own-data trial. ADR-047.

## 2026-08-14 — Chibase: do not 308 www↔apex in-app

- Removed the app `www` → apex redirect. It looped against the project domain card (apex → www). Both hostnames now serve the firm site; set the primary redirect only on Domains.

## 2026-08-14 — Chibase site + dual-origin public hardening (SEC-SITE)

- Rebuilt **Chibase Consulting** as short pages under `/firm` (preview, noindex on the product host). **Retire WordPress** (Webway declined malware cleanup): point website DNS only at this app; **do not import** WP content/plugins. **MX for both domains stays on Webway.** `trustledger.co.za` WP unchanged.
- Firm host serves consulting pages only; `/app`, `/pay`, `/trial` 302 to TrustLedger with `utm_source=chibase`. Old WP slugs 308 to the short IA. No Themba, no CAPEX form, no product checkout on the firm origin.
- Contact → `/api/contact` `source=chibase` → CRM Lead source **Chibase Consulting**.
- Security on both origins: CSP (with violation reports), HSTS, nosniff, probe block (WordPress/PHP/`.env`/SQLi-XSS query shapes → 404), form honeypot/reCAPTCHA/rate-limit events. Optional `SECURITY_ALERT_WEBHOOK_URL`. Request proxy is `src/proxy.ts` (Next.js 16). Honest limit: harden + detect, not “unhackable.”
- TrustLedger footer “Chibase Consulting” points at `/firm` (not the compromised WordPress origin). ADR-046. Runbooks `docs/CHIBASE_SITE.md`, `docs/SITE_SECURITY.md`.

## 2026-08-14 — Themba audiences, Global South, document grounding (THEMBA-C)

- Profile chips: MEL / M&E, community member, social facilitator, local government (plus funder, engineer, PM). No longer collapse those roles to “other.”
- Public copy: South Africa **and** the Global South; ZA place packs are included baseline for SA plans, not the whole market.
- Themba retrieves multiple chunks and cites operating procedures, the SRM blueprint (six dimensions), and the IKS practice frame. IKS published papers are a drop zone (`docs/themba/sources/IKS_PAPERS.md`) — not loaded yet; no invented citations.
- Home “who it is for” strip. ADR-045. Runbook `docs/THEMBA.md`.

## 2026-08-14 — Public copy: no Version 001/002 or TEDS (ADR-044)

- Removed Version 001/002 and “full TEDS blueprint” from FAQ, Themba, marketing strip/footer, product page, app shell, module eyebrows, readiness report, resource packs, `/llms.txt`, and WordPress FAQ paste.
- Public language is modules + plans (grievance desk vs Stakeholder Intelligence). Ops and internal docs unchanged.

## 2026-08-14 — Themba marketing guru (THEMBA-B)

- Global public widget (root layout); hidden on `/app`, `/ops`, `/login`, `/pay`, `/invite`.
- Avatar `/assets/images/themba-avatar.png`; greeting bubble; Markdown replies; role chips; conversion bar (trial / live demo / advisory).
- Knowledge: Social Licence to Build framework (mapped to shipped SRM + case desk), funder / engineer / PM / municipal value props. No public funder-dashboard URL.
- In-chat lead magnet → existing `/resources` packs. Bug keywords → `POST /api/telemetry/bug-report`.
- CRM sources **Themba Guide** / **Themba Bug**. Runbook `docs/THEMBA.md`. ADR-043.

## 2026-08-13 — Themba educates features before signup CTAs

- Feature / help / suitability questions map to dedicated knowledge (capabilities + readiness prompts), not the trial FAQ.
- Retrieval weights question + keywords over answer-body tokens so CTA phrases cannot steal matches.
- Widget greeting + starter chips emphasise open education, then soft drive to `/assessment` or `/trial`.

## 2026-08-13 — Themba Phase A (visitor guide)

- ADR-042 + packet THEMBA-A: public agent **Themba (The Trust)** on `/`, `/product`, `/faq`.
- BFF `POST /api/themba/chat` — knowledge retrieval from `siteFacts` + brief §6; escalate → CRM Lead; optional `THEMBA_XAI_API_KEY` polish.
- Runbook `docs/THEMBA.md`. No client LLM keys; no desk writes.

## 2026-08-11 — Trust Stats SA / ZA geo as platform baseline

- Removed “demo / illustrative” framing from `/app/geo`, `/app/intelligence`, indicator sources, and AI ESG briefs.
- ADR-040 + `ZA_BASELINE_INTEL` + geo pack notes: Stats SA / Census indicators are platform baseline, not demo seed.

## 2026-08-11 — VIP Plan Owner live login without Frappe roles

- Cloud API often 403s when posting User `roles`; provision now creates User then stamps `custom_tl_*`.
- Live session maps `custom_tl_plan_owner` → TrustLedger `admin` and sets desk/owner cookies from User customs (needed for VIP Website Users).

## 2026-08-10 — Segment intro emails + dashboard samples

- Six thought-provoking intro HTML packs (`10`–`15-intro-*.html`) with per-segment From names and Cloud File dashboard samples.
- Cloud: Email Templates `TL Intro Construction|Government|Architects|Engineers|Social Facilitators|Related Industries` + draft Newsletters per `TL Segment …` group.
- Assets in `public/marketing/email/`; runbook `SEGMENT_INTROS.md`.

## 2026-08-10 — ICP prune + industry Email Group segments

- Pruned **`TL Marketing`** 112 → **21** ICP (removed 91 vendors/tests/internals).
- Created segments: Construction (7), Architects (7), Engineers (3), Government (2), Social Facilitators (1), Related (1).
- Docs/CSVs: `SEGMENTATION.md`, `TL_Marketing_segmentation.csv`, `TL_Marketing_removed.csv`, per-segment member CSVs.

## 2026-08-10 — Consolidate marketing audience → TL Marketing

- Created Email Group **`TL Marketing`** with **112** unique emails (Warm 21 + HubSpot 83 + CRM Lead emails; 29 CRM-only).
- Retargeted soft-launch Newsletter draft to `TL Marketing`.
- CSV + audit: `TL_Marketing_email_group_member.csv`, `TL_Marketing_sources_audit.csv`; docs updated.

## 2026-08-10 — Branded Newsletter / Email Templates on Cloud

- Strengthened EM-1 HTML packs: ink header, TrustLedger wordmark, teal accent bar, Trust voice, Chibase footer only.
- Created Cloud Email Templates: `TL Email Shell`, `TL Soft Launch`, `TL Trial Invite`, `TL Quote Follow-up`, `TL Assessment Nudge`.
- Draft Newsletter (soft launch → `TL Warm Contacts`) for Desk review/send.

## 2026-08-10 — HubSpot contacts remapped + Email Groups imported

- Root cause: Desk Data Import used ERPNext **Lead** with invalid HubSpot status/owner/industry maps.
- Cloud: Email Groups **`TL Warm Contacts`** (21) + **`TL HubSpot Import`** (83); CRM Lead Source **`HubSpot Import`** + 23 warm/review CRM Leads.
- Remapped CSVs + steps: `docs/exports/email-marketing/contacts/` (`DESK_IMPORT_STEPS.md`).

## 2026-08-10 — Frappe Cloud config bootstrap + DocType exists probe

- Wired local `.env.local` against `app.trustledger.co.za`; auth OK as API user; CRM Lead smoke `CRM-LEAD-2026-00055`.
- Bootstrapped missing CRM Lead Sources (Paystack / Trial / EFT / Quote / Website Resource, etc.).
- `scripts/frappe-configure.mts` — one-shot ensure fields + product/SI DocTypes + CRM views + lead smoke.
- `frappeDocTypeExists` — do not treat DocType meta `403` as missing (avoids re-create attempts).
- SI DocTypes still need **System Manager** on the API user (create blocked with PermissionError).

## 2026-08-08 — Email Group Member import CSV (TL Warm Contacts)

- Ready Desk file: `docs/exports/email-marketing/contacts/TL_Warm_Contacts_email_group_member.csv` (21 rows: `email_group` + `email`).
- Steps: `DESK_IMPORT_STEPS.md` — import as **Email Group Member**, not Contact (Contact child-email mapping blocks Start Import).
- Keep/exclude/review CSVs from HubSpot clean pack alongside; FRAPPE_EMAIL_MARKETING points at the pack.

## 2026-08-06 — Free SRM resource toolkits

- Public `/resources` library with three printable packs: Community Grievance Checklist, SRM Readiness Planner, Community Engagement Toolkit.
- Work-email gate → CRM Lead `resource_download` (`Website Resource`) → signed 1-hour download via `/api/resources/file`.
- Pack preview routes `/resources/[slug]`; nav/footer/sitemap/robots + CRM setup source updated.
- CTAs into readiness check, trial, and walkthrough after download.

## 2026-08-05 — Readiness engagement funnel

- Promo `/readiness` → quiz `/assessment` → work email + OTP (when Resend ready) → `/readiness/next` choice hub → `/readiness/report` dashboard.
- Report adds per-dimension DIY outline plus TrustLedger stabilize / operationalize / govern turnaround lanes.
- Hub CTAs: report, `/product`, `/trial`, `/quote` with readiness UTMs; risk band nudges primary commercial path.
- APIs: `/api/assessment/lead` returns pending/grant tokens; `/api/assessment/verify` OTP verify + resend; `/api/assessment/session` validates grant before hub/report.
- Hardening: production fails closed without token secret; OTP email failure does not skip inbox proof; lead step resumes after refresh.
- Sitemap/robots/footer/FAQ/contact/siteFacts + assessment email nudge updated; IA in BUILD_PLAN.

## 2026-07-30 — ADR-041: site location cascade sequence

- Locked capture order: **Country → Province → Town → DM → TC → Ward** with pack dropdowns + **Add if not listed** per level.
- `GeoCascadePicker` rewritten; `GeoLocationWizard` wraps it for issue report; stakeholder create reuses the picker.
- TC optional / auto-skip when pack has none for the DM. Custom places in browser `tl-custom-geo-places`.

## 2026-07-30 — ADR-040: ZA baseline intel with SA plans

- Locked packaging: SA plans ship platform ZA place intel (municipalities, wards, TCs where packed); clients add project/situation data only — never fictional INC-*/STK-* seed.
- `docs/ZA_BASELINE_INTEL.md`, ADR-040 in `DECISIONS.md`; strategic brief §4–§5; geo README; Solo plan; `/product` + FAQ siteFacts; `AGENTS.md` rule 8.
- Honest gap: national TC pack still thin (~15); enrichment packet next, not a packaging blocker.

## 2026-07-29 — LinkedIn weekly content pack

- `docs/exports/linkedin/WEEKLY_CONTENT.md`: 8 weeks of Trust-voice posts showcasing desk, SI, AI Assist, reports, ZA place, funnel CTAs; reply snippets; publishing checklist (ADR-039).

## 2026-07-29 — Architecture extras map (agents / Helpdesk / Insights)

- `docs/ARCHITECTURE_EXTRAS_MAP.md`: maps Gemini-style “Typebot+Gemini + Helpdesk grievance + Insights BI” blueprint onto TrustLedger ADRs.
- Phase 1 (CRM + Vercel) = already built. Helpdesk ≠ grievance SoT; Insights ≠ customer reportComposer; public agents must stay BFF + suggest→apply.
- Linked from PLATFORM_STRATEGIC_BRIEF §10.

## 2026-07-29 — Product in primary marketing nav

- WP `page-home.txt` + `page-assessment.txt`: **Product** in desktop/mobile front nav → Vercel `/product` (platform education, not buried in footer/resources).
- Vercel `HomeHeader`: same Product link after Solutions.

## 2026-07-29 — ADR-039: public brand TrustLedger only; voice = Trust

- Scrubbed FAQ/AEO public copy: no Frappe/Vercel in answers; say TrustLedger Cloud. WP `page-home.txt` FAQ + how-it-works aligned.
- Locked in `docs/DECISIONS.md` ADR-039, `DESIGN_SYSTEM.md` Brand, `PLATFORM_STRATEGIC_BRIEF` §6, `AGENTS.md` rule 7.
- Primary public voice: **Trust** must dominate hero/FAQ/agents/social.
- Re-paste WP home after merge for live site.

## 2026-07-29 — WordPress home paste: AEO + ADR-033 trial copy

- `docs/wordpress/page-home.txt`: declarative SRM definition in hero; How it works / final CTA / resources use own-data trial (sample demo retired); expanded FAQ aligned to `siteFacts.ts`; Organization/SoftwareApplication/FAQPage JSON-LD; links to Vercel `/faq` + `/product`.
- `PASTE_PLANS.md` AEO smoke steps; `faq-aeo-snippet.txt` noted as minimal fallback; `AEO_VISIBILITY.md` §3 points at full home paste.
- **Live WP still needs Webway paste + SpeedyCache purge.**

## 2026-07-29 — AEO / AI-search visibility foundation

- Playbook: `docs/AEO_VISIBILITY.md` (maps Gemini-style AEO advice to WP + Vercel + off-domain entity work).
- Canonical facts + FAQ corpus: `src/lib/aeo/siteFacts.ts`; Schema.org builders + `JsonLd` component.
- New `/faq` hub with FAQPage JSON-LD + plan capability table; `public/llms.txt` for AI crawlers.
- Organization / SoftwareApplication / WebSite JSON-LD on root layout; product + home front-load `PRODUCT_DEFINITION`.
- robots/sitemap: allow FAQ/contact/quote/pay; add `/faq` + `/pay`; keep `/app` `/ops` blocked. No AI-bot blocks.
- Home FAQ stub fixed (ADR-033); footer/header link to `/faq`. Stale “Demo” OG copy removed from root metadata.

## 2026-07-27 — Pricing: optional privacy extras + foldable comparison

- Home `#pricing`: short TrustLedger data-protection blurb; foldable Compare plans matrix; optional privacy layers (Trust Pack, private cloud workspace, support-access visibility).
- Client copy uses **cloud** / TrustLedger only (no Frappe/Vercel on marketing).
- Contact form prefills from `?plan=` / `?extras=`. Config: `src/config/planComparison.ts`.
- WordPress paste: same blurb + foldable comparison + privacy extras in `docs/wordpress/page-home.txt` (+ CSS patch). Re-paste home + append CSS, then purge SpeedyCache.

## 2026-07-27 — Private bench request playbook

- `docs/PRIVATE_BENCH_REQUEST.md`: client-funded private Frappe bench — intake, quote, contract, provision, frontend pointing, run/offboard.
- Linked from SECURITY_TENANCY (L5); SEC-4 playbook marked done pending live Cloud quote.

## 2026-07-27 — SEC-0 / ADR-038: Multi-tenant security ladder on plans

- `docs/SECURITY_TENANCY.md`: L1–L5 ladder (identity → hard permissions → ops privacy → DPA → dedicated isolation).
- Package Trust Pack on Project+; Isolation / dedicated site on Institutional (cost-recovered); L2 baseline not a Solo tax.
- ACCESS_MODEL + PLATFORM_STRATEGIC_BRIEF updated; SEC-1…SEC-5 planned.

## 2026-07-26 — UG-1 / ADR-036: User manual + first-login setup wizard

- `docs/USER_MANUAL.md` — seeding spine, nav map, daily loop, plans, AI rules.
- In-app **Setup wizard** (plan-aware) on trial/live first entry; snooze / dismiss; reopen from Settings or Guide.
- `/app/guide` checklist + nav **Guide**; dashboard setup progress strip for Plan Owners.
- Solo gains `governanceReports` so Monthly pack hub matches SOLO_PLAN (executive/board still rank-gated).
- Companion video script unchanged: `docs/ONBOARDING_VIDEO_SCRIPT.md`.

## 2026-07-24 — CP-1 / ADR-035: Solo entry plan

- New commercial plan **`solo`** — R1,999/mo, 1 seat, 1 project, 10 MB, no AI Assist / SI / governance packs.
- Wired through Paystack catalogue, entitlements, seats, media quotas, report packs, trial/pay/quote/ops UI, Frappe `custom_plan_code`.
- Docs: `docs/SOLO_PLAN.md`, LAUNCH_PLANS, ACCESS_MODEL, PLATFORM_STRATEGIC_BRIEF, WORDPRESS_CTA.
- Ladder: Solo → Practitioner → Project → Institutional. Ops must create Paystack plan code `solo` before live charge.

## 2026-07-24 — Uninstall Email Delivery Service for sales@ SMTP

- Documented Frappe Cloud **Email Delivery Service** uninstall (blocks custom Email Accounts while installed).
- Desk checklist for `sales@trustledger.co.za` SMTP 465 / IMAP 993: `docs/exports/email-marketing/DESK_EMAIL_ACCOUNT_SALES.md`.

## 2026-07-24 — Launch gates: reject truncated Resend keys + fix checklist

- `resendApiKey` ignores stub values shorter than 20 chars (e.g. `re_` alone) so readiness/health don’t treat them as configured.
- Access-verify gate calls out truncated keys and `ACCESS_EMAIL_VERIFICATION=0`.
- Operator checklist: `docs/LAUNCH_GATES_FIX.md` (reCAPTCHA + Resend).

## 2026-07-24 — EM-1: branded Frappe bulk email pack

- `docs/FRAPPE_EMAIL_MARKETING.md`: Desk Email Domain → Email Group → Newsletter/Campaign; Resend stays transactional only.
- HTML templates in `docs/exports/email-marketing/` (shell, soft launch, trial, quote, assessment) — TrustLedger design tokens.
- BUILD_PLAN packet EM-1 active; HS_CUTOVER Phase 3 / LEAD_FORMS point at the pack.

## 2026-07-24 — Fix Home footer Contact → Vercel (not Gmail)

- WP `page-home.txt`: footer Contact is absolute Vercel `/contact` (fix `className`→`class`); mailto kept as email text only.
- Vercel `HomeFooter`: brand row Contact → `/contact` (mailto no longer the only/primary CTA).
- `WEBWAY_CUTOVER`: never label mailto as “Contact” (opens Google/Gmail on many PCs).

## 2026-07-24 — ADR-034 Frappe-only + Webway cutover checklist

- Clarified ADR-034: acquisition CRM = Frappe CRM Lead only; WP CTAs → Vercel → Frappe; HubSpot not required.
- Added `docs/WEBWAY_CUTOVER.md` (operator checklist for removing HubSpot embeds / pointing CTAs).
- Expanded `docs/HS_CUTOVER.md` phases 0–4; CRM_HANDOFF / WORDPRESS_CTA / BUILD_PLAN HS-2 active; AGENTS rule 12.

## 2026-07-24 — Resend key load + health auth probe

- Prefer valid `re_…` among RESEND_API_KEY / RESEND / RESEND_KEY; strip accidental `Bearer ` prefix.
- `/api/health` → `launch.resendAuthOk` + safe `resendDiag` (env source, length, prefix, from) — no secret.
- Clearer OTP error when Vercel still holds a revoked key.

## 2026-07-24 — Resend env hardening (live OTP)

- Accept `RESEND_API_KEY` (preferred) plus aliases `RESEND` / `RESEND_KEY`; `RESEND_FROM_EMAIL` or `RESEND_FROM`.
- Default From → `TrustLedger <onboarding@resend.dev>` until `trustledger.co.za` is verified in Resend.
- Clearer login errors for invalid key vs unverified From domain.
- Reject keys that do not start with `re_` (dashboard name is not the secret).

## 2026-07-23 — Fix live login ByteString (ellipsis in secrets/password)

- `cleanSecret` strips Unicode ellipsis / non-ByteString chars from Frappe + Resend keys
- Live login sanitises pasted credentials; clearer error if Vercel env keys were truncated with `…`
- Cookie name/email values forced ASCII-safe (OTP verify + login)

## 2026-07-24 — WP Contact CTAs → Vercel `/contact`

- `docs/WORDPRESS_CTA.md` + `page-home.txt`: absolute Vercel Contact URLs (no relative `/contact` / mailto-only nav).
- Rebased onto master (demo gate retired; trial/pay paths unchanged).

## 2026-07-23 — HS-1: start HubSpot cutover (Frappe CRM Lead SoT)

- ADR-034: Frappe CRM Lead is acquisition SoT; ADR-011 superseded for HubSpot-first magnet.
- Production: unset `LEAD_BACKEND` + Frappe keys ⇒ **frappe-only** (no HubSpot fallback). Explicit `auto` / `hubspot` remain for emergency.
- Ops readiness + `/api/health`: `leadBackend` / `leadBackendCutover` / `hubspotFallbackActive`.
- Runbook `docs/HS_CUTOVER.md`; CRM_HANDOFF / LEAD_FORMS / ACCESS_MODEL / FRAPPE_CLOUD_SETUP aligned.
- BUILD_PLAN packets HS-1 (active) → HS-4 (delete HubSpot client).

## 2026-07-23 — VIP complimentary access (Ops)

- `provisionOwnerCloud` / `POST /api/frappe/provision-owner`: `complimentaryVip` + `complimentaryUntil` → Customer `VIP Pilot — …`, plan default **institutional**, status **active**, Paystack billing cleared, Desk Comment stamped; no Frappe welcome email (operator shares temp password).
- Ops **Accounts**: **VIP complimentary access** panel (dry-run + create + temp password).
- Runbook: `docs/VIP_ACCESS.md`.
- Public `/trial` and `/pay` unchanged; VIP guests use `/login/live` only.

## 2026-07-23 — Platform Strategic Brief (living)

- Added `docs/PLATFORM_STRATEGIC_BRIEF.md`: achievements journey, front/back architecture, keep/improve/cut inventory, plan packaging matrix, public agent scripts, evaluation cadence, future upgrades
- Pointed `AGENTS.md` + `VERSIONING.md` + BUILD_PLAN + PUBLIC_LAUNCH at the brief

## 2026-07-23 — ADR-033: retire sample demo; Cloud SI north star

- Public `/demo` → `/product` (onboarding + feature purpose); no guest `tl-mode=demo` workspace
- Active packets: D1/D2 + SI-Cloud (TL Stakeholder / Engagement / Commitment)
- CTAs retarget `/product` or `/trial`; lingering demo sessions cleared from `/app`
- Ops: ensure DocTypes now includes SI; smoke Stakeholder→Engagement→Commitment
- Live BFF `GET/POST /api/frappe/si`; CRM create + services persist to Cloud when live

## 2026-07-23 — Access email verification (live OTP + trial gate)

- Live `/login/live`: password then 6-digit email OTP (Resend) before session cookies
- Trial `/pay/success`: no auto workspace — verify via emailed `/pay/activate` link
- `ACCESS_EMAIL_VERIFICATION` (auto-on in Production when Resend set); readiness + health gates

## 2026-07-23 — First-days hardening: reCAPTCHA + launch gates

- Production forms: tighter rate limit without captcha keys; verify whenever keys set
- `FORM_REQUIRE_RECAPTCHA=1` fail-closed when keys missing; Google attribution on forms
- Ops readiness + `/api/health` expose launch hardening (auto-provision, cron, Resend, reCAPTCHA)
- Docs: LEAD_FORMS / LAUNCH_WATCHLIST — turn on reCAPTCHA env steps

## 2026-07-23 — Launch hardening: no demo INC-* in customer desks

- Live incident/project lists: empty Cloud ≠ mock seed; customer/trial never fall back to demo data
- Invite accept uses `trial` mode (customer workspace) instead of `demo`
- Settings lockdown copy: TrustLedger ops (not Chibase product framing)
- `docs/LAUNCH_WATCHLIST.md` + refreshed `PUBLIC_LAUNCH.md` (GO LIVE posture)

## 2026-07-23 — GO LIVE Done (operator confirmed)

- Ops `/ops/readiness` green on Production; TrustLedger operational-grade for paying customers
- OPERATIONAL_DELIVERY / ROADMAP / PLATFORM_OPERATOR mark GO LIVE Done
- Next: Cloud V002 deepening (Engagement/Commitment DocTypes, Stats SA, live Grok)

## 2026-07-23 — GO LIVE ladder: Done when gates green

- GO LIVE lane → **done** when `goLiveReady` (env + `PLATFORM_OPERATOR_ONLY=0`)
- Lockdown-ON listed in `blockedReasons`; clearer Ops badge copy
- `deploySha` on readiness panel + `GET /api/health` for Production smoke
- Docs: do not re-set `PLATFORM_OPERATOR_ONLY=1` (re-blocks GO LIVE)

## 2026-07-23 — Step 5 Done → GO LIVE active on Ops ladder

- `step5Complete=true`; Ops `/ops/readiness` advances to GO LIVE
- GO LIVE desk checklist; `goLiveReady` when env gates + lockdown lifted
- OPERATIONAL_DELIVERY marks Steps 1–5 Done; GO LIVE Active

## 2026-07-23 — Packet 24g: Intelligence / ESG indicators (demo)

- `/app/intelligence` — place picker, indicator KPI cards, AI brief suggest→apply→save
- `mockIndicators` + geoService merge; local `tl-esg-briefs` store
- Mock `generateIndicatorBrief` only (no LLM keys / no Cloud brief call)
- Project/demo `esgIndicators` capability; V002 demo packets 24c–24g complete

## 2026-07-23 — Packet 24e: Grievance verify/close on case desk

- Process stages add **Verified** between Resolved and Closed
- Case desk: Advance stage + Verify & close; stamps + timeline events
- `incidentService.save` persists overlays (demo/org); list/get merge local
- Cloud TL Incident workflow stamps still follow-up

## 2026-07-23 — Packet 24d: Commitments status board (demo)

- `Commitment` type + mocks from engagement action items; `commitmentService`
- `/app/commitments` board + list + detail (status updates); nav + Project/demo capability
- Engagement detail: **Promote to commitment** on action items
- Cloud Commitment DocType still follow-up

## 2026-07-23 — Packet 24c: Engagements module (demo)

- `Engagement` type + mocks; `engagementService` (seed + localStorage; live list reserved)
- `/app/engagements` list + detail; nav + Project/demo capability
- Capture **Apply** also saves an Engagement linked to applied stakeholders
- noteService reads via engagements; Cloud Engagement DocType still follow-up

## 2026-07-23 — Step 4 complete → Step 5 active

- Buyer `/login/live` smoke passed with `PLATFORM_OPERATOR_ONLY=0`
- Ops readiness ladder: Steps 1–4 Done; active Step 5 (V002 depth)
- Lockdown gate flipped to “lifted” (no longer blocks readiness after ADR-013 lift)

## 2026-07-23 — Sign-out: stop middleware dashboard bounce

- `/login?signedOut=1` and `?repaired=1` bypass the signed-in redirect and clear session cookies
- Sign-out / session repair use hard navigation (`location.assign`) to avoid soft-nav cookie races

## 2026-07-23 — Sign-out → account chooser

- Sign out / leave trial clears demo + live sessions and lands on `/login?signedOut=1` (no auto-demo)
- `/login` chooser: live again / different account, trial, demo; quick demo role collapsed
- Support session repair redirects to `/login?repaired=1`

## 2026-07-23 — OD-4: Day-14 charge cron + entitlement gate

- Customer billing fields: `custom_bill_at`, `custom_authorization_code`, `custom_plan_amount_cents`
- `GET|POST /api/cron/charge-due` (+ `vercel.json` daily cron); Ops Finance dry-run/charge panel
- Charge success → `active`; fail → `past_due`; live login blocks past_due/cancelled when not Ops
- Step 3 Done; Step 4 active — human lifts `PLATFORM_OPERATOR_ONLY=0` after smoke

## 2026-07-22 — OD-3: Paystack auto-provision + org migrate

- Shared `provisionOwnerOnCloud` (API-key, idempotent); Ops provision-owner uses it
- Paystack verify/webhook creates Customer+User when `FRAPPE_AUTO_PROVISION=1`
- `POST /api/frappe/migrate-org` + `/login/live` one-shot browser → Cloud DocTypes
- Step 2 Done; Step 3 active on Ops readiness; lockdown stays ON

## 2026-07-22 — OD-2: Product DocTypes + Cloud File BFF

- Step 1 marked Done; Step 2 active on Ops readiness
- `POST /api/frappe/ensure-product-doctypes` — TL Project / Incident / Evidence
- `POST /api/frappe/product-smoke` + Ops smoke button (Project→Incident→Evidence)
- `POST /api/frappe/upload-file` — Frappe `upload_file` proxy
- `docs/PRODUCT_DOCTYPES.md`; OPERATIONAL_DELIVERY Step 2 checklist

## 2026-07-22 — Live password reset + Ops set temp password

- `/login/live` → Forgot password? → `POST /api/auth/live/forgot-password` (Frappe email reset)
- Ops Accounts → Set temp password → `POST /api/frappe/set-user-password` (operator + issuance; returns one-time temp password)
- Unblocks Step 1 Owner smoke when welcome/reset email is missing

## 2026-07-22 — OD-1b: Auto-ensure Desk custom fields

- `POST /api/frappe/ensure-custom-fields` (operator + issuance) creates Customer/User `custom_*` fields via API
- Live `provision-owner` auto-ensures fields before Customer/User create; User payload includes desk/owner/customer customs
- Ops Accounts: Check / Create Desk fields buttons
- Step 1 human scope reduced to Vercel env + smoke clicks (`docs/OPERATIONAL_DELIVERY.md`)

## 2026-07-22 — OD-1: Operational delivery Step 1 (ADR-032)

- Policy: delay paid production until Cloud operational grade (`docs/OPERATIONAL_DELIVERY.md`)
- Ops `/ops/readiness` + `GET /api/ops/readiness` env gate ladder (Steps 1→GO LIVE)
- T4/T5 marked Done; active packet **OD-1** (Desk Customer/User + provision smoke)
- ADR-032; do not lift ADR-013 until Step 4

## 2026-07-22 — Packets T4 + T5: media quotas + Frappe SoT prep

- T4: Org media library (`tl-org-media`) with plan storage quotas + Settings meter
- Case desk file upload for trial/org; over-quota blocks with upgrade CTA
- T5: `docs/FRAPPE_SOT.md` + `POST /api/frappe/provision-owner` (operator + FRAPPE_OWNER_ISSUANCE)
- Ops Accounts: dry-run / create Customer+Owner drafts; ADR-013 lockdown stays on
- ADR-030, ADR-031

## 2026-07-22 — Packet T3: Org data space (no demo contamination)

- Customer/trial workspaces never merge `mockIncidents` / `mockProjects`
- Org-scoped store `tl-org-data` + CSV import (projects & cases) for Plan Owner
- Settings → Org data space; Activity/Reports/Create report use workspace lists
- Intake saves to org data space; ADR-029

## 2026-07-22 — Packet 24f: Activity + Reports dual dashboards

- `/app/dashboard` → Activity dashboard (nav + project activity pulse)
- `/app/reports` → Reports hub: Monthly (text+graphs), Executive (strategic/high-risk graphs), Board pack (presentation)
- Plan seniority gates packs; Plan Owner grants desks in Settings → Report pack access
- ADR-028; nav label “Reports”; evidence AI writer still under each pack

## 2026-07-22 — Hard-block Cloud report AI + reject user’s Month/Year template

- `/api/frappe` returns 403 for `compose_activity_report` / `generate_report_brief`
- Template detector covers “comprehensive monthly report”, `[Month/Year]`, Topic 1 placeholders
- Create report clears stale editor body; refuses drafts without `INC-*` or `trustledger-evidence` model

## 2026-07-22 — Reports ignore Frappe seed; purge browser templates

- Create report grounds only on `mockIncidents` / local demo·trial stores — never live Frappe lists
- Auto-purge Month-End / `[Insert …]` drafts from `tl-authored-reports`; library “Clear browser library”
- Removed dead Cloud compose/brief method paths from `FRAPPE_METHODS`
- Docs: `docs/FRAPPE_SAMPLE_DATA.md` — deleting ERPNext sample DocTypes does not fix LLM templates

## 2026-07-22 — Report AI: never use Frappe/Grok templates

- `generateReportBrief` and `composeActivityReport` both use local evidence writer only
- Template detector expanded for Month-End / `[Insert …]` / sales-metric placeholders
- Create report always seeds `mockIncidents` even when live Frappe list is empty
- Briefs cite real INC-* titles from demo data

## 2026-07-22 — Soft public launch + live Paystack readiness

- ADR-027: public trial/pay with live Paystack; Frappe live login stays operator-gated
- Bugbot rules (`.cursor/BUGBOT.md`), PR template, `docs/CURSOR_AGENTS.md`, `docs/PUBLIC_LAUNCH.md`
- Invite accept re-checks plan desk cap; opt-out verifies Paystack reference+email (no client auth-code)
- Stable trial temp password per reference; production requires trial/Paystack secret
- Launch checklist updated for live key cutover

## 2026-07-22 — Desk ranks 1 (Client/Board) → 5 (CLO)

- Five desks ordered high→low: funder, executive (CEO/MD), delivery, supervisor, clo
- Plan Owner desk by plan (Practitioner supervisor, Project delivery, Institutional funder)
- Invites only ranks strictly below Owner; higher options greyed in picker + privilege matrix
- Legacy `site` / `oversight` ids normalize to supervisor / executive

## 2026-07-22 — Invite desk exposure gated by plan

- Desk exposure on invite lists all tiers; desks above the plan are greyed / disabled
- Project: CLO / site / supervisor; Institutional: full ladder; Practitioner: no invites
- Privilege matrix columns for above-plan desks greyed; createOrgInvite enforces the cap

## 2026-07-22 — Settings: plan on top; Owner invites & privileges only

- Read-only plan banner at top of Settings (no plan / desk self-toggle for clients)
- Removed demo role switcher from Settings
- Plan Owner section: Team invites + desk privileges matrix for lower ranks
- Juniors see assigned desk only; off-plan privilege rows stay greyed

## 2026-07-22 — Grey out off-plan Settings controls

- Visibility-by-desk-tier rows outside the current plan are greyed / disabled with upgrade hint
- Plan capabilities locked rows visually muted; matrix edit is Plan Owner only
- Practitioner trial: graphs, CRM, capture, supervisor, ESG stay visible but unusable

## 2026-07-22 — Plan capabilities: Owner-only, plan-gated toggles

- Settings → Plan capabilities visible only to Plan Owner (juniors never see it)
- Full catalogue always listed; modules outside the plan are locked with upgrade CTA
- Only Institutional may toggle every feature; lower plans toggle included modules only
- Above-plan force-on overrides ignored; ADR-024 amended

## 2026-07-22 — T1+T2: Plan Owner org + team invites (demo)

- Browser org tenancy: Plan Owner workspace on trial/subscribe; seat caps per ACCESS_MODEL
- Dashboard master strip; Settings → Team / Seats invites (role + desk exposure)
- `/invite/accept` joins as junior with locked desk tier; Practitioner = Owner-only
- Data space / media quotas / Frappe User SoT deferred (T3–T5); ADR-026

## 2026-07-22 — Report AI: hard-bind to demo cases (no LLM guides)

- Create report always seeds `mockIncidents` / `mockProjects` into evidence
- Activity-report compose never calls Cloud LLM (was returning `[Month/Year]` guides when `AI_MOCK=false`)
- UI shows case IDs in scope before write; template detector expanded

## 2026-07-22 — AI report writes finished prose (not a template guide)

- Activity report AI always uses evidence-based local writer from picked topics + demo/workspace cases
- Rejects fill-in-the-blank / “how to write a report” LLM guides
- Output includes real case findings, trust pulse, dates, and author — apply into editor on generate

## 2026-07-22 — AI report write from picked topics (demo data)

- Create report: pick topics → AI writes narrative sections from workspace/demo cases, trust pulse, and Capture evidence
- Suggest → apply → save; project scope filters facts; mock compose uses structured section writers
- Desk-gated topics stay greyed / non-selectable

## 2026-07-22 — Trial subscribe (card verify + deferred charge)

- `/pay` default = 14-day trial: Paystack card verification, authorization on file, bill at trial end
- Success: thank you + login/temp password (email via Resend when configured); no Contact us CTA
- Trial activates immediately; first-login password change prompt; `/login/trial` + `/pay/activate`
- Banner opt-out cancels scheduled charge (`Trial Opt-Out` + deactivate authorization)
- Ops `/api/paystack/charge-due` for day-14 collection; ADR-025
- CRM sources: `Trial Authorize`, `Trial Opt-Out`

## 2026-07-22 — Create report (evidence-based, seniority-gated)

- `/app/reports` → Create a report wizard: kinds (monthly, GRM, ESG, H&S, B-BBEE, CSI, MEL, board…)
- Sections selectable; options above desk grade greyed (visible, not selectable)
- AI compose from workspace incidents + Capture evidence; save for performance/dispute use
- Dashboard Report library views packs by desk level
- Nav label: Create report

- Capability catalogue + plan defaults + sellable add-ons (`entitlements` types/config/lib)
- `FeatureGate`, nav capability filters, Settings add-on/override preview (admin)
- Desk panels honour plan capabilities alongside desk-tier visibility
- Pricing/seats unchanged — packaging revisit later; switches are ready

- Professional desk tiers (CLO → supervisor → site → delivery → oversight → funder) with admin visibility matrix in Settings
- Capture hub: minutes / attendance / social intel / pasted report → AI stakeholder extract + brief (suggest → apply)
- Stakeholder CRM framed as demo placeholder; growth via capture
- Supervisor ranked queue of CLO/site filings; senior desks get charts (ops chart primitives)
- Issue intake requires project (select or create) — projects merge into dashboard/list

- Report flow: issue → reporter (or anonymous) → sequential dialogs for city, DM, TC, ward
- Geo pack powers `/api/geo` for the form only; place KPIs and Places browse removed from client dashboard/report
- Case still stores full geo path for tracking and categorisation

- Removed TEDS maturity panels from `/app/*` (ops-only: `/ops`, `/ops/executive`)
- Cascading geo picker (any-order province/DM/city/TC/ward) via `/api/geo`
- Intake: complaint natures, urgency, client junior/senior threshold, TAT stage targets
- AI triage suggests nature + staff routing (suggest → apply)
- Trust pulse (sentiment → trust index + TAT) on all role dashboards and client reports
- Case desk shows process stage timeline vs client targets

- `buildClientPortfolioBrief` aggregates projects, grievances, CRM, geo (same Frappe contract shapes)
- Client home → governance portfolio KPIs + CRM/geo panels
- `/app/reports` → printable portfolio trust brief for client/admin
- Geo + stakeholder services call live Frappe with seed fallback

## 2026-07-21 — TEDS maturity report (ops-only)

- `src/lib/tedsMaturity.ts` + `docs/TEDS_MATURITY_REPORT.md` (~36% MVP progress)
- Panels on `/ops/executive` (full) and `/ops` only — not on public product `/app` surfaces

## 2026-07-21 — ZA geo pack + stakeholder CRM seed

- Ingested MDB Wards 2020 (4 468 wards) + 15 traditional councils into `data/geo/za-mdb-2020.places.json`
- Multi-country pack schema (add NA/BW/… packs beside ZA)
- `/app/geo` browse by province → municipality → wards; TC list
- Stakeholder CRM kinds expanded; list + detail; Stats SA indicators deferred
- `scripts/ingest_za_geo.py` to regenerate

## 2026-07-21 — Version 001 label + Version 002 core kickoff (ADR-023)

- Soft launch may wait for V002 core; public Now/Next messaging (`HomeVersionStrip`)
- Docs: `VERSIONING.md`, `ROADMAP_V002.md`, Phase 6 packets 24a–24g
- Scaffold: `/app/geo`, `/app/stakeholders`, geo/stakeholder mocks + API contract rows
- App shell shows **Version 001**

## 2026-07-21 — Fix Vercel build (next/headers on client)

- Split server `readTrialSnapshot` into `trial.server.ts`
- Client `/trial` + incident service no longer import `next/headers` via `auth`/`trial`

## 2026-07-21 — WP plan links → Paystack + trial

- Home paste: plan cards → `/pay?plan=…` and `/trial?plan=…` (Institutional → contact)
- Assessment paste: remaining trial CTAs off `/demo` onto `/trial`
- `/trial` reads `?plan=` for pre-selected checkout plan
- Paste checklist: `docs/wordpress/PASTE_PLANS.md`

## 2026-07-21 — Own-data trial + upgrade to Paystack

- Start trial → `/trial` workspace (not `/demo` sample data)
- Banner Upgrade → `/pay`; expired wall with plan checkout + 90-day retention copy
- Subscribe form maze removed from trial funnel (ADR-022)

## 2026-07-20 — Pricing → Paystack plans

- Practitioner R5,399 / Project R14,999 defaults in `paystackPlans.ts`
- Home + WP pricing cards Subscribe → `/pay?plan=…` (quote demoted to fallback)
- Trial funnel choose-step uses Paystack subscribe links

## 2026-07-20 — Open trial (no login until print/save)

- `/demo` auto-enters `/app` as trial guest; email only on print/save
- Plan catalogue `src/config/plans.ts` + `docs/LAUNCH_PLANS.md` / `docs/PAYSTACK_SETUP.md`
- Soft lead gate retired in shell; `/trial` + Paystack subscribe paths remain
- WP paste refreshed: Home + Assessment CTAs → open trial (`docs/WORDPRESS_CTA.md`, `page-home.txt`, `page-assessment.txt`)
- ADR-021

## 2026-07-17 — Conversion homepage (Vercel `/`)

- New marketing homepage: single primary CTA, preserved left-copy / right-dashboard hero
- Admin login de-emphasized; Book walkthrough secondary; analytics hooks stubbed
- Components under `src/components/marketing/*`

## 2026-07-16 — Quote + EFT soft-launch bridge (23i)

- `/quote` → CRM Lead `Quote Request` (+ optional `OPS_ALERT_WEBHOOK_URL`)
- Ops → Finance → **Confirm EFT paid** → CRM Lead `EFT Payment` for Finance/Executive
- Trial / demo CTAs prefer quote over Paystack while KYC finalises
- ADR-020; Plan Owner still manual under lockdown

## 2026-07-16 — Frappe Jinja render hardening notice

- Documented Frappe PR #37924 Public Bench Jinja lockdown impact
- Vercel app unaffected; Desk template audit + smoke checklist in `docs/FRAPPE_JINJA_SAFE_RENDER.md`

## 2026-07-15 — Trial funnel with subscribe path

- `/trial`: capture details → choose Explore demo **or** Subscribe (Paystack)
- Demo banner + soft-gate offer Subscribe / pay; WP Start trial → `/trial`

## 2026-07-15 — Vercel Paystack checkout (23g)

- ADR-019: `/pay` → Paystack hosted checkout while Desk marketplace app is blocked
- Webhook + verify log CRM Lead `Paystack Payment`; Ops Finance + Executive show notifications
- WP buy CTAs documented; amounts via `PAYSTACK_AMOUNT_*_CENTS`

## 2026-07-15 — Interserv retired (ADR-018)

- Sole backend host is Frappe Cloud `app.trustledger.co.za`
- Docs/config scrubbed of Interserv runtime dependency
- `docs/INTERSERV_CANCEL.md` owner checklist to cancel before next deduction

## 2026-07-15 — Command control pillars (23f)

- ADR-017: `/ops/finance`, `/ops/staff`, `/ops/ai`, `/ops/issues`
- Finance + staff scaffolds (no fabricated numbers); **staff wellbeing deferred** placeholder
- AI tools registry with upgrade/watch/discharge framing; issues from Support Ticket CRM + TAT/feeling placeholders
- Executive Board links the four control pillars

## 2026-07-15 — Executive demographics + voice

- `/ops/executive` adds origin, industry/sector, influence, sentiment/perception, and verbatim quotes from CRM Comments
- Lead intake stores structured Sector / Demo role / UTM / Comment for cleaner future parsing

## 2026-07-15 — Executive Board brief (23e)

- ADR-016: `/ops/executive` is the C-suite board/investor surface; `/ops` stays junior day-to-day activity
- KPIs, weekly trend, activity mix, funnel, rating charts, talking points + print/copy
- Operator live login homes to `/ops/executive`

## 2026-07-15 — Ops = client activity (not product desk)

- Operator live login defaults to `/ops` (not `/app/dashboard`)
- Login API returns `home: /ops`; middleware bounces operators off `/app/dashboard` → `/ops`
- `/ops` + `/ops/activity` show demos / assessments / feedback / contact / support — not projects or issues
- Nav no longer treats the customer product desk as the operator home; Cloud CRM remains for record detail

## 2026-07-15 — Platform Ops command centre (23a)

- ADR-015 + `docs/PLATFORM_OPS.md`: `/ops` allowlist-only overview (not a CRM)
- Health + CRM Lead intake intel; Reports/Accounts stubs for later packets

## 2026-07-14 — Paystack payments setup (Frappe Cloud)

- ADR-014: Paystack + Frappe Paystack for ZAR collection
- `docs/PAYMENTS_SETUP.md` Desk/Marketplace checklist; Peach superseded for gateway choice

## 2026-07-14 — Live login without srm-core

- Live sign-in falls back to TrustLedger Cloud session/roles when `srm_core.get_session` is missing
- Unauthenticated `/app` in live data mode goes to `/login/live` (not demo)

## 2026-07-14 — UI branding sweep

- Removed user-facing “Frappe” / vendor doc paths; Settings, login, status, support, AI copy use TrustLedger (Cloud) / Chibase Consulting

## 2026-07-14 — CRM Desk bootstrap

- `/api/frappe/crm-setup` (token-gated) creates Lead Sources, default Job Title/Source columns, pinned views

## 2026-07-14 — Contact + launch feedback

- User-facing API errors say **TrustLedger** (not Frappe)
- `/contact` form replaces mailto bounce; posts to CRM Lead
- Post-assessment feedback form + demo shell **Feedback** drawer (rating + note → CRM)
- CRM Lead **Job Title** + **Source** + structured Comment for relevance triage (`docs/CRM_VIEWS.md`)

## 2026-07-13 — Honeypot autofill fix

- Renamed lead honeypot from `company_url` → `tl_hp` (password managers were autofilling website fields and silently dropping real leads)
- Server still accepts legacy `company_url`; logs when honeypot trips

## 2026-07-13 — Frappe Cloud cutover wiring

- Lead APIs prefer Frappe CRM Lead (`FRAPPE_API_KEY`/`SECRET`) with HubSpot fallback
- Docs: `docs/FRAPPE_CLOUD_SETUP.md` (Vercel env, CORS, smoke)
- Copy/defaults point at `https://app.trustledger.co.za`

## 2026-07-13 — Lead form spam + required comments

- Honeypot + rate limit + optional reCAPTCHA v3 on demo/assessment/support APIs
- Required intent comment on demo entry + assessment unlock
- `docs/LEAD_FORMS.md` for incentives/follow-up (CRM-side, not form-side)

## 2026-07-12 — Platform Operator sole live control

- ADR-013 + `docs/PLATFORM_OPERATOR.md`: live login / `/app` / Frappe BFF limited to `PLATFORM_OPERATOR_EMAILS` when `PLATFORM_OPERATOR_ONLY=1`
- Email session cookie; operator banner + Settings access panel
- Demo remains public unless `PLATFORM_OPERATOR_LOCK_PUBLIC=1`

## 2026-07-12 — Post-payment access model

- ADR-012 + `docs/ACCESS_MODEL.md`: Plan Owner = org admin; Owner confirms lower-role invites by plan seats

## 2026-07-12 — CRM handoff model

- ADR-011 + `docs/CRM_HANDOFF.md`: HubSpot Free = lead magnet; Frappe owns relationships after commitment

## 2026-07-12 — Support Phase A

- In-app Support drawer (self-serve + HubSpot tickets)
- `/status` + `/api/health` (Vercel + Frappe Cloud probes)
- Issue catalog + allowlist in `docs/SUPPORT_OPS.md`
- Repair session + live sign-in shortcuts

## 2026-07-11 — Demo entry lead capture

- `/demo` requires name + work email before start (same bar as assessment)
- Posts to HubSpot with `[Source: demo_entry]` for marketing segmentation
- Soft gate remains as backup (`demo_soft_gate`) if entry was skipped

## 2026-07-11 — Launch hardening

- Demo lead gate posts to HubSpot via `/api/demo/lead`
- Shared HubSpot helper; production fails closed without CRM config
- Unified `info@trustledger.co.za`; privacy links on lead forms
- Disable `NEXT_PUBLIC_DEV_ROLE` bypass in Vercel production
- Dynamic robots; `/reports` redirect; launch checklist doc

## 2026-07-11 — Stronger product chrome

- Ink (`#12202a`) full-height sidebar with teal active nav
- Full-bleed app layout (content still max-width)
- KPI cards with accent bar + larger type; framed page header; table elevation

## 2026-07-11 — App shell & dashboard polish

- Refined AppShell sidebar (sticky, workspace label, user footer)
- Soft active nav with stroke icons; tighter demo banner motion
- Shared `PageHeader`, `KpiCard`, `StatusChip`, `IncidentTable`
- Role dashboards: KPI strips, status chips, concern tables (Field ledger tokens)

## 2026-07-11 — Assessment → HubSpot

- `/api/assessment/lead` submits to HubSpot Forms API (EU) when `HUBSPOT_PORTAL_ID` + `HUBSPOT_FORM_ID` are set
- Maps name/email/company + assessment summary into the form `message` field
- Generic `ASSESSMENT_WEBHOOK_URL` remains as fallback

## 2026-07-11 — SRM Readiness Assessment

- Public `/assessment` wizard (16 Likert items across 6 governance dimensions)
- Lead gate (name + work email) before score / risk / top 3 / 90-day plan
- `POST /api/assessment/lead` with optional `ASSESSMENT_WEBHOOK_URL`
- CSP `frame-ancestors` allowlist for WordPress embed (`trustledger.co.za`)
- WordPress embed snippet: `docs/wordpress/assessment-embed.html`

## 2026-07-11 — Phase 4 Packets 19–22

- UTM capture on `/demo` + lead payload attribution
- Mobile menu nav for small screens
- robots.txt, sitemap, Open Graph metadata
- `docs/FRAPPE_API_CONTRACT.md` for Frappe Cloud / srm-core

## 2026-07-11 — Phase 3 Packets 15–18

- WordPress CTA paste guide (`docs/WORDPRESS_CTA.md`)
- Demo localStorage for submitted issues + evidence stubs
- Toast provider for apply/submit feedback

## 2026-07-11 — Phase 2 Packets 11–14

- `NEXT_PUBLIC_DATA_MODE` + Frappe client (`callFrappeMethod`)
- Live adapters on project/incident/note/AI services with mock fallback
- `/app/settings`, `/app/projects/[id]`, auth bridge stub doc

## 2026-07-11 — Packets 08–10

- Incident list filters (status, SLA, search)
- Demo lead soft-gate after 3 meaningful actions
- `docs/VERCEL_SMOKE.md` deploy checklist

## 2026-07-11 — Packets 03–07

- Expanded mock domain: projects, incidents (SLA/escalation/timeline), meeting notes, evidence
- Added `projectService`, `incidentService`, `noteService`, `evidenceService`
- Role dashboards now render real widgets (community/contractor/client/admin)
- Incident detail loads via services with timeline + evidence

## 2026-07-11 — Packets 00–02

- Demo-first docs, design system, `/demo` entry, `/app` shell
