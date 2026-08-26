import Link from "next/link";
import { SEP_SECTOR_PLAYBOOKS } from "@/data/sepSectors";
import { SEP_SLB_LANES } from "@/lib/sepExecution";
import {
  interestForClass,
  quadrantForClass,
  SEP_QUADRANT_LABELS,
  vulnerabilityForClass,
} from "@/lib/sepMatrix";
import type { EngagementPlan } from "@/types/engagementPlan";
import {
  SEP_MODULE_HREF,
  SEP_MODULE_LABELS,
  SEP_PURPOSE_LABELS,
  SEP_SECTOR_LABELS,
} from "@/types/engagementPlan";
import { STAKEHOLDER_KIND_LABELS } from "@/types/stakeholder";
import { ENGAGEMENT_KIND_LABELS } from "@/types/engagement";

type Props = {
  plan: EngagementPlan;
};

export function SepProcessDashboard({ plan }: Props) {
  const playbook = SEP_SECTOR_PLAYBOOKS[plan.sectorId];
  const modules = Array.from(
    new Set([
      ...plan.phases.map((p) => p.module),
      ...plan.activities.map((a) => a.module),
      ...plan.stakeholderClasses.map((s) => s.module),
    ]),
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Phases" value={String(plan.phases.length)} hint="Inception to close-out" />
        <Kpi
          label="Stakeholder classes"
          value={String(plan.stakeholderClasses.length)}
          hint={SEP_SECTOR_LABELS[plan.sectorId]}
        />
        <Kpi
          label="Planned activities"
          value={String(plan.activities.length)}
          hint="Draft engagements on apply"
        />
        <Kpi
          label="Standing commitments"
          value={String(plan.commitments.length)}
          hint="Promise board on apply"
        />
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="font-display text-lg font-semibold text-tl-ink">
          Social Licence to Build™ → TrustLedger desks
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Positioning mapped to shipped modules — not a separate unreleased
          suite. Themba does not write the live desk.
        </p>
        <ul className="mt-3 grid gap-3 lg:grid-cols-2">
          {SEP_SLB_LANES.map((row) => (
            <li
              key={row.id}
              className="rounded-md border border-tl-line px-3 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
                {row.slbLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-tl-ink">
                {row.deskLabel}
              </p>
              <p className="mt-1 text-xs text-tl-ink-muted">{row.protocol}</p>
              <Link
                href={row.href}
                className="mt-2 inline-block text-xs font-medium text-tl-trust-ink underline"
              >
                Open desk
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="font-display text-lg font-semibold text-tl-ink">
          Process from inception to finish
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">{playbook.summary}</p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-7">
          {plan.phases.map((phase) => (
            <li key={phase.id}>
              <a
                href={`#phase-${phase.id}`}
                className="block h-full rounded-md border border-tl-line px-2 py-3 text-center hover:border-tl-trust hover:bg-tl-paper"
              >
                <span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-tl-trust">
                  {phase.order}
                </span>
                <span className="mt-1 block text-xs font-medium text-tl-ink">
                  {phase.title}
                </span>
                <span className="mt-1 block text-[0.7rem] text-tl-ink-muted">
                  {phase.typicalDuration}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      {plan.phases.map((phase) => {
        const acts = plan.activities.filter((row) => row.phaseId === phase.id);
        return (
          <section
            key={phase.id}
            id={`phase-${phase.id}`}
            className="scroll-mt-24 rounded-lg border border-tl-line bg-tl-surface p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tl-trust">
                  Phase {phase.order}
                </p>
                <h3 className="font-display text-lg font-semibold text-tl-ink">
                  {phase.title}
                </h3>
              </div>
              <Link
                href={SEP_MODULE_HREF[phase.module]}
                className="rounded-md border border-tl-line px-3 py-1.5 text-xs font-medium hover:bg-tl-paper"
              >
                {SEP_MODULE_LABELS[phase.module]}
              </Link>
            </div>
            <p className="mt-2 text-sm text-tl-ink">{phase.intent}</p>
            <p className="mt-2 text-sm text-tl-ink-muted">
              <span className="font-medium text-tl-ink">Exit: </span>
              {phase.exitCriteria}
            </p>
            {acts.length ? (
              <ul className="mt-4 divide-y divide-tl-line rounded-md border border-tl-line">
                {acts.map((act) => (
                  <li key={act.id} className="px-3 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-tl-ink">{act.title}</p>
                      <span className="text-xs text-tl-ink-muted">
                        {ENGAGEMENT_KIND_LABELS[act.engagementKind]} ·{" "}
                        {SEP_PURPOSE_LABELS[act.purpose]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-tl-ink-muted">
                      {act.method}. Owner: {act.ownerHint}. {act.timingHint}.
                    </p>
                    <p className="mt-1 text-xs text-tl-ink-muted">
                      Evidence: {act.evidenceHint}
                      {act.captureTemplate ? (
                        <>
                          {" "}
                          ·{" "}
                          <Link
                            href={`/app/capture?source=${act.captureTemplate}`}
                            className="text-tl-trust-ink underline"
                          >
                            Capture {act.captureTemplate.replace("_", " ")} template
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-tl-ink-muted">
                No extra activities in this phase — the sector spine still applies.
              </p>
            )}
          </section>
        );
      })}

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="font-display text-lg font-semibold text-tl-ink">
          Stakeholder analysis
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Classes the playbook expects. Named organisations from the brief are
          attached where the extract was confident.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
                <th className="py-2 pr-3 font-medium">Class</th>
                <th className="py-2 pr-3 font-medium">Kind</th>
                <th className="py-2 pr-3 font-medium">Influence</th>
                <th className="py-2 pr-3 font-medium">Interest</th>
                <th className="py-2 pr-3 font-medium">Quadrant</th>
                <th className="py-2 pr-3 font-medium">Purpose</th>
                <th className="py-2 font-medium">Why / vulnerability</th>
              </tr>
            </thead>
            <tbody>
              {plan.stakeholderClasses.map((row) => (
                <tr key={row.id} className="border-b border-tl-line align-top">
                  <td className="py-2 pr-3 font-medium text-tl-ink">
                    {row.label}
                  </td>
                  <td className="py-2 pr-3 text-tl-ink-muted">
                    {STAKEHOLDER_KIND_LABELS[row.kind]}
                  </td>
                  <td className="py-2 pr-3 capitalize text-tl-ink-muted">
                    {row.influence}
                  </td>
                  <td className="py-2 pr-3 capitalize text-tl-ink-muted">
                    {interestForClass(row)}
                  </td>
                  <td className="py-2 pr-3 text-tl-ink-muted">
                    {SEP_QUADRANT_LABELS[quadrantForClass(row)]}
                  </td>
                  <td className="py-2 pr-3 text-tl-ink-muted">
                    {SEP_PURPOSE_LABELS[row.purpose]}
                  </td>
                  <td className="py-2 text-tl-ink-muted">
                    {row.why}
                    <span className="mt-1 block text-xs">
                      {vulnerabilityForClass(row)}
                    </span>
                    {row.namedFromBrief?.length ? (
                      <span className="mt-1 block text-tl-ink">
                        Named: {row.namedFromBrief.join("; ")}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <h2 className="font-display text-lg font-semibold text-tl-ink">
            Instruments cited
          </h2>
          <ul className="mt-3 space-y-3">
            {plan.instruments.map((row) => (
              <li key={row.id}>
                <p className="font-medium text-tl-ink">{row.label}</p>
                <p className="text-sm text-tl-ink-muted">{row.note}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <h2 className="font-display text-lg font-semibold text-tl-ink">
            Grievance path
          </h2>
          <p className="mt-2 text-sm text-tl-ink">{plan.grievancePath}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-tl-ink-muted">
            <li>Lodgment — Report issue / Capture</li>
            <li>Acknowledgment — case SLA due date</li>
            <li>Investigation — Incidents desk</li>
            <li>Resolution — named owner</li>
            <li>Verify &amp; close — community / supervisor stamp</li>
          </ol>
          <Link
            href="/app/incidents"
            className="mt-3 inline-block text-sm font-medium text-tl-trust-ink underline"
          >
            Open incidents desk
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="font-display text-lg font-semibold text-tl-ink">
          SRM modules this plan seeds
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          After client approval, Apply writes prospect stakeholders, draft
          engagements, and open commitments. Capture, geo, intelligence, and
          reports stay linked for the fieldwork that follows.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {modules.map((id) => (
            <li key={id}>
              <Link
                href={SEP_MODULE_HREF[id]}
                className="inline-block rounded-md border border-tl-line px-3 py-1.5 text-sm hover:bg-tl-paper"
              >
                {SEP_MODULE_LABELS[id]}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-tl-line bg-tl-surface px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold text-tl-ink">
        {value}
      </p>
      <p className="text-xs text-tl-ink-muted">{hint}</p>
    </div>
  );
}
