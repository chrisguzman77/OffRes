"""Map data endpoints."""

from fastapi import APIRouter
from app.schemas.maps import MapResponse
from app.services.map_service import load_map_points

router = APIRouter(prefix="/map", tags=["Map"])


@router.get("/points", response_model=MapResponse)
def get_map_points():
    """
    Return all disaster-related map points.
    Data comes from a local GeoJSON file — no internet needed.
    """
    result = load_map_points()
    return MapResponse(**result)