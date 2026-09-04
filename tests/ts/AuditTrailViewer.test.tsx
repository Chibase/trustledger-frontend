/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuditTrailViewer from "@/components/audit/AuditTrailViewer";
import {
  MOCK_LEDGER_CHAIN,
  TEST_ONLY_PUBLIC_KEY,
  VECTOR_1_HASH,
  VECTOR_3_HASH,
} from "@/lib/ledger/mockChain";
import type { LedgerEntry } from "@/lib/ledger/types";
import { verifyLedgerEntry } from "@/lib/ledger/verifyEntry";

jest.mock("@/lib/ledger/verify", () => ({
  verifySignatureBase64: jest.fn(async () => true),
  verificationCryptoAvailable: () => true,
}));

const ENTRY: LedgerEntry = MOCK_LEDGER_CHAIN[0]!;
const PUB = TEST_ONLY_PUBLIC_KEY;

const { verifySignatureBase64 } = jest.requireMock("@/lib/ledger/verify") as {
  verifySignatureBase64: jest.Mock;
};

beforeEach(() => {
  verifySignatureBase64.mockReset();
  verifySignatureBase64.mockResolvedValue(true);
});

test("renders a chain of entries with prev → current hash and evidence metadata", () => {
  const withMeta: LedgerEntry = {
    ...ENTRY,
    canonical_entity: {
      ...(ENTRY.canonical_entity as Record<string, unknown>),
      checksum: "sha256:demo-checksum",
    },
  };
  render(
    <AuditTrailViewer
      entityType="evidence"
      entityId="EVID-0099"
      initialEntries={[withMeta, MOCK_LEDGER_CHAIN[1]!]}
      initialPublicKey={PUB}
    />,
  );
  expect(screen.getByRole("heading", { name: /audit trail/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /verify chain/i })).toBeInTheDocument();
  expect(screen.getByText(/genesis/i)).toBeInTheDocument();
  expect(screen.getByText(/LGR-5001/)).toBeInTheDocument();
  expect(screen.getByText(/LGR-5002/)).toBeInTheDocument();
  expect(screen.getByText(/gps_lat/i)).toBeInTheDocument();
  expect(screen.getByText("-33.0002")).toBeInTheDocument();
  expect(screen.getByText("25.7001")).toBeInTheDocument();
  expect(screen.getByText("sha256:demo-checksum")).toBeInTheDocument();
  expect(screen.getByText(/USER-INS-01/)).toBeInTheDocument();
  expect(screen.getByText(/USER-INS-02/)).toBeInTheDocument();
  const hashes = screen.getAllByText(
    new RegExp(`${VECTOR_1_HASH.slice(0, 10)}…${VECTOR_1_HASH.slice(-6)}`),
  );
  expect(hashes.length).toBeGreaterThanOrEqual(2);
  expect(
    screen.getByText(
      new RegExp(`${VECTOR_3_HASH.slice(0, 10)}…${VECTOR_3_HASH.slice(-6)}`),
    ),
  ).toBeInTheDocument();
});

test("loading then error UX when get_chain fails", async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
  render(
    <AuditTrailViewer
      entityType="incident"
      entityId="INC-1001"
      apiBaseUrl="https://api.example.test"
    />,
  );
  expect(screen.getByText(/loading ledger/i)).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(/network down/i),
  );
});

test("shows verification not available when public key is missing", () => {
  render(
    <AuditTrailViewer
      entityType="evidence"
      entityId="EVID-0099"
      initialEntries={[ENTRY]}
      initialPublicKey={null}
    />,
  );
  expect(
    screen.getAllByText(/verification not available/i).length,
  ).toBeGreaterThan(0);
});

test("Verify marks the row verified when hash matches and signature mock returns true", async () => {
  const user = userEvent.setup();
  render(
    <AuditTrailViewer
      entityType="evidence"
      entityId="EVID-0099"
      initialEntries={[ENTRY]}
      initialPublicKey={PUB}
    />,
  );
  await user.click(screen.getByRole("button", { name: /^verify$/i }));
  await waitFor(() =>
    expect(screen.getByText(/^verified$/i)).toBeInTheDocument(),
  );
});

test("Verify shows mismatch when stored current_hash does not match", async () => {
  const user = userEvent.setup();
  const bad: LedgerEntry = { ...ENTRY, current_hash: "0".repeat(64) };
  render(
    <AuditTrailViewer
      entityType="evidence"
      entityId="EVID-0099"
      initialEntries={[bad]}
      initialPublicKey={PUB}
    />,
  );
  await user.click(screen.getByRole("button", { name: /^verify$/i }));
  await waitFor(() =>
    expect(screen.getByText(/^mismatch$/i)).toBeInTheDocument(),
  );
});

test("Verify chain marks matching signed entry verified", async () => {
  const user = userEvent.setup();
  render(
    <AuditTrailViewer
      entityType="evidence"
      entityId="EVID-0099"
      initialEntries={MOCK_LEDGER_CHAIN}
      initialPublicKey={PUB}
    />,
  );
  await user.click(screen.getByRole("button", { name: /verify chain/i }));
  await waitFor(() =>
    expect(screen.getByText(/^verified$/i)).toBeInTheDocument(),
  );
});

test("verifyLedgerEntry: mock public key + matching hash → verified", async () => {
  verifySignatureBase64.mockResolvedValueOnce(true);
  const outcome = await verifyLedgerEntry(ENTRY, PUB);
  expect(outcome.status).toBe("verified");
  expect(verifySignatureBase64).toHaveBeenCalled();
});

test("verifyLedgerEntry: mock public key rejected signature → bad_signature", async () => {
  verifySignatureBase64.mockResolvedValueOnce(false);
  const outcome = await verifyLedgerEntry(ENTRY, PUB);
  expect(outcome.status).toBe("bad_signature");
});
