# Frappe / srm-core API contract (TrustLedger frontend)

The Vercel app calls these whitelisted methods when `NEXT_PUBLIC_DATA_MODE=live`.
Until they exist, services fall back to Demo mocks.

Base URL: `NEXT_PUBLIC_API_BASE_URL` (Frappe Cloud — `https://app.trustledgersrm.co.za`)  
Transport: `POST` JSON, `credentials: include`  
Envelope: standard Frappe `{ "message": <payload> }`

## Methods

| Frontend constant | Path | Request body | Response `message` |
|-------------------|------|--------------|--------------------|
| `listProjects` | `/api/method/srm_core.api.projects.list_projects` | `{ ward?, status?, contractorName? }` | `Project[]` |
| `getProject` | `/api/method/srm_core.api.projects.get_project` | `{ name }` | `Project \| null` |
| `listIncidents` | `/api/method/srm_core.api.incidents.list_incidents` | filters object | `Incident[]` |
| `getIncident` | `/api/method/srm_core.api.incidents.get_incident` | `{ name }` | `Incident \| null` |
| `listNotes` | `/api/method/srm_core.api.engagements.list_meeting_notes` | `{ ward?, projectId? }` | `MeetingNote[]` (**legacy** alias; live desk does not depend on this returning rows) |
| `listEngagements` | `/api/method/srm_core.api.engagements.list_engagements` | `{ ward?, projectId?, query? }` | `Engagement[]` |
| `listCommitments` | `/api/method/srm_core.api.commitments.list_commitments` | `{ projectId?, engagementId?, query? }` | `Commitment[]` |
| `listEvidence` | `/api/method/srm_core.api.incidents.list_evidence` | `{ incident }` | `EvidenceStub[]` |
| `suggestTriage` | `/api/method/srm_core.api.ai.suggest_triage` | triage request | triage suggestion |
| `suggestSentiment` | `/api/method/srm_core.api.ai.suggest_sentiment` | `{ text, geographicArea?, linkedIncidentId?, sourceType? }` | `{ sentimentScore, sentimentLabel: positive\|neutral\|negative, confidenceScore, rationale, sourceType, model, promptVersion }` |
| `draftResponse` | `/api/method/srm_core.api.ai.draft_response` | draft request | draft suggestion |
| `generateReportBrief` | `/api/method/srm_core.api.ai.generate_report_brief` | brief request | brief suggestion |
| `getSession` | `/api/method/srm_core.api.auth.get_session` | (session cookie) | `{ user, fullName, roles, trustLedgerRole }` |
| `listGeoPlaces` | `/api/method/srm_core.api.geo.list_places` | `{ parentId? }` | `GeoPlace[]` |
| `getGeoPlace` | `/api/method/srm_core.api.geo.get_place` | `{ name }` | `GeoPlace \| null` |
| `listSocioIndicators` | `/api/method/srm_core.api.geo.list_indicators` | `{ placeId }` | `SocioEconomicIndicator[]` |
| `listStakeholders` | `/api/method/srm_core.api.stakeholders.list_stakeholders` | `{ placeId?, kind? }` | `Stakeholder[]` |
| `getStakeholder` | `/api/method/srm_core.api.stakeholders.get_stakeholder` | `{ name }` | `Stakeholder \| null` |

### Live Stakeholder Intelligence (preferred)

Product desk engagements, stakeholders, and commitments use the Cloud SI BFF, not the leftover `list_meeting_notes` method:

`GET|POST /api/frappe/si?kind=engagement|stakeholder|commitment`

Trust observations, participation, and community context use:

`GET|POST /api/frappe/trust` (`kind=observation|participation|community|verification|bucket`)

Live incidents (including process-stage stamps) use the product BFF, not `srm_core` `list_incidents`:

`GET|POST /api/frappe/product?kind=incident`

`noteService` still tries `FRAPPE_METHODS.listNotes` in live mode, then falls through to `engagementService` (SI Engagement DocType). Named Python `engagements.py` is not in this frontend repo. SI-Cloud status: **shipped**. TE-7 / TE-11 trust DocTypes: **shipped**. 24e-cloud incident stamps: **shipped**. P0b project Cloud save: **shipped** (`GET\|PUT /api/app/projects/[id]`; create remains `POST /api/app/projects`).

### OD-2 resource path (until srm_core create methods land)

Prefer Frappe **resource** DocTypes created by Ops ensure:

