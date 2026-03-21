"""
LLM service that wraps llama.cpp CLI.

Runs the model as a subprocess. This is the simplest approach for the Pi
and avoids Python binding complexities. The model runs fully offline.
"""

import subprocess
import json
from app.config import LLAMA_CPP_PATH, MODEL_PATH, MODEL_CONTEXT_SIZE, MODEL_THREADS, MODEL_MAX_TOKENS
from app.utils.knowledge_base import kb


def build_prompt(question: str, context_chunks: list[dict]) -> str:
    """
    Build a prompt with retrieved context for the LLM.
    Uses a simple chat template compatible with TinyLlama/ChatML.
    """
    context_text = ""
    if context_chunks:
        context_text = "\n\n".join([
            f"[Source: {c['source']}]\n{c['text']}" for c in context_chunks
        ])

    prompt = f"""<|system|>
You are DisasterPi, an emergency assistance AI running on a local device.
You help people during disasters with practical, life-saving information.
Be concise, clear, and actionable. If you are unsure, say so.
Use the provided reference information when available.
</s>
<|user|>
Reference Information:
{context_text if context_text else "No specific reference found. Answer from general knowledge."}

Question: {question}
</s>
<|assistant|>
"""
    return prompt


def ask_llm(question: str, max_tokens: int = 0) -> dict:
    """
    Send a question to the local LLM via llama.cpp CLI.
    
    1. Retrieve relevant context from the knowledge base
    2. Build a prompt with the context
    3. Call llama.cpp as a subprocess
    4. Parse and return the response
    """
    if max_tokens is None:
        max_tokens = MODEL_MAX_TOKENS

    # Step 1: Retrieve context
    context_chunks = kb.retrieve(question, top_k=3)
    context_summary = ", ".join([c["source"] for c in context_chunks]) if context_chunks else "none"

    # Step 2: Build prompt
    prompt = build_prompt(question, context_chunks)

    # Step 3: Call llama.cpp
    try:
        result = subprocess.run(
            [
                LLAMA_CPP_PATH,
                "-m", MODEL_PATH,
                "-p", prompt,
                "-n", str(max_tokens),
                "-c", str(MODEL_CONTEXT_SIZE),
                "-t", str(MODEL_THREADS),
                "--temp", "0.7",
                "--top-p", "0.9",
                "--repeat-penalty", "1.1",
                "--no-display-prompt",  # Don't echo the prompt back
            ],
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout — model can be slow on Pi
        )

        answer = result.stdout.strip()

        if not answer and result.stderr:
            answer = f"Model error: {result.stderr[:200]}"

    except subprocess.TimeoutExpired:
        answer = "The model took too long to respond. Please try a shorter question."
    except FileNotFoundError:
        answer = (
            "LLM not found. Make sure llama.cpp is built and the model is downloaded. "
            "See the setup instructions."
        )

    return {
        "question": question,
        "answer": answer,
        "context_used": context_summary,
        "model": MODEL_PATH.split("/")[-1]
    }