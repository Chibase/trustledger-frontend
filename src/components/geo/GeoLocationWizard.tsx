"use client";

import { useEffect, useState } from "react";
import type { GeoPlace } from "@/types/geo";
import type { IncidentGeoContext } from "@/types/incident";

type WizardStep = "city" | "dm" | "tc" | "ward" | null;

type GeoLocationWizardProps = {
  open: boolean;
  countryCode?: string;
  countryName?: string;
  onClose: () => void;
  onComplete: (ctx: IncidentGeoContext, label: string) => void;
};

async function fetchPlaces(params: Record<string, string>) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`/api/geo?${qs.toString()}`);
  if (!res.ok) throw new Error("Could not load places");
  const data = (await res.json()) as { places?: GeoPlace[] };
  return data.places ?? [];
}

async function fetchAncestors(id: string) {
  const res = await fetch(`/api/geo?id=${encodeURIComponent(id)}&ancestors=1`);
  if (!res.ok) throw new Error("Could not resolve location");
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

function labelFrom(
  city?: GeoPlace,
  dm?: GeoPlace,
  tc?: GeoPlace,
  ward?: GeoPlace,
  countryName = "South Africa",
): string {
  return [ward?.name, tc?.name, city?.name, dm?.name, countryName]
    .filter(Boolean)
    .join(" · ");
}

type DialogShellProps = {
  title: string;
  stepLabel: string;
  children: React.ReactNode;
  onBack?: () => void;
  onCancel: () => void;
  footer?: React.ReactNode;
};

function DialogShell({
  title,
  stepLabel,
  children,
  onBack,
  onCancel,
  footer,
}: DialogShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="geo-wizard-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-tl-line bg-tl-surface shadow-lg"
      >
        <div className="border-b border-tl-line px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            {stepLabel}
          </p>
          <h2
            id="geo-wizard-title"
            className="mt-1 font-display text-xl font-semibold text-tl-ink"
          >
            {title}
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex flex-wrap gap-2 border-t border-tl-line px-5 py-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-tl-line px-3 py-2 text-sm hover:bg-tl-paper"
          >
            Cancel
          </button>
          {footer}
        </div>
      </div>
    </div>
  );
}

/**
 * Sequential location capture: City → DM → Traditional council → Ward.
 * Uses the same geo pack as `/api/geo` (not shown on product dashboards).
 */
