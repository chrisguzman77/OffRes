import { StoredTransaction } from '../utils/storage';

interface TransactionListProps {
  transactions: StoredTransaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return <div>No transactions yet.</div>;
  }

  return (
    <div>
      {transactions.map((txn) => (
        <div key={txn.transaction_id}>
          <p>${txn.amount.toFixed(2)}</p>
          <span className={`status-badge status-${txn.status}`}>
            {txn.status}
          </span>
        </div>
      ))}
    </div>
  );
}