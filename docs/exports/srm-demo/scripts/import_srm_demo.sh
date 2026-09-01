#!/usr/bin/env bash
# TrustLedger SRM demo — local validate / optional curl import
# Fill BASE_URL, API_KEY, PLAN_ID before --execute. Never point at production
# unless you intend to seed a private Chibase sandbox.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE_URL="${TRUSTLEDGER_BASE_URL:-http://localhost:8000}"
API_KEY="${TRUSTLEDGER_API_KEY:-REPLACE_ME}"
PLAN_ID="${TRUSTLEDGER_PLAN_ID:-}"
MODE="${1:---dry-run}"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ -f data/organizations.csv ]] || die "CSVs missing. Run: python3 scripts/generate_dataset.py"
[[ -d images ]] || die "images/ missing."

case "$MODE" in
  --dry-run|"")
    python3 scripts/import_srm_demo.py --dry-run --create-ledger-locally
    ;;
  --execute)
    [[ "$API_KEY" != "REPLACE_ME" && -n "$API_KEY" ]] || die "Set TRUSTLEDGER_API_KEY (sandbox only)."
    python3 scripts/import_srm_demo.py --execute --base-url "$BASE_URL" --api-key "$API_KEY" ${PLAN_ID:+--plan-id "$PLAN_ID"}
    ;;
  --curl-examples)
    echo "# Create plan (if API exists). Otherwise create in UI and export PLAN_ID."
    cat <<EOF
curl -sS -X POST "$BASE_URL/api/plans" \\
  -H "Authorization: Bearer \$TRUSTLEDGER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"TrustLedger SRM — Demo: Consolidated Evidence","visibility":"private","pin_to_dashboard":true}'
EOF
    echo
    echo "# Example entity POST (repeat per CSV row). PLAN_ID required."
    echo "curl -sS -X POST \"$BASE_URL/api/incident\" -H \"Authorization: Bearer \$TRUSTLEDGER_API_KEY\" -H \"Content-Type: application/json\" -d @payloads/sample_incident.json"
    echo
    echo "# Evidence multipart upload"
    cat <<'EOF'
curl -sS -X POST "$BASE_URL/api/evidence/upload" \
  -H "Authorization: Bearer $TRUSTLEDGER_API_KEY" \
  -F "plan_id=$TRUSTLEDGER_PLAN_ID" \
  -F "parent_type=inspection" \
  -F "parent_id=INSP-1001" \
  -F "gps_lat=-33.0002" \
  -F "gps_lon=25.7001" \
  -F "timestamp=2026-08-01T09:17:00Z" \
  -F "checksum=sha256:REPLACE_FROM_CSV" \
  -F "uploader_id=USER-INS-01" \
  -F "file=@images/culvert_block_20260801.jpg;type=image/jpeg"
EOF
    ;;
  *)
    die "Unknown mode $MODE (use --dry-run | --execute | --curl-examples)"
    ;;
esac
