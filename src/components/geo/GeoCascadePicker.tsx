"use client";

import { useCallback, useEffect, useState } from "react";
import type { GeoPlace } from "@/types/geo";
import type { IncidentGeoContext } from "@/types/incident";

type CascadeSelection = {
  country?: GeoPlace;
  province?: GeoPlace;
  district?: GeoPlace;
  municipality?: GeoPlace;
  traditionalCouncil?: GeoPlace;
  ward?: GeoPlace;
};

type GeoCascadePickerProps = {
  onChange: (ctx: IncidentGeoContext, label: string) => void;
};

async function fetchPlaces(params: Record<string, string>) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`/api/geo?${qs.toString()}`);
  if (!res.ok) throw new Error("Geo lookup failed");
  const data = (await res.json()) as { places?: GeoPlace[] };
  return data.places ?? [];
}

async function fetchAncestors(id: string) {
  const res = await fetch(`/api/geo?id=${encodeURIComponent(id)}&ancestors=1`);
  if (!res.ok) throw new Error("Geo ancestors failed");
  const data = (await res.json()) as { breadcrumbs?: GeoPlace[] };
  return data.breadcrumbs ?? [];
}

function ctxFromSelection(sel: CascadeSelection): IncidentGeoContext {
  return {
    countryCode: sel.country?.code || "ZA",
    countryName: sel.country?.name || "South Africa",
    provinceId: sel.province?.id,
    provinceName: sel.province?.name,
    districtId: sel.district?.id,
    districtName: sel.district?.name,
    municipalityId: sel.municipality?.id,
    municipalityName: sel.municipality?.name,
    traditionalCouncilId: sel.traditionalCouncil?.id,
    traditionalCouncilName: sel.traditionalCouncil?.name,
    wardId: sel.ward?.id,
    wardName: sel.ward?.name,
    placeId:
      sel.ward?.id ||
      sel.traditionalCouncil?.id ||
      sel.municipality?.id ||
      sel.district?.id ||
      sel.province?.id,
  };
}

function labelFromCtx(ctx: IncidentGeoContext): string {
  return [
    ctx.wardName,
    ctx.traditionalCouncilName,
    ctx.municipalityName,
    ctx.districtName,
    ctx.provinceName,
    ctx.countryName,
  ]
    .filter(Boolean)
    .join(" · ");
}

