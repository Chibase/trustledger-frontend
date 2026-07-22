# Frappe / srm-core API contract (TrustLedger frontend)

The Vercel app calls these whitelisted methods when `NEXT_PUBLIC_DATA_MODE=live`.
Until they exist, services fall back to Demo mocks.

Base URL: `NEXT_PUBLIC_API_BASE_URL` (Frappe Cloud — `https://app.trustledger.co.za`)  
Transport: `POST` JSON, `credentials: include`  
Envelope: standard Frappe `{ "message": <payload> }`

## Methods

| Frontend constant | Path | Request body | Response `message` |
|-------------------|------|--------------|--------------------|
| `listProjects` | `/api/method/srm_core.api.projects.list_projects` | `{ ward?, status?, contractorName? }` | `Project[]` |
| `getProject` | `/api/method/srm_core.api.projects.get_project` | `{ name }` | `Project \| null` |
| `listIncidents` | `/api/method/srm_core.api.incidents.list_incidents` | filters object | `Incident[]` |
| `getIncident` | `/api/method/srm_core.api.incidents.get_incident` | `{ name }` | `Incident \| null` |
| `listNotes` | `/api/method/srm_core.api.engagements.list_meeting_notes` | `{ ward?, projectId? }` | `MeetingNote[]` |
| `listEvidence` | `/api/method/srm_core.api.incidents.list_evidence` | `{ incident }` | `EvidenceStub[]` |
| `suggestTriage` | `/api/method/srm_core.api.ai.suggest_triage` | triage request | triage suggestion |
| `suggestSentiment` | `/api/method/srm_core.api.ai.suggest_sentiment` | sentiment request | sentiment suggestion |
| `draftResponse` | `/api/method/srm_core.api.ai.draft_response` | draft request | draft suggestion |
| `generateReportBrief` | `/api/method/srm_core.api.ai.generate_report_brief` | brief request | brief suggestion |
| `getSession` | `/api/method/srm_core.api.auth.get_session` | (session cookie) | `{ user, fullName, roles, trustLedgerRole }` |
| `listGeoPlaces` | `/api/method/srm_core.api.geo.list_places` | `{ parentId? }` | `GeoPlace[]` |
| `getGeoPlace` | `/api/method/srm_core.api.geo.get_place` | `{ name }` | `GeoPlace \| null` |
| `listSocioIndicators` | `/api/method/srm_core.api.geo.list_indicators` | `{ placeId }` | `SocioEconomicIndicator[]` |
| `listStakeholders` | `/api/method/srm_core.api.stakeholders.list_stakeholders` | `{ placeId?, kind? }` | `Stakeholder[]` |
| `getStakeholder` | `/api/method/srm_core.api.stakeholders.get_stakeholder` | `{ name }` | `Stakeholder \| null` |

### OD-2 resource path (until srm_core create methods land)

Prefer Frappe **resource** DocTypes created by Ops ensure:

| Action | Path | Notes |
|--------|------|-------|
| Ensure DocTypes | `POST /api/frappe/ensure-product-doctypes` | `TL Project`, `TL Incident`, `TL Evidence` |
| Smoke create | `POST /api/frappe/product-smoke` | `{ kind, customer, project\|incident\|evidence }` |
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
5. Engagements + commitments DocTypes (24c–24d)
6. AI methods wrapping xAI with JSON schema validation
7. Notes + evidence list endpoints
