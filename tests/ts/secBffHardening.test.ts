import { FRAPPE_METHODS } from "@/config/api";
import {
  isAllowedFrappeProxyMethod,
  normalizeFrappeProxyMethod,
} from "@/lib/frappeProxyAllowlist";
import { decideOpsApiAccess, liveOwnerFromCloudCustomer } from "@/lib/secBffRules";
import {
  decidePaystackCredentialReveal,
  verifyPaystackRevealToken,
} from "@/lib/paystackVerifyGuard";
import { overlayLocalIncidentsOntoCloud } from "@/services/incidentService";
import type { Incident } from "@/types/incident";

describe("decideOpsApiAccess", () => {
  it("rejects an email-only request with no live sid", () => {
    const denied = decideOpsApiAccess({
      sid: null,
      allowlisted: true,
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.status).toBe(401);
  });

  it("rejects a sid that is not on the operator allowlist", () => {
    const denied = decideOpsApiAccess({
      sid: "sid-customer",
      allowlisted: false,
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.status).toBe(403);
  });

  it("allows a live sid on the allowlist", () => {
    expect(
      decideOpsApiAccess({ sid: "sid-ops", allowlisted: true }).ok,
    ).toBe(true);
  });
});

describe("liveOwnerFromCloudCustomer", () => {
  it("does not treat a client owner cookie as Plan Owner", () => {
    expect(liveOwnerFromCloudCustomer({ ownerCustomerName: null })).toBe(false);
    expect(liveOwnerFromCloudCustomer({ ownerCustomerName: "  " })).toBe(false);
  });

  it("treats Customer.custom_owner_email match as Plan Owner", () => {
    expect(
      liveOwnerFromCloudCustomer({ ownerCustomerName: "Acme Customer" }),
    ).toBe(true);
  });
});

describe("frappe proxy allowlist", () => {
  it("allows documented product methods and blocks arbitrary Desk methods", () => {
    expect(isAllowedFrappeProxyMethod(FRAPPE_METHODS.listProjects)).toBe(true);
    expect(isAllowedFrappeProxyMethod(FRAPPE_METHODS.getSession)).toBe(true);
    expect(
      isAllowedFrappeProxyMethod("/api/method/frappe.client.get"),
    ).toBe(false);
    expect(
      isAllowedFrappeProxyMethod("/api/method/frappe.client.get_list"),
    ).toBe(false);
    expect(
      isAllowedFrappeProxyMethod(FRAPPE_METHODS.ledgerCreateEntry),
    ).toBe(false);
    expect(
      isAllowedFrappeProxyMethod(
        "/api/method/srm_core.api.ai.compose_activity_report",
      ),
    ).toBe(false);
  });

  it("rejects path tricks", () => {
    expect(
      normalizeFrappeProxyMethod("/api/method/frappe.client.get?x=1"),
    ).toBeNull();
    expect(
      isAllowedFrappeProxyMethod("/api/method/../frappe.client.get"),
    ).toBe(false);
    expect(
      isAllowedFrappeProxyMethod("/api/method/frappe%2eclient%2eget"),
    ).toBe(false);
  });
});

describe("decidePaystackCredentialReveal", () => {
  it("mints once, replays with the reveal cookie, and withholds later callers", () => {
    expect(
      decidePaystackCredentialReveal({
        alreadyMinted: false,
        hasRevealCookie: false,
      }),
    ).toBe("mint");
    expect(
      decidePaystackCredentialReveal({
        alreadyMinted: true,
        hasRevealCookie: true,
      }),
    ).toBe("replay");
    expect(
      decidePaystackCredentialReveal({
        alreadyMinted: true,
        hasRevealCookie: false,
      }),
    ).toBe("withhold");
  });

  it("rejects a reveal token for a different reference", () => {
    expect(verifyPaystackRevealToken("not-a-token", "ref-1")).toBe(false);
  });
});

describe("live incident lists never seed mock INC-*", () => {
  it("does not append local-only rows onto Cloud", () => {
    const local = {
      id: "INC-LOCAL-ONLY",
      title: "Leftover",
      description: "",
      ward: "",
      geographicArea: "",
      status: "Open",
      priority: "P3-Medium",
      projectId: "",
      projectName: "",
      reportedByRole: "community",
      reportedAt: "",
      slaDueBy: "",
      slaBreached: false,
      escalationLevel: "None",
      ownerName: "",
      category: "",
      impactScore: 0,
      sentimentScore: 0,
      sentimentLabel: "neutral",
      timeline: [],
    } as Incident;
    expect(overlayLocalIncidentsOntoCloud([], [local])).toEqual([]);
  });
});
