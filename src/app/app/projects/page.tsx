import { ProjectsListClient } from "@/components/projects/ProjectsListClient";

export default function AppProjectsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Projects</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Portfolio includes seed projects plus any created from issue intake in
          this browser.
        </p>
      </div>
      <ProjectsListClient />
    </div>
  );
}
