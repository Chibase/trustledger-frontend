"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  loadWorkspaceCommunityProfiles,
  type CommunityProfile,
} from "@/lib/trust/communityProfiles";

/**
 * Community profiles, history, power context, language, and participation
 * interpretation from the parallel trust layer. Not Stats SA packs.
 */
export function CommunityProfilesPanel() {
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);

  const load = useCallback(() => {
    setProfiles(loadWorkspaceCommunityProfiles());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read local trust layer
    load();
  }, [load]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold text-tl-ink">
            Community profiles
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            History, power context, language, and participation interpretation
            from field capture. Attendance is not consent. English is not the
            default working language.
          </p>
        </div>
        <Link
          href="/app/capture"
          className="text-sm text-tl-trust-ink underline"
        >
          Capture field context
        </Link>
      </div>

      {profiles.length === 0 ? (
        <p className="text-sm text-tl-ink-muted">
          No community profiles yet. On Capture, open Field context, add history
          or power notes, then apply stakeholders so the extras save to this
          workspace.
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {profiles.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-tl-line bg-tl-surface p-4"
            >
              <p className="font-medium text-tl-ink">{row.label}</p>
              <p className="text-xs text-tl-ink-muted">
                {[row.ward, row.municipality].filter(Boolean).join(" · ") ||
                  "Place from field capture"}
              </p>
              {row.narrativeLanguage || row.workingLanguage ? (
                <p className="mt-2 text-sm text-tl-ink">
                  Spoken {row.narrativeLanguage || "unspecified"} · working{" "}
                  {row.workingLanguage || "unspecified"}
                  {row.oralSource ? " · oral source" : ""}
                </p>
              ) : null}
              {row.historyNotes ? (
                <p className="mt-2 text-sm text-tl-ink">
                  <span className="font-medium">History. </span>
                  {row.historyNotes}
                </p>
              ) : null}
              {row.powerStructureNotes ? (
                <p className="mt-2 text-sm text-tl-ink">
                  <span className="font-medium">Power / authority. </span>
                  {row.powerStructureNotes}
                </p>
              ) : null}
              {row.sensitivityNotes ? (
                <p className="mt-2 text-sm text-tl-ink">
                  <span className="font-medium">Sensitivity. </span>
                  {row.sensitivityNotes}
                </p>
              ) : null}
              {row.barriers || row.barrierTags?.length ? (
                <p className="mt-2 text-sm text-tl-ink">
                  <span className="font-medium">Barriers. </span>
                  {row.barrierTags?.join(", ") || row.barriers}
                </p>
              ) : null}
              {row.participationHints.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-tl-ink-muted">
                  {row.participationHints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
