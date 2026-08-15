import { ProjectsListClient } from "@/components/projects/ProjectsListClient";
import { getCurrentUser } from "@/lib/auth";

export default async function AppProjectsPage() {
  const user = await getCurrentUser();
  const canCreate =
    Boolean(user) &&
    (user?.mode === "live" || user?.mode === "trial") &&
    user?.isPlanOwner !== false;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Projects</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          {user?.mode === "live" || user?.isVip
            ? "Your programme sites on TrustLedger Cloud. Add projects for each site or workstream."
            : user?.mode === "trial"
              ? "Your trial workspace projects — add sites as you seed the desk."
              : "Portfolio for this session. Start a trial or live login to keep your own projects."}
        </p>
      </div>
      <ProjectsListClient canCreate={canCreate} />
    </div>
  );
}
