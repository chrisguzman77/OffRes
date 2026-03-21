"""
DisasterPi Backend — FastAPI Application

This is the main entry point. It:
1. Creates the FastAPI app
2. Registers all routers
3. Serves the built React frontend as static files
4. Initializes the database on startup
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.database import init_db
from app.routers import health, llm, wallet, vendor, sync, maps

# Create the app
app = FastAPI(
    title="DisasterPi API",
    description="Offline disaster-response device API",
    version="1.0.0"
)

# CORS — allow the dev servers to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(llm.router)
app.include_router(wallet.router)
app.include_router(vendor.router)
app.include_router(sync.router)
app.include_router(maps.router)

# Startup event — create database tables
@app.on_event("startup")
def on_startup():
    init_db()
    print("DisasterPi backend started. Database initialized.")

# Serve built frontend (after running `npm run build` in frontend-user/)
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend-user" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")