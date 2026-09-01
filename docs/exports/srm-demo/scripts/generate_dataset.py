#!/usr/bin/env python3
"""Generate the TrustLedger SRM — Demo: Consolidated Evidence dataset.

Produces CSVs, 30 EXIF-stamped JPEG placeholders, chained signed ledger
entries, dashboard JSON, GeoJSON, and payload samples. Synthetic only.
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
import random
import sys
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import piexif

SCRIPTS_DIR = Path(__file__).resolve().parent
PKG_ROOT = SCRIPTS_DIR.parent
sys.path.insert(0, str(SCRIPTS_DIR))

from ledger_crypto import (  # noqa: E402
    GENESIS_PREV,
    compute_current_hash,
    entity_representation,
    load_or_create_keypair,
    sign_hash,
)

LAT_MIN, LAT_MAX = -34.5, -31.5
LON_MIN, LON_MAX = 24.0, 29.0
DEMO_NOW = datetime(2026, 9, 1, 8, 0, 0, tzinfo=timezone.utc)
PLAN_NAME = "TrustLedger SRM — Demo: Consolidated Evidence"
PLAN_DESCRIPTION = (
    "Demo plan to show consolidation of scattered tools into one "
    "evidence-backed SRM with immutable ledgered audit trail."
)

USERS = [
    {
        "id": "USER-ADMIN-01",
        "username": "admin_demo",
        "role": "Demo Admin",
        "email (mock)": "admin@example.local",
        "phone (mock)": "000-000-0000",
        "notes": "Full permissions",
    },
    {
        "id": "USER-INS-01",
        "username": "inspector_demo",
        "role": "Inspector Mobile",
        "email (mock)": "inspector@example.local",
        "phone (mock)": "000-000-0001",
        "notes": "Field capture, offline sync, evidence upload",
    },
    {
        "id": "USER-MGR-01",
        "username": "pm_demo",
        "role": "Project Manager",
        "email (mock)": "pm@example.local",
        "phone (mock)": "000-000-0002",
        "notes": "Work orders, incident triage, dashboard pin",
    },
    {
        "id": "USER-AUD-01",
        "username": "auditor_demo",
        "role": "Auditor",
        "email (mock)": "auditor@example.local",
        "phone (mock)": "000-000-0003",
        "notes": "Read ledger, verify signatures, export reports",
    },
    {
        "id": "USER-CTR-01",
        "username": "contractor_demo",
        "role": "External Contractor",
        "email (mock)": "contractor@example.local",
        "phone (mock)": "000-000-0004",
        "notes": "Assigned work orders only",
    },
    {
        "id": "USER-PUB-01",
        "username": "public_demo",
        "role": "Public Reporter",
        "email (mock)": "reporter@example.local",
        "phone (mock)": "000-000-0005",
        "notes": "Viewer + public intake (no PII)",
    },
    {
        "id": "USER-VIEW-01",
        "username": "viewer_demo",
        "role": "Viewer",
        "email (mock)": "viewer@example.local",
        "phone (mock)": "000-000-0006",
        "notes": "Read-only dashboards",
    },
]

ORGS = [
    {
        "id": "ORG-001",
        "name": "Coastal District Municipality",
        "type": "Municipality",
        "region": "Eastern Cape",
        "description": "Demo municipality",
    },
    {
        "id": "ORG-002",
        "name": "Kariega Corridor Agency",
        "type": "Implementing Agency",
        "region": "Eastern Cape",
        "description": "Demo roads implementing agent for N2/R72 packages",
    },
    {
        "id": "ORG-003",
        "name": "Buffalo City Roads Directorate",
        "type": "Municipality",
        "region": "Eastern Cape",
        "description": "Demo metro roads directorate (East London / Mdantsane)",
    },
    {
        "id": "ORG-004",
        "name": "OR Tambo District Works",
        "type": "Municipality",
        "region": "Eastern Cape",
        "description": "Demo district works for Wild Coast / Mthatha corridor",
    },
    {
        "id": "ORG-005",
        "name": "Kouga Infrastructure Trust",
        "type": "Community Trust",
        "region": "Eastern Cape",
        "description": "Demo community trust for Humansdorp–St Francis assets",
    },
]

# SITE-014 is the hero R72 Bridge 3 - West fixture from the brief.
SITES = [
    {"id": "SITE-001", "org_id": "ORG-001", "name": "N2 Gqeberha Approach", "latitude": -33.9601, "longitude": 25.6022, "description": "N2 inbound pavement and drainage at Gqeberha western approach"},
    {"id": "SITE-002", "org_id": "ORG-001", "name": "Swartkops River Culvert Cluster", "latitude": -33.8704, "longitude": 25.6108, "description": "Triple-cell culvert under collector; siltation watch"},
    {"id": "SITE-003", "org_id": "ORG-002", "name": "R72 Sundays River Bridge", "latitude": -33.4212, "longitude": 25.4481, "description": "Deck joints and expansion gaps on R72 crossing"},
    {"id": "SITE-004", "org_id": "ORG-001", "name": "Motherwell Access Road km 3.2", "latitude": -33.8042, "longitude": 25.5891, "description": "Access road shoulder failure; stormwater inlets"},
    {"id": "SITE-005", "org_id": "ORG-003", "name": "Buffalo City N2 Overpass", "latitude": -33.0154, "longitude": 27.9052, "description": "Overpass bearings and parapet inspection zone"},
    {"id": "SITE-006", "org_id": "ORG-003", "name": "East London Harbour Road", "latitude": -33.0251, "longitude": 27.8754, "description": "Harbour link; high HGV wear and ponding"},
    {"id": "SITE-007", "org_id": "ORG-002", "name": "Makhanda R67 Shoulder", "latitude": -33.3102, "longitude": 26.5311, "description": "R67 cut-slope and guardrail run"},
    {"id": "SITE-008", "org_id": "ORG-004", "name": "Mthatha N2 Ring Culvert", "latitude": -31.5894, "longitude": 28.7842, "description": "Ring-road reinforced culvert; debris after storms"},
    {"id": "SITE-009", "org_id": "ORG-004", "name": "Qumbu R61 South Approach", "latitude": -31.5208, "longitude": 28.8681, "description": "R61 approach; drainage mitre drains"},
    {"id": "SITE-010", "org_id": "ORG-005", "name": "Humansdorp R102 Crossing", "latitude": -34.0284, "longitude": 24.7702, "description": "R102 crossing and pedestrian refuge"},
    {"id": "SITE-011", "org_id": "ORG-005", "name": "Jeffreys Bay Coastal Collector", "latitude": -34.0506, "longitude": 24.9214, "description": "Coastal collector; wind-blown sand on inlets"},
    {"id": "SITE-012", "org_id": "ORG-002", "name": "Addo Access Road km 8", "latitude": -33.5452, "longitude": 25.6903, "description": "Game-area access; livestock grid and culvert"},
    {"id": "SITE-013", "org_id": "ORG-003", "name": "Mdantsane Collector Drain", "latitude": -32.9581, "longitude": 27.7604, "description": "Open channel drain along collector; informal crossings"},
    {"id": "SITE-014", "org_id": "ORG-001", "name": "R72 Bridge 3 - West", "latitude": -33.0002, "longitude": 25.7001, "description": "Bridge on R72; drainage culvert on SW corner"},
    {"id": "SITE-015", "org_id": "ORG-004", "name": "Port St Johns R61 Terrace", "latitude": -31.6282, "longitude": 28.9714, "description": "Terrace wall and drainage on R61 descent"},
    {"id": "SITE-016", "org_id": "ORG-002", "name": "Paterson N10 Link", "latitude": -33.4406, "longitude": 25.9712, "description": "N10 link pavement and kilometre markers"},
    {"id": "SITE-017", "org_id": "ORG-005", "name": "St Francis Bay Causeway", "latitude": -34.1704, "longitude": 24.8311, "description": "Causeway deck and tidal scour watch"},
    {"id": "SITE-018", "org_id": "ORG-003", "name": "Qonce R63 Crossing", "latitude": -32.8803, "longitude": 27.3912, "description": "R63 urban crossing; signal mast and inlet"},
    {"id": "SITE-019", "org_id": "ORG-004", "name": "Butterworth N2 Culvert 12", "latitude": -32.3305, "longitude": 28.1506, "description": "N2 box culvert; debris screens"},
    {"id": "SITE-020", "org_id": "ORG-001", "name": "Colchester R72 East", "latitude": -33.6951, "longitude": 25.8204, "description": "R72 east of Colchester; floodplain culverts"},
]

ASSET_TYPES = [
    "Culvert - reinforced concrete",
    "Bridge deck joint",
    "Guardrail run",
    "Stormwater inlet",
    "Catchpit",
    "Retaining wall",
    "Pavement section",
    "Sign gantry",
    "Streetlight column",
    "Open channel drain",
    "Expansion bearing",
    "Parapet",
]
CONDITIONS = ["Good", "Fair", "Poor", "Critical"]
INSPECTORS = ["USER-INS-01", "USER-CTR-01"]
CHECKLIST_KEYS = [
    ("drainage", ["clear", "partial_blocked", "blocked"]),
    ("structural_cracks", ["none", "hairline", "wide"]),
    ("scour", ["none", "minor", "severe"]),
    ("safety_barrier", ["intact", "damaged", "missing"]),
]

IMAGE_SPECS = [
    ("culvert_block_20260801.jpg", "blocked culvert inlet", 0),
    ("r72_bridge_west_deck.jpg", "bridge deck looking west", 1),
    ("washout_lane_closure.jpg", "lane washout and cones", 2),
    ("swartkops_silt_cell.jpg", "silted culvert cell", 3),
    ("n2_gqeberha_shoulder.jpg", "N2 shoulder drop", 4),
    ("sundays_river_joint.jpg", "deck joint gap", 5),
    ("motherwell_inlet.jpg", "blocked stormwater inlet", 6),
    ("buffalo_overpass_bearing.jpg", "overpass bearing", 7),
    ("harbour_road_ponding.jpg", "harbour road ponding", 8),
    ("makhanda_guardrail.jpg", "guardrail impact", 9),
    ("mthatha_ring_debris.jpg", "debris at ring culvert", 10),
    ("qumbu_mitre_drain.jpg", "mitre drain erosion", 11),
    ("humansdorp_crossing.jpg", "R102 crossing surface", 12),
    ("jeffreys_sand_inlet.jpg", "sand on coastal inlet", 13),
    ("addo_livestock_grid.jpg", "livestock grid", 14),
    ("mdantsane_open_channel.jpg", "open channel silt", 15),
    ("psj_terrace_wall.jpg", "terrace wall crack", 16),
    ("paterson_n10_marker.jpg", "N10 km marker", 17),
    ("stfrancis_causeway_scour.jpg", "causeway scour", 18),
    ("qonce_signal_mast.jpg", "signal mast base", 19),
    ("butterworth_screen.jpg", "debris screen", 20),
    ("colchester_floodplain.jpg", "floodplain culvert", 21),
    ("temp_repair_bags.jpg", "sandbag temporary repair", 22),
    ("inspector_checklist_board.jpg", "field checklist board", 23),
    ("night_works_lighting.jpg", "night works lighting", 24),
    ("parapet_spall.jpg", "parapet concrete spall", 25),
    ("catchpit_grate.jpg", "catchpit grate missing", 26),
    ("gantry_bolt_corrosion.jpg", "gantry bolt corrosion", 27),
    ("channel_vegetation.jpg", "vegetation in channel", 28),
    ("evidence_wide_context.jpg", "wide site context", 29),
]


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def clamp_gps(lat: float, lon: float) -> tuple[float, float]:
    lat = min(max(lat, LAT_MIN + 0.01), LAT_MAX - 0.01)
    lon = min(max(lon, LON_MIN + 0.01), LON_MAX - 0.01)
    return round(lat, 6), round(lon, 6)


def jitter(lat: float, lon: float, rng: random.Random, scale: float = 0.002) -> tuple[float, float]:
    return clamp_gps(lat + rng.uniform(-scale, scale), lon + rng.uniform(-scale, scale))


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
                writer.writerow({k: "" if row.get(k) is None else str(row[k]) for k in fieldnames})


def _to_dms(value: float) -> tuple[tuple[int, int], tuple[int, int], tuple[int, int]]:
    abs_v = abs(value)
    deg = int(abs_v)
    minutes_f = (abs_v - deg) * 60
    minutes = int(minutes_f)
    seconds = (minutes_f - minutes) * 60
    return (deg, 1), (minutes, 1), (int(round(seconds * 10000)), 10000)


def stamp_exif(jpeg_bytes: bytes, lat: float, lon: float, ts: datetime) -> bytes:
    zeroth = {
        piexif.ImageIFD.Make: "TrustLedger Demo Cam",
        piexif.ImageIFD.Model: "SYNTHETIC-PLACEHOLDER",
        piexif.ImageIFD.Software: "TrustLedger SRM Demo Pack",
        piexif.ImageIFD.DateTime: ts.strftime("%Y:%m:%d %H:%M:%S"),
        piexif.ImageIFD.Artist: "synthetic-demo-no-pii",
    }
    exif = {
        piexif.ExifIFD.DateTimeOriginal: ts.strftime("%Y:%m:%d %H:%M:%S"),
        piexif.ExifIFD.DateTimeDigitized: ts.strftime("%Y:%m:%d %H:%M:%S"),
        piexif.ExifIFD.UserComment: b"ASCII\0\0\0TrustLedger synthetic evidence (no PII)",
    }
    gps = {
        piexif.GPSIFD.GPSLatitudeRef: "S" if lat < 0 else "N",
        piexif.GPSIFD.GPSLatitude: _to_dms(lat),
        piexif.GPSIFD.GPSLongitudeRef: "W" if lon < 0 else "E",
        piexif.GPSIFD.GPSLongitude: _to_dms(lon),
        piexif.GPSIFD.GPSAltitude: (0, 1),
        piexif.GPSIFD.GPSTimeStamp: (
            (ts.hour, 1),
            (ts.minute, 1),
            (ts.second, 1),
        ),
        piexif.GPSIFD.GPSDateStamp: ts.strftime("%Y:%m:%d"),
    }
    dumped = piexif.dump({"0th": zeroth, "Exif": exif, "GPS": gps})
    buf = BytesIO()
    piexif.insert(dumped, jpeg_bytes, buf)
    return buf.getvalue()


def _font(size: int) -> ImageFont.ImageFont:
    for name in ("DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def render_placeholder(
    filename: str,
    caption: str,
    hue_index: int,
    lat: float,
    lon: float,
    ts: datetime,
) -> Image.Image:
    w, h = 1280, 720
    rng = random.Random(hue_index * 997 + 13)
    img = Image.new("RGB", (w, h))
    px = img.load()
    sky_shift = (hue_index * 7) % 40
    for y in range(h):
        t = y / h
        if t < 0.42:
            r = int(70 + t * 80 + sky_shift)
            g = int(110 + t * 60)
            b = int(150 + t * 70)
        elif t < 0.55:
            r = int(90 + (t - 0.42) * 400)
            g = int(120 + (t - 0.42) * 80)
            b = int(70)
        else:
            r = int(55 + (t - 0.55) * 40)
            g = int(58 + (t - 0.55) * 20)
            b = int(52)
        for x in range(w):
            n = rng.randint(-12, 12)
            px[x, y] = (
                max(0, min(255, r + n)),
                max(0, min(255, g + n)),
                max(0, min(255, b + n)),
            )
    draw = ImageDraw.Draw(img, "RGBA")
    # Road vanishing point
    draw.polygon(
        [(w * 0.05, h), (w * 0.45, h * 0.52), (w * 0.55, h * 0.52), (w * 0.95, h)],
        fill=(70, 72, 68, 255),
    )
    draw.polygon(
        [(w * 0.495, h * 0.52), (w * 0.505, h * 0.52), (w * 0.54, h), (w * 0.46, h)],
        fill=(200, 170, 40, 220),
    )
    kind = hue_index % 5
    if kind == 0:  # culvert arch
        box = [w * 0.32, h * 0.58, w * 0.68, h * 0.92]
        draw.rectangle(box, fill=(120, 118, 112, 255), outline=(40, 40, 40, 255), width=4)
        draw.pieslice(
            [w * 0.36, h * 0.62, w * 0.64, h * 0.98],
            180,
            360,
            fill=(35, 38, 42, 255),
        )
    elif kind == 1:  # bridge deck
        draw.rectangle([0, h * 0.48, w, h * 0.58], fill=(130, 128, 122, 255))
        for i in range(8):
            x = int(w * 0.08 + i * w * 0.12)
            draw.rectangle([x, h * 0.18, x + 18, h * 0.48], fill=(150, 148, 140, 255))
    elif kind == 2:  # washout
        draw.polygon(
            [(w * 0.2, h * 0.7), (w * 0.55, h * 0.55), (w * 0.7, h * 0.95), (w * 0.15, h)],
            fill=(80, 60, 40, 255),
        )
    elif kind == 3:  # inlet grate
        gx, gy = w * 0.4, h * 0.68
        draw.rectangle([gx, gy, gx + 220, gy + 140], fill=(50, 50, 52, 255))
        for i in range(6):
            draw.line([gx + 10, gy + 20 + i * 20, gx + 210, gy + 20 + i * 20], fill=(20, 20, 20, 255), width=4)
    else:  # wall / channel
        draw.rectangle([w * 0.15, h * 0.5, w * 0.85, h * 0.85], fill=(140, 130, 115, 255))
        draw.line([w * 0.2, h * 0.62, w * 0.8, h * 0.78], fill=(90, 80, 70, 255), width=6)

    img = img.filter(ImageFilter.SMOOTH)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, w, 48], fill=(14, 124, 102))
    draw.text((18, 12), "TrustLedger  ·  SYNTHETIC DEMO EVIDENCE  ·  no PII", fill="white", font=_font(22))
    draw.rectangle([0, h - 88, w, h], fill=(18, 32, 42, 230))
    draw.text((18, h - 78), filename, fill="white", font=_font(22))
    draw.text((18, h - 50), caption, fill=(210, 220, 224), font=_font(18))
    meta = f"GPS {lat:.4f}, {lon:.4f}   {iso(ts)}   Eastern Cape (illustrative)"
    draw.text((18, h - 26), meta, fill=(180, 190, 194), font=_font(16))
    return img


def save_jpeg_with_exif(path: Path, image: Image.Image, lat: float, lon: float, ts: datetime) -> str:
    buf = BytesIO()
    image.save(buf, format="JPEG", quality=86, optimize=True)
    stamped = stamp_exif(buf.getvalue(), lat, lon, ts)
    path.write_bytes(stamped)
    return "sha256:" + hashlib.sha256(stamped).hexdigest()


def build_assets(rng: random.Random) -> list[dict[str, Any]]:
    assets: list[dict[str, Any]] = []
    # ASSET-201 .. ASSET-250; ASSET-210 is the hero culvert on SITE-014
    for i in range(50):
        n = 201 + i
        asset_id = f"ASSET-{n:03d}"
        if asset_id == "ASSET-210":
            site = next(s for s in SITES if s["id"] == "SITE-014")
            assets.append(
                {
                    "id": asset_id,
                    "site_id": "SITE-014",
                    "asset_type": "Culvert - reinforced concrete",
                    "condition": "Fair",
                    "installation_date": "2012-05-01",
                    "asset_tag": "CLV-R72-210",
                    "notes": "Minor hairline cracks",
                    "_lat": site["latitude"],
                    "_lon": site["longitude"],
                }
            )
            continue
        site = SITES[i % len(SITES)]
        year = rng.randint(2004, 2023)
        month = rng.randint(1, 12)
        assets.append(
            {
                "id": asset_id,
                "site_id": site["id"],
                "asset_type": ASSET_TYPES[i % len(ASSET_TYPES)],
                "condition": CONDITIONS[rng.randint(0, 3 if i % 11 else 2)],
                "installation_date": f"{year}-{month:02d}-01",
                "asset_tag": f"{site['id'][-3:]}-{n}",
                "notes": rng.choice(
                    [
                        "Routine watch item",
                        "Scour marks after 2024 rains",
                        "Vegetation encroachment",
                        "Bolt corrosion at base",
                        "Siltation after storm",
                        "Hairline map cracking",
                    ]
                ),
                "_lat": site["latitude"],
                "_lon": site["longitude"],
            }
        )
    return assets


def build_inspections(assets: list[dict[str, Any]], rng: random.Random) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    start = datetime(2026, 6, 1, 7, 0, 0, tzinfo=timezone.utc)
    for i in range(200):
        insp_id = f"INSP-{1001 + i}"
        asset = assets[0] if insp_id == "INSP-1001" else assets[i % len(assets)]
        if insp_id == "INSP-1001":
            asset = next(a for a in assets if a["id"] == "ASSET-210")
            dt = datetime(2026, 8, 1, 9, 15, 0, tzinfo=timezone.utc)
            score = 72
            notes = "Blockage and small cracks"
            checklist = {"drainage": "partial_blocked", "structural_cracks": "hairline"}
            status = "Completed"
            inspector = "USER-INS-01"
        else:
            dt = start + timedelta(hours=rng.randint(0, 90 * 24), minutes=rng.choice([0, 15, 30, 45]))
            score = rng.randint(48, 98)
            notes = rng.choice(
                [
                    "Routine inspection; no immediate action",
                    "Partial blockage; schedule clean",
                    "Barrier damage; contractor to quote",
                    "Scour at outlet; monitor after rain",
                    "Joint sealant failed; fair condition",
                    "Vegetation cleared; reinspect in 30 days",
                ]
            )
            checklist = {k: rng.choice(vals) for k, vals in CHECKLIST_KEYS}
            status = rng.choices(["Completed", "Draft", "Follow-up"], weights=[0.82, 0.08, 0.10])[0]
            inspector = rng.choice(INSPECTORS)
        rows.append(
            {
                "id": insp_id,
                "asset_id": asset["id"],
                "inspector_id": inspector,
                "date_time": iso(dt),
                "score": score,
                "notes": notes,
                "checklist_json": json.dumps(checklist, separators=(",", ":")),
                "status": status,
                "_site_id": asset["site_id"],
                "_lat": asset["_lat"],
                "_lon": asset["_lon"],
                "_dt": dt,
            }
        )
    return rows


def build_incidents(rng: random.Random) -> list[dict[str, Any]]:
    severities = ["Low", "Medium", "High", "Critical"]
    statuses = ["Open", "Investigating", "Resolved", "Closed"]
    reporters = ["USER-PUB-01", "USER-INS-01", "USER-MGR-01", "USER-CTR-01"]
    rows: list[dict[str, Any]] = []
    for i in range(30):
        inc_id = f"INC-{301 + i}"
        if inc_id == "INC-302":
            site = next(s for s in SITES if s["id"] == "SITE-014")
            rows.append(
                {
                    "id": inc_id,
                    "site_id": "SITE-014",
                    "reported_by": "USER-PUB-01",
                    "date_time": "2026-08-02T14:30:00Z",
                    "severity": "High",
                    "status": "Open",
                    "description": "Road washed-out over culvert; immediate closure recommended",
                    "_lat": site["latitude"],
                    "_lon": site["longitude"],
                    "_dt": datetime(2026, 8, 2, 14, 30, tzinfo=timezone.utc),
                }
            )
            continue
        site = SITES[i % len(SITES)]
        dt = datetime(2026, 6, 10, 8, 0, tzinfo=timezone.utc) + timedelta(days=rng.randint(0, 75), hours=rng.randint(0, 20))
        sev = rng.choices(severities, weights=[0.25, 0.4, 0.25, 0.1])[0]
        st = rng.choices(statuses, weights=[0.35, 0.25, 0.25, 0.15])[0]
        desc = rng.choice(
            [
                "Ponding after storm; one lane restricted",
                "Guardrail struck overnight; sharp edges exposed",
                "Community report of missing catchpit grate",
                "Contractor noted scour at outlet apron",
                "Sand drift covering coastal inlet",
                "Parapet spall above walkway",
                "Illegal dumping at culvert mouth",
                "Night works lighting complaint from adjacent erf (synthetic)",
            ]
        )
        rows.append(
            {
                "id": inc_id,
                "site_id": site["id"],
                "reported_by": rng.choice(reporters),
                "date_time": iso(dt),
                "severity": sev,
                "status": st,
                "description": desc,
                "_lat": site["latitude"],
                "_lon": site["longitude"],
                "_dt": dt,
            }
        )
    return rows


def build_work_orders(
    incidents: list[dict[str, Any]],
    assets: list[dict[str, Any]],
    rng: random.Random,
) -> list[dict[str, Any]]:
    statuses = ["Open", "Assigned", "In Progress", "Completed", "Overdue"]
    rows: list[dict[str, Any]] = []
    asset_by_site: dict[str, list[str]] = {}
    for a in assets:
        asset_by_site.setdefault(a["site_id"], []).append(a["id"])
    for i in range(80):
        wo_id = f"WO-{i + 1:03d}"
        if wo_id == "WO-075":
            rows.append(
                {
                    "id": wo_id,
                    "incident_id": "INC-302",
                    "asset_id": "ASSET-210",
                    "created_by": "USER-MGR-01",
                    "assigned_to": "USER-CTR-01",
                    "due_date": "2026-08-10",
                    "status": "Open",
                    "cost_estimate": 15000,
                    "notes": "Temporary repair to re-open lane",
                }
            )
            continue
        inc = incidents[i % len(incidents)]
        site_assets = asset_by_site.get(inc["site_id"]) or [assets[0]["id"]]
        due = (inc["_dt"] + timedelta(days=rng.randint(3, 21))).date()
        st = rng.choices(statuses, weights=[0.22, 0.18, 0.2, 0.25, 0.15])[0]
        if due < DEMO_NOW.date() and st in ("Open", "Assigned", "In Progress"):
            st = rng.choice(["Overdue", "Open"])
        rows.append(
            {
                "id": wo_id,
                "incident_id": inc["id"],
                "asset_id": rng.choice(site_assets),
                "created_by": rng.choice(["USER-MGR-01", "USER-ADMIN-01"]),
                "assigned_to": rng.choice(["USER-CTR-01", "USER-INS-01"]),
                "due_date": due.isoformat(),
                "status": st,
                "cost_estimate": rng.choice([3500, 8000, 12000, 15000, 24500, 48000, 72000]),
                "notes": rng.choice(
                    [
                        "Clean and CCTV outlet",
                        "Replace grate and bolt down",
                        "Reset guardrail posts",
                        "Re-seal deck joint",
                        "Vegetation cut-back 20 m",
                        "Place temporary barriers",
                        "Reconstruct outlet apron",
                    ]
                ),
            }
        )
    return rows


def build_images_and_evidence(
    inspections: list[dict[str, Any]],
    incidents: list[dict[str, Any]],
    work_orders: list[dict[str, Any]],
    assets: list[dict[str, Any]],
    rng: random.Random,
) -> tuple[list[dict[str, Any]], dict[str, str], list[dict[str, Any]]]:
    images_dir = PKG_ROOT / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    site_by_id = {s["id"]: s for s in SITES}
    asset_by_id = {a["id"]: a for a in assets}
    insp_by_id = {i["id"]: i for i in inspections}

    unique_meta: list[dict[str, Any]] = []
    hero_insp = insp_by_id["INSP-1001"]
    for idx, (fname, caption, hue) in enumerate(IMAGE_SPECS):
        if fname == "culvert_block_20260801.jpg":
            lat, lon = hero_insp["_lat"], hero_insp["_lon"]
            ts = datetime(2026, 8, 1, 9, 17, 0, tzinfo=timezone.utc)
            parent_type, parent_id = "inspection", "INSP-1001"
        else:
            parent = inspections[(idx * 7) % len(inspections)]
            lat, lon = jitter(parent["_lat"], parent["_lon"], rng, 0.0015)
            ts = parent["_dt"] + timedelta(minutes=2 + idx % 11)
            parent_type, parent_id = "inspection", parent["id"]
        img = render_placeholder(fname, caption, hue, lat, lon, ts)
        checksum = save_jpeg_with_exif(images_dir / fname, img, lat, lon, ts)
        unique_meta.append(
            {
                "filename": fname,
                "caption": caption,
                "lat": lat,
                "lon": lon,
                "ts": ts,
                "checksum": checksum,
                "parent_type": parent_type,
                "parent_id": parent_id,
            }
        )

    checksum_by_file = {m["filename"]: m["checksum"] for m in unique_meta}

    evidence: list[dict[str, Any]] = []
    # 400 rows EVID-0001 .. EVID-0400; EVID-0099 is the hero culvert photo
    parents_cycle: list[tuple[str, str, datetime, float, float, str]] = []
    for insp in inspections:
        parents_cycle.append(("inspection", insp["id"], insp["_dt"], insp["_lat"], insp["_lon"], insp["inspector_id"]))
    for inc in incidents:
        parents_cycle.append(("incident", inc["id"], inc["_dt"], inc["_lat"], inc["_lon"], inc["reported_by"]))
    for wo in work_orders:
        inc = next(x for x in incidents if x["id"] == wo["incident_id"])
        ast = asset_by_id[wo["asset_id"]]
        site = site_by_id[ast["site_id"]]
        dt = datetime.fromisoformat(wo["due_date"] + "T08:00:00+00:00")
        parents_cycle.append(("work_order", wo["id"], dt, site["latitude"], site["longitude"], wo["created_by"]))

    for i in range(400):
        evid_id = f"EVID-{i + 1:04d}"
        if evid_id == "EVID-0099":
            meta = next(m for m in unique_meta if m["filename"] == "culvert_block_20260801.jpg")
            evidence.append(
                {
                    "id": evid_id,
                    "parent_type": "inspection",
                    "parent_id": "INSP-1001",
                    "filename": meta["filename"],
                    "file_type": "image",
                    "gps_lat": meta["lat"],
                    "gps_lon": meta["lon"],
                    "timestamp": iso(meta["ts"]),
                    "uploader_id": "USER-INS-01",
                    "checksum": meta["checksum"],
                    "description": "Photo showing partial blockage",
                }
            )
            continue
        parent = parents_cycle[i % len(parents_cycle)]
        meta = unique_meta[i % len(unique_meta)]
        # Reuse file bytes/checksum; keep GPS plausible near parent
        lat, lon = jitter(parent[3], parent[4], rng, 0.0012)
        ts = parent[2] + timedelta(minutes=rng.randint(1, 25))
        evidence.append(
            {
                "id": evid_id,
                "parent_type": parent[0],
                "parent_id": parent[1],
                "filename": meta["filename"],
                "file_type": "image",
                "gps_lat": lat,
                "gps_lon": lon,
                "timestamp": iso(ts),
                "uploader_id": parent[5] if parent[5].startswith("USER-") else "USER-INS-01",
                "checksum": meta["checksum"],
                "description": rng.choice(
                    [
                        "Context photo of asset face",
                        "Close-up of defect",
                        "Downstream outlet",
                        "Upstream inlet",
                        "Safety barrier condition",
                        "Temporary works in place",
                    ]
                ),
            }
        )
    return evidence, checksum_by_file, unique_meta


def build_ledger(
    orgs: list[dict[str, Any]],
    sites: list[dict[str, Any]],
    assets: list[dict[str, Any]],
    inspections: list[dict[str, Any]],
    incidents: list[dict[str, Any]],
    work_orders: list[dict[str, Any]],
    evidence: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Exactly 500 chained create/update entries."""
    events: list[tuple[str, str, str, str, dict[str, Any], str]] = []
    # action, entity_type, entity_id, timestamp, canonical_source, actor, notes later

    def add(action: str, etype: str, entity: dict[str, Any], ts: str, actor: str, note: str) -> None:
        # Stringify like csv.DictWriter so validators can recompute hashes from CSVs.
        public = {
            k: "" if v is None else str(v)
            for k, v in entity.items()
            if not str(k).startswith("_")
        }
        events.append((action, etype, str(entity["id"]), ts, public, actor, note))

    for o in orgs:
        add("create", "organization", o, "2026-05-01T08:00:00Z", "USER-ADMIN-01", "Seed organisation")
    for s in sites:
        add("create", "site", s, "2026-05-02T08:00:00Z", "USER-MGR-01", "Seed site")
    for a in assets:
        add("create", "asset", a, "2026-05-03T08:00:00Z", "USER-MGR-01", "Seed asset")
    for inc in incidents:
        add("create", "incident", inc, inc["date_time"], inc["reported_by"], "Incident logged")
    for wo in work_orders:
        add("create", "work_order", wo, wo["due_date"] + "T07:00:00Z", wo["created_by"], "Work order raised")
    # 115 inspections (includes hero INSP-1001 first among them)
    insp_sorted = sorted(inspections, key=lambda r: (0 if r["id"] == "INSP-1001" else 1, r["id"]))
    for insp in insp_sorted[:115]:
        add("create", "inspection", insp, insp["date_time"], insp["inspector_id"], "Inspection captured")
    evid_sorted = sorted(evidence, key=lambda r: (0 if r["id"] == "EVID-0099" else 1, r["id"]))
    for ev in evid_sorted[:150]:
        add("create", "evidence", ev, ev["timestamp"], ev["uploader_id"], "Evidence uploaded")
    # 50 updates to reach 500: 5+20+50+30+80+115+150 = 450; +50 updates = 500
    # Update only entities that already have a create in this 500-row sample.
    update_sources = insp_sorted[:25] + incidents[:15] + work_orders[:10]
    for row in update_sources:
        if "inspector_id" in row:
            ts = iso(row["_dt"] + timedelta(hours=6))
            add("update", "inspection", row, ts, "USER-MGR-01", "Score / status update")
        elif "severity" in row:
            ts = iso(row["_dt"] + timedelta(hours=8))
            add("update", "incident", row, ts, "USER-MGR-01", "Status update")
        else:
            ts = row["due_date"] + "T16:00:00Z"
            add("update", "work_order", row, ts, "USER-CTR-01", "Progress update")

    if len(events) != 500:
        raise RuntimeError(f"expected 500 ledger events, got {len(events)}")

    # Stable chronological-ish order but keep hero evidence near its inspection
    events.sort(key=lambda e: (e[3], e[2]))

    private_key = load_or_create_keypair(PKG_ROOT / "keys")
    rows: list[dict[str, Any]] = []
    prev = GENESIS_PREV
    for idx, (action, etype, eid, ts, public, actor, note) in enumerate(events):
        canonical = entity_representation(public)
        current = compute_current_hash(prev, canonical, ts, actor)
        signature = sign_hash(private_key, current)
        lgr_id = f"LGR-{5001 + idx}"
        if eid == "EVID-0099" and action == "create":
            note = "Auto ledger for evidence upload"
        rows.append(
            {
                "id": lgr_id,
                "action": action,
                "entity_type": etype,
                "entity_id": eid,
                "timestamp": ts,
                "actor_id": actor,
                "prev_hash": prev,
                "current_hash": current,
                "signature": signature,
                "notes": note,
                "_canonical": canonical,
            }
        )
        prev = current
    return rows


