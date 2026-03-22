import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../utils/api';

interface BalanceData {
  wallet_id: string;
  balance: number;
  currency: string;
}

interface PaymentResult {
  transaction_id: string;
  amount: number;
  status: string;
  qr_code_base64: string;
}

interface TransactionItem {
  id: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

export default function Wallet() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [preloadAmount, setPreloadAmount] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDesc, setPayDesc] = useState('');
  const [qrResult, setQrResult] = useState<PaymentResult | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    try {
      const data = await apiGet<BalanceData>('/wallet/balance');
      setBalance(data);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const fetchTransactions = async () => {
    try {
      const data = await apiGet<TransactionItem[]>('/wallet/transactions');
      setTransactions(data);
    } catch {}
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const handlePreload = async () => {
    const amt = parseFloat(preloadAmount);
    if (isNaN(amt) || amt <= 0) return;
    setLoading(true);
    try {
      const res = await apiPost<{ message: string }>('/wallet/preload', { amount: amt });
      setMessage(res.message);
      setPreloadAmount('');
      fetchBalance();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handlePay = async () => {
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;
    setLoading(true);
    try {
      const res = await apiPost<PaymentResult>('/wallet/pay', {
        amount: amt,
        description: payDesc || 'Payment',
      });
      setQrResult(res);
      setPayAmount('');
      setPayDesc('');
      fetchBalance();
      fetchTransactions();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="page-title-mobile-only">Wallet</h1>

      {/* Balance */}
      <div className="terminal-card lead" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Available balance
        </div>
        <div
          className="amount-display"
          style={{
            fontSize: '2.75rem',
            fontWeight: 800,
            color: 'var(--currency)',
            margin: '12px 0 4px',
          }}
        >
          ${balance ? balance.balance.toFixed(2) : '---'}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="terminal-card" style={{ fontSize: '0.95rem', color: 'var(--text-body)' }}>
          {message}
          <button
            type="button"
            onClick={() => setMessage('')}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: 'var(--teal-600)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="wallet-grid">
        <div className="terminal-card feature-card--peach" style={{ boxShadow: 'var(--shadow-card)', marginBottom: 0 }}>
          <h2>Preload funds</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Add funds before going offline. Simulated bank transfer.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              className="terminal-input"
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount ($)"
              value={preloadAmount}
              onChange={(e) => setPreloadAmount(e.target.value)}
              style={{ flex: '1 1 140px', minWidth: 0 }}
            />
            <button
              type="button"
              className="btn-terminal btn-terminal--secondary btn-terminal--inline"
              onClick={handlePreload}
              disabled={loading}
            >
              Preload
            </button>
          </div>
        </div>

        <div className="terminal-card feature-card--teal" style={{ boxShadow: 'var(--shadow-card)', marginBottom: 0 }}>
          <h2>Make payment</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Generate a QR code for the vendor to scan.
          </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            className="terminal-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="Payment amount ($)"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <input
            className="terminal-input"
            type="text"
            placeholder="Description (optional)"
            value={payDesc}
            onChange={(e) => setPayDesc(e.target.value)}
          />
          <button type="button" className="btn-terminal" onClick={handlePay} disabled={loading}>
            Generate payment QR
          </button>
        </div>
      </div>
      </div>

      {/* QR display */}
      {qrResult && (
        <div className="terminal-card" style={{ textAlign: 'center' }}>
          <h2>Show to vendor</h2>
          <div className="qr-container">
            <img
              src={`data:image/png;base64,${qrResult.qr_code_base64}`}
              alt="Payment QR Code"
            />
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.85rem' }}>
            Amount: ${qrResult.amount.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Transaction: {qrResult.transaction_id.slice(0, 16)}...
          </div>
          <button type="button" className="btn-terminal btn-terminal--secondary" style={{ marginTop: '16px' }} onClick={() => setQrResult(null)}>
            Done
          </button>
        </div>
      )}

      {/* Recent transactions */}
      <div className="terminal-card">
        <h2>Recent transactions</h2>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No transactions yet.</p>
        ) : (
          transactions.slice(0, 10).map((txn) => (
            <div key={txn.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.85rem',
            }}>
              <span>
                <span className={`status-dot ${txn.status === 'settled' ? 'online' : 'pending'}`} />
                {txn.description || 'Payment'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                -${txn.amount.toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
