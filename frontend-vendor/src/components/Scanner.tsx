import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (data: string) => void;
  isActive: boolean;
}

export default function Scanner({ onScan, isActive }: ScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isActive) return;

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().then(() => onScan(decodedText));
        },
        () => {}
      )
      .catch((err: any) => {
        setError(`Camera error: ${err}. Please allow camera access.`);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [isActive, onScan]);

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }} />
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        Point your camera at the QR code
      </p>
    </div>
  );
}