def kpi_payload(
    assets: list[dict[str, Any]],
    inspections: list[dict[str, Any]],
    incidents: list[dict[str, Any]],
    work_orders: list[dict[str, Any]],
) -> dict[str, Any]:
    open_inc = sum(1 for i in incidents if i["status"] in ("Open", "Investigating"))
    overdue_wo = 0
    for wo in work_orders:
        due = datetime.fromisoformat(wo["due_date"]).date()
        if wo["status"] in ("Open", "Assigned", "In Progress", "Overdue") and due < DEMO_NOW.date():
            overdue_wo += 1
    window_start = DEMO_NOW - timedelta(days=30)
    inspected = {
        i["asset_id"]
        for i in inspections
        if i["_dt"] >= window_start and i["status"] == "Completed"
    }
    pct = round(100.0 * len(inspected) / len(assets), 1)
    scores = [int(i["score"]) for i in inspections]
    avg = round(sum(scores) / len(scores), 1)
    return {
        "as_of": iso(DEMO_NOW),
        "open_incidents": open_inc,
        "overdue_work_orders": overdue_wo,
        "pct_assets_inspected_last_30_days": pct,
        "avg_inspection_score": avg,
        "counts": {
            "organizations": 5,
            "sites": 20,
            "assets": 50,
            "inspections": 200,
            "incidents": 30,
            "work_orders": 80,
            "evidence": 400,
            "ledger_entries": 500,
            "unique_images": 30,
        },
    }


