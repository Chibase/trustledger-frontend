import { projectToFrappeDoc } from "@/lib/productCloud";
import { overlayLocalProjectsOntoCloud } from "@/services/projectService";
import type { Project } from "@/types/project";

function sampleProject(over: Partial<Project> = {}): Project {
  return {
    id: "PRJ-CLOUD-1",
    name: "Site A",
    clientFunder: "Acme Funder",
    budgetTotal: 1_000_000,
    budgetSpent: 120_000,
    ward: "Ward 12",
    municipality: "Nelson Mandela Bay",
    status: "Active",
    contractorName: "Build Co",
    startDate: "2026-03-01",
    targetEndDate: "2026-11-30",
    publicSummary: "Ward clinic upgrade",
    dossier: {
      siteDescription: "Local-only geo pack",
      geo: { wardName: "Ward 12", placeId: "za-place-1" },
      promises: [{ id: "PRM-1", text: "Local hire" }],
    },
    ...over,
  };
}

describe("P0b project Cloud save", () => {
  it("maps Cloud columns and omits dossier", () => {
    const doc = projectToFrappeDoc(sampleProject(), "Acme Customer", "org-1");
    expect(doc.customer).toBe("Acme Customer");
    expect(doc.project_code).toBe("PRJ-CLOUD-1");
    expect(doc.project_title).toBe("Site A");
    expect(doc.client_funder).toBe("Acme Funder");
    expect(doc.budget_total).toBe(1_000_000);
    expect(doc.ward).toBe("Ward 12");
    expect(doc.start_date).toBe("2026-03-01");
    expect(doc.target_end_date).toBe("2026-11-30");
    expect(doc.tl_org_id).toBe("org-1");
    expect(doc).not.toHaveProperty("dossier");
    expect(doc).not.toHaveProperty("mel_json");
    expect(doc).not.toHaveProperty("geo");
    expect(doc).not.toHaveProperty("promises");
    expect(doc).not.toHaveProperty("siteDescription");
  });

  it("does not invent today when start and end dates are blank", () => {
    const today = new Date().toISOString().slice(0, 10);
    const doc = projectToFrappeDoc(
      sampleProject({ startDate: "", targetEndDate: "  " }),
      "Acme Customer",
    );
    expect(doc).not.toHaveProperty("start_date");
    expect(doc).not.toHaveProperty("target_end_date");
    expect(JSON.stringify(doc)).not.toContain(today);
  });

  it("omits blank dates so PUT cannot wipe Cloud values with null", () => {
    const doc = projectToFrappeDoc(
      sampleProject({ startDate: "", targetEndDate: "" }),
      "Acme Customer",
    );
    expect(doc.start_date).toBeUndefined();
    expect(doc.target_end_date).toBeUndefined();
  });

  it("lets Cloud dates win over a stale local cache, including blank", () => {
    const cloud = sampleProject({
      startDate: "",
      targetEndDate: "",
      name: "Cloud title",
    });
    const local = sampleProject({
      startDate: "2026-01-01",
      targetEndDate: "2026-12-31",
      name: "Local title",
      dossier: { siteDescription: "Keep local dossier" },
    });
    const merged = overlayLocalProjectsOntoCloud([cloud], [local]);
    expect(merged[0]?.name).toBe("Cloud title");
    expect(merged[0]?.startDate).toBe("");
    expect(merged[0]?.targetEndDate).toBe("");
    expect(merged[0]?.dossier?.siteDescription).toBe("Keep local dossier");
  });

  it("does not surface local-only rows when Cloud is empty", () => {
    const local = sampleProject({ id: "PRJ-LOCAL-ONLY" });
    expect(overlayLocalProjectsOntoCloud([], [local])).toEqual([]);
  });
});