export function GeoLocationWizard({
  open,
  countryCode = "ZA",
  countryName = "South Africa",
  onClose,
  onComplete,
}: GeoLocationWizardProps) {
  const [step, setStep] = useState<WizardStep>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const [cities, setCities] = useState<GeoPlace[]>([]);
  const [dms, setDms] = useState<GeoPlace[]>([]);
  const [tcs, setTcs] = useState<GeoPlace[]>([]);
  const [wards, setWards] = useState<GeoPlace[]>([]);

  const [city, setCity] = useState<GeoPlace | undefined>();
  const [dm, setDm] = useState<GeoPlace | undefined>();
  const [tc, setTc] = useState<GeoPlace | undefined>();
  const [ward, setWard] = useState<GeoPlace | undefined>();
  const [province, setProvince] = useState<GeoPlace | undefined>();
  const [country, setCountry] = useState<GeoPlace | undefined>();

  useEffect(() => {
    if (!open) {
      setStep(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError(null);
      setFilter("");
      setCity(undefined);
      setDm(undefined);
      setTc(undefined);
      setWard(undefined);
      setProvince(undefined);
      try {
        const [local, metro, countryRow] = await Promise.all([
          fetchPlaces({
            level: "local_municipality",
            countryCode,
            limit: "500",
          }),
          fetchPlaces({ level: "metro", countryCode, limit: "50" }),
          fetch(`/api/geo?id=${encodeURIComponent(countryCode.toLowerCase())}`).then(
            (r) => r.json(),
          ),
        ]);
        if (cancelled) return;
        const list = uniqueById([...metro, ...local]).sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        setCities(list);
        setCountry((countryRow as { place?: GeoPlace }).place);
        setStep("city");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load cities");
          setStep("city");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, countryCode]);

  if (!open || !step) return null;

  async function chooseCity(place: GeoPlace) {
    setBusy(true);
    setError(null);
    setFilter("");
    try {
      const crumbs = await fetchAncestors(place.id);
      const dist = crumbs.find((c) => c.level === "district");
      const prov = crumbs.find((c) => c.level === "province");
      const ctry = crumbs.find((c) => c.level === "country");
      setCity(place);
      setProvince(prov);
      if (ctry) setCountry(ctry);
      setDm(dist);
      setTc(undefined);
      setWard(undefined);

      // DM choices: parent district first; also siblings under same province if needed
      if (dist) {
        setDms([dist]);
      } else if (prov) {
        const under = await fetchPlaces({
          parentId: prov.id,
          level: "district",
          limit: "100",
        });
        setDms(under);
      } else {
        setDms([]);
      }
      setStep("dm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load district");
    } finally {
      setBusy(false);
    }
  }

  async function chooseDm(place: GeoPlace) {
    setBusy(true);
    setError(null);
    setFilter("");
    try {
      setDm(place);
      const under = await fetchPlaces({
        parentId: place.id,
        limit: "400",
      });
      const councils = uniqueById(
        under.filter((p) => p.level === "traditional_council"),
      ).sort((a, b) => a.name.localeCompare(b.name));
      setTcs(councils);
      setTc(undefined);
      setWard(undefined);
      setStep("tc");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load councils");
    } finally {
      setBusy(false);
    }
  }

  async function chooseTc(place: GeoPlace | null) {
    setBusy(true);
    setError(null);
    setFilter("");
    try {
      setTc(place || undefined);
      if (!city) {
        setError("City is required before wards.");
        return;
      }
      const wardList = await fetchPlaces({
        parentId: city.id,
        level: "ward",
        limit: "400",
      });
      setWards(
        wardList.sort((a, b) =>
          String(a.meta?.wardNo ?? a.code).localeCompare(
            String(b.meta?.wardNo ?? b.code),
            undefined,
            { numeric: true },
          ),
        ),
      );
      setWard(undefined);
      setStep("ward");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load wards");
    } finally {
      setBusy(false);
    }
  }

  function finish(selectedWard: GeoPlace) {
    setWard(selectedWard);
    const ctx: IncidentGeoContext = {
      countryCode: country?.code || countryCode,
      countryName: country?.name || countryName,
      provinceId: province?.id,
      provinceName: province?.name,
      districtId: dm?.id,
      districtName: dm?.name,
      municipalityId: city?.id,
      municipalityName: city?.name,
      traditionalCouncilId: tc?.id,
      traditionalCouncilName: tc?.name,
      wardId: selectedWard.id,
      wardName: selectedWard.name,
      placeId: selectedWard.id,
    };
    onComplete(ctx, labelFrom(city, dm, tc, selectedWard, country?.name || countryName));
    onClose();
  }

  const q = filter.trim().toLowerCase();
  const filteredCities = q
    ? cities.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q),
      )
    : cities;
  const filteredDms = q
    ? dms.filter((d) => d.name.toLowerCase().includes(q))
    : dms;
  const filteredTcs = q
    ? tcs.filter((t) => t.name.toLowerCase().includes(q))
    : tcs;
  const filteredWards = q
    ? wards.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.code.toLowerCase().includes(q),
      )
    : wards;

  if (step === "city") {
    return (
      <DialogShell
        stepLabel="Location · step 1 of 4"
        title={`Choose a city (${countryName})`}
        onCancel={onClose}
      >
        <p className="mb-3 text-sm text-tl-ink-muted">
          Cities and towns from the national place pack. Selecting one opens the
          district municipality step.
        </p>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter cities…"
          className="mb-3 w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          autoFocus
        />
        {error ? <p className="mb-2 text-sm text-tl-danger">{error}</p> : null}
        {busy ? (
          <p className="text-sm text-tl-ink-muted">Loading cities…</p>
        ) : (
          <ul className="max-h-72 divide-y divide-tl-line overflow-y-auto rounded-md border border-tl-line">
            {filteredCities.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => void chooseCity(c)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-tl-paper"
                >
                  <span className="font-medium text-tl-ink">{c.name}</span>
                  <span className="text-xs text-tl-ink-muted">{c.code}</span>
                </button>
              </li>
            ))}
            {filteredCities.length === 0 ? (
              <li className="px-3 py-4 text-sm text-tl-ink-muted">
                No cities match.
              </li>
            ) : null}
          </ul>
        )}
      </DialogShell>
    );
  }

  if (step === "dm") {
    return (
      <DialogShell
        stepLabel="Location · step 2 of 4"
        title="District municipality (DM)"
        onBack={() => {
          setFilter("");
          setStep("city");
        }}
        onCancel={onClose}
      >
        <p className="mb-2 text-sm text-tl-ink-muted">
          City:{" "}
          <span className="font-medium text-tl-ink">{city?.name}</span>
        </p>
        <p className="mb-3 text-sm text-tl-ink-muted">
          Confirm or choose the DM for this city, then continue to traditional
          councils.
        </p>
        {dms.length > 1 ? (
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter districts…"
            className="mb-3 w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        ) : null}
        {error ? <p className="mb-2 text-sm text-tl-danger">{error}</p> : null}
        <ul className="max-h-72 divide-y divide-tl-line overflow-y-auto rounded-md border border-tl-line">
          {filteredDms.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => void chooseDm(d)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-tl-paper"
              >
                <span className="font-medium text-tl-ink">{d.name}</span>
                <span className="text-xs text-tl-ink-muted">DM</span>
              </button>
            </li>
          ))}
          {filteredDms.length === 0 ? (
            <li className="px-3 py-4 text-sm text-tl-ink-muted">
              No district found for this city.
            </li>
          ) : null}
        </ul>
      </DialogShell>
    );
  }

  if (step === "tc") {
    return (
      <DialogShell
        stepLabel="Location · step 3 of 4"
        title="Traditional council"
        onBack={() => {
          setFilter("");
          setStep("dm");
        }}
        onCancel={onClose}
        footer={
          <button
            type="button"
            onClick={() => void chooseTc(null)}
            className="ml-auto rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper"
          >
            Skip TC — go to wards
          </button>
        }
      >
        <p className="mb-2 text-sm text-tl-ink-muted">
          {city?.name}
          {dm ? ` · ${dm.name}` : ""}
        </p>
        <p className="mb-3 text-sm text-tl-ink-muted">
          Choose a traditional council in this DM. Wards unlock after this step.
        </p>
        {tcs.length > 0 ? (
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter traditional councils…"
            className="mb-3 w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            autoFocus
          />
        ) : null}
        {error ? <p className="mb-2 text-sm text-tl-danger">{error}</p> : null}
        {busy ? (
          <p className="text-sm text-tl-ink-muted">Loading councils…</p>
        ) : tcs.length === 0 ? (
          <p className="text-sm text-tl-ink-muted">
            No traditional councils seeded for this DM. Continue to wards for
            the selected city.
          </p>
        ) : (
          <ul className="max-h-72 divide-y divide-tl-line overflow-y-auto rounded-md border border-tl-line">
            {filteredTcs.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => void chooseTc(t)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-tl-paper"
                >
                  <span className="font-medium text-tl-ink">{t.name}</span>
                  <span className="text-xs text-tl-ink-muted">{t.code}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {tcs.length === 0 ? (
          <button
            type="button"
            onClick={() => void chooseTc(null)}
            className="mt-4 w-full rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            Continue to wards
          </button>
        ) : null}
      </DialogShell>
    );
  }

  // ward
  return (
    <DialogShell
      stepLabel="Location · step 4 of 4"
      title="Select ward"
      onBack={() => {
        setFilter("");
        setStep("tc");
      }}
      onCancel={onClose}
    >
      <p className="mb-2 text-sm text-tl-ink-muted">
        {[city?.name, dm?.name, tc?.name].filter(Boolean).join(" · ")}
      </p>
      <p className="mb-3 text-sm text-tl-ink-muted">
        Wards for the chosen city. This completes location for the report.
      </p>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter wards…"
        className="mb-3 w-full rounded-md border border-tl-line px-3 py-2 text-sm"
        autoFocus
      />
      {error ? <p className="mb-2 text-sm text-tl-danger">{error}</p> : null}
      {busy ? (
        <p className="text-sm text-tl-ink-muted">Loading wards…</p>
      ) : (
        <ul className="max-h-72 divide-y divide-tl-line overflow-y-auto rounded-md border border-tl-line">
          {filteredWards.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => finish(w)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-tl-paper"
              >
                <span className="font-medium text-tl-ink">{w.name}</span>
                <span className="text-xs text-tl-ink-muted">{w.code}</span>
              </button>
            </li>
          ))}
          {filteredWards.length === 0 ? (
            <li className="px-3 py-4 text-sm text-tl-ink-muted">
              No wards available for this city.
            </li>
          ) : null}
        </ul>
      )}
    </DialogShell>
  );
}
