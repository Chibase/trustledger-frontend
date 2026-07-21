import { mockStakeholders } from "@/data/mock/stakeholders";
import type { Stakeholder } from "@/types/stakeholder";

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const stakeholderService = {
  async list(placeId?: string): Promise<Stakeholder[]> {
    const rows = placeId
      ? mockStakeholders.filter((s) => s.placeId === placeId)
      : mockStakeholders;
    return delay(rows);
  },

  async get(id: string): Promise<Stakeholder | null> {
    return delay(mockStakeholders.find((s) => s.id === id) ?? null);
  },
};
