#!/usr/bin/env bash
# TrustLedger srm-core curl examples — placeholders only.
#   export BASE_URL="https://YOUR-STAGING-HOST"
#   export API_KEY="frappe_api_key:frappe_api_secret"
# Do not run against production without explicit human approval.
# This file is documentation; it does not execute requests unless you pass --execute.

set -euo pipefail

BASE_URL="${BASE_URL:-https://YOUR-STAGING-HOST}"
API_KEY="${API_KEY:-frappe_api_key:frappe_api_secret}"
AUTH_HEADER="Authorization: token ${API_KEY}"

if [[ "${1:-}" != "--execute" ]]; then
  cat <<'EOF'
TrustLedger srm-core curl examples (placeholders).

  export BASE_URL="https://YOUR-STAGING-HOST"
  export API_KEY="frappe_api_key:frappe_api_secret"

This script prints the commands. To actually POST (staging only, after human
confirmation of method names and auth):

  ./curl-examples.sh --execute

Refuses production host unless TRUSTLEDGER_ALLOW_PROD_IMPORT=YES.
See README.md for the readable curl blocks.
EOF
  exit 0
fi

host="${BASE_URL#https://}"
host="${host#http://}"
host="${host%%/*}"
if [[ "${host}" == *app.trustledgersrm.co.za* || "${host}" == *app.trustledger.co.za* ]] && [[ "${TRUSTLEDGER_ALLOW_PROD_IMPORT:-}" != "YES" ]]; then
  echo "Refusing production host ${host}" >&2
  exit 2
fi

json() {
  curl -sS -X POST "$1" -H "${AUTH_HEADER}" -H "Content-Type: application/json" -d "$2"
}

echo "== Create plan (proposed) =="
json "${BASE_URL}/api/method/srm_core.api.plans.create" \
  '{"plan_code":"project","name":"Project","org_id":"ORG-0001","status":"active"}'

echo "== Create organization =="
json "${BASE_URL}/api/method/srm_core.api.organizations.create_organization" \
  '{"org_id":"ORG-0001","name":"Sundays River Valley Local Municipality","org_type":"client","province":"Eastern Cape","municipality":"Sundays River Valley","contact_email":"srm.org0001@example.test","status":"active"}'

echo "== Create site =="
json "${BASE_URL}/api/method/srm_core.api.sites.create_site" \
  '{"site_id":"SITE-0001","org_id":"ORG-0001","name":"Corridor access km 11.1","project_code":"NCGR-B","ward":"Ward 2","municipality":"Sundays River Valley","gps_lat":"-33.4000","gps_lon":"25.4400","status":"active"}'

echo "== Create asset =="
json "${BASE_URL}/api/method/srm_core.api.assets.create_asset" \
  '{"asset_id":"ASSET-0001","site_id":"SITE-0001","org_id":"ORG-0001","name":"culvert 001","asset_type":"culvert","status":"in_service","installed_at":"2024-01-15"}'

echo "== Create inspection =="
json "${BASE_URL}/api/method/srm_core.api.inspections.create_inspection" \
  '{"inspection_id":"INSP-0001","site_id":"SITE-0001","asset_id":"ASSET-0001","org_id":"ORG-0001","inspector_id":"USER-0001","date_time":"2026-06-01T11:00:00Z","score":61,"status":"Completed","notes":"Guard rail and culvert walkabout"}'

echo "== Create incident =="
json "${BASE_URL}/api/method/srm_core.api.incidents.create_incident" \
  '{"incident_id":"INC-0001","org_id":"ORG-0001","site_id":"SITE-0001","title":"Access road dust affecting livestock","description":"Illustrative grievance for API examples. Not a live matter.","status":"Open","priority":"P4-Low","reported_by":"USER-0001","reported_at":"2026-07-02T09:00:00Z","ward":"Ward 2","category":"grievance"}'

echo "== Create work order =="
json "${BASE_URL}/api/method/srm_core.api.work_orders.create_work_order" \
  '{"work_order_id":"WO-0001","org_id":"ORG-0001","site_id":"SITE-0001","asset_id":"ASSET-0001","incident_id":"INC-0001","inspection_id":"INSP-0001","title":"Remediate culvert at corridor access km 11.1","status":"open","assigned_to":"USER-0001","due_date":"2026-09-16"}'

echo "== Evidence upload (set EVIDENCE_FILE) =="
if [[ -n "${EVIDENCE_FILE:-}" && -f "${EVIDENCE_FILE}" ]]; then
  CHECKSUM="$(sha256sum "${EVIDENCE_FILE}" | awk '{print $1}')"
  curl -sS -X POST "${BASE_URL}/api/method/srm_core.api.evidence.upload_evidence" \
    -H "${AUTH_HEADER}" \
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
    -F "file=@${EVIDENCE_FILE};type=image/jpeg"
  echo
else
  echo "skip evidence (set EVIDENCE_FILE to a JPEG path)"
fi

echo "== Ledger create_entry =="
json "${BASE_URL}/api/method/srm_core.api.ledger.create_entry" \
  '{"entity_type":"evidence","entity_id":"EVID-0099","action":"create","timestamp":"2026-08-01T09:17:30Z","actor_id":"USER-INS-01","canonical_entity":{"filename":"culvert_block_20260801.jpg","gps_lat":-33.0002,"gps_lon":25.7001,"id":"EVID-0099","parent_id":"INSP-1001","parent_type":"inspection","timestamp":"2026-08-01T09:17:00Z","uploader_id":"USER-INS-01"},"prev_hash":null,"signature":null}'

echo "== Ledger verify_entry =="
json "${BASE_URL}/api/method/srm_core.api.ledger.verify_entry" '{"ledger_id":"LGR-5001"}'
