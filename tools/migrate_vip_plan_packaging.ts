/**
 * VIP plan packaging migrate (browser overlay).
 *
 * No SQL: commercial PlanId + tl-sep-execution / desk stores.
 * Opening a VIP showcase session runs applyVipShowcaseSeed() which:
 *   - upserts NCGR-B desks only for Thozamile (thozi@) trial+VIP
 *   - adds SEP-NCGR-B and ESG-NCGR-B if missing (legacy SEP-only showcase)
 *   - purges leftover NCGR-B for any other mailbox
 *   - never writes when the session is not Thozamile's showcase
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
        skip: "non-Thozamile sessions; leftover NCGR-B is purged",
      },
      null,
      2,
    ),
  );
}

main();
