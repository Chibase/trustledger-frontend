/**
 * Project dossier persistence — local overlay that merges onto Project rows
 * (trial / org / live list). Flat Project fields stay the list/Cloud contract.
 */

import { saveDemoProject } from "@/lib/demoStore";
import { saveOrgProject } from "@/lib/orgDataSpace";
import { readTrialModeFromDocument } from "@/lib/trial";
import { saveTrialProject } from "@/lib/trialStore";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import type { Project, ProjectDossier, ProjectPromise } from "@/types/project";

const KEY = "tl-project-dossiers";

function readMap(): Record<string, ProjectDossier> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProjectDossier>;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, ProjectDossier>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
}

export function getStoredDossier(projectId: string): ProjectDossier | undefined {
  return readMap()[projectId];
}

export function mergeProjectDossier(project: Project): Project {
  const stored = getStoredDossier(project.id);
  const dossier = stored || project.dossier;
  if (!dossier) return project;
  return {
    ...project,
    dossier,
    clientFunder: dossier.funder?.name || project.clientFunder,
    ward: dossier.geo?.wardName || project.ward,
    municipality: dossier.geo?.municipalityName || project.municipality,
    budgetTotal:
      dossier.budget?.authorisedZar != null
        ? dossier.budget.authorisedZar
        : project.budgetTotal,
    startDate: dossier.dates?.startDate || project.startDate,
    targetEndDate: dossier.dates?.targetEndDate || project.targetEndDate,
    publicSummary:
      dossier.siteDescription || project.publicSummary || project.publicSummary,
  };
}

export function mergeProjectsWithDossiers(projects: Project[]): Project[] {
  return projects.map(mergeProjectDossier);
}

/** Apply flat Project fields into dossier defaults. */
export function hydrateDossierFromProject(project: Project): ProjectDossier {
  const base = getStoredDossier(project.id) || project.dossier || {};
  return {
    ...base,
    funder: {
      name: base.funder?.name || project.clientFunder || undefined,
      contactLabel: base.funder?.contactLabel,
      reportingCadence: base.funder?.reportingCadence,
    },
    geo: {
      countryCode: base.geo?.countryCode || "ZA",
      countryName: base.geo?.countryName,
      provinceId: base.geo?.provinceId,
      provinceName: base.geo?.provinceName,
      districtId: base.geo?.districtId,
      districtName: base.geo?.districtName,
      municipalityId: base.geo?.municipalityId,
      municipalityName:
        base.geo?.municipalityName || project.municipality || undefined,
      traditionalCouncilId: base.geo?.traditionalCouncilId,
      traditionalCouncilName: base.geo?.traditionalCouncilName,
      wardId: base.geo?.wardId,
      wardName: base.geo?.wardName || project.ward || undefined,
      placeId: base.geo?.placeId,
      placeLabel: base.geo?.placeLabel,
    },
    budget: {
      authorisedZar:
        base.budget?.authorisedZar != null
          ? base.budget.authorisedZar
          : project.budgetTotal || undefined,
      contingencyZar: base.budget?.contingencyZar,
    },
    dates: {
      startDate: base.dates?.startDate || project.startDate || undefined,
      targetEndDate:
        base.dates?.targetEndDate || project.targetEndDate || undefined,
    },
    siteDescription: base.siteDescription || project.publicSummary || undefined,
    sector: base.sector,
    empowermentTargets: base.empowermentTargets,
    promises: base.promises || [],
    communityIntel: base.communityIntel,
    updatedAt: base.updatedAt,
  };
}

export function applyDossierToProject(
  project: Project,
  dossier: ProjectDossier,
): Project {
  const nextDossier: ProjectDossier = {
    ...dossier,
    updatedAt: new Date().toISOString(),
  };
  return {
    ...project,
    dossier: nextDossier,
    clientFunder: nextDossier.funder?.name || project.clientFunder,
    ward: nextDossier.geo?.wardName || project.ward,
    municipality: nextDossier.geo?.municipalityName || project.municipality,
    budgetTotal:
      nextDossier.budget?.authorisedZar != null
        ? nextDossier.budget.authorisedZar
        : project.budgetTotal,
    startDate: nextDossier.dates?.startDate || project.startDate,
    targetEndDate: nextDossier.dates?.targetEndDate || project.targetEndDate,
    publicSummary: nextDossier.siteDescription || project.publicSummary,
  };
}

