import { useState, useEffect } from 'react';
import { getTransactions, StoredTransaction } from '../utils/storage';
import TransactionList from '../components/TransactionList';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  const total = transactions
    .filter((t) => t.status !== 'rejected')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <h1 className="page-title">History</h1>

      <div className="card card-hero">
        <div className="section-label" style={{ textAlign: 'center', marginBottom: '4px' }}>
          Total received
        </div>
        <div className="amount-display muted">${total.toFixed(2)}</div>
        <p className="muted-caption" style={{ marginTop: 0 }}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} on this device
        </p>
      </div>

      <h2 className="section-label">Recent transactions</h2>
      <div className="card" style={{ padding: '8px 18px 12px' }}>
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}
