/**
 * Browser BFF client for TE-7 / TE-11 trust Cloud rows.
 * Never imports Frappe API keys. Overlay keys are not posted.
 * Verification stamps are human-apply only.
 */

import type { TrustClaimVerificationStamp } from "@/lib/trust/claimVerification";
import type {
  TrustCommunityContext,
  TrustLayerBucket,
  TrustObservation,
  TrustParticipationRecord,
} from "@/types/trustLayer";

export type TrustCloudBucketPayload = {
  observations: TrustObservation[];
  participation: TrustParticipationRecord[];
  community: TrustCommunityContext[];
  verifications: TrustClaimVerificationStamp[];
};

export async function fetchTrustLayerFromCloud(): Promise<
  TrustCloudBucketPayload | null
> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/frappe/trust", {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return null;
    if (res.status === 404) {
      return {
        observations: [],
        participation: [],
        community: [],
        verifications: [],
      };
    }
    if (!res.ok) return null;
    const json = (await res.json()) as {
      observations?: TrustObservation[];
      participation?: TrustParticipationRecord[];
      community?: TrustCommunityContext[];
      verifications?: TrustClaimVerificationStamp[];
    };
    return {
      observations: Array.isArray(json.observations) ? json.observations : [],
      participation: Array.isArray(json.participation) ? json.participation : [],
      community: Array.isArray(json.community) ? json.community : [],
      verifications: Array.isArray(json.verifications) ? json.verifications : [],
    };
  } catch {
    return null;
  }
}

export async function pushTrustLayerToCloud(
  bucket: Pick<
    TrustLayerBucket,
    "observations" | "participation" | "community"
  > & { verifications?: TrustClaimVerificationStamp[] },
  orgId?: string,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/frappe/trust", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        kind: "bucket",
        orgId,
        observations: bucket.observations,
        participationRows: bucket.participation,
        communityRows: bucket.community,
        verificationRows: bucket.verifications || [],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pushClaimVerificationToCloud(
  stamp: TrustClaimVerificationStamp,
  orgId?: string,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/frappe/trust", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        kind: "verification",
        orgId,
        verification: stamp,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pushClaimVerificationsToCloud(
  stamps: TrustClaimVerificationStamp[],
  orgId?: string,
): Promise<boolean> {
  if (!stamps.length) return true;
  return pushTrustLayerToCloud(
    {
      observations: [],
      participation: [],
      community: [],
      verifications: stamps,
    },
    orgId,
  );
}
