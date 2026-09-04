#!/usr/bin/env python3
"""Build TrustLedger SRM demo CSVs, EXIF images, TEST keypair, and zip.

Does not call Cloud. Run from repo or from this folder:

    python3 build_package.py
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import random
import sys
import urllib.request
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import piexif
from PIL import Image, ImageDraw, ImageFilter

from ledger_util import (
    compute_hash,
    keypair_from_test_seed,
    sign_hash_ed25519,
)

ROOT = Path(__file__).resolve().parent
REPO_DEMO = ROOT.parent
ZIP_NAME = "trustledger-srm-demo.zip"

COUNTS = {
    "organizations": 5,
    "sites": 20,
    "assets": 50,
    "inspections": 200,
    "incidents": 30,
    "work_orders": 80,
    "evidence": 400,
    "users": 20,
    "ledger": 500,
    "images": 30,
}

ORG_ROWS = [
    ("ORG-0001", "Sundays River Valley Local Municipality", "client", "Eastern Cape", "Sundays River Valley", "srm.org0001@example.test"),
    ("ORG-0002", "NCGR-B Corridor Contractor JV", "contractor", "Eastern Cape", "Sundays River Valley", "srm.org0002@example.test"),
    ("ORG-0003", "Sundays Community Trust", "community", "Eastern Cape", "Sundays River Valley", "srm.org0003@example.test"),
    ("ORG-0004", "Sarah Baartman District Municipality", "client", "Eastern Cape", "Sarah Baartman", "srm.org0004@example.test"),
    ("ORG-0005", "Independent Social Monitor NPC", "monitor", "Eastern Cape", "Nelson Mandela Bay", "srm.org0005@example.test"),
]

ROLES = ["community", "contractor", "client", "admin"]
ASSET_TYPES = ["culvert", "guard_rail", "borehole", "access_road", "fence", "transformer"]
INCIDENT_STATUSES = ["Open", "Investigating", "Escalated", "Closed"]
PRIORITIES = ["P4-Low", "P3-Medium", "P2-High", "P1-Critical"]
WO_STATUSES = ["open", "assigned", "in_progress", "closed"]


def pad(prefix: str, n: int, width: int = 4) -> str:
    return f"{prefix}-{n:0{width}d}"


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def deg_to_dms(value: float) -> tuple[tuple[int, int], tuple[int, int], tuple[int, int]]:
    value = abs(value)
    deg = int(value)
    minutes_f = (value - deg) * 60
    minutes = int(minutes_f)
    seconds = round((minutes_f - minutes) * 60 * 10000)
    return (deg, 1), (minutes, 1), (seconds, 10000)


def inject_exif(path: Path, lat: float, lon: float, timestamp_iso: str) -> None:
    dt = datetime.fromisoformat(timestamp_iso.replace("Z", "+00:00"))
    dt_str = dt.strftime("%Y:%m:%d %H:%M:%S")
    gps = {
        piexif.GPSIFD.GPSLatitudeRef: b"S" if lat < 0 else b"N",
        piexif.GPSIFD.GPSLatitude: deg_to_dms(lat),
        piexif.GPSIFD.GPSLongitudeRef: b"W" if lon < 0 else b"E",
        piexif.GPSIFD.GPSLongitude: deg_to_dms(lon),
        piexif.GPSIFD.GPSDateStamp: dt.strftime("%Y:%m:%d").encode("ascii"),
        piexif.GPSIFD.GPSTimeStamp: ((dt.hour, 1), (dt.minute, 1), (dt.second, 1)),
    }
    exif_ifd = {
        piexif.ExifIFD.DateTimeOriginal: dt_str.encode("ascii"),
        piexif.ExifIFD.DateTimeDigitized: dt_str.encode("ascii"),
    }
    zeroth = {
        piexif.ImageIFD.DateTime: dt_str.encode("ascii"),
        piexif.ImageIFD.Software: b"TrustLedger demo pack TEST-ONLY",
        piexif.ImageIFD.Artist: b"Royalty-free placeholder (Picsum/Unsplash or generated)",
        piexif.ImageIFD.ImageDescription: b"Illustrative SRM field still - not a customer record",
    }
    piexif.insert(piexif.dump({"0th": zeroth, "Exif": exif_ifd, "GPS": gps}), str(path))


def generated_still(seed: int, label: str) -> bytes:
    rng = random.Random(seed)
    img = Image.new("RGB", (640, 480), (18 + rng.randint(0, 40), 80 + rng.randint(0, 50), 70 + rng.randint(0, 40)))
    draw = ImageDraw.Draw(img)
    for _ in range(40):
        x, y = rng.randint(0, 640), rng.randint(0, 480)
        r = rng.randint(8, 80)
        colour = (rng.randint(40, 180), rng.randint(70, 160), rng.randint(40, 120))
        draw.ellipse((x - r, y - r, x + r, y + r), fill=colour)
    img = img.filter(ImageFilter.GaussianBlur(radius=1.2))
    draw = ImageDraw.Draw(img)
    draw.rectangle((16, 420, 624, 464), fill=(18, 32, 42))
    draw.text((24, 430), label[:70], fill=(243, 245, 247))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=72)
    return buf.getvalue()


def fetch_royalty_free_jpeg(index: int) -> bytes:
    url = f"https://picsum.photos/seed/trustledger-srm-{index:02d}/640/480.jpg"
    req = urllib.request.Request(url, headers={"User-Agent": "TrustLedgerDemoPack/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = resp.read()
        if data[:2] == b"\xff\xd8" and len(data) > 2000:
            return data
    except Exception:
        pass
    return generated_still(1000 + index, f"generated still {index:02d} — royalty-free original")


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def build() -> None:
    rng = random.Random(20260801)
    csv_dir = ROOT / "csv"
    img_dir = ROOT / "images"
    key_dir = ROOT / "TEST-KEYPAIR-DO-NOT-USE-IN-PROD"
    csv_dir.mkdir(exist_ok=True)
    img_dir.mkdir(exist_ok=True)
    key_dir.mkdir(exist_ok=True)

    sk, pk = keypair_from_test_seed()
    (key_dir / "README.md").write_text(
        "# TEST-KEYPAIR-DO-NOT-USE-IN-PROD\n\n"
        "Ephemeral **demo** ed25519 keypair for `--create-ledger` signing only.\n\n"
        "- Derived from SHA-256(`TrustLedger TEST-KEYPAIR-DO-NOT-USE-IN-PROD v1`).\n"
        "- **Never** load this key on TrustLedger Cloud, KMS, or a customer workspace.\n"
        "- Private key file is labelled TEST-ONLY on purpose.\n",
        encoding="utf-8",
    )
    import base64

    (key_dir / "ed25519_public_key.b64").write_text(
        base64.b64encode(pk).decode("ascii") + "\n", encoding="utf-8"
    )
    (key_dir / "ed25519_private_key.TEST-ONLY.b64").write_text(
        "TEST-KEYPAIR-DO-NOT-USE-IN-PROD\n" + base64.b64encode(sk).decode("ascii") + "\n",
        encoding="utf-8",
    )

    orgs = [
        {
            "org_id": r[0],
            "name": r[1],
            "org_type": r[2],
            "province": r[3],
            "municipality": r[4],
            "contact_email": r[5],
            "status": "active",
        }
        for r in ORG_ROWS
    ]
    write_csv(
        csv_dir / "organizations.csv",
        orgs,
        ["org_id", "name", "org_type", "province", "municipality", "contact_email", "status"],
    )

    users: list[dict[str, str]] = []
    first_names = ["Anele", "Sipho", "Lindiwe", "Johan", "Thandi", "Pieter", "Naledi", "Chris", "Zanele", "Marco"]
    last_names = ["Dlamini", "Botha", "Ndlovu", "van Wyk", "Mokoena", "Naidoo", "Khumalo", "Petersen"]
    for i in range(1, COUNTS["users"] + 1):
        org = orgs[(i - 1) % len(orgs)]
        users.append(
            {
                "user_id": pad("USER", i),
                "org_id": org["org_id"],
                "full_name": f"{first_names[(i - 1) % len(first_names)]} {last_names[(i - 1) % len(last_names)]}",
                "email": f"user{i:04d}@example.test",
                "role": ROLES[(i - 1) % len(ROLES)],
                "desk_tier": str(1 + (i % 5)),
                "status": "active",
            }
        )
    write_csv(
        csv_dir / "users_and_roles.csv",
        users,
        ["user_id", "org_id", "full_name", "email", "role", "desk_tier", "status"],
    )

    sites: list[dict[str, str]] = []
    for i in range(1, COUNTS["sites"] + 1):
        org = orgs[(i - 1) % len(orgs)]
        lat = round(-33.4000 + ((i - 1) % 10) * 0.0123, 4)
        lon = round(25.4400 + ((i - 1) // 2) * 0.0111, 4)
        sites.append(
            {
                "site_id": pad("SITE", i),
                "org_id": org["org_id"],
                "name": f"Corridor access km {10 + i}.{i % 10}",
                "project_code": "NCGR-B",
                "ward": f"Ward {(i % 12) + 1}",
                "municipality": org["municipality"],
                "gps_lat": f"{lat:.4f}",
                "gps_lon": f"{lon:.4f}",
                "status": "active",
            }
        )
    write_csv(
        csv_dir / "sites.csv",
        sites,
        ["site_id", "org_id", "name", "project_code", "ward", "municipality", "gps_lat", "gps_lon", "status"],
    )

    assets: list[dict[str, str]] = []
    for i in range(1, COUNTS["assets"] + 1):
        site = sites[(i - 1) % len(sites)]
        assets.append(
            {
                "asset_id": pad("ASSET", i),
                "site_id": site["site_id"],
                "org_id": site["org_id"],
                "name": f"{ASSET_TYPES[(i - 1) % len(ASSET_TYPES)]} {i:03d}",
                "asset_type": ASSET_TYPES[(i - 1) % len(ASSET_TYPES)],
                "status": "in_service",
                "installed_at": f"2024-{(i % 12) + 1:02d}-15",
            }
        )
    write_csv(
        csv_dir / "assets.csv",
        assets,
        ["asset_id", "site_id", "org_id", "name", "asset_type", "status", "installed_at"],
    )

    inspections: list[dict[str, str]] = []
    start = datetime(2026, 6, 1, 8, 0, tzinfo=timezone.utc)
    for i in range(1, COUNTS["inspections"] + 1):
        asset = assets[(i - 1) % len(assets)]
        inspector = users[(i - 1) % len(users)]
        when = start + timedelta(hours=i * 3)
        inspections.append(
            {
                "inspection_id": pad("INSP", i),
                "site_id": asset["site_id"],
                "asset_id": asset["asset_id"],
                "org_id": asset["org_id"],
                "inspector_id": inspector["user_id"],
                "date_time": iso(when),
                "score": str(60 + (i % 40)),
                "status": "Completed" if i % 7 else "Open",
                "notes": "Guard rail and culvert walkabout" if i % 2 else "Dust and livestock access check",
            }
        )
    write_csv(
        csv_dir / "inspections.csv",
        inspections,
        [
            "inspection_id",
            "site_id",
            "asset_id",
            "org_id",
            "inspector_id",
            "date_time",
            "score",
            "status",
            "notes",
        ],
    )

    incidents: list[dict[str, str]] = []
    titles = [
        "Access road dust affecting livestock",
        "Employment list dispute at km marker",
        "Noise after 18:00 near homestead",
        "Standing water at culvert inlet",
        "Fence cut on community grazing land",
    ]
    for i in range(1, COUNTS["incidents"] + 1):
        site = sites[(i - 1) % len(sites)]
        reporter = users[(i - 1) % len(users)]
        when = datetime(2026, 7, 1, 9, 0, tzinfo=timezone.utc) + timedelta(days=i)
        incidents.append(
            {
                "incident_id": pad("INC", i),
                "org_id": site["org_id"],
                "site_id": site["site_id"],
                "title": titles[(i - 1) % len(titles)],
                "description": "Illustrative grievance for the SRM demo pack. Not a live matter.",
                "status": INCIDENT_STATUSES[(i - 1) % len(INCIDENT_STATUSES)],
                "priority": PRIORITIES[(i - 1) % len(PRIORITIES)],
                "reported_by": reporter["user_id"],
                "reported_at": iso(when),
                "ward": site["ward"],
                "category": "grievance",
            }
        )
    write_csv(
        csv_dir / "incidents.csv",
        incidents,
        [
            "incident_id",
            "org_id",
            "site_id",
            "title",
            "description",
            "status",
            "priority",
            "reported_by",
            "reported_at",
            "ward",
            "category",
        ],
    )

    work_orders: list[dict[str, str]] = []
    for i in range(1, COUNTS["work_orders"] + 1):
        site = sites[(i - 1) % len(sites)]
        asset = assets[(i - 1) % len(assets)]
        incident = incidents[(i - 1) % len(incidents)] if i % 3 else None
        inspection = inspections[(i - 1) % len(inspections)] if i % 2 else None
        assignee = users[(i - 1) % len(users)]
        due = datetime(2026, 9, 15, tzinfo=timezone.utc) + timedelta(days=i)
        work_orders.append(
            {
                "work_order_id": pad("WO", i),
                "org_id": site["org_id"],
                "site_id": site["site_id"],
                "asset_id": asset["asset_id"],
                "incident_id": incident["incident_id"] if incident else "",
                "inspection_id": inspection["inspection_id"] if inspection else "",
                "title": f"Remediate {asset['asset_type']} at {site['name']}",
                "status": WO_STATUSES[(i - 1) % len(WO_STATUSES)],
                "assigned_to": assignee["user_id"],
                "due_date": due.date().isoformat(),
            }
        )
    write_csv(
        csv_dir / "work_orders.csv",
        work_orders,
        [
            "work_order_id",
            "org_id",
            "site_id",
            "asset_id",
            "incident_id",
            "inspection_id",
            "title",
            "status",
            "assigned_to",
            "due_date",
        ],
    )

    evidence: list[dict[str, str]] = []
    image_names: list[str] = []
    sources: list[str] = []
    for i in range(1, COUNTS["images"] + 1):
        name = f"field_{i:02d}.jpg"
        image_names.append(name)
        path = img_dir / name
        raw = fetch_royalty_free_jpeg(i)
        path.write_bytes(raw)
        insp = inspections[i - 1]
        site = next(s for s in sites if s["site_id"] == insp["site_id"])
        lat = float(site["gps_lat"])
        lon = float(site["gps_lon"])
        ts = insp["date_time"]
        inject_exif(path, lat, lon, ts)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        uploader = insp["inspector_id"]
        evidence.append(
            {
                "evidence_id": pad("EVID", i),
                "org_id": insp["org_id"],
                "parent_type": "inspection",
                "parent_id": insp["inspection_id"],
                "filename": name,
                "checksum": digest,
                "gps_lat": f"{lat:.4f}",
                "gps_lon": f"{lon:.4f}",
                "timestamp": ts,
                "uploader_id": uploader,
                "classification": "photo",
                "has_local_image": "Y",
            }
        )
        sources.append(f"{name}: Lorem Picsum seed trustledger-srm-{i:02d} (Unsplash / royalty-free) or generated still; EXIF GPS/time injected for demo.")

    (img_dir / "SOURCES.txt").write_text(
        "Royalty-free placeholder stills for the TrustLedger SRM demo pack.\n"
        "EXIF GPS and timestamps are synthetic and must match evidence.csv rows EVID-0001–EVID-0030.\n\n"
        + "\n".join(sources)
        + "\n",
        encoding="utf-8",
    )

    for i in range(COUNTS["images"] + 1, COUNTS["evidence"] + 1):
        if i % 5 == 0:
            parent = incidents[(i - 1) % len(incidents)]
            parent_type, parent_id = "incident", parent["incident_id"]
            org_id = parent["org_id"]
            site = next(s for s in sites if s["site_id"] == parent["site_id"])
            ts = parent["reported_at"]
            uploader = parent["reported_by"]
        else:
            parent = inspections[(i - 1) % len(inspections)]
            parent_type, parent_id = "inspection", parent["inspection_id"]
            org_id = parent["org_id"]
            site = next(s for s in sites if s["site_id"] == parent["site_id"])
            ts = parent["date_time"]
            uploader = parent["inspector_id"]
        fname = f"note_{pad('EVID', i).lower()}.txt"
        payload = f"{pad('EVID', i)}|{parent_type}|{parent_id}|{ts}|illustrative".encode("utf-8")
        evidence.append(
            {
                "evidence_id": pad("EVID", i),
                "org_id": org_id,
                "parent_type": parent_type,
                "parent_id": parent_id,
                "filename": fname,
                "checksum": hashlib.sha256(payload).hexdigest(),
                "gps_lat": site["gps_lat"],
                "gps_lon": site["gps_lon"],
                "timestamp": ts,
                "uploader_id": uploader,
                "classification": "note",
                "has_local_image": "N",
            }
        )
    write_csv(
        csv_dir / "evidence.csv",
        evidence,
        [
            "evidence_id",
            "org_id",
            "parent_type",
            "parent_id",
            "filename",
            "checksum",
            "gps_lat",
            "gps_lon",
            "timestamp",
            "uploader_id",
            "classification",
            "has_local_image",
        ],
    )

    ledger: list[dict[str, str]] = []
    kid = "demo-test-2026-09"

    def add_entry(entity_type: str, entity_id: str, action: str, timestamp: str, actor_id: str, canonical: dict) -> None:
        n = len(ledger) + 1
        prev = ""
        current = compute_hash(prev, canonical, timestamp, actor_id)
        sig = sign_hash_ed25519(sk, current)
        ledger.append(
            {
                "ledger_id": pad("LGR", n),
                "entity_type": entity_type,
                "entity_id": entity_id,
                "action": action,
                "timestamp": timestamp,
                "actor_id": actor_id,
                "prev_hash": prev,
                "current_hash": current,
                "signature": sig,
                "kid": kid,
                "canonical_entity_json": json.dumps(canonical, separators=(",", ":"), sort_keys=True, ensure_ascii=False),
            }
        )

    for row in evidence:
        add_entry(
            "evidence",
            row["evidence_id"],
            "create",
            row["timestamp"],
            row["uploader_id"],
            {
                "filename": row["filename"],
                "gps_lat": float(row["gps_lat"]),
                "gps_lon": float(row["gps_lon"]),
                "id": row["evidence_id"],
                "parent_id": row["parent_id"],
                "parent_type": row["parent_type"],
                "timestamp": row["timestamp"],
                "uploader_id": row["uploader_id"],
            },
        )
    for row in incidents:
        add_entry(
            "incident",
            row["incident_id"],
            "create",
            row["reported_at"],
            row["reported_by"],
            {
                "id": row["incident_id"],
                "priority": row["priority"],
                "site_id": row["site_id"],
                "status": row["status"],
                "title": row["title"],
            },
        )
    for row in inspections[:50]:
        add_entry(
            "inspection",
            row["inspection_id"],
            "create",
            row["date_time"],
            row["inspector_id"],
            {
                "asset_id": row["asset_id"],
                "id": row["inspection_id"],
                "score": int(row["score"]),
                "status": row["status"],
            },
        )
    for row in assets[:20]:
        add_entry(
            "asset",
            row["asset_id"],
            "create",
            f"{row['installed_at']}T08:00:00Z",
            users[0]["user_id"],
            {
                "asset_type": row["asset_type"],
                "id": row["asset_id"],
                "site_id": row["site_id"],
            },
        )

    if len(ledger) != COUNTS["ledger"]:
        raise SystemExit(f"ledger count {len(ledger)} != {COUNTS['ledger']}")

    write_csv(
        csv_dir / "ledger_entries.csv",
        ledger,
        [
            "ledger_id",
            "entity_type",
            "entity_id",
            "action",
            "timestamp",
            "actor_id",
            "prev_hash",
            "current_hash",
            "signature",
            "kid",
            "canonical_entity_json",
        ],
    )

    _ = rng  # reserved for future jitter
    print(f"Wrote CSVs, {COUNTS['images']} images, TEST keypair under {ROOT}")


def zip_package() -> Path:
    zip_path = REPO_DEMO / ZIP_NAME
    include = [
        "README.md",
        "schema.md",
        "requirements.txt",
        "import_script.py",
        "ledger_util.py",
        "build_package.py",
        "acceptance_log.sample.txt",
        "TrustLedger_SRM_Demo.postman_collection.json",
    ]
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for name in include:
            path = ROOT / name
            if path.is_file():
                zf.write(path, arcname=f"trustledger-srm-demo/{name}")
        for folder in ("csv", "images", "TEST-KEYPAIR-DO-NOT-USE-IN-PROD"):
            for path in sorted((ROOT / folder).rglob("*")):
                if path.is_file():
                    zf.write(path, arcname=f"trustledger-srm-demo/{path.relative_to(ROOT)}")
    print("Wrote", zip_path, "bytes", zip_path.stat().st_size)
    return zip_path


if __name__ == "__main__":
    if "--zip-only" in sys.argv:
        zip_package()
    else:
        build()
        if "--zip" in sys.argv:
            zip_package()
