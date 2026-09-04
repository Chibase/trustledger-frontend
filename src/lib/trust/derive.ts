/**
 * Read-only derivation of trust-native rows from existing SRM records.
 * Never mutates incidents, engagements, commitments, or evidence.
 * Does not persist unless the caller writes the result to the trust layer store.
 */

import { communityContextFromIncident } from "@/lib/trust/communityContext";
import { createTrustObservation } from "@/lib/trust/observation";
import { participationFromTrustResponse } from "@/lib/trust/participation";
import type { Commitment } from "@/types/commitment";
import type { Engagement, EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Stakeholder } from "@/types/stakeholder";
import type {
  StakeholderTrustResponse,
  TrustAttitude,
  TrustClaimKind,
} from "@/types/trustOverlay";
import type {
  TrustCommunityContext,
  TrustDimensionId,
  TrustObservation,
  TrustObservationSource,
  TrustParticipationRecord,
  TrustSignalKind,
} from "@/types/trustLayer";

export type DeriveTrustLayerInput = {
  incidents?: Incident[];
  engagements?: Engagement[];
  commitments?: Commitment[];
  evidence?: EvidenceStub[];
  stakeholders?: Stakeholder[];
};

export type DerivedTrustLayer = {
  observations: TrustObservation[];
  participation: TrustParticipationRecord[];
  community: TrustCommunityContext[];
};

function attitudeToSignal(value: TrustAttitude | undefined): TrustSignalKind | null {
  if (value === "high") return "positive";
  if (value === "low") return "negative";
  if (value === "medium") return "neutral";
  return null;
}

function claimToObservation(
  claim: TrustClaimKind,
): { dimension: TrustDimensionId; signal: TrustSignalKind } | null {
  if (claim === "promise_kept") return { dimension: "project", signal: "positive" };
  if (claim === "promise_broken") {
    return { dimension: "concerns_acted_upon", signal: "negative" };
  }
  if (claim === "repair_complete") {
    return { dimension: "process", signal: "positive" };
  }
  if (claim === "consultation_held") {
    return { dimension: "people", signal: "positive" };
  }
  return null;
}

/**
 * Overlay attitudes become trust observations. SRM `sentimentLabel` /
 * `sentimentScore` never do — those stay generic sentiment records.
 */
function observationsFromTrustResponse(
  response: StakeholderTrustResponse | null | undefined,
  meta: {
    idPrefix: string;
    source: TrustObservationSource;
    sourceId: string;
    projectId?: string | null;
    stakeholderId?: string;
    fallbackAt: string;
  },
): TrustObservation[] {
  if (!response) return [];
  const at = response.capturedAt || meta.fallbackAt;
  const pairs: Array<{
    suffix: string;
    dimension: TrustDimensionId;
    attitude: TrustAttitude | undefined;
    note: string;
  }> = [
    {
      suffix: "process",
      dimension: "process",
      attitude: response.confidenceInProcess,
      note: "Derived from optional trustResponse.confidenceInProcess.",
    },
    {
      suffix: "entity",
      dimension: "implementing_entity",
      attitude: response.confidenceInImplementer,
      note: "Derived from optional trustResponse.confidenceInImplementer.",
    },
    {
      suffix: "fairness",
      dimension: "fairness",
      attitude: response.confidenceInFairness,
      note: "Derived from optional trustResponse.confidenceInFairness.",
    },
    {
      suffix: "acted-upon",
      dimension: "concerns_acted_upon",
      attitude: response.confidenceConcernsActedUpon,
      note: "Derived from optional trustResponse.confidenceConcernsActedUpon.",
    },
    {
      suffix: "people",
      dimension: "people",
      attitude: response.willingnessToParticipate,
      note: "Derived from optional trustResponse.willingnessToParticipate.",
    },
  ];
  const out: TrustObservation[] = [];
  for (const row of pairs) {
    const signal = attitudeToSignal(row.attitude);
    if (!signal) continue;
    out.push(
      createTrustObservation({
        id: `${meta.idPrefix}-${row.suffix}`,
        observedAt: at,
        dimension: row.dimension,
        signal,
        source: meta.source,
        sourceId: meta.sourceId,
        projectId: meta.projectId,
        stakeholderId: meta.stakeholderId,
        note: row.note,
      }),
    );
  }
  return out;
}

