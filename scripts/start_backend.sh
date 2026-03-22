#!/bin/bash
cd /home/pi-user/OffRes/backend
source venv/bin/activate
export PYTHONPATH="/home/pi-user/OffRes/backend"
export LLAMA_CPP_PATH="/home/pi-user/ai/llama.cpp-b8468/build/bin/llama-cli"
export MODEL_PATH="/home/pi-user/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