| Action | Path | Notes |
|--------|------|-------|
| Ensure DocTypes | `POST /api/frappe/ensure-product-doctypes` | `TL Project`, `TL Incident` (+ stage Datetimes), `TL Evidence`, SI, **TE-7 / TE-11 trust** |
| Live incident list/upsert | `GET\|POST /api/frappe/product?kind=incident` | Process-stage stamps; empty Cloud stays empty |
| Live project list/create | `GET\|POST /api/app/projects` | Create is Plan Owner-only; list is Cloud-authoritative |
| Live project get/update | `GET\|PUT /api/app/projects/[id]` | Any bound live session may update; dossier omitted |
| Smoke create | `POST /api/frappe/product-smoke` | `{ kind, customer, project\|incident\|evidence\|…\|observation\|participation\|community\|verification }` |
| Upload file | `POST /api/frappe/upload-file` | multipart → Frappe `upload_file` |

Field maps: `src/lib/productCloud.ts`. Spec: `docs/PRODUCT_DOCTYPES.md`.

Live browser calls go through the Next.js BFF `POST /api/frappe` (see `docs/AUTH_BRIDGE_STUB.md`).

## Type sources (frontend)

- `src/types/project.ts`
- `src/types/incident.ts`
- `src/types/engagement.ts`
- `src/types/ai.ts`
- `src/types/geo.ts` (Version 002)
- `src/types/stakeholder.ts` (Version 002)
- `src/types/trustLayer.ts` (TE-7)

## Ops requirements on Frappe Cloud

1. CORS allow `https://trustledger-frontend-pi.vercel.app` (see `docs/FRAPPE_CLOUD_SETUP.md`)
2. Cookie / session auth for live users (see `docs/AUTH_BRIDGE_STUB.md`)
3. Grok / xAI key only on server (`srm_core` site config) — never returned to browser
4. AI responses must include `model` + `promptVersion` for audit
5. Lead intake: API key user may create **Lead** (or custom `FRAPPE_LEAD_METHOD`)

## Suggested implementation order on srm-core

1. Geo places + socio-economic indicators (Version 002 / packet 24a)
2. Stakeholders list/get (packet 24b)
3. `list_incidents` / `get_incident` (maps existing SRM Incident DocType)
4. `list_projects` / `get_project` (or temporary stub DocType)
5. Engagements + commitments — **SI-Cloud DocTypes shipped**; leftover `list_meeting_notes` is not the live desk path
6. AI methods wrapping xAI with JSON schema validation
7. Notes + evidence list endpoints

## Write methods (staging / import — confirm before live use)

List/get paths above are what the Vercel app calls today. **Create** paths below are the defaults used by `tools/demo/api-examples/` (Postman + curl) and `tools/demo/srm-import/import_script.py`. Human must confirm names and `Authorization: token key:secret` vs session cookie before a real import. They may 404 until srm-core implements them.

Offline pack: `tools/demo/srm-import/` (zip `tools/demo/trustledger-srm-demo.zip`). Do not import to production without a human-scoped key.

| Action | Path | Notes |
|--------|------|-------|
| Create plan | `/api/method/srm_core.api.plans.create` | **Proposed.** Skip if Cloud does not expose it. |
| Create organisation | `/api/method/srm_core.api.organizations.create_organization` | Demo import |
| Create site | `/api/method/srm_core.api.sites.create_site` | Demo import |
| Create asset | `/api/method/srm_core.api.assets.create_asset` | Demo import |
| Create inspection | `/api/method/srm_core.api.inspections.create_inspection` | Demo import |
| Create incident | `/api/method/srm_core.api.incidents.create_incident` | Demo import |
| Create work order | `/api/method/srm_core.api.work_orders.create_work_order` | Demo import |
| Upload evidence | `/api/method/srm_core.api.evidence.upload_evidence` | multipart: `gps_lat`, `gps_lon`, `timestamp`, `checksum`, `file` |
| Create ledger entry | `/api/method/srm_core.api.ledger.create_entry` | `docs/LEDGER_API.md` |
| Verify ledger entry | `/api/method/srm_core.api.ledger.verify_entry` | `docs/LEDGER_API.md` |
| Get ledger chain | `/api/method/srm_core.api.ledger.get_chain` | GET `entity_id` |
| Ledger public key | `/api/method/srm_core.api.ledger.public_key` | Public key only |

Postman: `tools/demo/api-examples/TrustLedger_srm_core.postman_collection.json` (`BASE_URL`, `API_KEY` placeholders). Curl: `tools/demo/api-examples/README.md`.
