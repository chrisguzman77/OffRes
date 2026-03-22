import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../utils/api';
import KioskScreenKeyboard from '../components/KioskScreenKeyboard';
import { blurActiveElement } from '../utils/keyboardFocus';

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

type WalletOskField = 'preload' | 'payAmount' | 'payDesc';

export default function Wallet() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [preloadAmount, setPreloadAmount] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDesc, setPayDesc] = useState('');
  const [qrResult, setQrResult] = useState<PaymentResult | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [oskField, setOskField] = useState<WalletOskField | null>(null);

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
      setOskField(null);
      blurActiveElement();
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
      setOskField(null);
      blurActiveElement();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const closeOsk = () => {
    setOskField(null);
    blurActiveElement();
  };

  const openWalletOsk = (field: WalletOskField) => () => {
    queueMicrotask(() => setOskField(field));
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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'stretch' }}>
            <input
              className="terminal-input touch-keyboard-field"
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              pattern="[0-9]*\.?[0-9]*"
              placeholder="Amount ($)"
              value={preloadAmount}
              onChange={(e) => setPreloadAmount(e.target.value)}
              onPointerDown={openWalletOsk('preload')}
              style={{ flex: '1 1 140px', minWidth: 0 }}
            />
            <button
              type="button"
              className="btn-terminal btn-terminal--secondary btn-terminal--inline"
              style={{ minWidth: '52px' }}
              onClick={openWalletOsk('preload')}
              disabled={loading}
              aria-label="Show on-screen keyboard"
              title="Show keyboard"
            >
              ⌨
            </button>
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
            <input
              className="terminal-input touch-keyboard-field"
              style={{ flex: 1, minWidth: 0 }}
              type="text"
              inputMode="decimal"
              enterKeyHint="next"
              pattern="[0-9]*\.?[0-9]*"
              placeholder="Payment amount ($)"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              onPointerDown={openWalletOsk('payAmount')}
            />
            <button
              type="button"
              className="btn-terminal btn-terminal--secondary btn-terminal--inline"
              style={{ minWidth: '52px' }}
              onClick={openWalletOsk('payAmount')}
              disabled={loading}
              aria-label="Show on-screen keyboard"
              title="Show keyboard"
            >
              ⌨
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
            <input
              className="terminal-input touch-keyboard-field"
              style={{ flex: 1, minWidth: 0 }}
              type="text"
              inputMode="text"
              enterKeyHint="done"
              placeholder="Description (optional)"
              value={payDesc}
              onChange={(e) => setPayDesc(e.target.value)}
              onPointerDown={openWalletOsk('payDesc')}
            />
            <button
              type="button"
              className="btn-terminal btn-terminal--secondary btn-terminal--inline"
              style={{ minWidth: '52px' }}
              onClick={openWalletOsk('payDesc')}
              disabled={loading}
              aria-label="Show on-screen keyboard"
              title="Show keyboard"
            >
              ⌨
            </button>
          </div>
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

      {oskField === 'preload' && (
        <KioskScreenKeyboard
          value={preloadAmount}
          onChange={setPreloadAmount}
          mode="decimal"
          onClose={closeOsk}
        />
      )}
      {oskField === 'payAmount' && (
        <KioskScreenKeyboard
          value={payAmount}
          onChange={setPayAmount}
          mode="decimal"
          onClose={closeOsk}
        />
      )}
      {oskField === 'payDesc' && (
        <KioskScreenKeyboard
          value={payDesc}
          onChange={setPayDesc}
          mode="text"
          onClose={closeOsk}
        />
      )}
    </div>
  );
}
