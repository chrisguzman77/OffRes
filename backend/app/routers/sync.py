"""Reconciliation/sync endpoints for when internet returns."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.wallet import SyncRequest, SyncResponse
from app.services.sync_service import settle_transactions

router = APIRouter(prefix="/sync", tags=["Sync"])


@router.post("/settle", response_model=SyncResponse)
def settle(req: SyncRequest, db: Session = Depends(get_db)):
    """
    Reconcile pending transactions when connectivity returns.
    The vendor app submits its list of accepted transactions.
    We match them against our records and mark as settled.
    
    In production, this would also trigger bank settlement via
    Capital One / Nessie API.
    """
    result = settle_transactions(db, req.transactions)
    return SyncResponse(**result)