function uniqueById(places: GeoPlace[]): GeoPlace[] {
  const seen = new Set<string>();
  return places.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

/**
 * Cascading geo picker — any entry level fills parents via breadcrumbs.
 * District loads cities + traditional councils; municipality loads wards.
 */
export function GeoCascadePicker({ onChange }: GeoCascadePickerProps) {
  const [provinces, setProvinces] = useState<GeoPlace[]>([]);
  const [districts, setDistricts] = useState<GeoPlace[]>([]);
  const [municipalities, setMunicipalities] = useState<GeoPlace[]>([]);
  const [councils, setCouncils] = useState<GeoPlace[]>([]);
  const [wards, setWards] = useState<GeoPlace[]>([]);
  const [sel, setSel] = useState<CascadeSelection>({});
  const [wardQuery, setWardQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [countryKids, countryRes] = await Promise.all([
          fetchPlaces({ parentId: "za", limit: "20" }),
          fetch(`/api/geo?id=za`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setProvinces(countryKids.filter((p) => p.level === "province"));
        const c = (countryRes as { place?: GeoPlace }).place;
        if (c) setSel((s) => ({ ...s, country: c }));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load places");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const emit = useCallback(
    (next: CascadeSelection) => {
      const ctx = ctxFromSelection(next);
      onChange(ctx, labelFromCtx(ctx) || "Location pending");
    },
    [onChange],
  );

  async function loadDependents(next: CascadeSelection) {
    if (next.province) {
      const dist = await fetchPlaces({
        parentId: next.province.id,
        limit: "100",
      });
      setDistricts(dist.filter((d) => d.level === "district"));
    } else {
      setDistricts([]);
    }

    if (next.district) {
      const under = await fetchPlaces({
        parentId: next.district.id,
        limit: "400",
      });
      setMunicipalities(
        under.filter(
          (m) => m.level === "metro" || m.level === "local_municipality",
        ),
      );
      setCouncils(
        uniqueById(under.filter((p) => p.level === "traditional_council")),
      );
    } else {
      setMunicipalities([]);
      setCouncils([]);
    }

    if (next.municipality) {
      const w = await fetchPlaces({
        parentId: next.municipality.id,
        level: "ward",
        limit: "400",
      });
      setWards(w);
    } else if (next.district) {
      // Wards for all munis in district (when TC/DM chosen before city)
      const munis = await fetchPlaces({
        parentId: next.district.id,
        limit: "400",
      });
      const muniIds = munis
        .filter(
          (m) => m.level === "metro" || m.level === "local_municipality",
        )
        .map((m) => m.id);
      const wardBatches = await Promise.all(
        muniIds.slice(0, 12).map((id) =>
          fetchPlaces({ parentId: id, level: "ward", limit: "80" }),
        ),
      );
      setWards(uniqueById(wardBatches.flat()).slice(0, 400));
    } else {
      setWards([]);
    }
  }

  async function applyPlace(place: GeoPlace) {
    setBusy(true);
    setError(null);
    try {
      const crumbs = await fetchAncestors(place.id);
      const next: CascadeSelection = {
        country: crumbs.find((c) => c.level === "country"),
        province: crumbs.find((c) => c.level === "province"),
        district: crumbs.find((c) => c.level === "district"),
        municipality: crumbs.find(
          (c) => c.level === "metro" || c.level === "local_municipality",
        ),
        traditionalCouncil: crumbs.find((c) => c.level === "traditional_council"),
        ward: crumbs.find((c) => c.level === "ward"),
      };
      if (place.level === "ward") next.ward = place;
      if (place.level === "traditional_council") {
        next.traditionalCouncil = place;
        // Keep previously chosen municipality if still under same district
        if (
          sel.municipality &&
          next.district &&
          sel.district?.id === next.district.id
        ) {
          next.municipality = sel.municipality;
        }
      }
      if (place.level === "metro" || place.level === "local_municipality") {
        next.municipality = place;
        next.ward = undefined;
      }
      if (place.level === "district") {
        next.district = place;
        next.municipality = undefined;
        next.traditionalCouncil = undefined;
        next.ward = undefined;
      }
      if (place.level === "province") {
        next.province = place;
        next.district = undefined;
        next.municipality = undefined;
        next.traditionalCouncil = undefined;
        next.ward = undefined;
      }

      setSel(next);
      await loadDependents(next);
      emit(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cascade failed");
    } finally {
      setBusy(false);
    }
  }

  async function searchWard() {
    const q = wardQuery.trim();
    if (q.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        level: "ward",
        query: q,
        limit: "40",
      };
      if (sel.municipality) params.parentId = sel.municipality.id;
      const found = await fetchPlaces(params);
      setWards(found);
      if (found.length === 1) await applyPlace(found[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ward search failed");
    } finally {
      setBusy(false);
    }
  }

  async function searchCity() {
    const q = cityQuery.trim();
    if (q.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const found = uniqueById([
        ...(await fetchPlaces({
          level: "local_municipality",
          query: q,
          limit: "40",
        })),
        ...(await fetchPlaces({ level: "metro", query: q, limit: "20" })),
      ]);
      setMunicipalities(found);
      if (found.length === 1) await applyPlace(found[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "City search failed");
    } finally {
      setBusy(false);
    }
  }

  const filteredWards = wards;

  return (
    <fieldset className="space-y-3 rounded-lg border border-tl-line bg-tl-paper/50 p-4">
      <legend className="px-1 text-sm font-semibold text-tl-ink">
        Location (cascading)
      </legend>
      <p className="text-xs text-tl-ink-muted">
        Start at any level — parents fill automatically. City/municipality loads
        wards; district loads traditional councils and municipalities.
      </p>
      {error ? <p className="text-sm text-tl-danger">{error}</p> : null}
      {busy ? (
        <p className="text-xs text-tl-ink-muted">Updating location…</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Province</span>
          <select
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
            value={sel.province?.id || ""}
            onChange={(e) => {
              const p = provinces.find((x) => x.id === e.target.value);
              if (p) void applyPlace(p);
            }}
          >
            <option value="">Select province</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            District municipality (DM)
          </span>
          <select
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
            value={sel.district?.id || ""}
            disabled={!districts.length && !sel.district}
            onChange={(e) => {
              const p = districts.find((x) => x.id === e.target.value);
              if (p) void applyPlace(p);
            }}
          >
            <option value="">Select district</option>
            {districts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">City / municipality</span>
            <select
              className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
              value={sel.municipality?.id || ""}
              disabled={!municipalities.length && !sel.municipality}
              onChange={(e) => {
                const p = municipalities.find((x) => x.id === e.target.value);
                if (p) void applyPlace(p);
              }}
            >
              <option value="">Select municipality</option>
              {municipalities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <input
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void searchCity();
                }
              }}
              className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
              placeholder="Or search city (e.g. Beaufort) — fills DM/province"
            />
            <button
              type="button"
              onClick={() => void searchCity()}
              className="shrink-0 rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Find
            </button>
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Traditional council</span>
          <select
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
            value={sel.traditionalCouncil?.id || ""}
            disabled={!councils.length && !sel.traditionalCouncil}
            onChange={(e) => {
              const p = councils.find((x) => x.id === e.target.value);
              if (p) void applyPlace(p);
            }}
          >
            <option value="">Optional — select TC</option>
            {councils.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Ward search</span>
            <div className="flex gap-2">
              <input
                value={wardQuery}
                onChange={(e) => setWardQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void searchWard();
                  }
                }}
                className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
                placeholder="Code or name (e.g. WC053_1) — parents fill on select"
              />
              <button
                type="button"
                onClick={() => void searchWard()}
                className="shrink-0 rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper"
              >
                Find
              </button>
            </div>
          </label>
        </div>

        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Ward</span>
          <select
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
            value={sel.ward?.id || ""}
            disabled={!filteredWards.length}
            onChange={(e) => {
              const p = filteredWards.find((x) => x.id === e.target.value);
              if (p) void applyPlace(p);
            }}
          >
            <option value="">Select ward</option>
            {filteredWards.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-tl-ink-muted">
        Resolved:{" "}
        <span className="font-medium text-tl-ink">
          {labelFromCtx(ctxFromSelection(sel)) || "—"}
        </span>
      </p>
    </fieldset>
  );
}
