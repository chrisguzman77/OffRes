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
    <div className="container">
      <h1>Transaction History</h1>

      <div className="card">
        <div className="info-row">
          <span className="info-label">Total Received</span>
          <span className="amount-display" style={{ fontSize: '1.5rem', margin: 0 }}>
            
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Transaction Count</span>
          <span>{transactions.length}</span>
        </div>
      </div>

      <TransactionList transactions={transactions} />
    </div>
  );
}
