"use client";

/**
 * Sequential geo cascade (ADR-041):
 * Country → Province → Town → DM → TC → Ward
 * Dropdowns from platform pack; each level can add a custom place if missing.
 */

import { useCallback, useEffect, useId, useState } from "react";
import type { GeoLevel, GeoPlace } from "@/types/geo";
import type { IncidentGeoContext } from "@/types/incident";

export const GEO_CASCADE_SEQUENCE = [
  "country",
  "province",
  "town",
  "dm",
  "tc",
  "ward",
] as const;

export type GeoCascadeStep = (typeof GEO_CASCADE_SEQUENCE)[number];

type CascadeSelection = {
  country?: GeoPlace;
  province?: GeoPlace;
  town?: GeoPlace;
  dm?: GeoPlace;
  tc?: GeoPlace;
  ward?: GeoPlace;
};

type GeoCascadePickerProps = {
  onChange: (ctx: IncidentGeoContext, label: string) => void;
  /** When true, require ward before treating location as complete (default true). */
  requireWard?: boolean;
};

const CUSTOM_STORAGE_KEY = "tl-custom-geo-places";
const ADD_VALUE = "__add__";
const NONE_TC_VALUE = "__none__";

async function fetchPlaces(params: Record<string, string>) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`/api/geo?${qs.toString()}`);
  if (!res.ok) throw new Error("Geo lookup failed");
  const data = (await res.json()) as { places?: GeoPlace[] };
  return data.places ?? [];
}

async function fetchAncestors(id: string) {
  if (id.startsWith("custom:")) return [] as GeoPlace[];
  const res = await fetch(`/api/geo?id=${encodeURIComponent(id)}&ancestors=1`);
  if (!res.ok) throw new Error("Geo ancestors failed");
  const data = (await res.json()) as { breadcrumbs?: GeoPlace[] };
  return data.breadcrumbs ?? [];
}

function uniqueById(places: GeoPlace[]): GeoPlace[] {
  const seen = new Set<string>();
  return places.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function sortByName(places: GeoPlace[]): GeoPlace[] {
  return [...places].sort((a, b) => a.name.localeCompare(b.name));
}

function readCustomPlaces(): GeoPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GeoPlace[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomPlaces(places: GeoPlace[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(places));
}

function makeCustomPlace(args: {
  name: string;
  level: GeoLevel;
  parentId: string | null;
  countryCode: string;
  packId: string;
}): GeoPlace {
  const slug = args.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const id = `custom:${args.level}:${slug || Date.now()}`;
  return {
    id,
    code: `CUSTOM-${args.level.toUpperCase().slice(0, 3)}`,
    name: args.name.trim(),
    level: args.level,
    parentId: args.parentId,
    countryCode: args.countryCode,
    packId: args.packId || "custom-tenant",
    meta: { custom: true },
  };
}

function customsUnder(
  parentId: string | null,
  level: GeoLevel | GeoLevel[],
): GeoPlace[] {
  const levels = Array.isArray(level) ? level : [level];
  return readCustomPlaces().filter(
    (p) => p.parentId === parentId && levels.includes(p.level),
  );
}

function ctxFromSelection(sel: CascadeSelection): IncidentGeoContext {
  return {
    countryCode: sel.country?.code || "ZA",
    countryName: sel.country?.name || "South Africa",
    provinceId: sel.province?.id,
    provinceName: sel.province?.name,
    districtId: sel.dm?.id,
    districtName: sel.dm?.name,
    municipalityId: sel.town?.id,
    municipalityName: sel.town?.name,
    traditionalCouncilId: sel.tc?.id,
    traditionalCouncilName: sel.tc?.name,
    wardId: sel.ward?.id,
    wardName: sel.ward?.name,
    placeId:
      sel.ward?.id ||
      sel.tc?.id ||
      sel.town?.id ||
      sel.dm?.id ||
      sel.province?.id,
  };
}

export function labelFromGeoCtx(ctx: IncidentGeoContext): string {
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

function LevelSelect({
  label,
  value,
  options,
  disabled,
  placeholder,
  onSelect,
  onRequestAdd,
  allowNone,
  noneLabel,
}: {
  label: string;
  value: string;
  options: GeoPlace[];
  disabled?: boolean;
  placeholder: string;
  onSelect: (place: GeoPlace | null) => void;
  onRequestAdd: () => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const selectId = useId();
  return (
    <label className="block text-sm" htmlFor={selectId}>
      <span className="mb-1 block font-medium text-tl-ink">{label}</span>
      <select
        id={selectId}
        className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 disabled:opacity-60"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          if (v === ADD_VALUE) {
            onRequestAdd();
            return;
          }
          if (v === NONE_TC_VALUE || v === "") {
            onSelect(null);
            return;
          }
          const place = options.find((o) => o.id === v) || null;
          onSelect(place);
        }}
      >
        <option value="">{placeholder}</option>
        {allowNone ? (
          <option value={NONE_TC_VALUE}>{noneLabel || "None / not applicable"}</option>
        ) : null}
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.meta?.custom ? " (added)" : p.code ? ` · ${p.code}` : ""}
          </option>
        ))}
        <option value={ADD_VALUE}>+ Add if not listed…</option>
      </select>
    </label>
  );
}

