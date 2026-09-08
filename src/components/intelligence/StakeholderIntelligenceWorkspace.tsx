"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  buildDemoSampleChain,
  composeStakeholderWorkspace,
  emptyStakeholderChain,
  recordWorkspaceAction,
  recordWorkspaceDecision,
  recordWorkspaceIntelligence,
  recordWorkspaceInterpretation,
  recordWorkspaceOutcome,
  recordWorkspaceRecommendation,
  recordWorkspaceSignal,
  traceRecommendation,
  workspaceRecommendationIsSuggestion,
} from "@/lib/intelligence/stakeholderWorkspace";
import {
  loadStakeholderChain,
  saveStakeholderChain,
} from "@/lib/intelligence/stakeholderWorkspaceStore";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import type { Commitment } from "@/types/commitment";
import { COMMITMENT_STATUS_LABELS } from "@/types/commitment";
import type { Engagement, EvidenceStub } from "@/types/engagement";
import { ENGAGEMENT_KIND_LABELS } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import {
  HUMAN_DECISION_STATUSES,
  type HumanDecisionStatus,
  type IntelligenceRecordRef,
} from "@/types/intelligenceFoundation";
import {
  SIGNAL_CLASSIFICATIONS,
  type SignalClassification,
} from "@/types/intelligenceSignal";
import type { Stakeholder } from "@/types/stakeholder";
import type { StakeholderChainBundle } from "@/types/stakeholderIntelligenceWorkspace";

const STAGES = [
  { id: "workspace-stakeholder", label: "Stakeholder" },
  { id: "workspace-context", label: "Context" },
  { id: "workspace-evidence", label: "Evidence" },
  { id: "workspace-signals", label: "Signals" },
  { id: "workspace-interpretations", label: "Interpretations" },
  { id: "workspace-intelligence", label: "Intelligence" },
  { id: "workspace-recommendations", label: "Recommendations" },
  { id: "workspace-decision", label: "Human decision" },
  { id: "workspace-action", label: "Action / outcome" },
] as const;

const DECISION_STATUS_LABELS: Record<HumanDecisionStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  modified: "Modified",
  rejected: "Rejected",
  deferred: "Deferred",
  escalated: "Escalated",
};

type StakeholderIntelligenceWorkspaceProps = {
  stakeholder: Stakeholder;
  engagements: Engagement[];
  commitments: Commitment[];
  incidents: Incident[];
  evidence: EvidenceStub[];
};

function formatRef(ref: IntelligenceRecordRef): string {
  return `${ref.kind}:${ref.id}`;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Could not save";
}

