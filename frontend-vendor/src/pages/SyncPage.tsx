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
    <div className="container">
      <h1>Sync & Settle</h1>

      <div className="card">
        <div className="info-row">
          <span className="info-label">Pending Transactions</span>
          <span>{pending.length}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Pending Amount</span>
          <span>${pending.reduce((s, t) => s + t.amount, 0).toFixed(2)}</span>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSync}
        disabled={syncing}
        style={{ marginBottom: '16px' }}
      >
        {syncing ? 'Syncing...' : 'Sync Now'}
      </button>

      {status && (
        <div className="card">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{status}</p>
        </div>
      )}

      <div className="card" style={{ marginTop: '16px' }}>
        <h2>How Sync Works</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          When internet is available, tap "Sync Now" to send your accepted
          payments to the settlement server. Each transaction is matched against
          the device's records and marked as settled.
        </p>
      </div>
    </div>
  );
}