/**
 * Locked SA site location cascade — pack dropdowns + optional custom add.
 */
export function GeoCascadePicker({
  onChange,
  requireWard = true,
}: GeoCascadePickerProps) {
  const [countries, setCountries] = useState<GeoPlace[]>([]);
  const [provinces, setProvinces] = useState<GeoPlace[]>([]);
  const [towns, setTowns] = useState<GeoPlace[]>([]);
  const [dms, setDms] = useState<GeoPlace[]>([]);
  const [tcs, setTcs] = useState<GeoPlace[]>([]);
  const [wards, setWards] = useState<GeoPlace[]>([]);
  const [sel, setSel] = useState<CascadeSelection>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<GeoCascadeStep | null>(null);
  const [addName, setAddName] = useState("");
  const [tcSkipped, setTcSkipped] = useState(false);

  const emit = useCallback(
    (next: CascadeSelection) => {
      const ctx = ctxFromSelection(next);
      onChange(ctx, labelFromGeoCtx(ctx) || "Location pending");
    },
    [onChange],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const countryRows = await fetchPlaces({ level: "country", limit: "20" });
        if (cancelled) return;
        const list = sortByName(countryRows);
        setCountries(list);
        const za = list.find((c) => c.code === "ZA" || c.id === "za") || list[0];
        if (za) {
          setSel((s) => ({ ...s, country: za }));
          const kids = await fetchPlaces({ parentId: za.id, limit: "40" });
          if (cancelled) return;
          setProvinces(
            sortByName([
              ...kids.filter((p) => p.level === "province"),
              ...customsUnder(za.id, "province"),
            ]),
          );
          emit({ country: za });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load places");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount bootstrap only
  }, []);

  async function loadTownsForProvince(province: GeoPlace) {
    const districts = await fetchPlaces({
      parentId: province.id,
      level: "district",
      limit: "100",
    });
    const batches = await Promise.all(
      districts.map((d) => fetchPlaces({ parentId: d.id, limit: "200" })),
    );
    const munis = uniqueById(
      batches.flat().filter(
        (m) => m.level === "metro" || m.level === "local_municipality",
      ),
    );
    return sortByName([
      ...munis,
      ...customsUnder(province.id, ["local_municipality", "metro", "custom"]),
      ...districts.flatMap((d) =>
        customsUnder(d.id, ["local_municipality", "metro", "custom"]),
      ),
    ]);
  }

  async function selectCountry(place: GeoPlace | null) {
    if (!place) return;
    setBusy(true);
    setError(null);
    setAdding(null);
    try {
      const kids = await fetchPlaces({ parentId: place.id, limit: "40" });
      const next: CascadeSelection = { country: place };
      setSel(next);
      setProvinces(
        sortByName([
          ...kids.filter((p) => p.level === "province"),
          ...customsUnder(place.id, "province"),
        ]),
      );
      setTowns([]);
      setDms([]);
      setTcs([]);
      setWards([]);
      setTcSkipped(false);
      emit(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load provinces");
    } finally {
      setBusy(false);
    }
  }

  async function selectProvince(place: GeoPlace | null) {
    if (!place || !sel.country) return;
    setBusy(true);
    setError(null);
    setAdding(null);
    try {
      const townList = place.id.startsWith("custom:")
        ? sortByName(customsUnder(place.id, ["local_municipality", "metro", "custom"]))
        : await loadTownsForProvince(place);
      const next: CascadeSelection = {
        country: sel.country,
        province: place,
      };
      setSel(next);
      setTowns(townList);
      setDms([]);
      setTcs([]);
      setWards([]);
      setTcSkipped(false);
      emit(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load towns");
    } finally {
      setBusy(false);
    }
  }

  async function selectTown(place: GeoPlace | null) {
    if (!place || !sel.country || !sel.province) return;
    setBusy(true);
    setError(null);
    setAdding(null);
    try {
      let dm: GeoPlace | undefined;
      let dmOptions: GeoPlace[] = [];

      if (!place.id.startsWith("custom:")) {
        const crumbs = await fetchAncestors(place.id);
        dm = crumbs.find((c) => c.level === "district");
        if (dm) {
          dmOptions = [dm];
        } else if (sel.province && !sel.province.id.startsWith("custom:")) {
          dmOptions = await fetchPlaces({
            parentId: sel.province.id,
            level: "district",
            limit: "100",
          });
        }
      } else if (sel.province) {
        dmOptions = sortByName([
          ...(sel.province.id.startsWith("custom:")
            ? []
            : await fetchPlaces({
                parentId: sel.province.id,
                level: "district",
                limit: "100",
              })),
          ...customsUnder(sel.province.id, ["district", "custom"]),
        ]);
      }
      dmOptions = sortByName(
        uniqueById([
          ...dmOptions,
          ...customsUnder(sel.province.id, ["district", "custom"]),
          ...(dm ? customsUnder(dm.id, ["district", "custom"]) : []),
        ]),
      );

      const next: CascadeSelection = {
        country: sel.country,
        province: sel.province,
        town: place,
        dm,
      };
      setSel(next);
      setDms(dmOptions.length ? dmOptions : dm ? [dm] : []);
      setTcs([]);
      setWards([]);
      setTcSkipped(false);

      if (dm) {
        await loadTcAndPrepare(next, dm);
      } else {
        emit(next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resolve district");
    } finally {
      setBusy(false);
    }
  }

  async function loadWardsForTown(town: GeoPlace) {
    let wardList: GeoPlace[] = [];
    if (!town.id.startsWith("custom:")) {
      wardList = await fetchPlaces({
        parentId: town.id,
        level: "ward",
        limit: "500",
      });
    }
    return sortByName(
      uniqueById([
        ...wardList,
        ...customsUnder(town.id, ["ward", "custom", "village"]),
      ]),
    ).sort((a, b) =>
      String(a.meta?.wardNo ?? a.code).localeCompare(
        String(b.meta?.wardNo ?? b.code),
        undefined,
        { numeric: true },
      ),
    );
  }

  async function loadTcAndPrepare(base: CascadeSelection, dm: GeoPlace) {
    let councils: GeoPlace[] = [];
    if (!dm.id.startsWith("custom:")) {
      const under = await fetchPlaces({ parentId: dm.id, limit: "400" });
      councils = under.filter((p) => p.level === "traditional_council");
    }
    councils = sortByName(
      uniqueById([...councils, ...customsUnder(dm.id, ["traditional_council", "custom"])]),
    );
    setTcs(councils);
    // No seeded TCs → skip TC and unlock wards so sequence does not stall
    if (councils.length === 0 && base.town) {
      setTcSkipped(true);
      const next = { ...base, tc: undefined };
      setSel(next);
      setWards(await loadWardsForTown(base.town));
      emit(next);
      return;
    }
    emit(base);
  }

  async function selectDm(place: GeoPlace | null) {
    if (!place || !sel.country || !sel.province || !sel.town) return;
    setBusy(true);
    setError(null);
    setAdding(null);
    try {
      const next: CascadeSelection = {
        country: sel.country,
        province: sel.province,
        town: sel.town,
        dm: place,
      };
      setSel(next);
      setWards([]);
      setTcSkipped(false);
      await loadTcAndPrepare(next, place);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load traditional councils");
    } finally {
      setBusy(false);
    }
  }

  async function selectTc(place: GeoPlace | null) {
    if (!sel.country || !sel.province || !sel.town || !sel.dm) return;
    setBusy(true);
    setError(null);
    setAdding(null);
    try {
      setTcSkipped(place === null);
      const next: CascadeSelection = {
        country: sel.country,
        province: sel.province,
        town: sel.town,
        dm: sel.dm,
        tc: place || undefined,
      };
      setSel(next);
      setWards(await loadWardsForTown(sel.town));
      emit(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load wards");
    } finally {
      setBusy(false);
    }
  }

  function selectWard(place: GeoPlace | null) {
    if (!place || !sel.country || !sel.province || !sel.town || !sel.dm) return;
    if (!sel.tc && !tcSkipped) {
      // Allow ward if TC list empty (nothing to choose)
      if (tcs.length > 0) {
        setError("Select a traditional council, or choose None / not applicable.");
        return;
      }
      setTcSkipped(true);
    }
    setAdding(null);
    const next: CascadeSelection = {
      ...sel,
      ward: place,
    };
    setSel(next);
    emit(next);
  }

  function commitCustom(step: GeoCascadeStep) {
    const name = addName.trim();
    if (!name) {
      setError("Enter a name to add.");
      return;
    }
    const countryCode = sel.country?.code || "ZA";
    const packId = sel.country?.packId || "custom-tenant";

    let parentId: string | null = null;
    let level: GeoLevel = "custom";

    if (step === "country") {
      parentId = null;
      level = "country";
    } else if (step === "province") {
      if (!sel.country) return;
      parentId = sel.country.id;
      level = "province";
    } else if (step === "town") {
      if (!sel.province) return;
      parentId = sel.province.id;
      level = "local_municipality";
    } else if (step === "dm") {
      if (!sel.province) return;
      parentId = sel.province.id;
      level = "district";
    } else if (step === "tc") {
      if (!sel.dm) return;
      parentId = sel.dm.id;
      level = "traditional_council";
    } else if (step === "ward") {
      if (!sel.town) return;
      parentId = sel.town.id;
      level = "ward";
    }

    const place = makeCustomPlace({ name, level, parentId, countryCode, packId });
    const all = uniqueById([...readCustomPlaces(), place]);
    writeCustomPlaces(all);
    setAddName("");
    setAdding(null);
    setError(null);

    if (step === "country") {
      setCountries((prev) => sortByName(uniqueById([...prev, place])));
      void selectCountry(place);
    } else if (step === "province") {
      setProvinces((prev) => sortByName(uniqueById([...prev, place])));
      void selectProvince(place);
    } else if (step === "town") {
      setTowns((prev) => sortByName(uniqueById([...prev, place])));
      void selectTown(place);
    } else if (step === "dm") {
      setDms((prev) => sortByName(uniqueById([...prev, place])));
      void selectDm(place);
    } else if (step === "tc") {
      setTcs((prev) => sortByName(uniqueById([...prev, place])));
      void selectTc(place);
    } else if (step === "ward") {
      setWards((prev) => sortByName(uniqueById([...prev, place])));
      selectWard(place);
    }
  }

  const resolved = labelFromGeoCtx(ctxFromSelection(sel));
  const complete = Boolean(sel.ward) || (!requireWard && Boolean(sel.town && sel.dm));

  return (
    <fieldset className="space-y-3 rounded-lg border border-tl-line bg-tl-paper/50 p-4">
      <legend className="px-1 text-sm font-semibold text-tl-ink">
        Location (required sequence)
      </legend>
      <p className="text-xs text-tl-ink-muted">
        Country → Province → Town → DM → Traditional council → Ward. Choose from
        pre-loaded South African place data, or add a place if yours is missing.
      </p>
      {error ? <p className="text-sm text-tl-danger">{error}</p> : null}
      {busy ? (
        <p className="text-xs text-tl-ink-muted">Updating location…</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <LevelSelect
          label="1. Country"
          value={sel.country?.id || ""}
          options={countries}
          placeholder="Select country"
          onSelect={(p) => void selectCountry(p)}
          onRequestAdd={() => {
            setAdding("country");
            setAddName("");
          }}
        />

        <LevelSelect
          label="2. Province"
          value={sel.province?.id || ""}
          options={provinces}
          disabled={!sel.country}
          placeholder="Select province"
          onSelect={(p) => void selectProvince(p)}
          onRequestAdd={() => {
            setAdding("province");
            setAddName("");
          }}
        />

        <LevelSelect
          label="3. Town / municipality"
          value={sel.town?.id || ""}
          options={towns}
          disabled={!sel.province}
          placeholder="Select town"
          onSelect={(p) => void selectTown(p)}
          onRequestAdd={() => {
            setAdding("town");
            setAddName("");
          }}
        />

        <LevelSelect
          label="4. District municipality (DM)"
          value={sel.dm?.id || ""}
          options={dms}
          disabled={!sel.town}
          placeholder="Select DM"
          onSelect={(p) => void selectDm(p)}
          onRequestAdd={() => {
            setAdding("dm");
            setAddName("");
          }}
        />

        <LevelSelect
          label="5. Traditional council (TC)"
          value={
            tcSkipped && !sel.tc ? NONE_TC_VALUE : sel.tc?.id || ""
          }
          options={tcs}
          disabled={!sel.dm}
          placeholder="Select TC"
          allowNone
          noneLabel="None / not applicable"
          onSelect={(p) => void selectTc(p)}
          onRequestAdd={() => {
            setAdding("tc");
            setAddName("");
          }}
        />

        <LevelSelect
          label="6. Ward"
          value={sel.ward?.id || ""}
          options={wards}
          disabled={!sel.dm || (!sel.tc && !tcSkipped && tcs.length > 0)}
          placeholder="Select ward"
          onSelect={(p) => selectWard(p)}
          onRequestAdd={() => {
            setAdding("ward");
            setAddName("");
          }}
        />
      </div>

      {adding ? (
        <div className="rounded-md border border-dashed border-tl-line bg-tl-surface px-3 py-3">
          <p className="text-sm font-medium text-tl-ink">
            Add {adding === "dm" ? "district municipality" : adding === "tc" ? "traditional council" : adding === "town" ? "town / municipality" : adding}
          </p>
          <p className="mt-1 text-xs text-tl-ink-muted">
            Saved for this browser workspace and attached to your selection.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitCustom(adding);
                }
              }}
              className="min-w-[12rem] flex-1 rounded-md border border-tl-line px-3 py-2 text-sm"
              placeholder="Name as used on site"
              autoFocus
            />
            <button
              type="button"
              onClick={() => commitCustom(adding)}
              className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Add & select
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(null);
                setAddName("");
              }}
              className="rounded-md border border-tl-line px-3 py-2 text-sm hover:bg-tl-paper"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-tl-ink-muted">
        Resolved:{" "}
        <span className="font-medium text-tl-ink">{resolved || "—"}</span>
        {complete ? (
          <span className="ml-2 text-tl-trust-ink">Ready</span>
        ) : (
          <span className="ml-2">Complete through ward to continue</span>
        )}
      </p>
    </fieldset>
  );
}
