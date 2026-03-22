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

function decompressPayload(compressed: string): Promise<string> {
  try {
    const raw = atob(compressed.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }

    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();

    writer.write(bytes);
    writer.close();

    return new Promise<string>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      function read(): void {
        reader.read().then(({ done, value }) => {
          if (done) {
            const combined = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
            let offset = 0;
            for (const chunk of chunks) {
              combined.set(chunk, offset);
              offset += chunk.length;
            }
            resolve(new TextDecoder().decode(combined));
          } else {
            chunks.push(value);
            read();
          }
        }).catch(reject);
      }
      read();
    });
  } catch {
    return Promise.resolve(compressed);
  }
}

export async function parseQRPayload(raw: string): Promise<QRPayload | null> {
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
  // Decompress first to get the original signed JSON
  let originalPayload = qrPayload;
  try {
    const decompressed = await decompressPayload(qrPayload);
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