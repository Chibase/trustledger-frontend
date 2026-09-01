#!/usr/bin/env bash
# Offline ledger acceptance + import dry-run. No API keys. No Cloud calls.
# Invoked by .github/workflows/ledger-acceptance.yml and local Docker.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Jest ledger vectors =="
npm run test:ledger

if [[ -f "${ROOT}/jest.ui.config.cjs" ]]; then
  echo "== Jest AuditTrailViewer =="
  npm run test:audit
fi

echo "== pytest ledger vectors =="
python3 -m pytest tests/test_ledger_vectors.py -q

echo "== import_script.py --dry-run =="
mkdir -p "${ROOT}/tools/ci"
set +e
python3 "${ROOT}/tools/import_script.py" --dry-run 2>&1 | tee "${ROOT}/tools/ci/acceptance_log.txt"
import_status=${PIPESTATUS[0]}
set -e
if [[ "${import_status}" -ne 0 ]]; then
  echo "import dry-run FAILED (exit ${import_status})"
  exit "${import_status}"
fi

echo "ci_run.sh: PASS"
