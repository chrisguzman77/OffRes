"""Pydantic schemas for map endpoints."""

from pydantic import BaseModel
from typing import Optional

class MapPoint(BaseModel):
    id: str
    name: str
    category: str  # hospital, shelter, water, aid, safe_zone
    latitude: float
    longitude: float
    description: Optional[str] = None
    address: Optional[str] = None
    status: str = "open"  # open, closed, unknown

class MapResponse(BaseModel):
    points: list[MapPoint]
    region: str
    last_updated: str