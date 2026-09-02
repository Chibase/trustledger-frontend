/**
 * VIP plan packaging migrate (browser overlay).
 *
 * No SQL: commercial PlanId + tl-sep-execution / desk stores.
 * Opening a VIP showcase session runs applyVipShowcaseSeed() which:
 *   - upserts NCGR-B desks (project, incidents, engagements, commitments, capture, reports)
 *   - adds SEP-NCGR-B and ESG-NCGR-B if missing (legacy SEP-only showcase)
 *   - never writes when tl-vip is unset (non-VIP / live Cloud VIP)
 *
 * This script documents the contract and exits 0 for CI.
 */

import { VIP_DEMO_BUNDLE_VERSION } from "../src/types/planPackaging";

function main() {
  console.log(
    JSON.stringify(
      {
        storage: "localStorage + org desks",
        trigger: "applyVipShowcaseSeed on /login/vip and VipPackagingSync",
        bundleVersion: VIP_DEMO_BUNDLE_VERSION,
        skip: "non-VIP and live Cloud VIP (own data)",
      },
      null,
      2,
    ),
  );
}

main();
