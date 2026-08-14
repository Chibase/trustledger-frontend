import {
  isResourcePackId,
  resourcePackById,
  type ResourcePackId,
} from "@/data/resources";

export type ThembaMagnet = {
  packId: ResourcePackId;
  title: string;
};

const MAGNET_PHRASES = [
  "download",
  "checklist",
  "toolkit",
  "blueprint",
  "lead magnet",
  "printable",
  "pdf",
  "resource pack",
  "framework pack",
];

export function wantsLeadMagnet(question: string): boolean {
  const q = question.toLowerCase();
  return MAGNET_PHRASES.some((p) => q.includes(p));
}

export function magnetForQuestion(question: string): ThembaMagnet | null {
  if (!wantsLeadMagnet(question)) return null;
  const q = question.toLowerCase();
  let packId: ResourcePackId = "readiness-planner";
  if (/\b(grievance|complaint|intake|sla|case desk)\b/.test(q)) {
    packId = "grievance-checklist";
  } else if (/\b(engagement|consultation|meeting|community)\b/.test(q)) {
    packId = "engagement-toolkit";
  } else if (/\b(blueprint|framework|readiness|planner|compliance)\b/.test(q)) {
    packId = "readiness-planner";
  }
  const pack = resourcePackById(packId);
  if (!pack) return null;
  return { packId: pack.id, title: pack.title };
}

export function magnetByPackId(packId: string): ThembaMagnet | null {
  if (!isResourcePackId(packId)) return null;
  const pack = resourcePackById(packId);
  if (!pack) return null;
  return { packId: pack.id, title: pack.title };
}