export function StakeholderIntelligenceWorkspace({
  stakeholder,
  engagements,
  commitments,
  incidents,
  evidence,
}: StakeholderIntelligenceWorkspaceProps) {
  const { pushToast } = useToast();
  const customerWorkspace = isCustomerWorkspaceClient();
  const [bundle, setBundle] = useState<StakeholderChainBundle>(() =>
    loadStakeholderChain(stakeholder.id, { customerWorkspace }),
  );
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<string | null>(null);

  const view = useMemo(
    () =>
      composeStakeholderWorkspace({
        stakeholder,
        engagements,
        commitments,
        incidents,
        evidence,
        stored: bundle,
        customerWorkspace,
      }),
    [
      stakeholder,
      engagements,
      commitments,
      incidents,
      evidence,
      bundle,
      customerWorkspace,
    ],
  );

  function persist(next: StakeholderChainBundle) {
    const saved = saveStakeholderChain(next, { customerWorkspace });
    setBundle(saved);
    setError(null);
    setOpenForm(null);
  }

  function run(label: string, fn: () => StakeholderChainBundle) {
    try {
      persist(fn());
      pushToast(label, "success");
    } catch (err) {
      setError(errorMessage(err));
      pushToast(errorMessage(err), "error");
    }
  }

  function loadSample() {
    if (customerWorkspace) return;
    try {
      persist(buildDemoSampleChain(stakeholder, view.context));
      pushToast("Labelled sample chain loaded (demo only)", "success");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const operating = view.context.operating;
  const latestSignal = view.signals[view.signals.length - 1];
  const latestInterpretation =
    view.interpretations[view.interpretations.length - 1];
  const latestIntelligence = view.intelligence[view.intelligence.length - 1];
  const latestRecommendation =
    view.recommendations[view.recommendations.length - 1];
  const latestDecision = view.decisions[view.decisions.length - 1];
  const latestAction = view.actions[view.actions.length - 1];

  return (
    <section
      className="space-y-4"
      aria-labelledby="stakeholder-intelligence-workspace"
    >
      <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tl-trust">
          Stakeholder Intelligence
        </p>
        <h2
          id="stakeholder-intelligence-workspace"
          className="mt-1 font-display text-lg font-semibold text-tl-ink"
        >
          Intelligence & decision workspace
        </h2>
        <p className="mt-1.5 max-w-3xl text-sm text-tl-ink-muted">
          One governed trail: stakeholder, operating context, evidence and
          activity, signals, interpretations, intelligence, suggestions, then a
          distinct human decision. Recommendations stay suggestion only. They
          are not decisions, scores, or automated actions.
        </p>
        <nav
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Intelligence lifecycle"
        >
          {STAGES.map((stage, index) => (
            <a
              key={stage.id}
              href={`#${stage.id}`}
              className="rounded-md bg-tl-paper px-2 py-1 text-xs text-tl-ink-muted hover:text-tl-trust-ink"
            >
              {index + 1}. {stage.label}
            </a>
          ))}
        </nav>
        {view.chainSource === "seed_demo" ? (
          <p className="mt-3 rounded-md bg-tl-demo px-3 py-2 text-xs text-white">
            Sample chain (demo). Not customer evidence or a live analysis.
          </p>
        ) : null}
        {customerWorkspace ? (
          <p className="mt-3 text-xs text-tl-ink-muted">
            Customer workspace — demo seed and INC-* showcase rows are not mixed
            into this trail. Chain rows stay in this browser until a later Cloud
            packet.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-tl-danger/30 bg-tl-paper px-3 py-2 text-sm text-tl-danger">
          {error}
        </p>
      ) : null}

      <section id="workspace-stakeholder" className="space-y-2">
        <h3 className="font-display text-base font-semibold text-tl-ink">
          Stakeholder
        </h3>
        <p className="text-sm text-tl-ink">
          {stakeholder.name}
          {stakeholder.organisation ? ` · ${stakeholder.organisation}` : ""}
        </p>
        <p className="text-xs text-tl-ink-muted">
          CRM identity stays on this page. This workspace does not replace the
          registry card.
        </p>
      </section>

      <section
        id="workspace-context"
        className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4"
      >
        <h3 className="font-display text-base font-semibold text-tl-ink">
          Operating context
        </h3>
        <p className="text-sm text-tl-ink-muted">
          Descriptive I-02 context from recorded CRM fields. Influence is
          copied; other operating levels appear only when they were supplied —
          they are not inferred from activity counts.
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
              Influence (recorded)
            </dt>
            <dd className="mt-1 text-sm capitalize text-tl-ink">
              {operating?.influence || stakeholder.influence}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
              As of
            </dt>
            <dd className="mt-1 text-sm text-tl-ink">
              {view.context.temporal.asOf || "—"}
            </dd>
          </div>
        </dl>
        {operating?.note ? (
          <p className="text-sm text-tl-ink">{operating.note}</p>
        ) : null}
        <p className="text-xs text-tl-ink-muted">
          Subject {view.context.subjectRefs.map(formatRef).join(", ") || "—"}
        </p>
      </section>

      <section
        id="workspace-evidence"
        className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4"
      >
        <h3 className="font-display text-base font-semibold text-tl-ink">
          Evidence and activity
        </h3>
        <p className="text-sm text-tl-ink-muted">
          Linked engagements and commitments use recorded stakeholder ids.
          Shared-project rows appear only when this stakeholder has project
          links. Incidents are not first-class stakeholder records.
        </p>
        <ActivityList
          title="Linked engagements"
          empty="No engagement is linked to this stakeholder."
        >
          {view.linkedEngagements.map((row) => (
            <li key={row.id}>
              <Link
                href={`/app/engagements/${row.id}`}
                className="text-tl-trust-ink underline"
              >
                {row.title}
              </Link>
              <span className="text-tl-ink-muted">
                {" "}
                · {ENGAGEMENT_KIND_LABELS[row.kind]} · {row.heldOn}
              </span>
            </li>
          ))}
        </ActivityList>
        <ActivityList
          title="Linked commitments"
          empty="No commitment is linked to this stakeholder."
        >
          {view.linkedCommitments.map((row) => (
            <li key={row.id}>
              <Link
                href="/app/commitments"
                className="text-tl-trust-ink underline"
              >
                {row.title}
              </Link>
              <span className="text-tl-ink-muted">
                {" "}
                · {COMMITMENT_STATUS_LABELS[row.status]} · due {row.dueOn}
              </span>
            </li>
          ))}
        </ActivityList>
        <ActivityList
          title="Shared-project activity"
          empty="No shared-project engagements, commitments, or incidents (no project links, or none on those projects)."
        >
          {view.projectEngagements.map((row) => (
            <li key={row.id}>
              Engagement {row.title} ({row.id})
            </li>
          ))}
          {view.projectCommitments.map((row) => (
            <li key={row.id}>
              Commitment {row.title} ({row.id})
            </li>
          ))}
          {view.projectIncidents.map((row) => (
            <li key={row.id}>
              Case {row.title} ({row.id}) — project activity, not a
              stakeholder-attributed incident.
            </li>
          ))}
          {view.projectEvidence.map((row) => (
            <li key={row.id}>
              Evidence {row.fileName} on {row.incidentId}
            </li>
          ))}
        </ActivityList>
      </section>

      <ChainSection
        id="workspace-signals"
        title="Signals"
        count={view.signals.length}
        empty="No signal is on file. A signal is an observation, not a conclusion. Classification is not inferred from influence or counts."
      >
        {view.signals.map((row) => (
          <article
            key={row.id}
            className="rounded-md border border-tl-line bg-tl-paper p-3"
          >
            <p className="text-sm font-medium text-tl-ink">{row.summary}</p>
            <p className="mt-1 text-xs capitalize text-tl-ink-muted">
              {row.classification} · {row.state} · {row.id}
            </p>
            <p className="mt-2 text-sm text-tl-ink">{row.explanation}</p>
            <TraceLine
              label="Context"
              value={row.contextIds.join(", ") || "—"}
            />
            <TraceLine
              label="Evidence"
              value={row.evidenceRefs.map(formatRef).join(", ") || "—"}
            />
          </article>
        ))}
        {openForm === "signal" ? (
          <SignalForm
            onCancel={() => setOpenForm(null)}
            onSave={(fields) =>
              run("Signal recorded", () =>
                recordWorkspaceSignal({
                  bundle:
                    bundle.signals.length || bundle.source === "seed_demo"
                      ? bundle
                      : emptyStakeholderChain(stakeholder.id),
                  context: view.context,
                  ...fields,
                }),
              )
            }
          />
        ) : (
          <button
            type="button"
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-sm hover:bg-tl-paper"
            onClick={() => setOpenForm("signal")}
          >
            Record signal
          </button>
        )}
      </ChainSection>

      <ChainSection
        id="workspace-interpretations"
        title="Interpretations"
        count={view.interpretations.length}
        empty="No interpretation is on file. A hypothesis is not intelligence and not a decision."
      >
        {view.interpretations.map((row) => (
          <article
            key={row.id}
            className="rounded-md border border-tl-line bg-tl-paper p-3"
          >
            <p className="text-sm font-medium text-tl-ink">{row.hypothesis}</p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Review {row.reviewState} · {row.id}
            </p>
            <p className="mt-2 text-sm text-tl-ink">{row.rationale}</p>
            {row.alternatives.length ? (
              <p className="mt-2 text-sm text-tl-ink-muted">
                Alternatives: {row.alternatives.join(" ")}
              </p>
            ) : null}
            <TraceLine label="Signal" value={row.signalIds.join(", ")} />
            <TraceLine
              label="Context"
              value={row.contextIds.join(", ") || "—"}
            />
          </article>
        ))}
        {latestSignal && openForm === "interpretation" ? (
          <InterpretationForm
            signalId={latestSignal.id}
            onCancel={() => setOpenForm(null)}
            onSave={(fields) =>
              run("Interpretation recorded", () =>
                recordWorkspaceInterpretation({
                  bundle,
                  context: view.context,
                  ...fields,
                }),
              )
            }
          />
        ) : latestSignal ? (
          <button
            type="button"
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-sm hover:bg-tl-paper"
            onClick={() => setOpenForm("interpretation")}
          >
            Record interpretation
          </button>
        ) : (
          <p className="text-xs text-tl-ink-muted">
            Record a signal before an interpretation.
          </p>
        )}
      </ChainSection>

      <ChainSection
        id="workspace-intelligence"
        title="Intelligence"
        count={view.intelligence.length}
        empty="No intelligence is on file. Synthesis must not copy a hypothesis."
      >
        {view.intelligence.map((row) => (
          <article
            key={row.id}
            className="rounded-md border border-tl-line bg-tl-paper p-3"
          >
            <p className="text-sm font-medium text-tl-ink">{row.statement}</p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Review {row.reviewState} · {row.id}
            </p>
            <p className="mt-2 text-sm text-tl-ink">{row.synthesis}</p>
            <TraceLine
              label="Interpretations"
              value={row.interpretationIds.join(", ")}
            />
            <TraceLine label="Signals" value={row.signalIds.join(", ") || "—"} />
          </article>
        ))}
        {latestInterpretation && openForm === "intelligence" ? (
          <IntelligenceForm
            interpretationId={latestInterpretation.id}
            onCancel={() => setOpenForm(null)}
            onSave={(fields) =>
              run("Intelligence recorded", () =>
                recordWorkspaceIntelligence({
                  bundle,
                  ...fields,
                }),
              )
            }
          />
        ) : latestInterpretation ? (
          <button
            type="button"
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-sm hover:bg-tl-paper"
            onClick={() => setOpenForm("intelligence")}
          >
            Record intelligence
          </button>
        ) : (
          <p className="text-xs text-tl-ink-muted">
            Record an interpretation before intelligence.
          </p>
        )}
      </ChainSection>

      <ChainSection
        id="workspace-recommendations"
        title="Recommendations"
        count={view.recommendations.length}
        empty="No recommendation is on file. A recommendation is a suggestion, not a human decision."
      >
        {view.recommendations.map((row) => {
          const trace = traceRecommendation(row);
          return (
            <article
              key={row.id}
              className="rounded-md border border-dashed border-tl-line bg-tl-paper p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
                Suggestion only
              </p>
              <p className="mt-1 text-sm font-medium text-tl-ink">
                {row.statement}
              </p>
              <p className="mt-1 text-xs text-tl-ink-muted">
                Review {row.reviewState} · not a human decision · {row.id}
              </p>
              <p className="mt-2 text-sm text-tl-ink">{row.action}</p>
              <p className="mt-2 text-sm text-tl-ink-muted">{row.rationale}</p>
              <p className="mt-2 text-xs text-tl-ink-muted">
                Alternatives:{" "}
                {row.alternatives.map((alt) => alt.statement).join(" · ")}
              </p>
              <TraceLine
                label="Trail"
                value={`Recommendation ${trace.recommendationId} → Intelligence ${trace.intelligenceIds.join(", ") || "—"} → Interpretation ${trace.interpretationIds.join(", ") || "—"} → Signal ${trace.signalIds.join(", ") || "—"} → Context ${trace.contextIds.join(", ") || "—"} → Evidence ${trace.evidenceRefs.map(formatRef).join(", ") || "—"}`}
              />
              {!workspaceRecommendationIsSuggestion(row) ? (
                <p className="mt-2 text-sm text-tl-danger">
                  This row failed the suggestion-only guard.
                </p>
              ) : null}
            </article>
          );
        })}
        {latestIntelligence && openForm === "recommendation" ? (
          <RecommendationForm
            intelligenceId={latestIntelligence.id}
            onCancel={() => setOpenForm(null)}
            onSave={(fields) =>
              run("Recommendation recorded", () =>
                recordWorkspaceRecommendation({
                  bundle,
                  ...fields,
                }),
              )
            }
          />
        ) : latestIntelligence ? (
          <button
            type="button"
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-sm hover:bg-tl-paper"
            onClick={() => setOpenForm("recommendation")}
          >
            Record recommendation
          </button>
        ) : (
          <p className="text-xs text-tl-ink-muted">
            Record intelligence before a recommendation.
          </p>
        )}
      </ChainSection>

      <section
        id="workspace-decision"
        className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4"
      >
        <h3 className="font-display text-base font-semibold text-tl-ink">
          Human decision
        </h3>
        <p className="text-sm text-tl-ink-muted">
          A person records a new decision record against a suggestion. Accepting
          a recommendation review is not this step. Decisions are not executed
          automatically.
        </p>
        {view.decisions.map((row) => (
          <article
            key={row.id}
            className="rounded-md border border-tl-line bg-tl-paper p-3"
          >
            <p className="text-sm font-medium capitalize text-tl-ink">
              {DECISION_STATUS_LABELS[row.status]}
            </p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Human decision · {row.id} · recommendation {row.recommendationId}
            </p>
            {row.decidedBy ? (
              <p className="mt-1 text-sm text-tl-ink">By {row.decidedBy}</p>
            ) : null}
            {row.note ? (
              <p className="mt-2 text-sm text-tl-ink">{row.note}</p>
            ) : null}
          </article>
        ))}
        {latestRecommendation && openForm === "decision" ? (
          <DecisionForm
            recommendationId={latestRecommendation.id}
            onCancel={() => setOpenForm(null)}
            onSave={(fields) => {
              try {
                const result = recordWorkspaceDecision({
                  bundle,
                  ...fields,
                });
                persist(result.bundle);
                pushToast("Human decision recorded", "success");
              } catch (err) {
                setError(errorMessage(err));
                pushToast(errorMessage(err), "error");
              }
            }}
          />
        ) : latestRecommendation ? (
          <button
            type="button"
            className="rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
            onClick={() => setOpenForm("decision")}
          >
            Record human decision
          </button>
        ) : (
          <p className="text-sm text-tl-ink-muted">
            A recommendation must be on file before a human decision can be
            recorded. Empty customer files stay empty — this workspace will not
            invent one.
          </p>
        )}
      </section>

      <section
        id="workspace-action"
        className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4"
      >
        <h3 className="font-display text-base font-semibold text-tl-ink">
          Action and outcome
        </h3>
        <p className="text-sm text-tl-ink-muted">
          Recorded by a person after a decision. Not an automated action and not
          a methodology engine.
        </p>
        {view.actions.map((row) => (
          <article
            key={row.id}
            className="rounded-md border border-tl-line bg-tl-paper p-3"
          >
            <p className="text-sm text-tl-ink">{row.summary}</p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Action {row.id} · decision {row.decisionId}
            </p>
          </article>
        ))}
        {view.outcomes.map((row) => (
          <article
            key={row.id}
            className="rounded-md border border-tl-line bg-tl-paper p-3"
          >
            <p className="text-sm text-tl-ink">{row.summary}</p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Outcome {row.id}
              {row.actionId ? ` · action ${row.actionId}` : ""}
            </p>
          </article>
        ))}
        {latestDecision && openForm === "action" ? (
          <SimpleRecordForm
            label="What action was taken?"
            submitLabel="Record action"
            onCancel={() => setOpenForm(null)}
            onSave={(summary) =>
              run("Action recorded", () =>
                recordWorkspaceAction({
                  bundle,
                  decisionId: latestDecision.id,
                  summary,
                }),
              )
            }
          />
        ) : latestDecision ? (
          <button
            type="button"
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-sm hover:bg-tl-paper"
            onClick={() => setOpenForm("action")}
          >
            Record action
          </button>
        ) : (
          <p className="text-xs text-tl-ink-muted">
            Record a human decision before an action.
          </p>
        )}
        {latestAction && openForm === "outcome" ? (
          <SimpleRecordForm
            label="What was the outcome?"
            submitLabel="Record outcome"
            onCancel={() => setOpenForm(null)}
            onSave={(summary) =>
              run("Outcome recorded", () =>
                recordWorkspaceOutcome({
                  bundle,
                  actionId: latestAction.id,
                  summary,
                }),
              )
            }
          />
        ) : latestAction ? (
          <button
            type="button"
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-sm hover:bg-tl-paper"
            onClick={() => setOpenForm("outcome")}
          >
            Record outcome
          </button>
        ) : null}
      </section>

      {!customerWorkspace && view.chainSource === "none" ? (
        <p className="text-sm text-tl-ink-muted">
          Demo workspace: you may{" "}
          <button
            type="button"
            className="text-tl-trust-ink underline"
            onClick={loadSample}
          >
            load a labelled sample chain
          </button>{" "}
          to walk the trail. Sample text is not customer data.
        </p>
      ) : null}
    </section>
  );
}

function ChainSection({
  id,
  title,
  empty,
  count,
  children,
}: {
  id: string;
  title: string;
  empty: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4"
    >
      <h3 className="font-display text-base font-semibold text-tl-ink">
        {title}
      </h3>
      {count === 0 ? <p className="text-sm text-tl-ink-muted">{empty}</p> : null}
      {children}
    </section>
  );
}

function ActivityList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const count = Array.isArray(children)
    ? children.filter(Boolean).length
    : children
      ? 1
      : 0;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
        {title}
      </h4>
      {count ? (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-tl-ink">
          {children}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-tl-ink-muted">{empty}</p>
      )}
    </div>
  );
}

function TraceLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="mt-2 text-xs text-tl-ink-muted">
      {label}: {value}
    </p>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-tl-ink">{label}</span>
      {textarea ? (
        <textarea
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[4.5rem] w-full rounded-md border border-tl-line px-3 py-2 text-sm"
        />
      ) : (
        <input
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
        />
      )}
    </label>
  );
}

function FormActions({
  submitLabel,
  onCancel,
}: {
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="submit"
        className="rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
      >
        {submitLabel}
      </button>
      <button
        type="button"
        className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-sm hover:bg-tl-paper"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

function SignalForm({
  onSave,
  onCancel,
}: {
  onSave: (fields: {
    summary: string;
    explanation: string;
    classification: SignalClassification;
  }) => void;
  onCancel: () => void;
}) {
  const [summary, setSummary] = useState("");
  const [explanation, setExplanation] = useState("");
  const [classification, setClassification] =
    useState<SignalClassification>("observation");
  return (
    <form
      className="space-y-3 rounded-md border border-dashed border-tl-line p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ summary, explanation, classification });
      }}
    >
      <p className="text-xs text-tl-ink-muted">
        You supply the classification. The workspace will not infer it from
        influence or activity.
      </p>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-tl-ink">
          Classification
        </span>
        <select
          value={classification}
          onChange={(e) =>
            setClassification(e.target.value as SignalClassification)
          }
          className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
        >
          {SIGNAL_CLASSIFICATIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <Field label="What was observed?" value={summary} onChange={setSummary} required />
      <Field
        label="Explanation (what was seen, not what it means)"
        value={explanation}
        onChange={setExplanation}
        textarea
        required
      />
      <FormActions submitLabel="Save signal" onCancel={onCancel} />
    </form>
  );
}

function InterpretationForm({
  signalId,
  onSave,
  onCancel,
}: {
  signalId: string;
  onSave: (fields: {
    signalId: string;
    hypothesis: string;
    rationale: string;
    alternatives?: string[];
  }) => void;
  onCancel: () => void;
}) {
  const [hypothesis, setHypothesis] = useState("");
  const [rationale, setRationale] = useState("");
  const [alternative, setAlternative] = useState("");
  return (
    <form
      className="space-y-3 rounded-md border border-dashed border-tl-line p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          signalId,
          hypothesis,
          rationale,
          alternatives: alternative.trim() ? [alternative.trim()] : undefined,
        });
      }}
    >
      <Field
        label="Hypothesis"
        value={hypothesis}
        onChange={setHypothesis}
        required
      />
      <Field
        label="Rationale"
        value={rationale}
        onChange={setRationale}
        textarea
        required
      />
      <Field
        label="Alternative (optional)"
        value={alternative}
        onChange={setAlternative}
      />
      <FormActions submitLabel="Save interpretation" onCancel={onCancel} />
    </form>
  );
}

