"use client";

import { useCallback, useState } from "react";
import { GeoCascadePicker } from "@/components/geo/GeoCascadePicker";
import { FEATURED_INDICATOR_PLACES } from "@/data/mockIndicators";
import {
  applyBaselineToCommunityIntel,
  clearBaselineFromCommunityIntel,
  dossierGeoFromCascade,
  dossierHasCascadeGeo,
  fetchIndicatorsForGeo,
  fetchIndicatorsForPlace,
  geoAnchorId,
  geoLabelFromDossier,
  indicatorPlaceCandidates,
  isCountryOnlyGeo,
} from "@/lib/dossierIntel";
import {
  hydrateDossierFromProject,
  newPromiseId,
  persistProjectWithDossier,
} from "@/lib/projectDossier";
import type { IncidentGeoContext } from "@/types/incident";
import type { SocioEconomicIndicator } from "@/types/geo";
import {
  PROJECT_SECTOR_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  type Project,
  type ProjectDossier,
  type ProjectPromise,
} from "@/types/project";

type Props = {
  project: Project;
  onSaved: (project: Project) => void;
  compact?: boolean;
};

const inputClass =
  "w-full rounded-md border border-tl-line px-3 py-2 text-sm bg-tl-surface";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ProjectDossierForm({ project, onSaved, compact }: Props) {
  const [dossier, setDossier] = useState<ProjectDossier>(() =>
    hydrateDossierFromProject(project),
  );
  const [contractorName, setContractorName] = useState(project.contractorName);
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  const [promiseText, setPromiseText] = useState("");
  const [promiseOwner, setPromiseOwner] = useState("");
  const [promiseDue, setPromiseDue] = useState("");
  const [geoLabel, setGeoLabel] = useState(() =>
    geoLabelFromDossier(hydrateDossierFromProject(project).geo),
  );
  const [availableIndicators, setAvailableIndicators] = useState<
    SocioEconomicIndicator[]
  >([]);
  const [indicatorPlaceId, setIndicatorPlaceId] = useState<string>(
    () =>
      hydrateDossierFromProject(project).communityIntel?.baselinePlaceId || "",
  );
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    const attached =
      hydrateDossierFromProject(project).communityIntel?.attachedIndicators;
    return new Set(attached?.map((a) => a.key) || []);
  });
  const [intelBusy, setIntelBusy] = useState(false);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [featuredPick, setFeaturedPick] = useState<string>(
    FEATURED_INDICATOR_PLACES[0]?.id || "",
  );

  function patch(partial: Partial<ProjectDossier>) {
    setDossier((d) => ({ ...d, ...partial }));
  }

  const onGeoChange = useCallback((ctx: IncidentGeoContext, label: string) => {
    // GeoCascadePicker emits country-only on mount — do not wipe a saved cascade.
    if (isCountryOnlyGeo(ctx)) {
      setDossier((d) => {
        if (dossierHasCascadeGeo(d.geo)) return d;
        return {
          ...d,
          geo: dossierGeoFromCascade(ctx, d.geo?.placeLabel),
        };
      });
      return;
    }

    setGeoLabel(label);
    setDossier((d) => {
      const nextGeo = dossierGeoFromCascade(ctx, d.geo?.placeLabel);
      const prevAnchor = geoAnchorId(d.geo);
      const nextAnchor = geoAnchorId(nextGeo);
      const placeChanged =
        Boolean(prevAnchor) && Boolean(nextAnchor) && prevAnchor !== nextAnchor;
      return {
        ...d,
        geo: nextGeo,
        communityIntel: placeChanged
          ? clearBaselineFromCommunityIntel(d.communityIntel)
          : d.communityIntel,
      };
    });
    setAvailableIndicators([]);
    setSelectedKeys(new Set());
    setIndicatorPlaceId("");
    setIntelError(null);
  }, []);

  async function loadBaselineFromCascade() {
    setIntelBusy(true);
    setIntelError(null);
    try {
      const hit = await fetchIndicatorsForGeo(dossier.geo);
      if (!hit) {
        setAvailableIndicators([]);
        setIndicatorPlaceId("");
        setIntelError(
          "No platform socio-economic indicators for this cascade yet — pick a featured place pack below, or keep tenant notes only.",
        );
        return;
      }
      setAvailableIndicators(hit.indicators);
      setIndicatorPlaceId(hit.placeId);
      setSelectedKeys(new Set(hit.indicators.map((i) => i.key)));
    } catch (e) {
      setIntelError(
        e instanceof Error ? e.message : "Could not load platform baseline",
      );
    } finally {
      setIntelBusy(false);
    }
  }

  async function loadFeaturedPack() {
    if (!featuredPick) return;
    setIntelBusy(true);
    setIntelError(null);
    try {
      const rows = await fetchIndicatorsForPlace(featuredPick);
      if (!rows.length) {
        setAvailableIndicators([]);
        setIndicatorPlaceId("");
        setIntelError("No indicators in that featured pack.");
        return;
      }
      setAvailableIndicators(rows);
      setIndicatorPlaceId(featuredPick);
      setSelectedKeys(new Set(rows.map((i) => i.key)));
    } catch (e) {
      setIntelError(
        e instanceof Error ? e.message : "Could not load featured pack",
      );
    } finally {
      setIntelBusy(false);
    }
  }

  function attachSelectedBaseline() {
    if (!indicatorPlaceId || !availableIndicators.length) return;
    const rows = availableIndicators.filter((r) => selectedKeys.has(r.key));
    if (!rows.length) {
      setIntelError("Select at least one indicator to attach.");
      return;
    }
    patch({
      communityIntel: applyBaselineToCommunityIntel(
        dossier.communityIntel,
        rows,
        indicatorPlaceId,
      ),
    });
    setIntelError(null);
  }

  function clearAttachedBaseline() {
    patch({
      communityIntel: clearBaselineFromCommunityIntel(dossier.communityIntel),
    });
  }

  function toggleKey(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const canLoadCascadeBaseline =
    indicatorPlaceCandidates(dossier.geo).length > 0;

  function save() {
    setSaving(true);
    try {
      const next = persistProjectWithDossier({
        ...project,
        contractorName: contractorName.trim(),
        status: status || project.status,
        dossier,
      });
      onSaved(next);
    } finally {
      setSaving(false);
    }
  }

  function addPromise() {
    const text = promiseText.trim();
    if (!text) return;
    const row: ProjectPromise = {
      id: newPromiseId(),
      text,
      ownerLabel: promiseOwner.trim() || undefined,
      dueOn: promiseDue.trim() || undefined,
      status: "open",
    };
    patch({ promises: [...(dossier.promises || []), row] });
    setPromiseText("");
    setPromiseOwner("");
    setPromiseDue("");
  }

  function removePromise(id: string) {
    patch({
      promises: (dossier.promises || []).filter((p) => p.id !== id),
    });
  }

  const attached = dossier.communityIntel?.attachedIndicators || [];

  return (
    <div className="space-y-5">
      {!compact ? (
        <div>
          <h2 className="font-display text-lg font-semibold text-tl-ink">
            Project details
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Capture funder, budget, geo cascade, empowerment targets, promises,
            and attach platform community intelligence once. Field notes,
            issues, and reports then link to this project.
          </p>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <Field id="pd-funder" label="Funder / client">
          <input
            id="pd-funder"
            className={inputClass}
            value={dossier.funder?.name || ""}
            onChange={(e) =>
              patch({
                funder: { ...dossier.funder, name: e.target.value },
              })
            }
            placeholder="e.g. Municipal roads programme"
          />
        </Field>
        <Field id="pd-contractor" label="Main contractor">
          <input
            id="pd-contractor"
            className={inputClass}
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
          />
        </Field>
        <Field id="pd-sector" label="Sector">
          <select
            id="pd-sector"
            className={inputClass}
            value={dossier.sector || ""}
            onChange={(e) => patch({ sector: e.target.value || undefined })}
          >
            <option value="">Select sector</option>
            {PROJECT_SECTOR_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field id="pd-status" label="Status">
          <select
            id="pd-status"
            className={inputClass}
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as Project["status"])
            }
          >
            {PROJECT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field id="pd-start" label="Start date">
          <input
            id="pd-start"
            type="date"
            className={inputClass}
            value={dossier.dates?.startDate || ""}
            onChange={(e) =>
              patch({
                dates: { ...dossier.dates, startDate: e.target.value },
              })
            }
          />
        </Field>
        <Field id="pd-end" label="Target end date">
          <input
            id="pd-end"
            type="date"
            className={inputClass}
            value={dossier.dates?.targetEndDate || ""}
            onChange={(e) =>
              patch({
                dates: { ...dossier.dates, targetEndDate: e.target.value },
              })
            }
          />
        </Field>
        <Field id="pd-budget" label="Authorised budget (ZAR)">
          <input
            id="pd-budget"
            type="number"
            className={inputClass}
            value={dossier.budget?.authorisedZar ?? ""}
            onChange={(e) =>
              patch({
                budget: {
                  ...dossier.budget,
                  authorisedZar: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                },
              })
            }
          />
        </Field>
        <Field id="pd-contingency" label="Contingency (ZAR)">
          <input
            id="pd-contingency"
            type="number"
            className={inputClass}
            value={dossier.budget?.contingencyZar ?? ""}
            onChange={(e) =>
              patch({
                budget: {
                  ...dossier.budget,
                  contingencyZar: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                },
              })
            }
          />
        </Field>
        <Field id="pd-cadence" label="Reporting cadence">
          <select
            id="pd-cadence"
            className={inputClass}
            value={dossier.funder?.reportingCadence || ""}
            onChange={(e) =>
              patch({
                funder: {
                  ...dossier.funder,
                  reportingCadence: e.target.value || undefined,
                },
              })
            }
          >
            <option value="">Select</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="ad_hoc">Ad hoc</option>
          </select>
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-tl-ink">
          Geo location (Country → Province → Town → DM → TC → Ward)
        </h3>
        <p className="text-xs text-tl-ink-muted">
          Same platform cascade as stakeholders and issue intake (ADR-041). Ward
          optional for programme-level projects.
        </p>
        {geoLabel ? (
          <p className="rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink">
            Selected: {geoLabel}
            {dossier.geo?.placeId ? (
              <span className="text-tl-ink-muted">
                {" "}
                · place {dossier.geo.placeId}
              </span>
            ) : null}
          </p>
        ) : null}
        <GeoCascadePicker requireWard={false} onChange={onGeoChange} />
        <Field id="pd-place" label="Site / place label (optional)">
          <input
            id="pd-place"
            className={inputClass}
            value={dossier.geo?.placeLabel || ""}
            onChange={(e) =>
              patch({
                geo: { ...dossier.geo, placeLabel: e.target.value },
              })
            }
            placeholder="Street upgrade corridor, clinic site…"
          />
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-tl-ink">
          Empowerment targets
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="pd-hire" label="Local hire target">
            <input
              id="pd-hire"
              type="number"
              className={inputClass}
              value={dossier.empowermentTargets?.localHireTarget ?? ""}
              onChange={(e) =>
                patch({
                  empowermentTargets: {
                    ...dossier.empowermentTargets,
                    localHireTarget: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  },
                })
              }
            />
          </Field>
          <Field id="pd-bbbee" label="B-BBEE level target">
            <select
              id="pd-bbbee"
              className={inputClass}
              value={dossier.empowermentTargets?.bbbeeLevelTarget || ""}
              onChange={(e) =>
                patch({
                  empowermentTargets: {
                    ...dossier.empowermentTargets,
                    bbbeeLevelTarget: e.target.value || undefined,
                  },
                })
              }
            >
              <option value="">Select</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={`Level ${n}`}>
                  Level {n}
                </option>
              ))}
              <option value="EME">Exempted Micro Enterprise</option>
              <option value="QSE">Qualifying Small Enterprise</option>
            </select>
          </Field>
          <Field id="pd-black" label="Black ownership target (%)">
            <input
              id="pd-black"
              type="number"
              className={inputClass}
              value={
                dossier.empowermentTargets?.blackOwnershipTargetPct ?? ""
              }
              onChange={(e) =>
                patch({
                  empowermentTargets: {
                    ...dossier.empowermentTargets,
                    blackOwnershipTargetPct: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  },
                })
              }
            />
          </Field>
          <Field id="pd-pref" label="Preferential procurement target (ZAR)">
            <input
              id="pd-pref"
              type="number"
              className={inputClass}
              value={
                dossier.empowermentTargets?.preferentialProcurementTargetZar ??
                ""
              }
              onChange={(e) =>
                patch({
                  empowermentTargets: {
                    ...dossier.empowermentTargets,
                    preferentialProcurementTargetZar: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  },
                })
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id="pd-wyp" label="Women / youth / PWD targets">
              <textarea
                id="pd-wyp"
                rows={2}
                className={inputClass}
                value={dossier.empowermentTargets?.womenYouthPwdTargets || ""}
                onChange={(e) =>
                  patch({
                    empowermentTargets: {
                      ...dossier.empowermentTargets,
                      womenYouthPwdTargets: e.target.value,
                    },
                  })
                }
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-tl-ink">
          Community intelligence
        </h3>
        <p className="text-xs text-tl-ink-muted">
          Attach Stats SA / Census platform baseline for the selected place
          (ADR-040). Tenant notes for businesses and structures stay separate.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={intelBusy || !canLoadCascadeBaseline}
            onClick={() => void loadBaselineFromCascade()}
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
          >
            {intelBusy ? "Loading…" : "Load baseline for cascade place"}
          </button>
          <div className="flex min-w-[14rem] flex-1 flex-wrap items-end gap-2">
            <label className="block min-w-[10rem] flex-1 text-sm">
              <span className="mb-1 block font-medium">
                Or featured place pack
              </span>
              <select
                className={inputClass}
                value={featuredPick}
                onChange={(e) => setFeaturedPick(e.target.value)}
              >
                {FEATURED_INDICATOR_PLACES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={intelBusy || !featuredPick}
              onClick={() => void loadFeaturedPack()}
              className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
            >
              Load pack
            </button>
          </div>
        </div>

        {intelError ? (
          <p className="text-sm text-tl-danger" role="status">
            {intelError}
          </p>
        ) : null}

        {availableIndicators.length > 0 ? (
          <div className="space-y-2 rounded-md border border-tl-line bg-tl-paper p-3">
            <p className="text-xs font-medium text-tl-ink-muted">
              Platform indicators
              {indicatorPlaceId ? ` · ${indicatorPlaceId}` : ""} — select then
              attach
            </p>
            <ul className="space-y-2">
              {availableIndicators.map((row) => (
                <li key={`${row.placeId}:${row.key}`}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedKeys.has(row.key)}
                      onChange={() => toggleKey(row.key)}
                    />
                    <span>
                      <span className="font-medium">{row.label}</span>
                      {": "}
                      {row.value}
                      {row.unit === "%" ? "%" : ` ${row.unit}`}
                      <span className="text-tl-ink-muted">
                        {row.year ? ` · ${row.year}` : ""}
                        {row.source ? ` · ${row.source}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={attachSelectedBaseline}
              className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Attach selected to project
            </button>
          </div>
        ) : null}

        {attached.length > 0 ? (
          <div className="space-y-2 rounded-md border border-tl-line bg-tl-surface p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-tl-ink">
                Attached baseline
                {dossier.communityIntel?.baselinePlaceId
                  ? ` · ${dossier.communityIntel.baselinePlaceId}`
                  : ""}
              </p>
              <button
                type="button"
                onClick={clearAttachedBaseline}
                className="text-xs text-tl-danger underline"
              >
                Detach
              </button>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {attached.map((row) => (
                <li
                  key={`${row.placeId}:${row.key}`}
                  className="text-sm text-tl-ink"
                >
                  <span className="font-medium">{row.label}</span>
                  {": "}
                  {row.value}
                  {row.unit === "%" ? "%" : ` ${row.unit}`}
                  <span className="text-xs text-tl-ink-muted">
                    {row.source ? ` · ${row.source}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="pd-unemp" label="Area unemployment (%)">
            <input
              id="pd-unemp"
              type="number"
              className={inputClass}
              value={dossier.communityIntel?.unemploymentRatePct ?? ""}
              onChange={(e) =>
                patch({
                  communityIntel: {
                    ...dossier.communityIntel,
                    unemploymentRatePct: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  },
                })
              }
            />
          </Field>
          <Field id="pd-unemp-src" label="Unemployment source">
            <input
              id="pd-unemp-src"
              className={inputClass}
              value={dossier.communityIntel?.unemploymentSource || ""}
              onChange={(e) =>
                patch({
                  communityIntel: {
                    ...dossier.communityIntel,
                    unemploymentSource: e.target.value,
                  },
                })
              }
              placeholder="Stats SA / ward survey / estimate"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id="pd-biz" label="Local businesses / SMMEs (tenant notes)">
              <textarea
                id="pd-biz"
                rows={2}
                className={inputClass}
                value={dossier.communityIntel?.localBusinessesNotes || ""}
                onChange={(e) =>
                  patch({
                    communityIntel: {
                      ...dossier.communityIntel,
                      localBusinessesNotes: e.target.value,
                    },
                  })
                }
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="pd-struct" label="Structures (ward, TC, forums)">
              <textarea
                id="pd-struct"
                rows={2}
                className={inputClass}
                value={dossier.communityIntel?.structuresNotes || ""}
                onChange={(e) =>
                  patch({
                    communityIntel: {
                      ...dossier.communityIntel,
                      structuresNotes: e.target.value,
                    },
                  })
                }
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="pd-neet" label="NEET / youth notes">
              <textarea
                id="pd-neet"
                rows={2}
                className={inputClass}
                value={dossier.communityIntel?.neetYouthNotes || ""}
                onChange={(e) =>
                  patch({
                    communityIntel: {
                      ...dossier.communityIntel,
                      neetYouthNotes: e.target.value,
                    },
                  })
                }
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-tl-ink">Promises</h3>
        <ul className="space-y-2 text-sm">
          {(dossier.promises || []).map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-tl-line bg-tl-paper px-3 py-2"
            >
              <div>
                <p className="font-medium">{p.text}</p>
                <p className="text-xs text-tl-ink-muted">
                  {p.ownerLabel || "No owner"}
                  {p.dueOn ? ` · due ${p.dueOn}` : ""}
                  {p.status ? ` · ${p.status}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-tl-danger underline"
                onClick={() => removePromise(p.id)}
              >
                Remove
              </button>
            </li>
          ))}
          {(dossier.promises || []).length === 0 ? (
            <li className="text-sm text-tl-ink-muted">
              No programme promises yet — add standing commitments here.
            </li>
          ) : null}
        </ul>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <Field id="pd-prom" label="Promise">
              <input
                id="pd-prom"
                className={inputClass}
                value={promiseText}
                onChange={(e) => setPromiseText(e.target.value)}
                placeholder="e.g. Local labour desk open weekly"
              />
            </Field>
          </div>
          <Field id="pd-prom-owner" label="Owner">
            <input
              id="pd-prom-owner"
              className={inputClass}
              value={promiseOwner}
              onChange={(e) => setPromiseOwner(e.target.value)}
            />
          </Field>
          <Field id="pd-prom-due" label="Due">
            <input
              id="pd-prom-due"
              type="date"
              className={inputClass}
              value={promiseDue}
              onChange={(e) => setPromiseDue(e.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={addPromise}
              className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Add promise
            </button>
          </div>
        </div>
      </section>

      <Field id="pd-site" label="Site / programme description">
        <textarea
          id="pd-site"
          rows={3}
          className={inputClass}
          value={dossier.siteDescription || ""}
          onChange={(e) => patch({ siteDescription: e.target.value })}
        />
      </Field>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save project details"}
      </button>
    </div>
  );
}
