/**
 * @jest-environment jsdom
 */
import { isLiveMode } from "@/config/api";
import { preferCloudSiList } from "@/lib/workspaceData";

jest.mock("@/config/api", () => ({
  isLiveMode: jest.fn(() => true),
}));

const trialRow = { id: "ENG-VIP", source: "trial" as const };
const seedRow = { id: "ENG-SEED", source: "seed" as const };
const liveRow = { id: "ENG-LIVE", source: "live" as const };

describe("preferCloudSiList", () => {
  function setMode(mode: "trial" | "live") {
    document.cookie
      .split(";")
      .map((part) => part.split("=")[0]?.trim())
      .filter(Boolean)
      .forEach((name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
    document.cookie = `tl-mode=${mode}`;
  }

  beforeEach(() => {
    setMode("trial");
    (isLiveMode as jest.Mock).mockReturnValue(true);
  });

  it("keeps trial SI rows when live Cloud SI is empty", () => {
    setMode("trial");
    const rows = preferCloudSiList([], [trialRow, seedRow]);
    expect(rows.map((row) => row.id)).toEqual(["ENG-VIP"]);
  });

  it("does not fill an empty live Cloud with leftover trial stakeholders", () => {
    setMode("live");
    const rows = preferCloudSiList([], [trialRow, liveRow], {
      liveExtras: "live-source",
    });
    expect(rows.map((row) => row.id)).toEqual(["ENG-LIVE"]);
  });

  it("keeps unsynced engagement drafts whose source is minutes, not live", () => {
    setMode("live");
    const rows = preferCloudSiList([], [
      { id: "ENG-MIN", source: "minutes" as const },
    ]);
    expect(rows.map((row) => row.id)).toEqual(["ENG-MIN"]);
  });

  it("keeps unsynced live drafts beside Cloud rows", () => {
    setMode("live");
    const rows = preferCloudSiList(
      [{ id: "ENG-CLOUD", source: "live" as const }],
      [liveRow],
    );
    expect(rows.map((row) => row.id).sort()).toEqual(["ENG-CLOUD", "ENG-LIVE"]);
  });
});
