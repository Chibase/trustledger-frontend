import {
  FRAPPE_SID_COOKIE,
  TL_DESK_TIER_LOCKED_COOKIE,
  TL_ORG_OWNER_COOKIE,
} from "@/lib/auth.constants";
import { applyTrustLedgerUserFlags } from "@/lib/frappeServer";
import { buildInviteeUserDraft, buildOwnerUserDraft } from "@/lib/frappeSoT";
import {
  decideInviteeExistingUser,
  decideLiveSeatKind,
  inviteeSeatGuard,
} from "@/lib/inviteeCloud";
import { applyLiveSessionCookies, livePlanOwnerFromCookies } from "@/lib/liveSessionCookies";
import { canInviteDeskTier } from "@/lib/orgSeats";
import { decideTenantBind } from "@/lib/tenantScope";

jest.mock("@/lib/leadCapture", () => ({
  cleanSecret: (v: string) => v,
  frappeBase: () => "",
  frappeKeyPair: () => null,
  cookieSafeValue: (v: string) => v,
}));

type CookieRecord = { value: string; httpOnly?: boolean; maxAge?: number };
type FakeResponse = {
  cookies: {
    store: Map<string, CookieRecord>;
    set: (
      name: string,
      value: string,
      opts?: { httpOnly?: boolean; maxAge?: number },
    ) => void;
    get: (name: string) => CookieRecord | undefined;
  };
};

function fakeResponse(): FakeResponse {
  const store = new Map<string, CookieRecord>();
  return {
    cookies: {
      store,
      set(name, value, opts) {
        store.set(name, {
          value,
          httpOnly: opts?.httpOnly,
          maxAge: opts?.maxAge,
        });
      },
      get(name) {
        return store.get(name);
      },
    },
  };
}

function cookieValue(res: FakeResponse, name: string): string | undefined {
  return res.cookies.get(name)?.value;
}

describe("inviteeSeatGuard", () => {
  it("rejects the Plan Owner email as an invitee", () => {
    expect(
      inviteeSeatGuard({
        email: "owner@acme.test",
        ownerEmail: "owner@acme.test",
        password: "long-enough-secret",
      }),
    ).toMatch(/Plan Owner/);
  });

  it("rejects a short password", () => {
    expect(
      inviteeSeatGuard({
        email: "junior@acme.test",
        ownerEmail: "owner@acme.test",
        password: "short",
      }),
    ).toMatch(/8 characters/);
  });

  it("allows a distinct invitee", () => {
    expect(
      inviteeSeatGuard({
        email: "junior@acme.test",
        ownerEmail: "owner@acme.test",
        password: "long-enough-secret",
      }),
    ).toBeNull();
  });
});

describe("buildInviteeUserDraft", () => {
  it("never stamps Plan Owner on the invitee User", () => {
    const draft = buildInviteeUserDraft({
      email: "junior@acme.test",
      fullName: "Junior",
      customerName: "CUST-ACME",
      deskTier: "supervisor",
      appRole: "community",
    });
    expect(draft.tl_plan_owner).toBe(0);
    expect(draft.tl_desk_tier).toBe("supervisor");
    expect(draft.customer).toBe("CUST-ACME");
    expect(draft.tl_app_role).toBe("community");
    expect(draft.send_welcome_email).toBe(false);
    expect(draft.roles).toEqual(["Customer"]);
  });

  it("keeps Owner drafts on Plan Owner = 1", () => {
    const owner = buildOwnerUserDraft({
      email: "owner@acme.test",
      fullName: "Owner",
      customerName: "CUST-ACME",
      deskTier: "delivery",
    });
    expect(owner.tl_plan_owner).toBe(1);
  });
});

describe("decideLiveSeatKind", () => {
  it("treats Owner entitlement as owner, not invitee", () => {
    expect(
      decideLiveSeatKind({
        sessionPlanOwner: false,
        ownerCustomerName: "CUST-ACME",
        inviteeCustomerName: "CUST-OTHER",
      }),
    ).toBe("owner");
  });

  it("binds an invitee from the User Customer stamp", () => {
    expect(
      decideLiveSeatKind({
        sessionPlanOwner: false,
        ownerCustomerName: "",
        inviteeCustomerName: "CUST-ACME",
      }),
    ).toBe("invitee");
  });

  it("does not promote an invitee stamp to Plan Owner", () => {
    expect(
      decideLiveSeatKind({
        sessionPlanOwner: false,
        ownerCustomerName: null,
        inviteeCustomerName: "CUST-ACME",
      }),
    ).not.toBe("owner");
  });

  it("rejects an unbound non-owner login", () => {
    expect(
      decideLiveSeatKind({
        sessionPlanOwner: false,
        ownerCustomerName: "",
        inviteeCustomerName: "",
      }),
    ).toBe("unbound");
  });
});

