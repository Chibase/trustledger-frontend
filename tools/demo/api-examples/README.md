# TrustLedger srm-core API examples

Postman collection and curl samples for **staging**. Defaults follow `docs/FRAPPE_API_CONTRACT.md` and `docs/LEDGER_API.md`.

**Human must confirm actual method names and auth headers before a real import.** Create methods (including `plans.create`) may 404 until Cloud implements them.

Do not put production secrets in this folder. Do not call `app.trustledgersrm.co.za` or the retired `app.trustledger.co.za` host without explicit human approval.

## Placeholders

| Variable | Meaning | Placeholder in git |
|----------|---------|--------------------|
| `BASE_URL` | Staging host, no trailing slash | `https://YOUR-STAGING-HOST` |
| `API_KEY` | Frappe token `api_key:api_secret` | `frappe_api_key:frappe_api_secret` |

Auth header used here:

```http
Authorization: token ${API_KEY}
```

Session-cookie auth (`credentials: include`) is the browser path in the contract. API-key token is the import/Postman path. Confirm which Cloud expects for your user.

```bash
export BASE_URL="https://YOUR-STAGING-HOST"
export API_KEY="frappe_api_key:frappe_api_secret"
```

## Postman

1. Import `TrustLedger_srm_core.postman_collection.json`.
2. Collection variables: `BASE_URL`, `API_KEY` (same placeholders).
3. Folders:
   - **Create Plan** — `POST /api/method/srm_core.api.plans.create` (proposed; skip if unavailable)
   - **Create entity** — org / site / asset / inspection / incident / work_order
   - **Evidence upload** — multipart `gps_lat`, `gps_lon`, `timestamp`, `checksum`, `file`
   - **Ledger** — `create_entry`, `verify_entry`, plus `get_chain` and `public_key`

Collection auth is `Authorization: token {{API_KEY}}`.

## Curl examples

Readable copy-paste samples (same placeholders). Full script: `curl-examples.sh`.

### Create plan (proposed)

```bash
curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.plans.create" \
  -H "Authorization: token ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_code": "project",
    "name": "Project",
    "org_id": "ORG-0001",
    "status": "active"
  }'
```

### Create organization

```bash
curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.organizations.create_organization" \
  -H "Authorization: token ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "ORG-0001",
    "name": "Sundays River Valley Local Municipality",
    "org_type": "client",
    "province": "Eastern Cape",
    "municipality": "Sundays River Valley",
    "contact_email": "srm.org0001@example.test",
    "status": "active"
  }'
```

### Create site

```bash
curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.sites.create_site" \
  -H "Authorization: token ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "SITE-0001",
    "org_id": "ORG-0001",
    "name": "Corridor access km 11.1",
    "project_code": "NCGR-B",
    "ward": "Ward 2",
    "municipality": "Sundays River Valley",
    "gps_lat": "-33.4000",
    "gps_lon": "25.4400",
    "status": "active"
  }'
```

### Create asset

```bash
curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.assets.create_asset" \
  -H "Authorization: token ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "asset_id": "ASSET-0001",
    "site_id": "SITE-0001",
    "org_id": "ORG-0001",
    "name": "culvert 001",
    "asset_type": "culvert",
    "status": "in_service",
    "installed_at": "2024-01-15"
  }'
```

### Create inspection

```bash
curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.inspections.create_inspection" \
  -H "Authorization: token ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "inspection_id": "INSP-0001",
    "site_id": "SITE-0001",
    "asset_id": "ASSET-0001",
    "org_id": "ORG-0001",
    "inspector_id": "USER-0001",
    "date_time": "2026-06-01T11:00:00Z",
    "score": 61,
    "status": "Completed",
    "notes": "Guard rail and culvert walkabout"
  }'
```

### Create incident

```bash
curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.incidents.create_incident" \
  -H "Authorization: token ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "incident_id": "INC-0001",
    "org_id": "ORG-0001",
    "site_id": "SITE-0001",
    "title": "Access road dust affecting livestock",
    "description": "Illustrative grievance for API examples. Not a live matter.",
    "status": "Open",
    "priority": "P4-Low",
    "reported_by": "USER-0001",
    "reported_at": "2026-07-02T09:00:00Z",
    "ward": "Ward 2",
    "category": "grievance"
  }'
```

### Create work order

```bash
curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.work_orders.create_work_order" \
  -H "Authorization: token ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "work_order_id": "WO-0001",
    "org_id": "ORG-0001",
    "site_id": "SITE-0001",
    "asset_id": "ASSET-0001",
    "incident_id": "INC-0001",
    "inspection_id": "INSP-0001",
    "title": "Remediate culvert at corridor access km 11.1",
    "status": "open",
    "assigned_to": "USER-0001",
    "due_date": "2026-09-16"
  }'
```

### Evidence upload (multipart)

```bash
# checksum = SHA-256 of the file bytes you upload
CHECKSUM="$(sha256sum ./field_01.jpg | awk '{print $1}')"

curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.evidence.upload_evidence" \
  -H "Authorization: token ${API_KEY}" \
  -F "evidence_id=EVID-0001" \
  -F "org_id=ORG-0001" \
  -F "parent_type=inspection" \
  -F "parent_id=INSP-0001" \
  -F "gps_lat=-33.4000" \
  -F "gps_lon=25.4400" \
  -F "timestamp=2026-06-01T11:00:00Z" \
  -F "checksum=${CHECKSUM}" \
  -F "uploader_id=USER-0001" \
  -F "classification=photo" \
  -F "file=@./field_01.jpg;type=image/jpeg"
```

### Ledger create entry

`signature` is `null` so Cloud signs. Do not paste a production private key.

```bash
curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.ledger.create_entry" \
  -H "Authorization: token ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "evidence",
    "entity_id": "EVID-0099",
    "action": "create",
    "timestamp": "2026-08-01T09:17:30Z",
    "actor_id": "USER-INS-01",
    "canonical_entity": {
      "filename": "culvert_block_20260801.jpg",
      "gps_lat": -33.0002,
      "gps_lon": 25.7001,
      "id": "EVID-0099",
      "parent_id": "INSP-1001",
      "parent_type": "inspection",
      "timestamp": "2026-08-01T09:17:00Z",
      "uploader_id": "USER-INS-01"
    },
    "prev_hash": null,
    "signature": null
  }'
```

### Ledger verify

```bash
curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.ledger.verify_entry" \
  -H "Authorization: token ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"ledger_id": "LGR-5001"}'
```

### Ledger chain + public key (optional)

```bash
curl -sS -G "${BASE_URL}/api/method/srm_core.api.ledger.get_chain" \
  -H "Authorization: token ${API_KEY}" \
  --data-urlencode "entity_id=EVID-0099"

curl -sS "${BASE_URL}/api/method/srm_core.api.ledger.public_key" \
  -H "Authorization: token ${API_KEY}"
```
