#!/usr/bin/env python3
"""Regenerate data/geo/za-mdb-2020.places.json from Downloads sources.

Usage (PowerShell):
  pip install openpyxl
  python scripts/ingest_za_geo.py
"""

from __future__ import annotations

import csv
import json
import re
import shutil
from collections import OrderedDict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "geo"
RAW = OUT_DIR / "raw"

TC_SRC = Path.home() / "Downloads" / "traditional_councils_frappe_import.csv"
XLSX_SRC = Path.home() / "Downloads" / "MDB_Wards_2020_5217612273586549231.xlsx"

PROVINCE_CODE = {
    "Eastern Cape": "EC",
    "Free State": "FS",
    "Gauteng": "GP",
    "KwaZulu-Natal": "KZN",
    "Limpopo": "LP",
    "Mpumalanga": "MP",
    "North West": "NW",
    "Northern Cape": "NC",
    "Western Cape": "WC",
}


def main() -> None:
    if not XLSX_SRC.exists():
        raise SystemExit(f"Missing {XLSX_SRC}")
    if not TC_SRC.exists():
        raise SystemExit(f"Missing {TC_SRC}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    shutil.copy2(TC_SRC, RAW / "traditional_councils_frappe_import.csv")

    places: OrderedDict[str, dict] = OrderedDict()

    def add(place: dict) -> None:
        places[place["id"]] = place

    add(
        {
            "id": "za",
            "code": "ZA",
            "name": "South Africa",
            "level": "country",
            "parentId": None,
            "countryCode": "ZA",
            "packId": "za-mdb-2020",
        }
    )
    for name, code in PROVINCE_CODE.items():
        add(
            {
                "id": f"za-{code.lower()}",
                "code": code,
                "name": name,
                "level": "province",
                "parentId": "za",
                "countryCode": "ZA",
                "packId": "za-mdb-2020",
            }
        )

    wb = openpyxl.load_workbook(XLSX_SRC, read_only=True, data_only=True)
    ws = wb.active
    headers = None
    ward_rows = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            headers = [str(c) if c is not None else "" for c in row]
            continue
        ward_rows.append(dict(zip(headers, row)))
    wb.close()

    districts: set[str] = set()
    munis: set[str] = set()

    for r in ward_rows:
        prov = r["Province"]
        pcode = PROVINCE_CODE[prov]
        prov_id = f"za-{pcode.lower()}"
        dcode = str(r["DistrictCo"] or "").strip()
        dname = str(r["district_or_metro"] or "").strip()
        cat_b = str(r["CAT_B"] or "").strip()
        muni_name = str(r["local_municipality"] or "").strip()
        ward_id_raw = str(r["ward_identifier"] or "").strip()
        ward_no = r["WardNo"]
        ward_label = str(r["WardLabel"] or "").strip()

        dist_id = f"za-dist-{dcode.lower()}"
        if dist_id not in districts:
            districts.add(dist_id)
            add(
                {
                    "id": dist_id,
                    "code": dcode,
                    "name": dname,
                    "level": "district",
                    "parentId": prov_id,
                    "countryCode": "ZA",
                    "packId": "za-mdb-2020",
                    "meta": {"metroDistrict": not dcode.upper().startswith("DC")},
                }
            )

        muni_id = f"za-muni-{cat_b.lower()}"
        if muni_id not in munis:
            munis.add(muni_id)
            is_metro = "metropolitan" in muni_name.lower() or not dcode.upper().startswith(
                "DC"
            )
            add(
                {
                    "id": muni_id,
                    "code": cat_b,
                    "name": muni_name,
                    "level": "metro" if is_metro else "local_municipality",
                    "parentId": dist_id,
                    "countryCode": "ZA",
                    "packId": "za-mdb-2020",
                }
            )

        add(
            {
                "id": f"za-ward-{ward_id_raw}",
                "code": ward_label or ward_id_raw,
                "name": f"Ward {ward_no}",
                "level": "ward",
                "parentId": muni_id,
                "countryCode": "ZA",
                "packId": "za-mdb-2020",
                "meta": {
                    "wardNo": ward_no,
                    "wardIdentifier": ward_id_raw,
                    "mdbYear": 2020,
                },
            }
        )

    name_to_dist: dict[str, str] = {}
    for p in places.values():
        if p["level"] == "district":
            key = re.sub(r"[^a-z0-9]", "", p["name"].lower())
            name_to_dist[key] = p["id"]
            if "ortambo" in key:
                name_to_dist["ortambo"] = p["id"]

    with TC_SRC.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            code = (row.get("council_code") or "").strip()
            name = (row.get("name") or "").strip()
            if not code or not name:
                continue
            dist_name = (row.get("district_municipality") or "").strip()
            key = re.sub(r"[^a-z0-9]", "", dist_name.lower())
            parent = name_to_dist.get(key) or name_to_dist.get("ortambo") or "za-ec"
            place: dict = {
                "id": f"za-tc-{code.lower()}",
                "code": code,
                "name": name,
                "level": "traditional_council",
                "parentId": parent,
                "countryCode": "ZA",
                "packId": "za-mdb-2020",
                "meta": {
                    k: v
                    for k, v in {
                        "kingdom": (row.get("kingdom") or "").strip() or None,
                        "administrativeSeat": (row.get("administrative_seat") or "").strip()
                        or None,
                        "traditionalLeader": (row.get("traditional_leader") or "").strip()
                        or None,
                        "status": (row.get("status") or "").strip() or None,
                        "localMunicipality": (row.get("local_municipality") or "").strip()
                        or None,
                        "notes": (row.get("notes") or "").strip() or None,
                    }.items()
                    if v is not None
                },
            }
            if not place["meta"]:
                del place["meta"]
            for coord, key_name in (("latitude", "lat"), ("longitude", "lng")):
                raw = row.get(coord) or ""
                if raw not in ("", None):
                    try:
                        place[key_name] = float(raw)
                    except ValueError:
                        pass
            add(place)

    out = {
        "pack": {
            "id": "za-mdb-2020",
            "countryCode": "ZA",
            "countryName": "South Africa",
            "label": "South Africa — MDB Wards 2020 + traditional councils",
            "levels": [
                "country",
                "province",
                "district",
                "local_municipality",
                "metro",
                "traditional_council",
                "ward",
            ],
            "sources": [
                "MDB_Wards_2020 (Municipal Demarcation Board)",
                "traditional_councils_frappe_import.csv",
            ],
            "notes": "Socio-economic indicators (Stats SA) layered later. Additional country packs use the same schema.",
        },
        "places": list(places.values()),
        "indicators": [],
    }
    out_path = OUT_DIR / "za-mdb-2020.places.json"
    out_path.write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {out_path} ({out_path.stat().st_size} bytes, {len(places)} places)")


if __name__ == "__main__":
    main()
