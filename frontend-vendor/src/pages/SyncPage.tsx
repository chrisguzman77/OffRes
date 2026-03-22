import { useState } from 'react';
import { getPendingForSync, updateTransactionStatus } from '../utils/storage';

export default function SyncPage() {
  const [status, setStatus] = useState<string>('');
  const [syncing, setSyncing] = useState(false);

  const pending = getPendingForSync();

  const handleSync = async () => {
    if (pending.length === 0) {
      setStatus('No pending transactions to sync.');
      return;
    }

    setSyncing(true);
    setStatus('Syncing...');

    try {
      const response = await fetch('http://disasterpi.local:8000/sync/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: pending.map((t) => ({
            transaction_id: t.transaction_id,
            vendor_id: t.vendor_id,
            accepted_at: t.accepted_at,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();

        data.settled.forEach((id: string) => {
          updateTransactionStatus(id, 'settled');
        });

        setStatus(
          `Sync complete! ${data.settled.length} settled, ${data.failed.length} failed.`
        );
      } else {
        setStatus('Sync failed. Server returned an error.');
      }
    } catch {
      setStatus('Cannot reach the server. Make sure you have internet connectivity.');
    }

    setSyncing(false);
  };

  return (
    <div>
      <h1 className="page-title">Sync &amp; settle</h1>

      <div className="card">
        <div className="info-row">
          <span className="info-label">Pending transactions</span>
          <span style={{ fontWeight: 700 }}>{pending.length}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Pending amount</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            ${pending.reduce((s, t) => s + t.amount, 0).toFixed(2)}
          </span>
        </div>
      </div>

      <button type="button" className="btn btn-primary" onClick={handleSync} disabled={syncing} style={{ marginBottom: '14px' }}>
        {syncing ? 'Syncing…' : 'Sync now'}
      </button>

      {status && (
        <div className="card">
          <p className="help-text" style={{ textAlign: 'center', margin: 0 }}>
            {status}
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="section-label" style={{ marginTop: 0 }}>
          How sync works
        </h2>
        <p className="help-text">
          When internet is available, tap &quot;Sync now&quot; to send accepted payments to the settlement
          server. Each transaction is matched against the device records and marked as settled.
        </p>
      </div>
    </div>
  );
}