function fromIncidents(incidents: Incident[]): {
  observations: TrustObservation[];
  participation: TrustParticipationRecord[];
  community: TrustCommunityContext[];
} {
  const observations: TrustObservation[] = [];
  const participation: TrustParticipationRecord[] = [];
  const community: TrustCommunityContext[] = [];

  for (const incident of incidents) {
    observations.push(
      ...observationsFromTrustResponse(incident.trustResponse, {
        idPrefix: `TRO-incident-${incident.id}`,
        source: "incident",
        sourceId: incident.id,
        projectId: incident.projectId,
        fallbackAt: incident.reportedAt,
      }),
    );

    const part = participationFromTrustResponse(incident.trustResponse, {
      id: `TRP-incident-${incident.id}`,
      source: "incident",
      sourceId: incident.id,
      projectId: incident.projectId,
      observedAt: incident.reportedAt,
    });
    if (part) participation.push(part);

    community.push(
      communityContextFromIncident(incident, `TRC-incident-${incident.id}`),
    );
  }

  return { observations, participation, community };
}

function fromEngagements(rows: Engagement[]): {
  observations: TrustObservation[];
  participation: TrustParticipationRecord[];
} {
  const observations: TrustObservation[] = [];
  const participation: TrustParticipationRecord[] = [];
  for (const row of rows) {
    observations.push(
      ...observationsFromTrustResponse(row.trustResponse, {
        idPrefix: `TRO-engagement-${row.id}`,
        source: "engagement",
        sourceId: row.id,
        projectId: row.projectId,
        stakeholderId: row.stakeholderIds[0],
        fallbackAt: row.heldOn || row.createdAt,
      }),
    );
    const part = participationFromTrustResponse(row.trustResponse, {
      id: `TRP-engagement-${row.id}`,
      source: "engagement",
      sourceId: row.id,
      projectId: row.projectId,
      stakeholderId: row.stakeholderIds[0],
      observedAt: row.heldOn || row.createdAt,
    });
    if (part) participation.push(part);
  }
  return { observations, participation };
}

function fromCommitments(rows: Commitment[]): TrustObservation[] {
  const observations: TrustObservation[] = [];
  for (const row of rows) {
    if (row.status === "fulfilled") {
      observations.push(
        createTrustObservation({
          id: `TRO-commitment-${row.id}-project`,
          observedAt: row.createdAt,
          dimension: "project",
          signal: "positive",
          source: "commitment",
          sourceId: row.id,
          projectId: row.projectId,
          note: "Derived from fulfilled commitment.",
        }),
      );
    } else if (row.status === "broken") {
      observations.push(
        createTrustObservation({
          id: `TRO-commitment-${row.id}-acted-upon`,
          observedAt: row.createdAt,
          dimension: "concerns_acted_upon",
          signal: "negative",
          source: "commitment",
          sourceId: row.id,
          projectId: row.projectId,
          note: "Derived from broken commitment (concerns not acted upon).",
        }),
      );
    }
  }
  return observations;
}

function fromEvidence(rows: EvidenceStub[]): TrustObservation[] {
  const observations: TrustObservation[] = [];
  for (const row of rows) {
    const support = row.trustSupport;
    if (!support?.supportsTrustClaim || !support.claimKind) continue;
    const mapped = claimToObservation(support.claimKind);
    if (!mapped) continue;
    observations.push(
      createTrustObservation({
        id: `TRO-evidence-${row.id}-${mapped.dimension}`,
        observedAt: row.uploadedAt,
        dimension: mapped.dimension,
        signal: mapped.signal,
        source: "evidence",
        sourceId: row.id,
        evidenceIds: [row.id],
        note: `Derived from evidence trustSupport (${support.claimKind}).`,
      }),
    );
  }
  return observations;
}

function fromStakeholders(rows: Stakeholder[]): TrustParticipationRecord[] {
  const participation: TrustParticipationRecord[] = [];
  for (const row of rows) {
    const part = participationFromTrustResponse(row.trustResponse, {
      id: `TRP-stakeholder-${row.id}`,
      source: "stakeholder",
      sourceId: row.id,
      projectId: row.projectIds?.[0] ?? null,
      stakeholderId: row.id,
      observedAt: row.updatedAt || row.createdAt,
    });
    if (part) participation.push(part);
  }
  return participation;
}

function dedupeCommunity(
  rows: TrustCommunityContext[],
): TrustCommunityContext[] {
  const seen = new Set<string>();
  const out: TrustCommunityContext[] = [];
  for (const row of rows) {
    const key = `${row.projectId || ""}|${row.placeId || row.ward || row.communityRef || row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function deriveTrustLayer(
  input: DeriveTrustLayerInput,
): DerivedTrustLayer {
  const incidents = fromIncidents(input.incidents || []);
  const engagements = fromEngagements(input.engagements || []);
  return {
    observations: [
      ...incidents.observations,
      ...engagements.observations,
      ...fromCommitments(input.commitments || []),
      ...fromEvidence(input.evidence || []),
    ],
    participation: [
      ...incidents.participation,
      ...engagements.participation,
      ...fromStakeholders(input.stakeholders || []),
    ],
    community: dedupeCommunity(incidents.community),
  };
}
