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

export function parseQRPayload(raw: string): QRPayload | null {
  try {
    const parsed = JSON.parse(raw);

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
  deviceUrl: string = 'http://disasterpi.local:8000'
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${deviceUrl}/vendor/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qr_payload: qrPayload,
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