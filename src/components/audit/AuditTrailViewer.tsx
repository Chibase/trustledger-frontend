import React, { useEffect, useState } from 'react';
import { canonicalizeObject, computeCurrentHashHex } from '@/lib/ledger/canonicalize';
import { verifySignatureBase64 } from '@/lib/ledger/verify';

type LedgerEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  actor_id: string;
  prev_hash: string | null;
  current_hash: string;
  signature?: string | null;
  canonical_entity?: any;
};

type Props = {
  entityType: string;
  entityId: string;
  apiBaseUrl?: string; // optional override
};

export function AuditTrailViewer({ entityType, entityId, apiBaseUrl }: Props) {
  const [chain, setChain] = useState<LedgerEntry[] | null>(null);
  const [pubKeyB64, setPubKeyB64] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [verifications, setVerifications] = useState<Record<string, boolean | string>>({});
  const base = apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    async function load() {
      setStatus('loading');
      try {
        const q = new URL(`${base}/api/method/srm_core.api.ledger.get_chain`);
        q.searchParams.set('entity_id', entityId);
        const r = await fetch(q.toString(), { credentials: 'include', method: 'GET' });
        const json = await r.json();
        const entries: LedgerEntry[] = json?.message || [];
        setChain(entries);
      } catch (err) {
        console.error(err);
        setChain([]);
      }

      try {
        const r2 = await fetch(`${base}/api/method/srm_core.api.ledger.public_key`);
        const j2 = await r2.json();
        const key = j2?.message?.public_key;
        setPubKeyB64(key || null);
      } catch (e) {
        setPubKeyB64(null);
      }

      setStatus(null);
    }
    load();
  }, [entityId, base]);

  async function verifyEntry(entry: LedgerEntry) {
    if (!entry.signature) return 'no-signature';
    if (!entry.canonical_entity) return 'no-canonical';
    if (!pubKeyB64) return 'no-pubkey';

    // Recompute canonical JSON bytes and hash
    try {
      const canonicalBytes = canonicalizeObject(entry.canonical_entity);
      const recomputed = await computeCurrentHashHex(entry.prev_hash || '', canonicalBytes, entry.timestamp, entry.actor_id);
      if (recomputed !== entry.current_hash) {
        setVerifications((s) => ({ ...s, [entry.id]: false }));
        return false;
      }
      const ok = await verifySignatureBase64(pubKeyB64, entry.signature, recomputed);
      setVerifications((s) => ({ ...s, [entry.id]: ok }));
      return ok;
    } catch (err) {
      console.error('verify error', err);
      setVerifications((s) => ({ ...s, [entry.id]: 'error' }));
      return 'error';
    }
  }

  async function verifyAll() {
    if (!chain) return;
    setStatus('verifying');
    for (const e of chain) {
      // eslint-disable-next-line no-await-in-loop
      // only verify entries that have signature + canonical_entity
      if (e.signature && e.canonical_entity) await verifyEntry(e);
    }
    setStatus(null);
  }

  return (
    <div className="tl-audit rounded-md border p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Audit trail</h3>
        <div>
          <button
            onClick={() => verifyAll()}
            className="px-3 py-1 text-sm rounded bg-tl-trust text-white"
            disabled={!chain || chain.length === 0 || status === 'verifying'}
          >
            Verify chain
          </button>
        </div>
      </div>

      {status === 'loading' ? (
        <p className="text-sm text-gray-500">Loading ledger...</p>
      ) : null}

      {!chain || chain.length === 0 ? (
        <p className="text-sm text-gray-500">No ledger entries found for this entity.</p>
      ) : (
        <ol className="space-y-2">
          {chain.map((entry) => (
            <li key={entry.id} className="rounded border p-2 bg-tl-paper">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-tl-ink-muted">{entry.action} · {new Date(entry.timestamp).toLocaleString()}</div>
                  <div className="font-mono text-sm">{entry.current_hash}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs">Actor: {entry.actor_id}</div>
                  <div className="mt-2">
                    <button
                      onClick={() => verifyEntry(entry)}
                      className="px-2 py-1 text-xs rounded border"
                    >Verify</button>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-sm text-tl-ink-muted">
                {entry.canonical_entity ? (
                  <details>
                    <summary className="cursor-pointer">View canonical entity</summary>
                    <pre className="whitespace-pre-wrap text-xs mt-2">{JSON.stringify(entry.canonical_entity, null, 2)}</pre>
                  </details>
                ) : (
                  <div className="text-xs">No canonical entity stored with this ledger entry.</div>
                )}

                <div className="mt-2">
                  <span className="text-xs">Verification status: </span>
                  <span className="font-medium">
                    {verifications[entry.id] === true ? (
                      <span className="text-green-600">Verified</span>
                    ) : verifications[entry.id] === false ? (
                      <span className="text-red-600">Mismatch</span>
                    ) : typeof verifications[entry.id] === 'string' ? (
                      <span className="text-amber-700">{verifications[entry.id]}</span>
                    ) : (
                      <span className="text-gray-500">Not verified</span>
                    )}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default AuditTrailViewer;
