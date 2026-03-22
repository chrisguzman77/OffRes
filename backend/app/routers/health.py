"""Health check endpoint."""

from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    """Simple health check. Returns 200 if the server is running."""
    return {"status": "ok", "device": "DisasterPi", "version": "1.0.0"}