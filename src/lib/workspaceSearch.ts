import type { Project } from "@/types/project";

/** Desk search from the shell top bar (`/app/projects?q=`). */
export function projectMatchesDeskSearch(project: Project, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  return [
    project.name,
    project.id,
    project.ward,
    project.municipality,
    project.clientFunder,
    project.contractorName,
  ].some((value) => (value || "").toLowerCase().includes(q));
}
