import { StoredTransaction } from '../utils/storage';

interface TransactionListProps {
  transactions: StoredTransaction[];
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return <div className="empty-state">No transactions yet.</div>;
  }

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.accepted_at).getTime() - new Date(a.accepted_at).getTime()
  );

  return (
    <div className="txn-list">
      {sorted.map((txn) => (
        <div key={txn.transaction_id} className="txn-row">
          <div className="txn-row-main">
            <div className="txn-row-title">Received</div>
            <div className="txn-row-sub">
              {txn.description || 'Payment'} ·{' '}
              <span className={`status-badge status-${txn.status}`}>{txn.status}</span>
            </div>
          </div>
          <div className="txn-row-right">
            <div className="txn-amount">+${txn.amount.toFixed(2)}</div>
            <div className="txn-date">{formatDate(txn.accepted_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