def write_dashboards(
    kpis: dict[str, Any],
    incidents: list[dict[str, Any]],
    evidence: list[dict[str, Any]],
    ledger: list[dict[str, Any]],
) -> None:
    dash_dir = PKG_ROOT / "dashboards"
    dash_dir.mkdir(exist_ok=True)
    features = []
    for inc in incidents:
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [inc["_lon"], inc["_lat"]]},
                "properties": {
                    "id": inc["id"],
                    "site_id": inc["site_id"],
                    "severity": inc["severity"],
                    "status": inc["status"],
                    "description": inc["description"],
                    "date_time": inc["date_time"],
                },
            }
        )
    geo = {"type": "FeatureCollection", "features": features}
    (dash_dir / "incident_map.geojson").write_text(json.dumps(geo, indent=2), encoding="utf-8")

    exec_dash = {
        "id": "dash-exec-srm-demo",
        "name": "Executive Summary",
        "plan": PLAN_NAME,
        "theme": {
            "ink": "#12202a",
            "trust": "#0e7c66",
            "amber": "#c47a10",
            "danger": "#b42318",
            "paper": "#f3f5f7",
        },
        "kpis": [
            {"id": "open_incidents", "label": "Open incidents", "value": kpis["open_incidents"], "tone": "amber"},
            {"id": "overdue_wo", "label": "Overdue work orders", "value": kpis["overdue_work_orders"], "tone": "danger"},
            {
                "id": "inspected_30d",
                "label": "% assets inspected (30d)",
                "value": kpis["pct_assets_inspected_last_30_days"],
                "unit": "%",
                "tone": "trust",
            },
            {"id": "avg_score", "label": "Avg inspection score", "value": kpis["avg_inspection_score"], "tone": "trust"},
        ],
        "saved_filters": [
            {"id": "open-high", "label": "Open + High/Critical incidents", "where": {"status": ["Open"], "severity": ["High", "Critical"]}},
            {"id": "overdue-wo", "label": "Overdue work orders", "where": {"status": ["Overdue", "Open"], "due_before": "2026-09-01"}},
            {"id": "r72-hero", "label": "R72 Bridge 3 West trail", "where": {"site_id": "SITE-014"}},
        ],
        "widgets": [
            {"type": "kpi-row", "source": "kpis"},
            {"type": "table", "title": "Open incidents", "entity": "incident", "filter": "open-high"},
            {"type": "table", "title": "Overdue work orders", "entity": "work_order", "filter": "overdue-wo"},
            {"type": "bar", "title": "Inspections by score band", "entity": "inspection"},
        ],
        "recreate_ui": [
            "VIP / Institutional workspace → Dashboards → New dashboard → Executive Summary",
            "Add 4 KPI tiles mapped to incident status, work-order due/status, inspection recency, mean score",
            "Pin to Plan Owner dashboard; save filter 'R72 Bridge 3 West trail'",
        ],
    }
    map_dash = {
        "id": "dash-map-srm-demo",
        "name": "Incident Map",
        "plan": PLAN_NAME,
        "map": {
            "engine": "leaflet",
            "center": [-33.0, 26.5],
            "zoom": 7,
            "bounds": [[LAT_MIN, LON_MIN], [LAT_MAX, LON_MAX]],
            "geojson": "incident_map.geojson",
            "heatmap": {"weight_field": "severity", "weights": {"Low": 1, "Medium": 2, "High": 4, "Critical": 6}},
            "popup": {
                "title": "{id}",
                "body": "{description}",
                "links": [
                    "Open evidence for site",
                    "Open ledger chain for incident id",
                ],
            },
        },
        "filters": ["severity", "status", "site_id", "date_time"],
        "click_behaviour": "Open incident drawer with evidence thumbnails + ledger hashes for entity_id",
        "recreate_ui": [
            "Enable Mapping / GIS module",
            "Import dashboards/incident_map.geojson",
            "Heatmap by severity; click incident → evidence + ledger",
        ],
    }
    # Ten example chains around EVID-0099 and neighbours
    evid_idx = next(i for i, r in enumerate(ledger) if r["entity_id"] == "EVID-0099" and r["action"] == "create")
    start = max(0, evid_idx - 2)
    sample_chain = []
    for row in ledger[start : start + 10]:
        sample_chain.append(
            {
                "id": row["id"],
                "action": row["action"],
                "entity_type": row["entity_type"],
                "entity_id": row["entity_id"],
                "prev_hash": row["prev_hash"],
                "current_hash": row["current_hash"],
                "signature": row["signature"],
                "timestamp": row["timestamp"],
                "actor_id": row["actor_id"],
            }
        )
    evid_rows = [e for e in evidence if e["parent_id"] in ("INSP-1001", "INC-302") or e["id"] == "EVID-0099"][:8]
    audit_dash = {
        "id": "dash-audit-srm-demo",
        "name": "Audit Trail Viewer",
        "plan": PLAN_NAME,
        "search": {"placeholder": "Entity id (e.g. EVID-0099, INC-302, ASSET-210)", "quick_jumps": ["INSP-1001", "INC-302", "WO-075", "EVID-0099"]},
        "panels": [
            {"type": "entity-header"},
            {"type": "evidence-gallery", "fields": ["filename", "gps_lat", "gps_lon", "timestamp", "checksum"]},
            {"type": "ledger-chain", "fields": ["id", "action", "prev_hash", "current_hash", "signature"], "verify_public_key": "keys/ledger_ed25519_public.pem"},
        ],
        "sample_chain": sample_chain,
        "sample_evidence": evid_rows,
        "recreate_ui": [
            "Enable Ledger / Audit Trail module",
            "Add search-by-entity-id dashlet",
            "Show evidence GPS+timestamp and hash chain with signature verify using demo public key",
        ],
    }
    (dash_dir / "executive_summary.json").write_text(json.dumps(exec_dash, indent=2), encoding="utf-8")
    (dash_dir / "incident_map.json").write_text(json.dumps(map_dash, indent=2), encoding="utf-8")
    (dash_dir / "audit_trail_viewer.json").write_text(json.dumps(audit_dash, indent=2), encoding="utf-8")
    (dash_dir / "kpis.json").write_text(json.dumps(kpis, indent=2), encoding="utf-8")


