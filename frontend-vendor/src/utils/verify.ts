import { inflate } from 'pako';

export interface QRPayload {
  data: {
    transaction_id: string;
    wallet_id: string;
    amount: number;
    currency: string;
    description: string;
    nonce: string;
    created_at: string;
  };
  signature: string;
}

function normalizeScannedPayload(raw: string): string {
  return raw.replace(/^\uFEFF/, '').trim();
}

/** Decompresses Python `zlib.compress` output (RFC 1950 zlib wrapper). */
function decompressPayload(compressed: string): string {
  try {
    let b64 = compressed.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    const raw = atob(b64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }
    return new TextDecoder().decode(inflate(bytes));
  } catch {
    return compressed;
  }
}

export async function parseQRPayload(raw: string): Promise<QRPayload | null> {
  raw = normalizeScannedPayload(raw);
  try {
    // First try direct JSON parse (uncompressed)
    const direct = JSON.parse(raw);
    if (direct.data && direct.signature) return direct as QRPayload;
  } catch {
    // Not raw JSON, try decompressing
  }

  try {
    const decompressed = await decompressPayload(raw);
    const parsed = JSON.parse(decompressed);
    if (!parsed.data || !parsed.signature) return null;
    if (!parsed.data.transaction_id) return null;
    if (!parsed.data.amount || parsed.data.amount <= 0) return null;
    if (!parsed.data.nonce) return null;
    return parsed as QRPayload;
  } catch {
    return null;
  }
}

export async function verifyWithDevice(
  qrPayload: string,
  vendorId: string,
  vendorName: string,
  deviceUrl: string = 'http://localhost:8000'
): Promise<{ success: boolean; message: string }> {
  qrPayload = normalizeScannedPayload(qrPayload);
  // Decompress first to get the original signed JSON
  let originalPayload = qrPayload;
  try {
    const decompressed = decompressPayload(qrPayload);
    JSON.parse(decompressed); // Verify it's valid JSON
    originalPayload = decompressed;
  } catch {
    // Already raw JSON
  }

  try {
    const response = await fetch(`${deviceUrl}/vendor/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qr_payload: originalPayload,
        vendor_id: vendorId,
        vendor_name: vendorName,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message };
    } else {
      const err = await response.json();
      return { success: false, message: err.detail || 'Verification failed' };
    }
  } catch {
    return {
      success: true,
      message: 'Device unreachable. Payment accepted locally (will verify on sync).'
    };
  }
}