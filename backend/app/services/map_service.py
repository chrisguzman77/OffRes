"""
Map service that loads GeoJSON data for offline map display.
"""

import json
from pathlib import Path
from app.config import GEOJSON_PATH


def load_map_points() -> dict:
    """
    Load disaster-related points from the GeoJSON file.
    Returns a structured response with points categorized.
    """
    geojson_path = Path(GEOJSON_PATH)

    if not geojson_path.exists():
        return {
            "points": [],
            "region": "unknown",
            "last_updated": "never"
        }

    with open(geojson_path, "r") as f:
        geojson = json.load(f)

    points = []
    for feature in geojson.get("features", []):
        props = feature.get("properties", {})
        coords = feature.get("geometry", {}).get("coordinates", [0, 0])

        points.append({
            "id": props.get("id", ""),
            "name": props.get("name", "Unknown"),
            "category": props.get("category", "other"),
            "latitude": coords[1],   # GeoJSON is [lng, lat]
            "longitude": coords[0],
            "description": props.get("description", ""),
            "address": props.get("address", ""),
            "status": props.get("status", "open")
        })

    return {
        "points": points,
        "region": geojson.get("region", "Local Area"),
        "last_updated": geojson.get("last_updated", "pre-loaded")
    }