def write_payloads(
    orgs: list[dict[str, Any]],
    sites: list[dict[str, Any]],
    assets: list[dict[str, Any]],
    inspections: list[dict[str, Any]],
    incidents: list[dict[str, Any]],
    work_orders: list[dict[str, Any]],
    evidence: list[dict[str, Any]],
    users: list[dict[str, Any]],
    ledger: list[dict[str, Any]],
) -> None:
    out = PKG_ROOT / "payloads"
    out.mkdir(exist_ok=True)
    plan = {
        "name": PLAN_NAME,
        "description": PLAN_DESCRIPTION,
        "visibility": "private",
        "account": "Chibase",
        "pin_to_dashboard": True,
        "snapshot_label": "Demo baseline (master)",
        "clone_label": "Demo — SANRAL",
        "modules": [
            "data_collection",
            "evidence_attachments",
            "ledger_audit_trail",
            "mapping_gis",
            "workflows_approvals",
            "reporting_dashboards",
            "integrations_api_csv",
            "offline_sync",
        ],
    }
    (out / "plan.json").write_text(json.dumps(plan, indent=2), encoding="utf-8")

    def public_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [{k: v for k, v in r.items() if not str(k).startswith("_")} for r in rows]

    mapping = {
        "organizations": public_rows(orgs),
        "sites": public_rows(sites),
        "assets": public_rows(assets),
        "inspections": public_rows(inspections),
        "incidents": public_rows(incidents),
        "work_orders": public_rows(work_orders),
        "evidence": public_rows(evidence),
        "users": public_rows(users),
        "ledger": public_rows(ledger),
    }
    (out / "entities.json").write_text(json.dumps(mapping, indent=2), encoding="utf-8")

    # Current Cloud DocType mapping (VIP-style TL Project / Incident / Evidence)
    site014 = next(s for s in sites if s["id"] == "SITE-014")
    cloud = {
        "note": "Use when importing into a VIP / live workspace via existing TL Project / TL Incident / TL Evidence DocTypes. Fill CUSTOMER with the Frappe Customer name (e.g. VIP Pilot — Chibase).",
        "customer": "${CUSTOMER}",
        "project": {
            "id": "PRJ-SRM-DEMO-001",
            "name": PLAN_NAME,
            "clientFunder": "Coastal District Municipality (synthetic)",
            "budgetTotal": 12500000,
            "budgetSpent": 1840000,
            "ward": "R72 corridor (illustrative)",
            "municipality": "Coastal District Municipality",
            "status": "Active",
            "contractorName": "Demo JV (synthetic)",
            "startDate": "2026-05-01",
            "targetEndDate": "2026-11-30",
            "publicSummary": PLAN_DESCRIPTION,
        },
        "hero_incident": {
            "id": "INC-302",
            "title": "Road washed-out over culvert (R72 Bridge 3 West)",
            "description": "Road washed-out over culvert; immediate closure recommended",
            "ward": "R72 Bridge 3 - West",
            "geographicArea": f"SITE-014 · {site014['latitude']},{site014['longitude']}",
            "status": "Open",
            "priority": "P2-High",
            "projectId": "PRJ-SRM-DEMO-001",
            "projectName": PLAN_NAME,
            "reportedByRole": "community",
            "filedByTier": "clo",
            "reportedAt": "2026-08-02T14:30:00Z",
        },
    }
    (out / "cloud_vip_mapping.json").write_text(json.dumps(cloud, indent=2), encoding="utf-8")


