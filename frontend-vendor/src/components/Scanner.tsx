import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (data: string) => void;
  isActive: boolean;
}

export default function Scanner({ onScan, isActive }: ScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isActive) return;

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          isRunningRef.current = false;
          scanner.stop().then(() => {
            onScan(decodedText);
          }).catch(() => {});
        },
        () => {}
      )
      .then(() => {
        isRunningRef.current = true;
      })
      .catch((err: any) => {
        setError(`Camera error: ${err}. Please allow camera access.`);
      });

    return () => {
      if (scannerRef.current && isRunningRef.current) {
        isRunningRef.current = false;
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isActive, onScan]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div>
      <style>{`
        #qr-reader {
          width: 100% !important;
          max-width: 400px !important;
          margin: 0 auto !important;
          border: 2px solid var(--accent) !important;
          border-radius: var(--radius) !important;
          overflow: hidden !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: auto !important;
          display: block !important;
          object-fit: cover !important;
        }
        #qr-reader img {
          display: none !important;
        }
        #qr-shaded-region {
          border-color: rgba(88, 166, 255, 0.5) !important;
        }
      `}</style>
      <div id="qr-reader" />
      <p style={{
        textAlign: 'center',
        color: 'var(--text-secondary)',
        marginTop: '12px',
        fontSize: '0.9rem',
      }}>
        Point your camera at the QR code on the OFFRes device
      </p>
    </div>
  );
}
