"""
SQLAlchemy models for the wallet system.
These define the actual database tables.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Boolean, Text
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Wallet(Base):
    """
    Represents a user's wallet.
    In the MVP, there is one wallet on the device.
    """
    __tablename__ = "wallets"

    id = Column(String, primary_key=True, default=generate_uuid)
    owner_name = Column(String, nullable=False, default="Device Owner")
    balance = Column(Float, nullable=False, default=0.0)
    currency = Column(String, nullable=False, default="USD")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class Transaction(Base):
    """
    Represents a payment transaction.
    
    Status flow:
    - 'pending'   → QR generated, not yet scanned by vendor
    - 'accepted'  → Vendor scanned and accepted
    - 'rejected'  → Vendor rejected (e.g., amount mismatch)
    - 'settled'   → Reconciled after internet returns
    - 'failed'    → Settlement failed
    """
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    wallet_id = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="USD")
    vendor_id = Column(String, nullable=True)  # Set when vendor accepts
    vendor_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")
    qr_payload = Column(Text, nullable=True)  # The signed QR data
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
    settled_at = Column(DateTime, nullable=True)

    # Nonce to prevent replay attacks / duplicate payments
    nonce = Column(String, nullable=False, default=generate_uuid)