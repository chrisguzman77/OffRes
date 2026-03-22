"""
Application configuration.
All paths are relative to the backend/ directory.
"""

import os
from pathlib import Path

# Base directory is the backend/ folder
BASE_DIR = Path(__file__).resolve().parent.parent

# Database
DATABASE_URL = f"sqlite:///{BASE_DIR / 'data' / 'disasterpi.db'}"

# LLM
LLAMA_CPP_PATH = os.getenv("LLAMA_CPP_PATH", str(Path.home() / "llama.cpp" / "llama-cli"))
MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "data" / "models" / "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"))
# TinyLlama 1.1B Chat is trained for 2048 tokens; larger -c values still truncate internally and
# can cut long RAG prompts mid-string (broken completions that repeat the system block).
MODEL_CONTEXT_SIZE = int(os.getenv("MODEL_CONTEXT_SIZE", "2048"))
MODEL_THREADS = 4  # Pi 5 has 4 cores
MODEL_MAX_TOKENS = int(os.getenv("MODEL_MAX_TOKENS", "512"))

# Knowledge base
KB_DIR = str(BASE_DIR / "data" / "knowledge_base")

# GeoJSON
GEOJSON_PATH = str(BASE_DIR / "data" / "geojson" / "disaster_points.geojson")

# QR / Wallet
QR_SECRET_KEY = os.getenv("QR_SECRET_KEY", "disasterpi-mvp-secret-key-change-in-production")
WALLET_DEFAULT_CURRENCY = "USD"

# Server
HOST = "0.0.0.0"
PORT = 8000
