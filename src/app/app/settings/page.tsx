import { API_BASE_URL, getDataMode } from "@/config/api";
import { getCurrentUser } from "@/lib/auth";
import { aiService } from "@/services/aiService";

export default async function AppSettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const dataMode = getDataMode();
  const aiMock = aiService.isMockMode();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Session and environment for this Demo / pilot build.
        </p>
      </div>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="font-semibold">Signed-in profile</h2>
        <dl className="mt-3 space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">Role</dt>
            <dd>{user.role}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">User id</dt>
            <dd className="font-mono text-xs">{user.id}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="font-semibold">Runtime mode</h2>
        <dl className="mt-3 space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">Data mode</dt>
            <dd className="font-medium">{dataMode}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">AI mock</dt>
            <dd>{aiMock ? "on" : "off (Frappe AI methods)"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">API base</dt>
            <dd className="max-w-[14rem] truncate font-mono text-xs">
              {API_BASE_URL}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-tl-ink-muted">
          Set <code>NEXT_PUBLIC_DATA_MODE=live</code> and point{" "}
          <code>NEXT_PUBLIC_API_BASE_URL</code> at Interserv Frappe when ready.
          Demo stays the default.
        </p>
      </section>
    </div>
  );
}
