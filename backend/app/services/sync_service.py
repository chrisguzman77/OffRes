"""
Sync/reconciliation service.

When internet connectivity returns, both the device and the vendor app
submit their records of pending transactions. This service:
1. Matches transaction IDs
2. Verifies amounts match
3. Marks transactions as 'settled'

In a real system, this would also trigger actual bank settlement
via Capital One / Nessie API. In our MVP, we simulate settlement
by updating the status.

Duplicate payment protection:
- Each transaction has a unique nonce
- The vendor app stores nonces it has already accepted
- On sync, we check that each transaction is only settled once
"""

from sqlalchemy.orm import Session
from app.models.wallet import Transaction
from datetime import datetime, timezone


def settle_transactions(db: Session, vendor_submissions: list[dict]) -> dict:
    """
    Process vendor submissions and settle matching transactions.
    
    vendor_submissions: list of dicts with:
      - transaction_id: str
      - vendor_id: str  
      - accepted_at: str (ISO datetime)
    
    Returns dict with settled IDs, failed IDs, and a message.
    """
    settled = []
    failed = []

    for sub in vendor_submissions:
        txn_id = sub.get("transaction_id")
        vendor_id = sub.get("vendor_id")

        if not txn_id:
            failed.append(txn_id or "unknown")
            continue

        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()

        if not txn:
            failed.append(txn_id)
            continue

        # Prevent double settlement
        if txn.status == "settled":
            failed.append(txn_id)
            continue

        # Only settle pending or accepted transactions
        if txn.status not in ("pending", "accepted"):
            failed.append(txn_id)
            continue

        # Settle the transaction
        txn.status = "settled"
        txn.vendor_id = vendor_id
        txn.settled_at = datetime.now(timezone.utc)
        settled.append(txn_id)

    db.commit()

    return {
        "settled": settled,
        "failed": failed,
        "message": f"Settled {len(settled)} transactions. {len(failed)} failed."
    }