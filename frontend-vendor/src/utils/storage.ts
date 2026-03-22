/**
 * Local storage utilities for the vendor app.
 */

export interface StoredTransaction {
  transaction_id: string;
  amount: number;
  currency: string;
  description: string;
  nonce: string;
  accepted_at: string;
  vendor_id: string;
  vendor_name: string;
  status: 'accepted' | 'settled' | 'rejected';
}

const STORAGE_KEY = 'disasterpi_vendor_transactions';
const NONCE_KEY = 'disasterpi_vendor_nonces';
const VENDOR_ID_KEY = 'disasterpi_vendor_id';

export function getVendorId(): string {
  let id = localStorage.getItem(VENDOR_ID_KEY);
  if (!id) {
    id = 'vendor-' + crypto.randomUUID();
    localStorage.setItem(VENDOR_ID_KEY, id);
  }
  return id;
}

export function getVendorName(): string {
  return localStorage.getItem('disasterpi_vendor_name') || 'Vendor';
}

export function setVendorName(name: string): void {
  localStorage.setItem('disasterpi_vendor_name', name);
}

export function getTransactions(): StoredTransaction[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTransaction(txn: StoredTransaction): void {
  const txns = getTransactions();
  txns.unshift(txn);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
  addNonce(txn.nonce);
}

export function updateTransactionStatus(txnId: string, status: StoredTransaction['status']): void {
  const txns = getTransactions();
  const idx = txns.findIndex(t => t.transaction_id === txnId);
  if (idx >= 0) {
    txns[idx].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
  }
}

export function isNonceUsed(nonce: string): boolean {
  const raw = localStorage.getItem(NONCE_KEY);
  if (!raw) return false;
  const nonces: string[] = JSON.parse(raw);
  return nonces.includes(nonce);
}

function addNonce(nonce: string): void {
  const raw = localStorage.getItem(NONCE_KEY);
  const nonces: string[] = raw ? JSON.parse(raw) : [];
  nonces.push(nonce);
  localStorage.setItem(NONCE_KEY, JSON.stringify(nonces));
}

export function getPendingForSync(): StoredTransaction[] {
  return getTransactions().filter(t => t.status === 'accepted');
}

export function clearAll(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NONCE_KEY);
}
