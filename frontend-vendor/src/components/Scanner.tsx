import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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

    const scanner = new Html5Qrcode('qr-reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    scannerRef.current = scanner;

    // html5-qrcode requires an object with exactly one key here (deviceId, facingMode, or userPreferences).
    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 15,
          // Omit qrbox so the whole camera frame is decoded (per html5-qrcode docs).
          // Any cropped region often misses part of the code when scanning another phone.
        },
        (decodedText) => {
          isRunningRef.current = false;
          scanner.stop().then(() => {
            onScan(decodedText.trim());
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
          max-width: 100% !important;
          margin: 0 auto !important;
          border: 2px solid var(--brand) !important;
          border-radius: var(--radius-md) !important;
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
          border-color: rgba(85, 72, 217, 0.45) !important;
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
