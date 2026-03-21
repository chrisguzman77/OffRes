import { useState, useCallback } from 'react';
import Scanner from '../components/Scanner';
import { parseQRPayload, verifyWithDevice } from '../utils/verify';
import { getVendorId, getVendorName, saveTransaction, isNonceUsed } from '../utils/storage';

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = useCallback(async (raw: string) => {
    setScanning(false);

    const payload = parseQRPayload(raw);
    if (!payload) return setResult({ type: 'error', message: 'Invalid QR' });

    if (isNonceUsed(payload.data.nonce)) {
      return setResult({ type: 'error', message: 'Duplicate scan' });
    }

    const vendorId = getVendorId();
    const vendorName = getVendorName();
    const verification = await verifyWithDevice(raw, vendorId, vendorName);

    if (verification.success) {
      saveTransaction({
        ...payload.data,
        accepted_at: new Date().toISOString(),
        vendor_id: vendorId,
        vendor_name: vendorName,
        status: 'accepted',
      });

      setResult({ type: 'success', message: verification.message });
    }
  }, []);

  return (
    <div>
      {!scanning && <button onClick={() => setScanning(true)}>Scan</button>}
      {scanning && <Scanner onScan={handleScan} isActive />}
      {result && <p>{result.message}</p>}
    </div>
  );
}