def write_report_template(kpis: dict[str, Any]) -> None:
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>TrustLedger SRM — Incident evidence pack (synthetic)</title>
  <style>
    :root {{ --ink:#12202a; --muted:#5b6b76; --trust:#0e7c66; --line:#d7dee4; --paper:#f3f5f7; --amber:#c47a10; }}
    body {{ font-family: "Source Sans 3", "DejaVu Sans", sans-serif; color: var(--ink); background: white; margin: 24px; }}
    h1 {{ font-family: "Source Serif 4", serif; font-size: 1.6rem; margin: 0 0 0.25rem; }}
    .meta {{ color: var(--muted); font-size: 0.85rem; }}
    .kpis {{ display: flex; gap: 12px; margin: 16px 0 24px; }}
    .kpi {{ flex: 1; border: 1px solid var(--line); border-radius: 8px; padding: 12px; }}
    .kpi b {{ display: block; font-size: 1.4rem; color: var(--trust); }}
    article {{ border-top: 1px solid var(--line); padding: 16px 0; page-break-inside: avoid; }}
    img {{ max-width: 320px; border-radius: 4px; }}
    code, .hash {{ font-family: ui-monospace, monospace; font-size: 0.72rem; word-break: break-all; }}
    .banner {{ background: #1f4b7a; color: white; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; }}
  </style>
</head>
<body>
  <p class="banner">SYNTHETIC DEMO — no real PII — Eastern Cape-like coordinates</p>
  <h1>Incident evidence pack</h1>
  <p class="meta">{PLAN_NAME}<br/>As of {kpis['as_of']} · Filter: SITE-014 / High+Open (example)</p>
  <div class="kpis">
    <div class="kpi"><span>Open incidents</span><b>{kpis['open_incidents']}</b></div>
    <div class="kpi"><span>Overdue work orders</span><b>{kpis['overdue_work_orders']}</b></div>
    <div class="kpi"><span>% inspected 30d</span><b>{kpis['pct_assets_inspected_last_30_days']}%</b></div>
    <div class="kpi"><span>Avg inspection score</span><b>{kpis['avg_inspection_score']}</b></div>
  </div>
  <article>
    <h2>INC-302 · Road washed-out over culvert</h2>
    <p>SITE-014 · R72 Bridge 3 - West · High · Open · 2026-08-02T14:30:00Z</p>
    <p>Reported by USER-PUB-01 (mock). Linked asset ASSET-210 · WO-075 due 2026-08-10.</p>
    <p><img src="../images/culvert_block_20260801.jpg" alt="Partial blockage at culvert (synthetic)"/></p>
    <p>Evidence <strong>EVID-0099</strong> · GPS -33.0002, 25.7001 · 2026-08-01T09:17:00Z<br/>
    Inspection <strong>INSP-1001</strong> score 72 · drainage partial_blocked</p>
    <p>Ledger hashes for this trail are resolved at export time from <code>ledger_entries.csv</code>
    (search entity_id INSP-1001, EVID-0099, INC-302, WO-075). Signature verification uses
    <code>keys/ledger_ed25519_public.pem</code>.</p>
    <p class="hash" id="ledger-hashes">{{{{ledger_chain}}}}</p>
  </article>
  <p class="meta">Render to PDF via browser Print → Save as PDF, or <code>wkhtmltopdf reports/incident_evidence_report.html out.pdf</code>.</p>
</body>
</html>
"""
    path = PKG_ROOT / "reports" / "incident_evidence_report.html"
    path.write_text(html, encoding="utf-8")
    tmpl = """{# TrustLedger SRM demo — incident evidence pack (Jinja-style)
   Fill incidents, evidence, ledger from CSV/JSON. Do not call Cloud LLM for this pack. #}
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>{{ plan_name }}</title></head>
<body>
<h1>{{ plan_name }} — filtered incidents</h1>
<p>As of {{ as_of }} · filter {{ filter_label }}</p>
{% for inc in incidents %}
  <section>
    <h2>{{ inc.id }} · {{ inc.description }}</h2>
    <p>{{ inc.site_id }} · {{ inc.severity }} · {{ inc.status }} · {{ inc.date_time }}</p>
    {% for ev in inc.evidence %}
      <figure>
        <img src="{{ images_dir }}/{{ ev.filename }}" alt="{{ ev.description }}"/>
        <figcaption>{{ ev.id }} · {{ ev.gps_lat }}, {{ ev.gps_lon }} · {{ ev.timestamp }} · {{ ev.checksum }}</figcaption>
      </figure>
    {% endfor %}
    <ol>
    {% for lgr in inc.ledger %}
      <li>{{ lgr.id }} {{ lgr.action }} {{ lgr.entity_type }}/{{ lgr.entity_id }}
          prev={{ lgr.prev_hash }} current={{ lgr.current_hash }} sig={{ lgr.signature }}</li>
    {% endfor %}
    </ol>
  </section>
{% endfor %}
</body></html>
"""
    (PKG_ROOT / "reports" / "incident_evidence_report.j2").write_text(tmpl, encoding="utf-8")


def public(row: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in row.items() if not str(k).startswith("_")}


def main() -> int:
    rng = random.Random(42)
    data = PKG_ROOT / "data"
    data.mkdir(exist_ok=True)

    users = USERS
    orgs = ORGS
    sites = [{**s} for s in SITES]
    assets = build_assets(rng)
    inspections = build_inspections(assets, rng)
    incidents = build_incidents(rng)
    work_orders = build_work_orders(incidents, assets, rng)
    evidence, _checksums, unique_meta = build_images_and_evidence(
        inspections, incidents, work_orders, assets, rng
    )
    ledger = build_ledger(orgs, sites, assets, inspections, incidents, work_orders, evidence)

    write_csv(
        data / "users_and_roles.csv",
        ["id", "username", "role", "email (mock)", "phone (mock)", "notes"],
        users,
    )
    write_csv(data / "organizations.csv", ["id", "name", "type", "region", "description"], orgs)
    write_csv(data / "sites.csv", ["id", "org_id", "name", "latitude", "longitude", "description"], sites)
    write_csv(
        data / "assets.csv",
        ["id", "site_id", "asset_type", "condition", "installation_date", "asset_tag", "notes"],
        [public(a) for a in assets],
    )
    write_csv(
        data / "inspections.csv",
        ["id", "asset_id", "inspector_id", "date_time", "score", "notes", "checklist_json", "status"],
        [public(i) for i in inspections],
    )
    write_csv(
        data / "incidents.csv",
        ["id", "site_id", "reported_by", "date_time", "severity", "status", "description"],
        [public(i) for i in incidents],
    )
    write_csv(
        data / "work_orders.csv",
        ["id", "incident_id", "asset_id", "created_by", "assigned_to", "due_date", "status", "cost_estimate", "notes"],
        work_orders,
    )
    write_csv(
        data / "evidence.csv",
        ["id", "parent_type", "parent_id", "filename", "file_type", "gps_lat", "gps_lon", "timestamp", "uploader_id", "checksum", "description"],
        evidence,
    )
    write_csv(
        data / "ledger_entries.csv",
        ["id", "action", "entity_type", "entity_id", "timestamp", "actor_id", "prev_hash", "current_hash", "signature", "notes"],
        [public(r) for r in ledger],
    )

    kpis = kpi_payload(assets, inspections, incidents, work_orders)
    write_dashboards(kpis, incidents, evidence, ledger)
    write_payloads(orgs, sites, assets, inspections, incidents, work_orders, evidence, users, ledger)
    write_report_template(kpis)

    manifest = {
        "plan": PLAN_NAME,
        "synthetic": True,
        "gps_bounds": {"lat": [LAT_MIN, LAT_MAX], "lon": [LON_MIN, LON_MAX]},
        "unique_images": [m["filename"] for m in unique_meta],
        "hero": {
            "organization": "ORG-001",
            "site": "SITE-014",
            "asset": "ASSET-210",
            "inspection": "INSP-1001",
            "incident": "INC-302",
            "work_order": "WO-075",
            "evidence": "EVID-0099",
        },
        "canonicalisation": "json.dumps(sort_keys=True, separators=(',', ':'), ensure_ascii=False)",
        "hash": "sha256(prev_hash + canonical_entity_representation + timestamp + actor_id); NULL prev treated as 64 zero hex chars",
        "signature": "ed25519 over UTF-8 current_hash; stored as sig:<base64>",
        "kpis": kpis,
    }
    (PKG_ROOT / "payloads" / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps({"generated": True, "kpis": kpis, "images": len(unique_meta), "ledger": len(ledger)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
