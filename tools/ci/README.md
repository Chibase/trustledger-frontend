# Ledger acceptance CI — local run

GitHub Actions: `.github/workflows/ledger-acceptance.yml`  
Entry: `tools/ci_run.sh` (Jest ledger + pytest + `import_script.py --dry-run`).

**No staging API key. No Cloud `--run`.** Dry-run only. Human review is required before adding CI secrets for any future integration job.

## Run on the host

```bash
npm ci
python3 -m pip install pytest pynacl pillow piexif
bash tools/ci_run.sh
```

If `tools/demo/srm-import/` is not in the tree, import dry-run is skipped (ledger tests still must pass). After that pack is merged, dry-run is required and fails the job on CSV/EXIF/hash errors.

## Run in Docker (same shape as Actions)

Node 20 + Python 3.12 on Debian, bind-mount the repo:

```bash
docker run --rm -t \
  -v "$PWD":/workspace -w /workspace \
  node:20-bookworm \
  bash -lc '
    set -euo pipefail
    apt-get update -qq
    apt-get install -y -qq python3 python3-pip python3-venv
    python3 -m pip install --break-system-packages pytest pynacl pillow piexif
    npm ci
    bash tools/ci_run.sh
  '
```

Optional: [nektos/act](https://github.com/nektos/act) once Docker is available:

```bash
act pull_request -W .github/workflows/ledger-acceptance.yml
```