function IntelligenceForm({
  interpretationId,
  onSave,
  onCancel,
}: {
  interpretationId: string;
  onSave: (fields: {
    interpretationIds: string[];
    statement: string;
    synthesis: string;
  }) => void;
  onCancel: () => void;
}) {
  const [statement, setStatement] = useState("");
  const [synthesis, setSynthesis] = useState("");
  return (
    <form
      className="space-y-3 rounded-md border border-dashed border-tl-line p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          interpretationIds: [interpretationId],
          statement,
          synthesis,
        });
      }}
    >
      <p className="text-xs text-tl-ink-muted">
        Statement must not copy the interpretation hypothesis.
      </p>
      <Field
        label="Intelligence statement"
        value={statement}
        onChange={setStatement}
        required
      />
      <Field
        label="Synthesis"
        value={synthesis}
        onChange={setSynthesis}
        textarea
        required
      />
      <FormActions submitLabel="Save intelligence" onCancel={onCancel} />
    </form>
  );
}

function RecommendationForm({
  intelligenceId,
  onSave,
  onCancel,
}: {
  intelligenceId: string;
  onSave: (fields: {
    intelligenceIds: string[];
    statement: string;
    action: string;
    rationale: string;
    objective: string;
  }) => void;
  onCancel: () => void;
}) {
  const [statement, setStatement] = useState("");
  const [action, setAction] = useState("");
  const [rationale, setRationale] = useState("");
  const [objective, setObjective] = useState("");
  return (
    <form
      className="space-y-3 rounded-md border border-dashed border-tl-line p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          intelligenceIds: [intelligenceId],
          statement,
          action,
          rationale,
          objective,
        });
      }}
    >
      <p className="text-xs text-tl-ink-muted">
        Suggestion only. Statement and action must not copy the intelligence
        statement. A no-action alternative is added automatically.
      </p>
      <Field
        label="Suggestion"
        value={statement}
        onChange={setStatement}
        required
      />
      <Field label="Suggested action" value={action} onChange={setAction} required />
      <Field
        label="Rationale"
        value={rationale}
        onChange={setRationale}
        textarea
        required
      />
      <Field
        label="Objective"
        value={objective}
        onChange={setObjective}
        required
      />
      <FormActions submitLabel="Save recommendation" onCancel={onCancel} />
    </form>
  );
}

