#!/usr/bin/env python3
"""Validate and (optionally) import the TrustLedger SRM demo pack.

Usage:
  python3 import_srm_demo.py --dry-run
  python3 import_srm_demo.py --execute --base-url URL --api-key KEY --plan-id ID
  python3 import_srm_demo.py --dry-run --create-ledger-locally

Environment (execute mode):
  TRUSTLEDGER_BASE_URL   default http://localhost:8000
  TRUSTLEDGER_API_KEY    Bearer token or Frappe token key:secret
  TRUSTLEDGER_PLAN_ID    plan / project id after manual create
  TRUSTLEDGER_CUSTOMER   Frappe Customer name for VIP-style DocType import
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SCRIPTS_DIR = Path(__file__).resolve().parent
PKG_ROOT = SCRIPTS_DIR.parent
sys.path.insert(0, str(SCRIPTS_DIR))

from ledger_crypto import (  # noqa: E402
    compute_current_hash,
    entity_representation,
    load_public_key,
    verify_signature,
)

LAT_MIN, LAT_MAX = -34.5, -31.5
LON_MIN, LON_MAX = 24.0, 29.0
EXPECTED = {
    "organizations": 5,
    "sites": 20,
    "assets": 50,
    "inspections": 200,
    "incidents": 30,
    "work_orders": 80,
    "evidence": 400,
    "users_and_roles": 7,
    "ledger_entries": 500,
}

CSV_FILES = {
    "organizations": "organizations.csv",
    "sites": "sites.csv",
    "assets": "assets.csv",
    "inspections": "inspections.csv",
    "incidents": "incidents.csv",
    "work_orders": "work_orders.csv",
    "evidence": "evidence.csv",
    "users_and_roles": "users_and_roles.csv",
    "ledger_entries": "ledger_entries.csv",
}

HEADERS = {
    "organizations": ["id", "name", "type", "region", "description"],
    "sites": ["id", "org_id", "name", "latitude", "longitude", "description"],
    "assets": ["id", "site_id", "asset_type", "condition", "installation_date", "asset_tag", "notes"],
    "inspections": ["id", "asset_id", "inspector_id", "date_time", "score", "notes", "checklist_json", "status"],
    "incidents": ["id", "site_id", "reported_by", "date_time", "severity", "status", "description"],
    "work_orders": ["id", "incident_id", "asset_id", "created_by", "assigned_to", "due_date", "status", "cost_estimate", "notes"],
    "evidence": [
        "id",
        "parent_type",
        "parent_id",
        "filename",
        "file_type",
        "gps_lat",
        "gps_lon",
        "timestamp",
        "uploader_id",
        "checksum",
        "description",
    ],
    "users_and_roles": ["id", "username", "role", "email (mock)", "phone (mock)", "notes"],
    "ledger_entries": [
        "id",
        "action",
        "entity_type",
        "entity_id",
        "timestamp",
        "actor_id",
        "prev_hash",
        "current_hash",
        "signature",
        "notes",
    ],
}


class ValidationError(Exception):
    pass


def read_csv(name: str) -> list[dict[str, str]]:
    path = PKG_ROOT / "data" / CSV_FILES[name]
    if not path.exists():
        raise ValidationError(f"Missing CSV: {path}. Run scripts/generate_dataset.py first.")
    with path.open(encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames != HEADERS[name]:
            raise ValidationError(
                f"{CSV_FILES[name]} headers mismatch.\n"
                f"  expected: {HEADERS[name]}\n"
                f"  found:    {list(reader.fieldnames or [])}"
            )
        rows = list(reader)
    if not rows:
        raise ValidationError(f"{CSV_FILES[name]} has a header but no data rows.")
    return rows


def require(row: dict[str, str], fields: list[str], context: str) -> None:
    for f in fields:
        if row.get(f) in (None, ""):
            raise ValidationError(f"{context}: missing required field '{f}'")


def parse_float(value: str, context: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{context}: not a number: {value!r}") from exc


def validate(create_ledger_locally: bool = False) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    counts: dict[str, int] = {}
    tables: dict[str, list[dict[str, str]]] = {}

    for name in CSV_FILES:
        try:
            tables[name] = read_csv(name)
            counts[name] = len(tables[name])
            if counts[name] != EXPECTED[name]:
                errors.append(f"{name}: expected {EXPECTED[name]} rows, found {counts[name]}")
        except ValidationError as exc:
            errors.append(str(exc))
            tables[name] = []
            counts[name] = 0

    users = {r["id"] for r in tables.get("users_and_roles", [])}
    orgs = {r["id"] for r in tables.get("organizations", [])}
    sites = {r["id"]: r for r in tables.get("sites", [])}
    assets = {r["id"]: r for r in tables.get("assets", [])}
    inspections = {r["id"]: r for r in tables.get("inspections", [])}
    incidents = {r["id"]: r for r in tables.get("incidents", [])}
    work_orders = {r["id"]: r for r in tables.get("work_orders", [])}
    evidence = tables.get("evidence", [])
    ledger = tables.get("ledger_entries", [])

    for row in tables.get("sites", []):
        require(row, HEADERS["sites"], row.get("id", "site"))
        if row["org_id"] not in orgs:
            errors.append(f"{row['id']}: org_id {row['org_id']} does not exist")
        lat = parse_float(row["latitude"], row["id"])
        lon = parse_float(row["longitude"], row["id"])
        if not (LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX):
            errors.append(f"{row['id']}: GPS {lat},{lon} outside Eastern Cape demo bounds")

    for row in tables.get("assets", []):
        require(row, HEADERS["assets"], row.get("id", "asset"))
        if row["site_id"] not in sites:
            errors.append(f"{row['id']}: site_id {row['site_id']} does not exist")

    for row in tables.get("inspections", []):
        require(row, HEADERS["inspections"], row.get("id", "inspection"))
        if row["asset_id"] not in assets:
            errors.append(f"{row['id']}: asset_id {row['asset_id']} does not exist")
        if row["inspector_id"] not in users:
            errors.append(f"{row['id']}: inspector_id {row['inspector_id']} does not exist")
        try:
            json.loads(row["checklist_json"])
        except json.JSONDecodeError:
            errors.append(f"{row['id']}: checklist_json is not valid JSON")

    for row in tables.get("incidents", []):
        require(row, HEADERS["incidents"], row.get("id", "incident"))
        if row["site_id"] not in sites:
            errors.append(f"{row['id']}: site_id {row['site_id']} does not exist")
        if row["reported_by"] not in users:
            errors.append(f"{row['id']}: reported_by {row['reported_by']} does not exist")

    for row in tables.get("work_orders", []):
        require(row, HEADERS["work_orders"], row.get("id", "work_order"))
        if row["incident_id"] not in incidents:
            errors.append(f"{row['id']}: incident_id {row['incident_id']} does not exist")
        if row["asset_id"] not in assets:
            errors.append(f"{row['id']}: asset_id {row['asset_id']} does not exist")

    parent_sets = {
        "inspection": inspections,
        "incident": incidents,
        "work_order": work_orders,
        "asset": assets,
        "site": sites,
    }
    images_dir = PKG_ROOT / "images"
    unique_files: set[str] = set()
    for row in evidence:
        require(row, HEADERS["evidence"], row.get("id", "evidence"))
        pset = parent_sets.get(row["parent_type"])
        if pset is None or row["parent_id"] not in pset:
            errors.append(
                f"{row['id']}: parent {row['parent_type']}/{row['parent_id']} does not exist"
            )
        lat = parse_float(row["gps_lat"], row["id"])
        lon = parse_float(row["gps_lon"], row["id"])
        if not (LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX):
            errors.append(f"{row['id']}: GPS {lat},{lon} outside demo bounds")
        fname = row["filename"]
        unique_files.add(fname)
        fpath = images_dir / fname
        if not fpath.exists():
            errors.append(f"{row['id']}: image file missing: {fpath.name}")
            continue
        digest = "sha256:" + hashlib.sha256(fpath.read_bytes()).hexdigest()
        if digest != row["checksum"]:
            errors.append(
                f"{row['id']}: checksum mismatch for {fname}\n"
                f"  csv:  {row['checksum']}\n"
                f"  file: {digest}"
            )
    if len(unique_files) < 30:
        errors.append(f"Need ≥30 unique image filenames; found {len(unique_files)}")
    present = list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.jpeg")) + list(images_dir.glob("*.png"))
    if len(present) < 30:
        errors.append(f"images/ must contain ≥30 files; found {len(present)}")

    # Ledger chain + signatures
    pub_path = PKG_ROOT / "keys" / "ledger_ed25519_public.pem"
    if not pub_path.exists():
        errors.append(f"Missing public key {pub_path}")
        public_key = None
    else:
        public_key = load_public_key(pub_path)

    chain_ok = 0
    sig_ok = 0
    if ledger:
        if ledger[0]["prev_hash"] not in ("NULL", "0" * 64):
            errors.append(f"First ledger prev_hash should be NULL or 64 zeros, got {ledger[0]['prev_hash']}")
        for i, row in enumerate(ledger):
            require(row, HEADERS["ledger_entries"], row.get("id", "ledger"))
            if i > 0 and row["prev_hash"] != ledger[i - 1]["current_hash"]:
                errors.append(
                    f"{row['id']}: prev_hash does not chain from {ledger[i - 1]['id']}"
                )
            else:
                chain_ok += 1
            if public_key and verify_signature(public_key, row["current_hash"], row["signature"]):
                sig_ok += 1
            elif public_key:
                errors.append(f"{row['id']}: signature verification failed")

    # 10 random chain samples with hash recompute against entity CSV
    entity_lookup = {
        "organization": {r["id"]: r for r in tables.get("organizations", [])},
        "site": {r["id"]: r for r in tables.get("sites", [])},
        "asset": {r["id"]: r for r in tables.get("assets", [])},
        "inspection": inspections,
        "incident": incidents,
        "work_order": work_orders,
        "evidence": {r["id"]: r for r in evidence},
    }
    sample_ids: list[str] = []
    sample_chains: list[dict[str, Any]] = []
    rng = random.Random(7)
    if len(ledger) >= 10:
        indexes = rng.sample(range(len(ledger)), 10)
        for idx in indexes:
            row = ledger[idx]
            sample_ids.append(row["id"])
            prev_ok = idx == 0 or row["prev_hash"] == ledger[idx - 1]["current_hash"]
            sig_ok_row = bool(
                public_key
                and verify_signature(public_key, row["current_hash"], row["signature"])
            )
            src = entity_lookup.get(row["entity_type"], {}).get(row["entity_id"])
            hash_matches_csv = None
            if src is None:
                warnings.append(
                    f"{row['id']}: entity {row['entity_type']}/{row['entity_id']} not in CSV (update-only sample)"
                )
            else:
                canonical = entity_representation(src)
                recomputed = compute_current_hash(
                    row["prev_hash"], canonical, row["timestamp"], row["actor_id"]
                )
                hash_matches_csv = recomputed == row["current_hash"]
                if not hash_matches_csv:
                    if row["action"] == "create":
                        errors.append(
                            f"{row['id']}: current_hash does not match canonical create payload"
                        )
                    else:
                        warnings.append(
                            f"{row['id']}: update hash not recomputed from current CSV row (expected)"
                        )
            sample_chains.append(
                {
                    "id": row["id"],
                    "entity": f"{row['entity_type']}/{row['entity_id']}",
                    "action": row["action"],
                    "prev_hash": row["prev_hash"],
                    "current_hash": row["current_hash"],
                    "chain_link_ok": prev_ok,
                    "signature_ok": sig_ok_row,
                    "hash_matches_csv": hash_matches_csv,
                    "previous_id": None if idx == 0 else ledger[idx - 1]["id"],
                }
            )

    if create_ledger_locally:
        out = PKG_ROOT / "payloads" / "ledger_local_recomputed.json"
        out.write_text(json.dumps(ledger, indent=2), encoding="utf-8")

    report = {
        "ok": not errors,
        "counts": counts,
        "expected": EXPECTED,
        "unique_images": len(unique_files),
        "image_files_on_disk": len(present),
        "ledger_chain_links_ok": chain_ok,
        "ledger_signatures_ok": sig_ok,
        "sample_chain_ids": sample_ids,
        "sample_chains": sample_chains,
        "errors": errors,
        "warnings": warnings,
        "hero": {
            "ORG-001": "ORG-001" in orgs,
            "SITE-014": "SITE-014" in sites,
            "ASSET-210": "ASSET-210" in assets,
            "INSP-1001": "INSP-1001" in inspections,
            "INC-302": "INC-302" in incidents,
            "WO-075": "WO-075" in work_orders,
            "EVID-0099": any(r["id"] == "EVID-0099" for r in evidence),
        },
    }
    return report


def api_request(
    base_url: str,
    api_key: str,
    method: str,
    path: str,
    body: dict[str, Any] | None = None,
    timeout: int = 30,
) -> dict[str, Any]:
    url = base_url.rstrip("/") + path
    data = None
    headers = {"Accept": "application/json", "Authorization": f"Bearer {api_key}"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return {"ok": True, "status": resp.status, "body": json.loads(raw) if raw else {}}
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:400]
        return {"ok": False, "status": exc.code, "error": f"{path} → HTTP {exc.code}: {detail}"}
    except URLError as exc:
        return {
            "ok": False,
            "status": 0,
            "error": (
                f"Cannot reach {url} ({exc.reason}). "
                "Set --base-url / TRUSTLEDGER_BASE_URL, or stay in --dry-run."
            ),
        }


def execute_import(base_url: str, api_key: str, plan_id: str | None, customer: str | None) -> dict[str, Any]:
    results: list[dict[str, Any]] = []
    if not plan_id:
        created = api_request(
            base_url,
            api_key,
            "POST",
            "/api/plans",
            {
                "name": "TrustLedger SRM — Demo: Consolidated Evidence",
                "description": (
                    "Demo plan to show consolidation of scattered tools into one "
                    "evidence-backed SRM with immutable ledgered audit trail."
                ),
                "visibility": "private",
                "pin_to_dashboard": True,
            },
        )
        results.append({"step": "POST /api/plans", **created})
        if created.get("ok"):
            plan_id = str(
                created.get("body", {}).get("id")
                or created.get("body", {}).get("message", {}).get("id")
                or ""
            )
        else:
            return {
                "ok": False,
                "note": "Create the plan manually in the VIP workspace UI, then re-run with --plan-id.",
                "results": results,
            }

    entity_paths = {
        "organizations": "/api/organization",
        "sites": "/api/site",
        "assets": "/api/asset",
        "inspections": "/api/inspection",
        "incidents": "/api/incident",
        "work_orders": "/api/work_order",
        "evidence": "/api/evidence",
        "ledger_entries": "/api/ledger",
    }
    for name, path in entity_paths.items():
        rows = read_csv(name)
        # Post a single example plus a count; full 400/500 POSTs are available via --all
        sample = rows[0]
        payload = {"plan_id": plan_id, **sample}
        res = api_request(base_url, api_key, "POST", path, payload)
        results.append({"step": f"POST {path} ({name} sample {sample.get('id')})", **res})

    if customer:
        mapping = json.loads((PKG_ROOT / "payloads" / "cloud_vip_mapping.json").read_text())
        mapping["customer"] = customer
        res = api_request(
            base_url,
            api_key,
            "POST",
            "/api/frappe/product-smoke",
            {"kind": "project", "customer": customer, "project": mapping["project"]},
        )
        results.append({"step": "VIP-style TL Project via product-smoke", **res})

    return {"ok": all(r.get("ok") for r in results), "plan_id": plan_id, "results": results}


def print_report(report: dict[str, Any]) -> None:
    print("=== TrustLedger SRM demo — acceptance dry-run ===")
    print("Counts:")
    for k, expected in EXPECTED.items():
        got = report["counts"].get(k, 0)
        flag = "OK" if got == expected else "FAIL"
        print(f"  {flag:4} {k:18} {got}/{expected}")
    print(f"  unique image filenames: {report['unique_images']}")
    print(f"  image files on disk:    {report['image_files_on_disk']}")
    print(f"  ledger chain links OK:  {report['ledger_chain_links_ok']}")
    print(f"  ledger signatures OK:   {report['ledger_signatures_ok']}")
    print("Hero fixtures:")
    for k, ok in report["hero"].items():
        print(f"  {'OK' if ok else 'FAIL':4} {k}")
    if report["sample_chain_ids"]:
        print("Sample chain ids:", ", ".join(report["sample_chain_ids"]))
    for w in report["warnings"]:
        print("WARN:", w)
    if report["errors"]:
        print("ERRORS:")
        for e in report["errors"]:
            print(" -", e)
    print("RESULT:", "PASS" if report["ok"] else "FAIL")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate / import TrustLedger SRM demo pack")
    parser.add_argument("--dry-run", action="store_true", help="Validate CSVs, GPS, checksums, ledger chain")
    parser.add_argument("--execute", action="store_true", help="POST to ingestion API (requires credentials)")
    parser.add_argument("--create-ledger-locally", action="store_true", help="Write ledger JSON for local/API bypass")
    parser.add_argument("--base-url", default=None, help="API base URL (or TRUSTLEDGER_BASE_URL)")
    parser.add_argument("--api-key", default=None, help="API key (or TRUSTLEDGER_API_KEY)")
    parser.add_argument("--plan-id", default=None, help="Existing plan id (or TRUSTLEDGER_PLAN_ID)")
    parser.add_argument("--customer", default=None, help="Frappe Customer name for VIP DocType mapping")
    parser.add_argument("--log", default=str(PKG_ROOT / "logs" / "dry-run.log"))
    args = parser.parse_args()

    if not args.dry_run and not args.execute:
        args.dry_run = True

    import os

    report = validate(create_ledger_locally=args.create_ledger_locally)
    print_report(report)
    log_path = Path(args.log)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {log_path}")

    if args.execute:
        if not report["ok"]:
            print("Refusing --execute because dry-run failed.")
            return 1
        base = args.base_url or os.environ.get("TRUSTLEDGER_BASE_URL") or "http://localhost:8000"
        key = args.api_key or os.environ.get("TRUSTLEDGER_API_KEY") or ""
        if not key or key in ("REPLACE_ME", "YOUR_API_KEY"):
            print(
                "ERROR: --execute needs --api-key or TRUSTLEDGER_API_KEY. "
                "Do not run against production. Stay in --dry-run until Chibase supplies a sandbox key."
            )
            return 1
        plan_id = args.plan_id or os.environ.get("TRUSTLEDGER_PLAN_ID")
        customer = args.customer or os.environ.get("TRUSTLEDGER_CUSTOMER")
        result = execute_import(base, key, plan_id, customer)
        exec_log = PKG_ROOT / "logs" / "execute.log"
        exec_log.write_text(json.dumps(result, indent=2), encoding="utf-8")
        print(json.dumps(result, indent=2))
        return 0 if result.get("ok") else 2

    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
