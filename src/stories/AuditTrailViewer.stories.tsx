import { AuditTrailViewer } from "@/components/audit/AuditTrailViewer";
import {
  MOCK_LEDGER_CHAIN,
  TEST_ONLY_PUBLIC_KEY,
} from "@/lib/ledger/mockChain";

/**
 * CSF-style story (no @storybook/react dependency so Next typecheck stays green).
 * Wire Storybook + MSW in the frontend dev flow when adding Storybook to CI.
 */
const meta = {
  title: "Audit/AuditTrailViewer",
  component: AuditTrailViewer,
};

export default meta;

export const WithMockedChain = {
  name: "Mocked ledger chain",
  render: () => (
    <div className="mx-auto max-w-2xl p-4">
      <AuditTrailViewer
        entityType="evidence"
        entityId="EVID-0099"
        initialEntries={MOCK_LEDGER_CHAIN}
        initialPublicKey={TEST_ONLY_PUBLIC_KEY}
      />
    </div>
  ),
};

export const VerificationUnavailable = {
  name: "No public key",
  render: () => (
    <div className="mx-auto max-w-2xl p-4">
      <AuditTrailViewer
        entityType="evidence"
        entityId="EVID-0099"
        initialEntries={MOCK_LEDGER_CHAIN}
        initialPublicKey={null}
      />
    </div>
  ),
};

export const EmptyChain = {
  render: () => (
    <div className="mx-auto max-w-2xl p-4">
      <AuditTrailViewer
        entityType="incident"
        entityId="INC-1001"
        initialEntries={[]}
        initialPublicKey={TEST_ONLY_PUBLIC_KEY}
      />
    </div>
  ),
};
