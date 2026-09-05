import { filterOpsActivityRows, opsActivityToCsv } from "@/lib/opsReports";
import type { OpsActivityRow } from "@/lib/opsIntel";
import { SUBPROCESSORS, PURGE_SLA_DAYS } from "@/lib/legal/subprocessors";

function row(over: Partial<OpsActivityRow> = {}): OpsActivityRow {
  return {
    name: "LEAD-1",
    lead_name: "Ada",
    email: "ada@example.com",
    organization: "Acme",
    job_title: "Quote request · Project",
    source: "Quote Request",
    status: "New",
    modified: "2026-09-05T08:00:00.000Z",
    activity: "quote",
    intent: "Quote request · Project",
    rating: null,
    readiness: null,
    ...over,
  };
}

describe("ops 23b activity CSV", () => {
  it("filters by activity, source, and search", () => {
    const rows = [
      row(),
      row({
        name: "LEAD-2",
        activity: "support",
        source: "Support Ticket",
        email: "pat@site.test",
        lead_name: "Pat",
        intent: "Support · Access",
      }),
    ];
    expect(filterOpsActivityRows(rows, { activity: "quote" })).toHaveLength(1);
    expect(
      filterOpsActivityRows(rows, { source: "Support Ticket" })[0]?.name,
    ).toBe("LEAD-2");
    expect(filterOpsActivityRows(rows, { q: "pat@" })).toHaveLength(1);
  });

  it("escapes commas in CSV cells", () => {
    const csv = opsActivityToCsv([
      row({ organization: "Acme, Inc", intent: 'Said "hello"' }),
    ]);
    expect(csv).toContain('"Acme, Inc"');
    expect(csv).toContain('"Said ""hello"""');
    expect(csv.split("\n")[0]).toContain("activity");
  });
});

describe("SEC-2 subprocessors note", () => {
  it("lists processors without claiming SOC 2", () => {
    expect(SUBPROCESSORS.map((row) => row.name)).toEqual([
      "Frappe Cloud",
      "Vercel Inc.",
      "Resend",
      "Paystack",
      "Webway",
    ]);
    expect(PURGE_SLA_DAYS).toBe(30);
  });
});
