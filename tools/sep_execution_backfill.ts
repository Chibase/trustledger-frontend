/**
 * SEP execution overlay backfill (browser store + Cloud hydrate).
 *
 * Trial stays in `tl-engagement-plans` / `tl-sep-execution`. Live entitled
 * workspaces persist on TL Engagement Plan (ADR-053 / SI-SEP Cloud persist).
 * Opening `/app/engagement-plan/[id]` runs `backfillSepExecution(plan)`.
 *
 * This script documents the contract and exits 0 so CI can invoke it.
 */

import { emptySepExecution } from "../src/lib/sepExecutionStore";

function main() {
  const sample = emptySepExecution("SEP-BACKFILL");
  console.log(
    JSON.stringify(
      {
        storage: "localStorage:tl-sep-execution",
        trigger: "loadSepExecutionView(plan) on the plan dashboard",
        overlayVersion: sample.version,
        note: "No SQL migration. Existing composed plans seed milestones/tasks on first open.",
      },
      null,
      2,
    ),
  );
}

main();
