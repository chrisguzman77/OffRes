"""
Vendor-facing endpoints.
These are called by the vendor app after scanning a QR code.
In the MVP, the vendor app calls these directly when both devices
are on the same local network. In a fully offline scenario, the 
vendor app stores transactions locally and syncs later.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.wallet import VendorAcceptRequest, VendorAcceptResponse
from app.models.wallet import Transaction
from app.utils.crypto import verify_payload

router = APIRouter(prefix="/vendor", tags=["Vendor"])


@router.post("/accept", response_model=VendorAcceptResponse)
def accept_payment(req: VendorAcceptRequest, db: Session = Depends(get_db)):
    """
    Vendor accepts a scanned QR payment.
    
    1. Verify the QR payload signature
    2. Find the transaction
    3. Mark as accepted
    """
    # Verify signature
    is_valid, payload_data = verify_payload(req.qr_payload)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid QR signature. Payment rejected.")

    txn_id = payload_data.get("transaction_id")
    if not txn_id:
        raise HTTPException(status_code=400, detail="No transaction ID in payload.")

    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    if txn.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Transaction already {txn.status}. Cannot accept again."
        )

    # Accept the transaction
    txn.status = "accepted"
    txn.vendor_id = req.vendor_id
    txn.vendor_name = req.vendor_name
    db.commit()
    db.refresh(txn)

    return VendorAcceptResponse(
        transaction_id=txn.id,
        amount=txn.amount,
        status=txn.status,
        message=f"Payment of ${txn.amount:.2f} accepted by {req.vendor_name}."
    )