describe("decideTenantBind (invitee session Customer)", () => {
  it("binds the session Customer and ignores a claimed peer name", () => {
    expect(
      decideTenantBind({
        sessionCustomer: "CUST-ACME",
        claimed: "CUST-PEER",
        operator: false,
      }),
    ).toEqual({ ok: true, customerName: "CUST-ACME", breakGlass: false });
  });

  it("rejects an unbound non-operator", () => {
    const r = decideTenantBind({
      sessionCustomer: null,
      operator: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(404);
  });
});

describe("applyTrustLedgerUserFlags", () => {
  it("maps invitee app role and never sets Plan Owner", () => {
    const applied = applyTrustLedgerUserFlags(
      { trustLedgerRole: "community" },
      { planOwner: false, appRole: "client", deskTier: "supervisor" },
    );
    expect(applied.isPlanOwner).toBeUndefined();
    expect(applied.trustLedgerRole).toBe("client");
    expect(applied.appRole).toBe("client");
    expect(applied.deskTier).toBe("supervisor");
  });

  it("promotes Plan Owner community mapping to admin", () => {
    const applied = applyTrustLedgerUserFlags(
      { trustLedgerRole: "community" },
      { planOwner: true },
    );
    expect(applied.isPlanOwner).toBe(true);
    expect(applied.trustLedgerRole).toBe("admin");
  });
});

describe("applyLiveSessionCookies", () => {
  it("locks desk and clears Plan Owner for invitees", () => {
    const res = fakeResponse();
    applyLiveSessionCookies(res as never, {
      sid: "sid-invitee",
      role: "community",
      email: "junior@acme.test",
      fullName: "Junior",
      isPlanOwner: false,
      deskTier: "supervisor",
      planId: "project",
    });
    expect(cookieValue(res, FRAPPE_SID_COOKIE)).toBe("sid-invitee");
    expect(cookieValue(res, TL_ORG_OWNER_COOKIE)).toBe("");
    expect(cookieValue(res, TL_DESK_TIER_LOCKED_COOKIE)).toBe("1");
  });

  it("does not lock desk for Plan Owner", () => {
    const res = fakeResponse();
    applyLiveSessionCookies(res as never, {
      sid: "sid-owner",
      role: "admin",
      email: "owner@acme.test",
      fullName: "Owner",
      isPlanOwner: true,
      deskTier: "delivery",
      planId: "project",
    });
    expect(cookieValue(res, TL_ORG_OWNER_COOKIE)).toBe("1");
    expect(res.cookies.get(TL_ORG_OWNER_COOKIE)?.httpOnly).toBe(true);
    expect(res.cookies.get(FRAPPE_SID_COOKIE)?.httpOnly).toBe(true);
    expect(cookieValue(res, TL_DESK_TIER_LOCKED_COOKIE)).toBe("0");
  });
});

describe("canInviteDeskTier (SEC-5 re-check)", () => {
  it("paid Project cannot invite at Owner rank", () => {
    expect(canInviteDeskTier("project", "delivery")).toBe(false);
    expect(canInviteDeskTier("project", "supervisor")).toBe(true);
    expect(canInviteDeskTier("project", "funder")).toBe(false);
  });

  it("Institutional may invite at or below Owner", () => {
    expect(canInviteDeskTier("institutional", "funder")).toBe(true);
    expect(canInviteDeskTier("institutional", "clo")).toBe(true);
  });

  it("VIP skips the desk gate", () => {
    expect(canInviteDeskTier("project", "funder", { vip: true })).toBe(true);
  });

  it("live Cloud plan wins over a stale Institutional token", () => {
    expect(canInviteDeskTier("institutional", "funder")).toBe(true);
    expect(canInviteDeskTier("project", "funder")).toBe(false);
  });
});

describe("decideInviteeExistingUser", () => {
  it("allows creating a new Cloud User", () => {
    expect(
      decideInviteeExistingUser({
        exists: false,
        targetCustomer: "CUST-ACME",
      }),
    ).toEqual({ action: "create" });
  });

  it("rejects replay against an existing seat on the same Customer", () => {
    const r = decideInviteeExistingUser({
      exists: true,
      planOwner: false,
      customer: "CUST-ACME",
      targetCustomer: "CUST-ACME",
    });
    expect(r.action).toBe("reject");
    if (r.action === "reject") expect(r.status).toBe(409);
  });

  it("rejects a User already bound to another organisation", () => {
    const r = decideInviteeExistingUser({
      exists: true,
      customer: "CUST-PEER",
      targetCustomer: "CUST-ACME",
    });
    expect(r.action).toBe("reject");
  });
});

describe("livePlanOwnerFromCookies", () => {
  it("does not treat a client-writable admin role as Plan Owner", () => {
    expect(livePlanOwnerFromCookies(false)).toBe(false);
    expect(livePlanOwnerFromCookies(true)).toBe(true);
  });
});
