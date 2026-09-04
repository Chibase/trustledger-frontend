/**
 * @jest-environment jsdom
 */
import { mockEngagements } from "@/data/mockEngagements";
import { engagementService } from "@/services/engagementService";

jest.mock("@/config/api", () => ({
  isLiveMode: () => false,
}));

const STORAGE_KEY = "tl-engagements";
const TRUST_RESPONSE_KEY = "tl-engagement-trust-response";

describe("engagement overlay local store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps trustResponse in the overlay key, not tl-engagements", async () => {
    const row = {
      ...mockEngagements[0]!,
      trustResponse: { confidenceInProcess: "low" as const },
    };
    const saved = await engagementService.save(row);
    expect(saved.trustResponse?.confidenceInProcess).toBe("low");

    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "[]",
    ) as Array<{ id: string; trustResponse?: unknown }>;
    const storedRow = stored.find((item) => item.id === row.id);
    expect(storedRow).toBeDefined();
    expect(storedRow).not.toHaveProperty("trustResponse");

    const overlay = JSON.parse(
      window.localStorage.getItem(TRUST_RESPONSE_KEY) || "{}",
    ) as Record<string, { confidenceInProcess?: string }>;
    expect(overlay[row.id]?.confidenceInProcess).toBe("low");
  });

  it("does not resurrect a cleared overlay from the engagement payload", async () => {
    const row = {
      ...mockEngagements[0]!,
      trustResponse: { confidenceInProcess: "low" as const },
    };
    await engagementService.save(row);
    await engagementService.save({ ...row, trustResponse: null });

    const overlay = JSON.parse(
      window.localStorage.getItem(TRUST_RESPONSE_KEY) || "{}",
    ) as Record<string, unknown>;
    expect(overlay[row.id]).toBeUndefined();

    const listed = await engagementService.list();
    const found = listed.find((item) => item.id === row.id);
    expect(found?.trustResponse).toBeUndefined();
  });
});
