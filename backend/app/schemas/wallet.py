"""Pydantic schemas for wallet endpoints."""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PreloadRequest(BaseModel):
    amount: float
    source: str = "Capital One"  # In real world: Capital One / Nessie

class PreloadResponse(BaseModel):
    wallet_id: str
    new_balance: float
    message: str

class PaymentRequest(BaseModel):
    amount: float
    description: str = "Vendor payment"
    vendor_name: Optional[str] = None

class PaymentResponse(BaseModel):
    transaction_id: str
    amount: float
    status: str
    qr_code_base64: str  # Base64-encoded PNG image of QR code
    qr_payload: str      # Raw signed payload (for verification)

class BalanceResponse(BaseModel):
    wallet_id: str
    balance: float
    currency: str

class TransactionDetail(BaseModel):
    id: str
    amount: float
    currency: str
    status: str
    vendor_name: Optional[str]
    description: Optional[str]
    created_at: datetime
    settled_at: Optional[datetime]

    class Config:
        from_attributes = True

class VendorAcceptRequest(BaseModel):
    """Sent by the vendor app after scanning QR."""
    qr_payload: str
    vendor_id: str
    vendor_name: str

class VendorAcceptResponse(BaseModel):
    transaction_id: str
    amount: float
    status: str
    message: str

class SyncRequest(BaseModel):
    """Vendor submits pending transactions for settlement."""
    transactions: list[dict]  # List of {transaction_id, vendor_id, accepted_at}

class SyncResponse(BaseModel):
    settled: list[str]
    failed: list[str]
    message: str