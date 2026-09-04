/**
 * SEP execution overlay backfill (browser store).
 *
 * There is no SQL schema: plans live in `tl-engagement-plans` until a Cloud
 * DocType exists (ADR-053). Opening `/app/engagement-plan/[id]` runs
 * `backfillSepExecution(plan)` into `tl-sep-execution`.
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
