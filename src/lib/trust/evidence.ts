import type { EvidenceStub } from "@/types/engagement";
import type { EvidenceTrustSupport } from "@/types/trustOverlay";

export function evidenceTrustSupport(
  row: EvidenceStub,
): EvidenceTrustSupport | null {
  return row.trustSupport ?? null;
}

/** Current evidence workflow is unchanged; this only reads the optional overlay. */
export function evidenceSupportsTrustClaim(row: EvidenceStub): boolean {
  return row.trustSupport?.supportsTrustClaim === true;
}

export function listEvidenceSupportingTrustClaims(
  rows: EvidenceStub[],
): EvidenceStub[] {
  return rows.filter(evidenceSupportsTrustClaim);
}
