#!/bin/bash
# Download TinyLlama 1.1B Q4_K_M GGUF model (~637MB)
# Run this once from the Pi terminal (requires internet).

MODEL_DIR="$HOME/disasterpi/backend/data/models"
MODEL_FILE="tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
MODEL_URL="https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/${MODEL_FILE}"

mkdir -p "$MODEL_DIR"

if [ -f "$MODEL_DIR/$MODEL_FILE" ]; then
    echo "Model already downloaded: $MODEL_DIR/$MODEL_FILE"
    exit 0
fi

echo "Downloading $MODEL_FILE (~637MB)..."
curl -L -o "$MODEL_DIR/$MODEL_FILE" "$MODEL_URL"

if [ $? -eq 0 ]; then
    echo "Download complete!"
    ls -lh "$MODEL_DIR/$MODEL_FILE"
else
    echo "Download failed. Please check your internet connection and try again."
    exit 1
fi