export function persistProjectWithDossier(project: Project): Promise<Project> {
  const dossier = project.dossier || hydrateDossierFromProject(project);
  const next = applyDossierToProject(project, {
    ...dossier,
    updatedAt: new Date().toISOString(),
  });

  return persistPreparedProject(next);
}

async function persistPreparedProject(next: Project): Promise<Project> {
  const trial = readTrialModeFromDocument();
  const customer = isCustomerWorkspaceClient();

  if (!trial && customer) {
    const { isLiveMode } = await import("@/config/api");
    if (isLiveMode()) {
      const { projectService } = await import("@/services/projectService");
      const saved = await projectService.save(next);
      const map = readMap();
      map[saved.id] = saved.dossier || next.dossier || {};
      writeMap(map);
      return mergeProjectDossier(saved);
    }
  }

  const map = readMap();
  map[next.id] = next.dossier || {};
  writeMap(map);
  if (trial) saveTrialProject(next);
  else if (customer) saveOrgProject(next);
  else saveDemoProject(next);
  return next;
}

export function newPromiseId(): string {
  return `PRM-${Date.now().toString(36).slice(-6)}`;
}

export function openPromises(project: Project): ProjectPromise[] {
  return (project.dossier?.promises || []).filter(
    (p) => !p.status || p.status === "open" || p.status === "at_risk",
  );
}

/** Dropdown option lists derived from a project's dossier. */
export function projectPlaceOptions(project: Project): string[] {
  const d = project.dossier;
  const rows = [
    d?.geo?.placeLabel,
    d?.geo?.wardName || project.ward,
    d?.geo?.traditionalCouncilName,
    d?.geo?.municipalityName || project.municipality,
    d?.geo?.districtName,
    d?.geo?.provinceName,
  ].filter((v): v is string => Boolean(v && v.trim()));
  return [...new Set(rows)];
}

export function dossierSummaryLines(project: Project): string[] {
  const d = project.dossier;
  const lines: string[] = [];
  const funder = d?.funder?.name || project.clientFunder;
  if (funder) lines.push(`Funder / client: ${funder}`);
  if (project.contractorName) lines.push(`Contractor: ${project.contractorName}`);
  const ward = d?.geo?.wardName || project.ward;
  const muni = d?.geo?.municipalityName || project.municipality;
  if (ward || muni) {
    const district = d?.geo?.districtName;
    const province = d?.geo?.provinceName;
    lines.push(
      `Geo: ${[ward, muni, district, province].filter(Boolean).join(", ")}`,
    );
  }
  const budget = d?.budget?.authorisedZar ?? project.budgetTotal;
  if (budget) lines.push(`Budget: R${budget.toLocaleString("en-ZA")}`);
  if (d?.dates?.startDate || project.startDate) {
    lines.push(
      `Dates: ${d?.dates?.startDate || project.startDate} → ${d?.dates?.targetEndDate || project.targetEndDate || "—"}`,
    );
  }
  if (d?.sector) lines.push(`Sector: ${d.sector}`);
  if (d?.empowermentTargets?.localHireTarget != null) {
    lines.push(`Local hire target: ${d.empowermentTargets.localHireTarget}`);
  }
  if (d?.empowermentTargets?.bbbeeLevelTarget) {
    lines.push(`B-BBEE target: ${d.empowermentTargets.bbbeeLevelTarget}`);
  }
  if (d?.communityIntel?.unemploymentRatePct != null) {
    lines.push(
      `Area unemployment: ${d.communityIntel.unemploymentRatePct}%${d.communityIntel.unemploymentSource ? ` (${d.communityIntel.unemploymentSource})` : ""}`,
    );
  }
  const attached = d?.communityIntel?.attachedIndicators?.length || 0;
  if (attached) {
    lines.push(
      `Platform baseline indicators: ${attached}${d?.communityIntel?.baselinePlaceId ? ` (${d.communityIntel.baselinePlaceId})` : ""}`,
    );
  }
  const local = d?.communityIntel?.localIndicators?.length || 0;
  if (local) {
    const zar = (d?.communityIntel?.localIndicators || [])
      .filter((r) => r.unit === "ZAR")
      .reduce((a, r) => a + r.value, 0);
    lines.push(
      `Local intel / project impact rows: ${local}${zar > 0 ? ` · R${zar.toLocaleString("en-ZA")} ZAR logged` : ""}`,
    );
  }
  const promiseCount = d?.promises?.length || 0;
  if (promiseCount) lines.push(`Promises on file: ${promiseCount}`);
  return lines;
}