function DecisionForm({
  recommendationId,
  onSave,
  onCancel,
}: {
  recommendationId: string;
  onSave: (fields: {
    recommendationId: string;
    status: HumanDecisionStatus;
    decidedBy: string;
    note: string;
  }) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<HumanDecisionStatus>("accepted");
  const [decidedBy, setDecidedBy] = useState("");
  const [note, setNote] = useState("");
  return (
    <form
      className="space-y-3 rounded-md border border-tl-trust/40 bg-tl-paper p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ recommendationId, status, decidedBy, note });
      }}
    >
      <p className="text-xs text-tl-ink-muted">
        This creates a human-decision record. It does not change the
        recommendation into a decision.
      </p>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-tl-ink">Decision</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as HumanDecisionStatus)}
          className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
        >
          {HUMAN_DECISION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {DECISION_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <Field
        label="Decided by"
        value={decidedBy}
        onChange={setDecidedBy}
        required
      />
      <Field label="Note" value={note} onChange={setNote} textarea />
      <FormActions submitLabel="Save human decision" onCancel={onCancel} />
    </form>
  );
}

function SimpleRecordForm({
  label,
  submitLabel,
  onSave,
  onCancel,
}: {
  label: string;
  submitLabel: string;
  onSave: (summary: string) => void;
  onCancel: () => void;
}) {
  const [summary, setSummary] = useState("");
  return (
    <form
      className="space-y-3 rounded-md border border-dashed border-tl-line p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(summary);
      }}
    >
      <Field label={label} value={summary} onChange={setSummary} textarea required />
      <FormActions submitLabel={submitLabel} onCancel={onCancel} />
    </form>
  );
}
