#!/usr/bin/env python3
"""TrustLedger SRM demo import.

  python3 import_script.py --dry-run
  python3 import_script.py --run --i-approve-staging --base-url "$BASE_URL" --api-key "$API_KEY"
  python3 import_script.py --run --create-ledger --i-approve-staging --base-url "$BASE_URL" --api-key "$API_KEY"

Does not default to production. Refuses app.trustledger.co.za unless
TRUSTLEDGER_ALLOW_PROD_IMPORT=YES is set by a human.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

from ledger_util import compute_hash, keypair_from_test_seed, verify_signature

try:
    import piexif
except ImportError:  # pragma: no cover
    piexif = None  # type: ignore

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None  # type: ignore

ROOT = Path(__file__).resolve().parent
CSV_DIR = ROOT / "csv"
IMG_DIR = ROOT / "images"
KEY_DIR = ROOT / "TEST-KEYPAIR-DO-NOT-USE-IN-PROD"

EXPECTED = {
    "organizations.csv": 5,
    "sites.csv": 20,
    "assets.csv": 50,
    "inspections.csv": 200,
    "incidents.csv": 30,
    "work_orders.csv": 80,
    "evidence.csv": 400,
    "users_and_roles.csv": 20,
    "ledger_entries.csv": 500,
}

ZA_LAT = (-35.0, -22.0)
ZA_LON = (16.0, 33.0)
PROD_HOSTS = ("app.trustledger.co.za",)

METHODS = {
    "organizations": "/api/method/srm_core.api.organizations.create_organization",
    "sites": "/api/method/srm_core.api.sites.create_site",
    "assets": "/api/method/srm_core.api.assets.create_asset",
    "inspections": "/api/method/srm_core.api.inspections.create_inspection",
    "incidents": "/api/method/srm_core.api.incidents.create_incident",
    "work_orders": "/api/method/srm_core.api.work_orders.create_work_order",
    "users": "/api/method/srm_core.api.users.create_user",
    "evidence": "/api/method/srm_core.api.evidence.upload_evidence",
    "ledger": "/api/method/srm_core.api.ledger.create_entry",
}


def read_csv(name: str) -> list[dict[str, str]]:
    path = CSV_DIR / name
    with path.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def parse_float(value: str) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def dms_to_deg(dms: Any) -> float:
    deg, minutes, seconds = dms
    def r(pair: Any) -> float:
        return pair[0] / pair[1]
    return r(deg) + r(minutes) / 60 + r(seconds) / 3600


def read_exif_gps_time(path: Path) -> tuple[float | None, float | None, str | None]:
    if piexif is None:
        return None, None, None
    try:
        exif = piexif.load(str(path))
    except Exception:
        return None, None, None
    gps = exif.get("GPS") or {}
    lat = lon = None
    if piexif.GPSIFD.GPSLatitude in gps and piexif.GPSIFD.GPSLatitudeRef in gps:
        lat = dms_to_deg(gps[piexif.GPSIFD.GPSLatitude])
        ref = gps[piexif.GPSIFD.GPSLatitudeRef]
        if isinstance(ref, bytes):
            ref = ref.decode("ascii")
        if str(ref).upper().startswith("S"):
            lat = -lat
    if piexif.GPSIFD.GPSLongitude in gps and piexif.GPSIFD.GPSLongitudeRef in gps:
        lon = dms_to_deg(gps[piexif.GPSIFD.GPSLongitude])
        ref = gps[piexif.GPSIFD.GPSLongitudeRef]
        if isinstance(ref, bytes):
            ref = ref.decode("ascii")
        if str(ref).upper().startswith("W"):
            lon = -lon
    ts = None
    exif_ifd = exif.get("Exif") or {}
    raw = exif_ifd.get(piexif.ExifIFD.DateTimeOriginal)
    if raw:
        text = raw.decode("ascii") if isinstance(raw, bytes) else str(raw)
        try:
            dt = datetime.strptime(text, "%Y:%m:%d %H:%M:%S")
            ts = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            ts = text
    return lat, lon, ts


def dry_run() -> tuple[bool, str]:
    lines: list[str] = ["TrustLedger SRM demo import — acceptance log", "mode: dry-run", ""]
    missing_refs: list[str] = []
    ok = True

    tables: dict[str, list[dict[str, str]]] = {}
    for name, expected in EXPECTED.items():
        rows = read_csv(name)
        tables[name] = rows
        count = len(rows)
        mark = "OK" if count == expected else "FAIL"
        if count != expected:
            ok = False
        lines.append(f"count {name}: {count} (expected {expected}) [{mark}]")

    orgs = {r["org_id"] for r in tables["organizations.csv"]}
    sites = {r["site_id"]: r for r in tables["sites.csv"]}
    assets = {r["asset_id"]: r for r in tables["assets.csv"]}
    inspections = {r["inspection_id"]: r for r in tables["inspections.csv"]}
    incidents = {r["incident_id"]: r for r in tables["incidents.csv"]}
    users = {r["user_id"]: r for r in tables["users_and_roles.csv"]}

    def need(label: str, value: str, pool: set[str] | dict[str, Any]) -> None:
        nonlocal ok
        if value and value not in pool:
            missing_refs.append(f"{label}={value}")
            ok = False

    for row in tables["sites.csv"]:
        need("sites.org_id", row["org_id"], orgs)
    for row in tables["assets.csv"]:
        need("assets.site_id", row["site_id"], sites)
        need("assets.org_id", row["org_id"], orgs)
    for row in tables["users_and_roles.csv"]:
        need("users.org_id", row["org_id"], orgs)
    for row in tables["inspections.csv"]:
        need("inspections.site_id", row["site_id"], sites)
        need("inspections.asset_id", row["asset_id"], assets)
        need("inspections.inspector_id", row["inspector_id"], users)
    for row in tables["incidents.csv"]:
        need("incidents.site_id", row["site_id"], sites)
        need("incidents.org_id", row["org_id"], orgs)
        need("incidents.reported_by", row["reported_by"], users)
    for row in tables["work_orders.csv"]:
        need("work_orders.org_id", row["org_id"], orgs)
        need("work_orders.site_id", row["site_id"], sites)
        if row.get("asset_id"):
            need("work_orders.asset_id", row["asset_id"], assets)
        if row.get("incident_id"):
            need("work_orders.incident_id", row["incident_id"], incidents)
        if row.get("inspection_id"):
            need("work_orders.inspection_id", row["inspection_id"], inspections)
        need("work_orders.assigned_to", row["assigned_to"], users)

    gps_fail = 0
    for label, rows, lat_k, lon_k in (
        ("sites", tables["sites.csv"], "gps_lat", "gps_lon"),
        ("evidence", tables["evidence.csv"], "gps_lat", "gps_lon"),
    ):
        for row in rows:
            lat = parse_float(row[lat_k])
            lon = parse_float(row[lon_k])
            if lat is None or lon is None or not (ZA_LAT[0] <= lat <= ZA_LAT[1]) or not (ZA_LON[0] <= lon <= ZA_LON[1]):
                gps_fail += 1
                ok = False
                missing_refs.append(f"gps_out_of_bounds {label} {row.get('site_id') or row.get('evidence_id')}")
    lines.append(f"gps_bounds_failures: {gps_fail}")

    checksum_missing = 0
    image_ok = 0
    exif_mismatch = 0
    for row in tables["evidence.csv"]:
        if not row.get("checksum") or len(row["checksum"]) != 64:
            checksum_missing += 1
            ok = False
        parent_pool = inspections if row["parent_type"] == "inspection" else incidents
        need(f"evidence.parent_id[{row['parent_type']}]", row["parent_id"], parent_pool)
        need("evidence.uploader_id", row["uploader_id"], users)
        path = IMG_DIR / row["filename"]
        if row.get("has_local_image") == "Y":
            if not path.is_file():
                missing_refs.append(f"missing_image {row['filename']}")
                ok = False
                continue
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            if digest != row["checksum"]:
                missing_refs.append(f"checksum_mismatch {row['evidence_id']}")
                ok = False
            else:
                image_ok += 1
            lat, lon, ts = read_exif_gps_time(path)
            csv_lat = parse_float(row["gps_lat"])
            csv_lon = parse_float(row["gps_lon"])
            if lat is None or lon is None or csv_lat is None or csv_lon is None:
                exif_mismatch += 1
                ok = False
            elif abs(lat - csv_lat) > 1e-3 or abs(lon - csv_lon) > 1e-3:
                exif_mismatch += 1
                ok = False
            elif ts and ts[:16] != row["timestamp"][:16]:
                exif_mismatch += 1
                ok = False
    lines.append(f"evidence_checksum_missing: {checksum_missing}")
    lines.append(f"evidence_local_images_verified: {image_ok} (need >= 30)")
    if image_ok < 30:
        ok = False
    lines.append(f"exif_gps_time_mismatches: {exif_mismatch}")

    _, pk = keypair_from_test_seed()
    hash_fail = 0
    sig_fail = 0
    entity_ids = {
        "evidence": {r["evidence_id"] for r in tables["evidence.csv"]},
        "incident": {r["incident_id"] for r in tables["incidents.csv"]},
        "inspection": {r["inspection_id"] for r in tables["inspections.csv"]},
        "asset": {r["asset_id"] for r in tables["assets.csv"]},
        "work_order": {r["work_order_id"] for r in tables["work_orders.csv"]},
    }
    for row in tables["ledger_entries.csv"]:
        canonical = json.loads(row["canonical_entity_json"])
        recomputed = compute_hash(row["prev_hash"], canonical, row["timestamp"], row["actor_id"])
        if recomputed != row["current_hash"]:
            hash_fail += 1
            ok = False
        if not verify_signature(pk, row["signature"], row["current_hash"]):
            sig_fail += 1
            ok = False
        pool = entity_ids.get(row["entity_type"], set())
        need(f"ledger.entity_id[{row['entity_type']}]", row["entity_id"], pool)
        need("ledger.actor_id", row["actor_id"], users)
    lines.append(f"ledger_hash_mismatches: {hash_fail}")
    lines.append(f"ledger_signature_mismatches: {sig_fail}")

    lines.append("")
    if missing_refs:
        lines.append("missing_or_invalid_references:")
        for item in missing_refs[:200]:
            lines.append(f"  - {item}")
        if len(missing_refs) > 200:
            lines.append(f"  … {len(missing_refs) - 200} more")
    else:
        lines.append("missing_or_invalid_references: none")

    lines.append("")
    lines.append(f"referential_integrity: {'PASS' if not missing_refs else 'FAIL'}")
    lines.append(f"overall: {'PASS' if ok else 'FAIL'}")
    report = "\n".join(lines) + "\n"
    return ok, report


def refuse_production(base_url: str) -> None:
    host = base_url.lower().replace("https://", "").replace("http://", "").split("/")[0]
    if any(prod in host for prod in PROD_HOSTS):
        if os.environ.get("TRUSTLEDGER_ALLOW_PROD_IMPORT") != "YES":
            raise SystemExit(
                "Refusing production import against app.trustledger.co.za. "
                "A human must set TRUSTLEDGER_ALLOW_PROD_IMPORT=YES and provide a scoped key."
            )


def frappe_post(base: str, path: str, api_key: str, payload: dict[str, Any] | None = None, files: Any = None, data: Any = None) -> dict[str, Any]:
    if requests is None:
        raise SystemExit("pip install requests")
    url = base.rstrip("/") + path
    headers = {"Authorization": f"token {api_key}", "Accept": "application/json"}
    if files is None:
        headers["Content-Type"] = "application/json"
        resp = requests.post(url, headers=headers, json=payload or {}, timeout=60)
    else:
        resp = requests.post(url, headers=headers, data=data, files=files, timeout=120)
    try:
        body = resp.json()
    except Exception:
        body = {"raw": resp.text[:500]}
    return {"status": resp.status_code, "ok": resp.ok, "body": body}


def run_import(base: str, api_key: str, create_ledger: bool, include_users: bool) -> str:
    refuse_production(base)
    logs: list[str] = ["TrustLedger SRM demo import — run log", f"base_url: {base}", ""]
    summary: dict[str, int] = defaultdict(int)

    def post_rows(kind: str, filename: str) -> None:
        rows = read_csv(filename)
        for row in rows:
            result = frappe_post(base, METHODS[kind], api_key, payload=row)
            key = "ok" if result["ok"] else "fail"
            summary[f"{kind}_{key}"] += 1
            if not result["ok"]:
                logs.append(f"FAIL {kind} {list(row.values())[0]} {result['status']} {result['body']}")

    post_rows("organizations", "organizations.csv")
    if include_users:
        post_rows("users", "users_and_roles.csv")
    else:
        logs.append("skip users (pass --include-users to POST Frappe User records)")
    post_rows("sites", "sites.csv")
    post_rows("assets", "assets.csv")
    post_rows("inspections", "inspections.csv")
    post_rows("incidents", "incidents.csv")
    post_rows("work_orders", "work_orders.csv")

    for row in read_csv("evidence.csv"):
        data = {
            "evidence_id": row["evidence_id"],
            "org_id": row["org_id"],
            "parent_type": row["parent_type"],
            "parent_id": row["parent_id"],
            "gps_lat": row["gps_lat"],
            "gps_lon": row["gps_lon"],
            "timestamp": row["timestamp"],
            "checksum": row["checksum"],
            "uploader_id": row["uploader_id"],
            "classification": row["classification"],
        }
        files = None
        path = IMG_DIR / row["filename"]
        if row.get("has_local_image") == "Y" and path.is_file():
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            if digest != row["checksum"]:
                summary["evidence_checksum_fail"] += 1
                logs.append(f"FAIL checksum {row['evidence_id']}")
                continue
            files = {"file": (row["filename"], path.read_bytes(), "image/jpeg")}
        result = frappe_post(base, METHODS["evidence"], api_key, files=files, data=data)
        summary["evidence_ok" if result["ok"] else "evidence_fail"] += 1
        if not result["ok"]:
            logs.append(f"FAIL evidence {row['evidence_id']} {result['status']}")

    if create_ledger:
        logs.append("create-ledger: posting signed TEST-ONLY entries")
        for row in read_csv("ledger_entries.csv"):
            payload = {
                "entity_type": row["entity_type"],
                "entity_id": row["entity_id"],
                "action": row["action"],
                "timestamp": row["timestamp"],
                "actor_id": row["actor_id"],
                "canonical_entity": json.loads(row["canonical_entity_json"]),
                "prev_hash": row["prev_hash"] or None,
                "signature": row["signature"],
                "kid": row["kid"],
            }
            result = frappe_post(base, METHODS["ledger"], api_key, payload=payload)
            summary["ledger_ok" if result["ok"] else "ledger_fail"] += 1
            ledger_id = ""
            body = result["body"]
            if isinstance(body, dict):
                message = body.get("message")
                if isinstance(message, dict):
                    ledger_id = str(message.get("ledger_id") or "")
            logs.append(
                f"ledger {row['ledger_id']} -> http {result['status']} cloud_id={ledger_id or 'n/a'}"
            )
    else:
        logs.append("create-ledger: skipped (pass --create-ledger)")

    logs.append("")
    logs.append("summary:")
    for key in sorted(summary):
        logs.append(f"  {key}: {summary[key]}")
    return "\n".join(logs) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="TrustLedger SRM demo import")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--run", action="store_true")
    parser.add_argument("--create-ledger", action="store_true")
    parser.add_argument("--include-users", action="store_true")
    parser.add_argument("--base-url", default=os.environ.get("BASE_URL", ""))
    parser.add_argument("--api-key", default=os.environ.get("API_KEY", ""))
    parser.add_argument("--i-approve-staging", action="store_true")
    args = parser.parse_args()

    if not args.dry_run and not args.run:
        parser.print_help()
        print("\nHint: start with python3 import_script.py --dry-run")
        return 2

    if args.dry_run:
        ok, report = dry_run()
        log_path = ROOT / "acceptance_log.txt"
        log_path.write_text(report, encoding="utf-8")
        print(report)
        print(f"Wrote {log_path}")
        if not ok:
            return 1
        if not args.run:
            return 0

    if args.run:
        if not args.i_approve_staging:
            print("Refusing --run without --i-approve-staging (human approval).")
            return 2
        if not args.base_url or not args.api_key:
            print("BASE_URL and API_KEY required for --run (env or flags). Do not commit keys.")
            return 2
        if args.api_key in {"API_KEY", "changeme", "placeholder"}:
            print("Placeholder API_KEY refused.")
            return 2
        print(run_import(args.base_url, args.api_key, args.create_ledger, args.include_users))
    return 0


if __name__ == "__main__":
    sys.exit(main())
