"""Wallet management endpoints for the device user."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.wallet import (
    PreloadRequest, PreloadResponse,
    PaymentRequest, PaymentResponse,
    BalanceResponse, TransactionDetail
)
from app.services.wallet_service import (
    preload_funds, get_balance, create_payment, get_transactions
)

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.post("/preload", response_model=PreloadResponse)
def preload(req: PreloadRequest, db: Session = Depends(get_db)):
    """
    Preload funds into the device wallet.
    This simulates an online bank transfer. In production, this would
    integrate with Capital One's Nessie API.
    Must be done BEFORE going offline.
    """
    try:
        result = preload_funds(db, req.amount, req.source)
        return PreloadResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/balance", response_model=BalanceResponse)
def balance(db: Session = Depends(get_db)):
    """Get current wallet balance."""
    result = get_balance(db)
    return BalanceResponse(**result)


@router.post("/pay", response_model=PaymentResponse)
def pay(req: PaymentRequest, db: Session = Depends(get_db)):
    """
    Create an offline payment and generate a QR code.
    The QR code is shown on screen for a vendor to scan.
    Balance is deducted immediately (optimistic).
    """
    try:
        result = create_payment(db, req.amount, req.description, req.vendor_name)
        return PaymentResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions", response_model=list[TransactionDetail])
def transactions(db: Session = Depends(get_db)):
    """List all transactions, newest first."""
    return get_transactions(db)