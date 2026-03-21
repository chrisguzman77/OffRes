"""
Wallet service handling preload, balance, and payment operations.

Preload flow (online):
  1. User calls /wallet/preload with an amount
  2. In the real world, this would pull from Capital One / Nessie
  3. In our MVP, we simulate instant preload
  4. Balance is stored in SQLite

Payment flow (offline):
  1. User requests payment with amount
  2. We check balance >= amount
  3. We deduct the balance immediately (optimistic)
  4. We create a Transaction record with status='pending'
  5. We generate a signed QR payload
  6. We return the QR code image to display on screen
"""

from sqlalchemy.orm import Session
from app.models.wallet import Wallet, Transaction
from app.services.qr_service import generate_qr_code
from app.utils.crypto import sign_payload
from datetime import datetime, timezone


def get_or_create_wallet(db: Session) -> Wallet:
    """Get the device wallet, or create one if it doesn't exist."""
    wallet = db.query(Wallet).first()
    if not wallet:
        wallet = Wallet(owner_name="Device Owner", balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


def preload_funds(db: Session, amount: float, source: str) -> dict:
    """
    Simulate adding funds to the wallet.
    In production, this would call Capital One's Nessie API or a real bank API.
    """
    if amount <= 0:
        raise ValueError("Preload amount must be positive")

    wallet = get_or_create_wallet(db)
    wallet.balance += amount
    wallet.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(wallet)

    return {
        "wallet_id": wallet.id,
        "new_balance": wallet.balance,
        "message": f"Preloaded ${amount:.2f} from {source}. "
                   f"New balance: ${wallet.balance:.2f}"
    }


def get_balance(db: Session) -> dict:
    """Return current wallet balance."""
    wallet = get_or_create_wallet(db)
    return {
        "wallet_id": wallet.id,
        "balance": wallet.balance,
        "currency": wallet.currency
    }


def create_payment(db: Session, amount: float, description: str, vendor_name: str = None) -> dict:
    """
    Create an offline payment.
    
    1. Verify sufficient balance
    2. Deduct from wallet (optimistic deduction)
    3. Create transaction record
    4. Generate signed QR payload
    5. Generate QR code image
    """
    wallet = get_or_create_wallet(db)

    if amount <= 0:
        raise ValueError("Payment amount must be positive")

    if wallet.balance < amount:
        raise ValueError(
            f"Insufficient balance. Available: ${wallet.balance:.2f}, "
            f"Requested: ${amount:.2f}"
        )

    # Deduct balance
    wallet.balance -= amount
    wallet.updated_at = datetime.now(timezone.utc)

    # Create transaction
    txn = Transaction(
        wallet_id=wallet.id,
        amount=amount,
        description=description,
        vendor_name=vendor_name,
        status="pending"
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    db.refresh(wallet)

    # Build QR payload
    payload_data = {
        "transaction_id": txn.id,
        "wallet_id": wallet.id,
        "amount": amount,
        "currency": txn.currency,
        "description": description,
        "nonce": txn.nonce,
        "created_at": txn.created_at.isoformat()
    }
    signed_payload = sign_payload(payload_data)
    
    # Store signed payload in transaction
    txn.qr_payload = signed_payload
    db.commit()

    # Generate QR code image
    qr_base64 = generate_qr_code(signed_payload)

    return {
        "transaction_id": txn.id,
        "amount": amount,
        "status": txn.status,
        "qr_code_base64": qr_base64,
        "qr_payload": signed_payload
    }


def get_transactions(db: Session) -> list[dict]:
    """Return all transactions, newest first."""
    txns = db.query(Transaction).order_by(Transaction.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "amount": t.amount,
            "currency": t.currency,
            "status": t.status,
            "vendor_name": t.vendor_name,
            "description": t.description,
            "created_at": t.created_at,
            "settled_at": t.settled_at
        }
        for t in txns
    ]