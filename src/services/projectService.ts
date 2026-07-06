import { mockProjects } from "@/data/mockProjects";
import type { Project } from "@/types/project";

export const projectService = {
  list(): Promise<Project[]> {
    return Promise.resolve(mockProjects);
  },
};
