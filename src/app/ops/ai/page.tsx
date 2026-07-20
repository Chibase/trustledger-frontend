import Link from "next/link";
import { PillarBanner } from "@/components/ops/PillarBanner";
import {
  aiStatusLabel,
  buildAiToolsOverview,
} from "@/lib/commandCentreIntel";

export const dynamic = "force-dynamic";

export default function OpsAiToolsPage() {
  const data = buildAiToolsOverview();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command control</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">AI tools</h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Govern every AI capability on the platform — performance, challenges,
          and whether to upgrade or discharge a tool.
        </p>
      </header>

      <PillarBanner status={data.status}>{data.summary}</PillarBanner>

      <div className="overflow-x-auto rounded-lg border border-tl-line bg-tl-surface">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Tool</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Challenge</th>
              <th className="px-4 py-3 font-medium">Recommendation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tl-line">
            {data.tools.map((tool) => (
              <tr key={tool.id}>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-xs text-tl-ink-muted">{tool.purpose}</p>
                  <p className="mt-1 text-[11px] text-tl-ink-muted">
                    {tool.model} · {tool.promptVersion}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className="rounded-sm bg-tl-paper px-1.5 py-0.5 text-xs font-medium">
                    {aiStatusLabel(tool.status)}
                  </span>
                </td>
                <td className="px-4 py-3 align-top text-tl-ink-muted">
                  {tool.challenge}
                </td>
                <td className="px-4 py-3 align-top">{tool.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "Upgrade",
            body: "Prompt/model bump when confidence or board tone slips.",
          },
          {
            title: "Watch",
            body: "Keep suggest→apply; raise if reject rate climbs.",
          },
          {
            title: "Discharge",
            body: "Retire a tool that adds risk without measurable value.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-tl-line bg-tl-surface p-4"
          >
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-1 text-sm text-tl-ink-muted">{card.body}</p>
            <p className="mt-2 text-[11px] uppercase tracking-wide text-tl-amber">
              Action workflow — next packet
            </p>
          </div>
        ))}
      </section>

      <p className="text-sm text-tl-ink-muted">{data.telemetryNote}</p>

      <p className="text-sm">
        <Link
          href="/ops/executive"
          className="font-medium text-tl-trust-ink underline"
        >
          Back to Executive Board
        </Link>
      </p>
    </div>
  );
}
