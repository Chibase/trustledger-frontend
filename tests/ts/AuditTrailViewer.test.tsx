/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AuditTrailViewer from '../../src/components/audit/AuditTrailViewer';

// Mock fetch responses
const mockChainResponse = { message: [
  {
    id: 'LGR-5001',
    action: 'create',
    entity_type: 'evidence',
    entity_id: 'EVID-0099',
    timestamp: '2026-08-01T09:17:30Z',
    actor_id: 'USER-INS-01',
    prev_hash: '',
    current_hash: 'deadbeef',
    signature: 'sigbase64',
    canonical_entity: { id: 'EVID-0099', filename: 'image.jpg' }
  }
] };

const mockPubKeyResponse = { message: { public_key: 'cHVibGlja2V5' } };

beforeEach(() => {
  // @ts-ignore
  global.fetch = jest.fn((url: string) => {
    if (url.includes('get_chain')) {
      return Promise.resolve({ json: () => Promise.resolve(mockChainResponse) });
    }
    if (url.includes('public_key')) {
      return Promise.resolve({ json: () => Promise.resolve(mockPubKeyResponse) });
    }
    return Promise.resolve({ json: () => Promise.resolve({}) });
  });
});

test('renders ledger entries and verify button', async () => {
  render(<AuditTrailViewer entityType="evidence" entityId="EVID-0099" apiBaseUrl="https://api.local" />);
  await waitFor(() => expect(screen.getByText(/Audit trail/i)).toBeInTheDocument());
  expect(screen.getByText(/Verify chain/i)).toBeInTheDocument();
  // entry current_hash should render
  await waitFor(() => expect(screen.getByText(/deadbeef/i)).toBeInTheDocument());
});
