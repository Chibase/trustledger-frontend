import React from 'react';
import AuditTrailViewer from '@/components/audit/AuditTrailViewer';

export default {
  title: 'Audit/AuditTrailViewer',
  component: AuditTrailViewer,
};

const mockedChain = [
  {
    id: 'LGR-5001',
    action: 'create',
    entity_type: 'evidence',
    entity_id: 'EVID-0099',
    timestamp: '2026-08-01T09:17:30Z',
    actor_id: 'USER-INS-01',
    prev_hash: '',
    current_hash: 'abc123deadbeef...placeholder',
    signature: 'MEUCIQD...',
    canonical_entity: {
      id: 'EVID-0099',
      filename: 'culvert_block_20260801.jpg',
      gps_lat: -33.0002,
      gps_lon: 25.7001,
      uploader_id: 'USER-INS-01',
      timestamp: '2026-08-01T09:17:00Z',
    },
  },
];

export const Default = () => (
  <div style={{ width: 600 }}>
    {/* Storybook does not call the real API; we render the component with a mocked fetch using MSW or similar in a real setup */}
    <AuditTrailViewer entityType="evidence" entityId="EVID-0099" apiBaseUrl="https://example.local" />
  </div>
);
