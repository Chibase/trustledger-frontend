import { operatorGateMessage } from "@/lib/platformOperator";

export type OpsSessionDenied = {
  ok: false;
  status: 401 | 403;
  error: string;
};

/** Pure rule: Ops APIs need a live sid, not an email cookie by itself. */
export function decideOpsApiAccess(input: {
  sid?: string | null;
  allowlisted: boolean;
}): OpsSessionDenied | { ok: true } {
  if (!input.sid?.trim()) {
    return {
      ok: false,
      status: 401,
      error: "Live operator session required.",
    };
  }
  if (!input.allowlisted) {
    return {
      ok: false,
      status: 403,
      error: operatorGateMessage("not_operator"),
    };
  }
  return { ok: true };
}

/** Mutating Owner APIs: Customer owner-email match only — not cookies or User flags. */
export function liveOwnerFromCloudCustomer(input: {
  ownerCustomerName?: string | null;
}): boolean {
  return Boolean(input.ownerCustomerName?.trim());
}
