"use client";

import Link from "next/link";
import type {
  CaptureStructured,
  PackCaptureSource,
} from "@/lib/captureStore";
import { PACK_SOURCE_META } from "@/lib/captureStore";
import type { Incident } from "@/types/incident";

type Props = {
  pack: PackCaptureSource;
  value: CaptureStructured;
  onChange: (next: CaptureStructured) => void;
  /** Live desk cases for Issue log pack. */
  projectIncidents?: Incident[];
  projectId?: string;
};

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
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-tl-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-tl-line px-3 py-2 text-sm bg-tl-surface";

function num(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function TextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label}>
      <input
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={placeholder}
      />
    </Field>
  );
}

function NumberInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label}>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => onChange(num(e.target.value))}
        className={inputClass}
        placeholder={placeholder}
      />
    </Field>
  );
}

function AreaInput({
  id,
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label}>
      <textarea
        id={id}
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={placeholder}
      />
    </Field>
  );
}

export function CapturePackForm({
  pack,
  value,
  onChange,
  projectIncidents = [],
  projectId,
}: Props) {
  const meta = PACK_SOURCE_META[pack];

  if (value.pack !== pack) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-tl-ink">{meta.label}</p>
        <p className="mt-1 text-sm text-tl-ink-muted">{meta.hint}</p>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Feeds: {meta.reports}
        </p>
      </div>

      {pack === "project_profile" && value.pack === "project_profile" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            id="pp-period"
            label="Reporting period"
            value={value.data.periodLabel}
            onChange={(periodLabel) =>
              onChange({ pack, data: { ...value.data, periodLabel } })
            }
            placeholder="e.g. August 2026"
          />
          <TextInput
            id="pp-sector"
            label="Sector / programme type"
            value={value.data.sector}
            onChange={(sector) =>
              onChange({ pack, data: { ...value.data, sector } })
            }
            placeholder="Infrastructure / mining / housing…"
          />
          <TextInput
            id="pp-client"
            label="Client / funder"
            value={value.data.clientFunder}
            onChange={(clientFunder) =>
              onChange({ pack, data: { ...value.data, clientFunder } })
            }
          />
          <TextInput
            id="pp-contractor"
            label="Main contractor"
            value={value.data.contractorName}
            onChange={(contractorName) =>
              onChange({ pack, data: { ...value.data, contractorName } })
            }
          />
          <TextInput
            id="pp-ward"
            label="Ward"
            value={value.data.ward}
            onChange={(ward) => onChange({ pack, data: { ...value.data, ward } })}
          />
          <TextInput
            id="pp-muni"
            label="Municipality"
            value={value.data.municipality}
            onChange={(municipality) =>
              onChange({ pack, data: { ...value.data, municipality } })
            }
          />
          <TextInput
            id="pp-status"
            label="Project status"
            value={value.data.status}
            onChange={(status) =>
              onChange({ pack, data: { ...value.data, status } })
            }
            placeholder="Active / OnHold / Completed…"
          />
          <TextInput
            id="pp-start"
            label="Start date (YYYY-MM-DD)"
            value={value.data.startDate}
            onChange={(startDate) =>
              onChange({ pack, data: { ...value.data, startDate } })
            }
          />
          <TextInput
            id="pp-end"
            label="Target end (YYYY-MM-DD)"
            value={value.data.targetEndDate}
            onChange={(targetEndDate) =>
              onChange({ pack, data: { ...value.data, targetEndDate } })
            }
          />
          <NumberInput
            id="pp-budget"
            label="Empowerment budget authorised (ZAR)"
            value={value.data.budgetTotal}
            onChange={(budgetTotal) =>
              onChange({ pack, data: { ...value.data, budgetTotal } })
            }
          />
          <NumberInput
            id="pp-spent"
            label="Empowerment spent (ZAR)"
            value={value.data.budgetSpent}
            onChange={(budgetSpent) =>
              onChange({ pack, data: { ...value.data, budgetSpent } })
            }
          />
          <p className="sm:col-span-2 text-xs text-tl-ink-muted">
            Spent auto-updates from Employment training spend and B-BBEE
            skills / procurement / ESD when those packs are saved.
          </p>
          <div className="sm:col-span-2">
            <AreaInput
              id="pp-site"
              label="Site / programme description"
              value={value.data.siteDescription}
              onChange={(siteDescription) =>
                onChange({ pack, data: { ...value.data, siteDescription } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="pp-summary"
              label="Public summary"
              value={value.data.publicSummary}
              onChange={(publicSummary) =>
                onChange({ pack, data: { ...value.data, publicSummary } })
              }
            />
          </div>
        </div>
      ) : null}

      {pack === "bbbee" && value.pack === "bbbee" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            id="bb-period"
            label="Reporting period"
            value={value.data.periodLabel}
            onChange={(periodLabel) =>
              onChange({ pack, data: { ...value.data, periodLabel } })
            }
          />
          <TextInput
            id="bb-level"
            label="B-BBEE level / status"
            value={value.data.bbbeeLevel}
            onChange={(bbbeeLevel) =>
              onChange({ pack, data: { ...value.data, bbbeeLevel } })
            }
            placeholder="Level 1–8 / Exempted Micro…"
          />
          <NumberInput
            id="bb-own"
            label="Ownership (%)"
            value={value.data.ownershipPct}
            onChange={(ownershipPct) =>
              onChange({ pack, data: { ...value.data, ownershipPct } })
            }
          />
          <NumberInput
            id="bb-black"
            label="Black ownership (%)"
            value={value.data.blackOwnershipPct}
            onChange={(blackOwnershipPct) =>
              onChange({ pack, data: { ...value.data, blackOwnershipPct } })
            }
          />
          <NumberInput
            id="bb-skills"
            label="Skills development spend (ZAR)"
            value={value.data.skillsDevSpendZar}
            onChange={(skillsDevSpendZar) =>
              onChange({ pack, data: { ...value.data, skillsDevSpendZar } })
            }
          />
          <p className="sm:col-span-2 text-xs text-tl-ink-muted">
            Skills, preferential procurement, and ESD spend roll into
            empowerment spent when this pack is saved.
          </p>
          <NumberInput
            id="bb-pref"
            label="Preferential procurement (ZAR)"
            value={value.data.preferentialProcurementZar}
            onChange={(preferentialProcurementZar) =>
              onChange({
                pack,
                data: { ...value.data, preferentialProcurementZar },
              })
            }
          />
          <NumberInput
            id="bb-esd"
            label="ESD spend (ZAR)"
            value={value.data.esdSpendZar}
            onChange={(esdSpendZar) =>
              onChange({ pack, data: { ...value.data, esdSpendZar } })
            }
          />
          <NumberInput
            id="bb-suppliers"
            label="Local suppliers engaged"
            value={value.data.localSupplierCount}
            onChange={(localSupplierCount) =>
              onChange({ pack, data: { ...value.data, localSupplierCount } })
            }
          />
          <TextInput
            id="bb-cert"
            label="Certificate / verification ref"
            value={value.data.certificateRef}
            onChange={(certificateRef) =>
              onChange({ pack, data: { ...value.data, certificateRef } })
            }
          />
          <div className="sm:col-span-2">
            <AreaInput
              id="bb-mgmt"
              label="Management control notes"
              value={value.data.managementControlNotes}
              onChange={(managementControlNotes) =>
                onChange({
                  pack,
                  data: { ...value.data, managementControlNotes },
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="bb-notes"
              label="Additional empowerment notes"
              value={value.data.notes}
              onChange={(notes) =>
                onChange({ pack, data: { ...value.data, notes } })
              }
            />
          </div>
        </div>
      ) : null}

      {pack === "employment" && value.pack === "employment" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            id="em-period"
            label="Reporting period"
            value={value.data.periodLabel}
            onChange={(periodLabel) =>
              onChange({ pack, data: { ...value.data, periodLabel } })
            }
          />
          <NumberInput
            id="em-target"
            label="Local hire target"
            value={value.data.localHireTarget}
            onChange={(localHireTarget) =>
              onChange({ pack, data: { ...value.data, localHireTarget } })
            }
          />
          <NumberInput
            id="em-actual"
            label="Local hire actual"
            value={value.data.localHireActual}
            onChange={(localHireActual) =>
              onChange({ pack, data: { ...value.data, localHireActual } })
            }
          />
          <NumberInput
            id="em-total"
            label="Total workforce"
            value={value.data.totalWorkforce}
            onChange={(totalWorkforce) =>
              onChange({ pack, data: { ...value.data, totalWorkforce } })
            }
          />
          <NumberInput
            id="em-contractor"
            label="Contractor labour"
            value={value.data.contractorLabour}
            onChange={(contractorLabour) =>
              onChange({ pack, data: { ...value.data, contractorLabour } })
            }
          />
          <NumberInput
            id="em-women"
            label="Women employed"
            value={value.data.womenEmployed}
            onChange={(womenEmployed) =>
              onChange({ pack, data: { ...value.data, womenEmployed } })
            }
          />
          <NumberInput
            id="em-youth"
            label="Youth employed"
            value={value.data.youthEmployed}
            onChange={(youthEmployed) =>
              onChange({ pack, data: { ...value.data, youthEmployed } })
            }
          />
          <NumberInput
            id="em-pwd"
            label="Persons with disability"
            value={value.data.personsWithDisability}
            onChange={(personsWithDisability) =>
              onChange({ pack, data: { ...value.data, personsWithDisability } })
            }
          />
          <NumberInput
            id="em-training"
            label="Training days delivered"
            value={value.data.trainingDays}
            onChange={(trainingDays) =>
              onChange({ pack, data: { ...value.data, trainingDays } })
            }
          />
          <NumberInput
            id="em-training-spend"
            label="Training spend (ZAR)"
            value={value.data.trainingSpendZar}
            onChange={(trainingSpendZar) =>
              onChange({ pack, data: { ...value.data, trainingSpendZar } })
            }
          />
          <div className="sm:col-span-2">
            <AreaInput
              id="em-training-notes"
              label="Training activity (what was delivered)"
              value={value.data.trainingActivityNotes}
              onChange={(trainingActivityNotes) =>
                onChange({
                  pack,
                  data: { ...value.data, trainingActivityNotes },
                })
              }
              placeholder="e.g. Local labour induction · 12 people · R45 000"
            />
          </div>
          <p className="sm:col-span-2 text-xs text-tl-ink-muted">
            Saving this pack rolls training spend into project empowerment
            spent (with B-BBEE skills / procurement / ESD).
          </p>
          <NumberInput
            id="em-disputes"
            label="Open labour disputes"
            value={value.data.labourDisputesOpen}
            onChange={(labourDisputesOpen) =>
              onChange({ pack, data: { ...value.data, labourDisputesOpen } })
            }
          />
          <div className="sm:col-span-2">
            <AreaInput
              id="em-wards"
              label="Ward / origin of labour notes"
              value={value.data.wardOfOriginNotes}
              onChange={(wardOfOriginNotes) =>
                onChange({ pack, data: { ...value.data, wardOfOriginNotes } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="em-notes"
              label="Employment notes"
              value={value.data.notes}
              onChange={(notes) =>
                onChange({ pack, data: { ...value.data, notes } })
              }
            />
          </div>
        </div>
      ) : null}

      {pack === "csi" && value.pack === "csi" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            id="csi-period"
            label="Reporting period"
            value={value.data.periodLabel}
            onChange={(periodLabel) =>
              onChange({ pack, data: { ...value.data, periodLabel } })
            }
          />
          <TextInput
            id="csi-name"
            label="Programme name"
            value={value.data.programmeName}
            onChange={(programmeName) =>
              onChange({ pack, data: { ...value.data, programmeName } })
            }
          />
          <TextInput
            id="csi-benef"
            label="Beneficiary group"
            value={value.data.beneficiaryGroup}
            onChange={(beneficiaryGroup) =>
              onChange({ pack, data: { ...value.data, beneficiaryGroup } })
            }
            placeholder="Youth / women / ward schools…"
          />
          <NumberInput
            id="csi-amount"
            label="Amount (ZAR)"
            value={value.data.amountZar}
            onChange={(amountZar) =>
              onChange({ pack, data: { ...value.data, amountZar } })
            }
          />
          <NumberInput
            id="csi-reached"
            label="Beneficiaries reached"
            value={value.data.beneficiariesReached}
            onChange={(beneficiariesReached) =>
              onChange({ pack, data: { ...value.data, beneficiariesReached } })
            }
          />
          <TextInput
            id="csi-eng"
            label="Linked engagement / meeting"
            value={value.data.linkedEngagement}
            onChange={(linkedEngagement) =>
              onChange({ pack, data: { ...value.data, linkedEngagement } })
            }
          />
          <div className="sm:col-span-2">
            <AreaInput
              id="csi-out"
              label="Outcomes"
              value={value.data.outcomes}
              onChange={(outcomes) =>
                onChange({ pack, data: { ...value.data, outcomes } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="csi-notes"
              label="CSI notes"
              value={value.data.notes}
              onChange={(notes) =>
                onChange({ pack, data: { ...value.data, notes } })
              }
            />
          </div>
        </div>
      ) : null}

      {pack === "esg_period" && value.pack === "esg_period" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            id="esg-period"
            label="Reporting period"
            value={value.data.periodLabel}
            onChange={(periodLabel) =>
              onChange({ pack, data: { ...value.data, periodLabel } })
            }
          />
          <NumberInput
            id="esg-env"
            label="Environmental incidents"
            value={value.data.environmentalIncidents}
            onChange={(environmentalIncidents) =>
              onChange({ pack, data: { ...value.data, environmentalIncidents } })
            }
          />
          <NumberInput
            id="esg-nm"
            label="H&S near misses"
            value={value.data.hsNearMisses}
            onChange={(hsNearMisses) =>
              onChange({ pack, data: { ...value.data, hsNearMisses } })
            }
          />
          <NumberInput
            id="esg-lti"
            label="Lost-time injuries"
            value={value.data.hsLostTimeInjuries}
            onChange={(hsLostTimeInjuries) =>
              onChange({ pack, data: { ...value.data, hsLostTimeInjuries } })
            }
          />
          <div className="sm:col-span-2">
            <AreaInput
              id="esg-dust"
              label="Dust / water / noise / waste controls"
              value={value.data.dustWaterNoiseNotes}
              onChange={(dustWaterNoiseNotes) =>
                onChange({ pack, data: { ...value.data, dustWaterNoiseNotes } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="esg-rehab"
              label="Rehabilitation / closure progress"
              value={value.data.rehabilitationProgress}
              onChange={(rehabilitationProgress) =>
                onChange({
                  pack,
                  data: { ...value.data, rehabilitationProgress },
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="esg-trust"
              label="Community trust / social notes"
              value={value.data.communityTrustNotes}
              onChange={(communityTrustNotes) =>
                onChange({ pack, data: { ...value.data, communityTrustNotes } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="esg-gov"
              label="Governance actions this period"
              value={value.data.governanceActions}
              onChange={(governanceActions) =>
                onChange({ pack, data: { ...value.data, governanceActions } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="esg-notes"
              label="ESG notes"
              value={value.data.notes}
              onChange={(notes) =>
                onChange({ pack, data: { ...value.data, notes } })
              }
            />
          </div>
        </div>
      ) : null}

      {pack === "grm_period" && value.pack === "grm_period" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            id="grm-period"
            label="Reporting period"
            value={value.data.periodLabel}
            onChange={(periodLabel) =>
              onChange({ pack, data: { ...value.data, periodLabel } })
            }
          />
          <NumberInput
            id="grm-open"
            label="Cases opened"
            value={value.data.casesOpened}
            onChange={(casesOpened) =>
              onChange({ pack, data: { ...value.data, casesOpened } })
            }
          />
          <NumberInput
            id="grm-closed"
            label="Cases closed"
            value={value.data.casesClosed}
            onChange={(casesClosed) =>
              onChange({ pack, data: { ...value.data, casesClosed } })
            }
          />
          <NumberInput
            id="grm-esc"
            label="Cases escalated"
            value={value.data.casesEscalated}
            onChange={(casesEscalated) =>
              onChange({ pack, data: { ...value.data, casesEscalated } })
            }
          />
          <NumberInput
            id="grm-days"
            label="Average days to close"
            value={value.data.avgDaysToClose}
            onChange={(avgDaysToClose) =>
              onChange({ pack, data: { ...value.data, avgDaysToClose } })
            }
          />
          <div className="sm:col-span-2">
            <AreaInput
              id="grm-themes"
              label="Top themes / natures"
              value={value.data.topThemes}
              onChange={(topThemes) =>
                onChange({ pack, data: { ...value.data, topThemes } })
              }
              placeholder="Employment, access, dust, compensation…"
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="grm-feedback"
              label="Community feedback"
              value={value.data.communityFeedback}
              onChange={(communityFeedback) =>
                onChange({ pack, data: { ...value.data, communityFeedback } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="grm-improve"
              label="Process improvements"
              value={value.data.processImprovements}
              onChange={(processImprovements) =>
                onChange({ pack, data: { ...value.data, processImprovements } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="grm-notes"
              label="GRM notes"
              value={value.data.notes}
              onChange={(notes) =>
                onChange({ pack, data: { ...value.data, notes } })
              }
            />
          </div>
        </div>
      ) : null}

      {pack === "issue_log" && value.pack === "issue_log" ? (
        <div className="space-y-4">
          <div className="rounded-md border border-tl-line bg-tl-paper p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-tl-ink">
                Desk cases
                {projectId ? ` · ${projectIncidents.length} on file` : ""}
              </p>
              <Link
                href={
                  projectId
                    ? `/app/issues/report?projectId=${encodeURIComponent(projectId)}`
                    : "/app/issues/report"
                }
                className="text-sm font-medium text-tl-trust-ink underline"
              >
                Log new issue
              </Link>
            </div>
            {projectIncidents.length === 0 ? (
              <p className="mt-2 text-sm text-tl-ink-muted">
                No cases linked to this project yet — use Log new issue or open{" "}
                <Link href="/app/incidents" className="underline">
                  Incidents
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
                {projectIncidents.slice(0, 12).map((inc) => (
                  <li key={inc.id}>
                    <Link
                      href={`/app/incidents/${encodeURIComponent(inc.id)}`}
                      className="text-tl-trust-ink underline"
                    >
                      {inc.id}
                    </Link>
                    <span className="text-tl-ink-muted">
                      {" "}
                      · {inc.status} · {inc.priority} —{" "}
                      {inc.title.slice(0, 72)}
                      {inc.title.length > 72 ? "…" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              id="il-period"
              label="Reporting period"
              value={value.data.periodLabel}
              onChange={(periodLabel) =>
                onChange({ pack, data: { ...value.data, periodLabel } })
              }
            />
            <NumberInput
              id="il-logged"
              label="Cases logged this period"
              value={value.data.casesLogged}
              onChange={(casesLogged) =>
                onChange({ pack, data: { ...value.data, casesLogged } })
              }
            />
            <NumberInput
              id="il-open"
              label="Open cases (desk)"
              value={value.data.casesOpen}
              onChange={(casesOpen) =>
                onChange({ pack, data: { ...value.data, casesOpen } })
              }
            />
            <NumberInput
              id="il-closed"
              label="Closed this period"
              value={value.data.casesClosed}
              onChange={(casesClosed) =>
                onChange({ pack, data: { ...value.data, casesClosed } })
              }
            />
            <NumberInput
              id="il-esc"
              label="Escalated"
              value={value.data.casesEscalated}
              onChange={(casesEscalated) =>
                onChange({ pack, data: { ...value.data, casesEscalated } })
              }
            />
            <div className="sm:col-span-2">
              <AreaInput
                id="il-themes"
                label="Top themes / natures"
                value={value.data.topThemes}
                onChange={(topThemes) =>
                  onChange({ pack, data: { ...value.data, topThemes } })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <AreaInput
                id="il-refs"
                label="Open case refs"
                value={value.data.openCaseRefs}
                onChange={(openCaseRefs) =>
                  onChange({ pack, data: { ...value.data, openCaseRefs } })
                }
                placeholder="INC-… · INC-…"
              />
            </div>
            <div className="sm:col-span-2">
              <AreaInput
                id="il-desk"
                label="Desk notes"
                value={value.data.deskNotes}
                onChange={(deskNotes) =>
                  onChange({ pack, data: { ...value.data, deskNotes } })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <AreaInput
                id="il-notes"
                label="Issue log notes"
                value={value.data.notes}
                onChange={(notes) =>
                  onChange({ pack, data: { ...value.data, notes } })
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {pack === "budget" && value.pack === "budget" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            id="bud-period"
            label="Reporting period"
            value={value.data.periodLabel}
            onChange={(periodLabel) =>
              onChange({ pack, data: { ...value.data, periodLabel } })
            }
          />
          <NumberInput
            id="bud-total"
            label="Empowerment budget authorised (ZAR)"
            value={value.data.budgetTotalZar}
            onChange={(budgetTotalZar) =>
              onChange({ pack, data: { ...value.data, budgetTotalZar } })
            }
          />
          <NumberInput
            id="bud-ytd"
            label="Empowerment spent to date (ZAR)"
            value={value.data.spendToDateZar}
            onChange={(spendToDateZar) =>
              onChange({ pack, data: { ...value.data, spendToDateZar } })
            }
          />
          <p className="sm:col-span-2 text-xs text-tl-ink-muted">
            This pack is the empowerment envelope — not CAPEX. Spent prefills
            from training + B-BBEE packs when those are saved.
          </p>
          <NumberInput
            id="bud-period-spend"
            label="Period empowerment spend (ZAR)"
            value={value.data.periodSpendZar}
            onChange={(periodSpendZar) =>
              onChange({ pack, data: { ...value.data, periodSpendZar } })
            }
          />
          <NumberInput
            id="bud-cont"
            label="Contingency remaining (ZAR)"
            value={value.data.contingencyZar}
            onChange={(contingencyZar) =>
              onChange({ pack, data: { ...value.data, contingencyZar } })
            }
          />
          <NumberInput
            id="bud-claims"
            label="Claims pending (ZAR)"
            value={value.data.claimsPendingZar}
            onChange={(claimsPendingZar) =>
              onChange({ pack, data: { ...value.data, claimsPendingZar } })
            }
          />
          <div className="sm:col-span-2">
            <AreaInput
              id="bud-var"
              label="Variance / claims notes"
              value={value.data.varianceNotes}
              onChange={(varianceNotes) =>
                onChange({ pack, data: { ...value.data, varianceNotes } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <AreaInput
              id="bud-notes"
              label="Empowerment budget notes"
              value={value.data.notes}
              onChange={(notes) =>
                onChange({ pack, data: { ...value.data, notes } })
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
