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
    <div>
      <h1 className="page-title">Scan payment</h1>

      {!scanning && !result && (
        <>
          <div className="card">
            <p className="help-text" style={{ marginBottom: '16px' }}>
              Point your camera at the customer&apos;s payment QR. Works best in good light with the full
              code visible.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setScanning(true)}>
              Start scanning
            </button>
          </div>
        </>
      )}

      {scanning && (
        <div className="card" style={{ padding: '14px' }}>
          <Scanner onScan={handleScan} isActive={scanning} />
          <button type="button" className="btn btn-danger" style={{ marginTop: '14px' }} onClick={() => setScanning(false)}>
            Cancel
          </button>
        </div>
      )}

      {result && (
        <div className="card card-hero">
          {result.type === 'success' ? (
            <>
              <div className="success-message">Payment accepted</div>
              {result.payload && (
                <>
                  <div className="amount-display">${result.payload.data.amount.toFixed(2)}</div>
                  <div className="info-row" style={{ textAlign: 'left' }}>
                    <span className="info-label">Description</span>
                    <span style={{ fontWeight: 600 }}>{result.payload.data.description}</span>
                  </div>
                </>
              )}
              <p className="muted-caption">{result.message}</p>
            </>
          ) : (
            <div className="error-message">{result.message}</div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '18px' }}
            onClick={() => {
              setResult(null);
              setScanning(false);
            }}
          >
            Scan another
          </button>
        </div>
      )}
    </div>
  );
}
