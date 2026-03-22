import { useState, useCallback } from 'react';
import Scanner from '../components/Scanner';
import {
  parseQRPayload,
  verifyWithDevice,
  QRPayload,
} from '../utils/verify';
import {
  getVendorId,
  getVendorName,
  saveTransaction,
  isNonceUsed,
} from '../utils/storage';

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
    payload?: QRPayload;
  } | null>(null);

  const handleScan = useCallback(async (raw: string) => {
    setScanning(false);

    const payload = await parseQRPayload(raw);
    if (!payload) {
      setResult({ type: 'error', message: 'Invalid QR code. Not a valid OFFRes payment.' });
      return;
    }

    if (isNonceUsed(payload.data.nonce)) {
      setResult({ type: 'error', message: 'This payment has already been scanned. Duplicate rejected.' });
      return;
    }

    const vendorId = getVendorId();
    const vendorName = getVendorName();
    const verification = await verifyWithDevice(raw, vendorId, vendorName);

    if (verification.success) {
      saveTransaction({
        transaction_id: payload.data.transaction_id,
        amount: payload.data.amount,
        currency: payload.data.currency,
        description: payload.data.description,
        nonce: payload.data.nonce,
        accepted_at: new Date().toISOString(),
        vendor_id: vendorId,
        vendor_name: vendorName,
        status: 'accepted',
      });

      setResult({
        type: 'success',
        message: verification.message,
        payload,
      });
    } else {
      setResult({ type: 'error', message: verification.message });
    }
  }, []);

  return (
    <div className="container">
      <h1>Scan Payment</h1>

      {!scanning && !result && (
        <button className="btn btn-primary" onClick={() => setScanning(true)}>
          Start Scanning
        </button>
      )}

      {scanning && (
        <div>
          <Scanner onScan={handleScan} isActive={scanning} />
          <button
            className="btn btn-danger"
            style={{ marginTop: '12px' }}
            onClick={() => setScanning(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {result && (
        <div className="card">
          {result.type === 'success' ? (
            <>
              <div className="success-message">Payment Accepted</div>
              {result.payload && (
                <>
                  <div className="amount-display">${result.payload.data.amount.toFixed(2)}</div>
                  <div className="info-row">
                    <span className="info-label">Description</span>
                    <span>{result.payload.data.description}</span>
                  </div>
                </>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '8px' }}>
                {result.message}
              </p>
            </>
          ) : (
            <div className="error-message">{result.message}</div>
          )}

          <button
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={() => {
              setResult(null);
              setScanning(false);
            }}
          >
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
}
