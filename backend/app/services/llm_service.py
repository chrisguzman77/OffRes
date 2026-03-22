"""
LLM service that wraps llama.cpp CLI.

Runs the model as a subprocess. This is the simplest approach for the Pi
and avoids Python binding complexities. The model runs fully offline.
"""

import os
import re
import subprocess
import tempfile
from app.config import LLAMA_CPP_PATH, MODEL_PATH, MODEL_CONTEXT_SIZE, MODEL_THREADS, MODEL_MAX_TOKENS
from app.utils.knowledge_base import kb


def _prompt_char_budget(gen_tokens: int) -> int:
    """
    Max UTF-8 length for the full ChatML prompt.

    TinyLlama fits ~2048 tokens total; RAG + role tokens are denser than plain English,
    so using ~4 chars/token was far too generous and caused silent truncation mid-prompt
    (answers that repeat the system block and stop at “Reference excerpts:”).
    """
    reserve = 96  # special tokens + chat template overhead
    tokens_left = max(200, MODEL_CONTEXT_SIZE - reserve - gen_tokens)
    # Conservative ~2.2 chars per token for mixed prose + markup; hard cap as safety rail
    est = int(tokens_left * 2.2)
    return min(1800, max(500, est))


def _trim_chunks_for_prompt(
    question: str, chunks: list[dict], max_prompt_chars: int
) -> list[dict]:
    """Drop / shorten RAG chunks until build_prompt fits the context budget."""
    if not chunks:
        return []
    trimmed = list(chunks)
    while len(trimmed) > 1 and len(build_prompt(question, trimmed)) > max_prompt_chars:
        trimmed.pop()
    if len(build_prompt(question, trimmed)) <= max_prompt_chars:
        return trimmed
    last = dict(trimmed[-1])
    orig = last["text"]
    text = orig
    step = max(50, len(text) // 20)
    while len(text) > 0 and len(build_prompt(question, trimmed[:-1] + [{**last, "text": text}])) > max_prompt_chars:
        if len(text) <= 80:
            text = text[: max(0, len(text) - 20)]
        else:
            text = text[:-step].rstrip()
    last["text"] = text + ("…" if len(text) < len(orig) else "")
    return trimmed[:-1] + [last]


def build_prompt(question: str, context_chunks: list[dict]) -> str:
    """
    Build a prompt with retrieved context for the LLM.
    Uses a simple chat template compatible with TinyLlama/ChatML.
    """
    system = (
        "DisasterPi: disaster preparedness and safety. Use excerpts below when relevant; "
        "otherwise short practical steps and when to follow official guidance."
    )

    if context_chunks:
        context_text = "\n\n".join(
            [f"[{c['source']}]\n{c['text']}" for c in context_chunks]
        )
        user_block = f"Excerpts:\n{context_text}\n\nQ: {question.strip()}"
    else:
        user_block = question.strip()

    return f"""<|system|>
{system}
</s>
<|user|>
{user_block}
</s>
<|assistant|>
"""


def strip_ansi(text: str) -> str:
    """Remove ANSI escape codes (color, cursor, reset sequences)."""
    return re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', text)


def parse_llm_output(raw: str) -> str:
    """
    Extract the assistant's answer from llama.cpp stdout.

    With --no-display-prompt, stdout is mostly new tokens (preferred).

    If the prompt was echoed (older flags), take text after the *first*
    <|assistant|> — using the *last* marker breaks when conversation mode
    prints multiple role headers or the model emits that token again.
    """
    text = strip_ansi(raw)

    marker = "<|assistant|>"
    if marker in text:
        answer = text.split(marker, 1)[1]
    else:
        lines = text.splitlines()
        answer_start = -1
        for i, line in enumerate(lines):
            if line.startswith("> "):
                answer_start = i
        if answer_start != -1:
            answer = "\n".join(lines[answer_start + 1:])
        else:
            answer = text

    # Drop repeated chat markers the model may emit at the very start of the reply
    for _ in range(4):
        stripped = re.sub(
            r"^\s*(<\|assistant\|>|</s>|<\|user\|>|<\|system\|>)\s*",
            "",
            answer,
            count=1,
            flags=re.IGNORECASE,
        )
        if stripped == answer:
            break
        answer = stripped

    answer = re.sub(r'\[.*?t/s.*?\]', '', answer, flags=re.DOTALL)
    answer = re.sub(r'Exiting\.\.\.', '', answer)
    answer = re.sub(r'\n{3,}', '\n\n', answer)

    return answer.strip()


def _answer_looks_like_prompt_echo(answer: str) -> bool:
    """Heuristic for broken runs where the model repeats the chat prefix instead of answering."""
    a = (answer or "").strip()
    if not a:
        return False
    if a.startswith("You are DisasterPi"):
        return True
    if "</s>" in a and "<|user|>" in a:
        return True
    if "Reference excerpts:" in a and len(a) < 600:
        return True
    return False


def _run_llama_subprocess(prompt: str, max_tokens: int) -> subprocess.CompletedProcess:
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            newline="\n",
            delete=False,
            suffix=".txt",
        ) as tmp:
            tmp.write(prompt)
            tmp_path = tmp.name

        return subprocess.run(
            [
                LLAMA_CPP_PATH,
                "-m", MODEL_PATH,
                "-f", tmp_path,
                "-n", str(max_tokens),
                "-c", str(MODEL_CONTEXT_SIZE),
                "-t", str(MODEL_THREADS),
                "--temp", "0.7",
                "--top-p", "0.9",
                "--repeat-penalty", "1.1",
                "--single-turn",
            ],
            capture_output=True,
            text=True,
            stdin=subprocess.DEVNULL,
            timeout=300,
        )
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


def ask_llm(question: str, max_tokens: int = None) -> dict:
    """
    Send a question to the local LLM via llama.cpp CLI.

    1. Retrieve relevant context from the knowledge base
    2. Build a prompt with the context
    3. Call llama.cpp as a subprocess
    4. Parse and return the response
    """
    if max_tokens is None:
        max_tokens = MODEL_MAX_TOKENS
    max_tokens = min(max_tokens, MODEL_MAX_TOKENS, MODEL_CONTEXT_SIZE // 2)

    # Step 1: Retrieve context (trim so prompt + generation fit TinyLlama 2048 ctx)
    context_chunks = kb.retrieve(question, top_k=2)
    budget = _prompt_char_budget(max_tokens)
    context_chunks = _trim_chunks_for_prompt(question, context_chunks, budget)
    context_summary = ", ".join([c["source"] for c in context_chunks]) if context_chunks else "none"

    # Step 2–3: Build prompt and call llama.cpp (-f file avoids Windows argv limits)
    prompt = build_prompt(question, context_chunks)
    answer = ""
    try:
        result = _run_llama_subprocess(prompt, max_tokens)
        raw_out = result.stdout or ""
        answer = parse_llm_output(raw_out)

        if _answer_looks_like_prompt_echo(answer):
            context_chunks = []
            context_summary = "none (retried without RAG)"
            prompt = build_prompt(question, [])
            result = _run_llama_subprocess(prompt, max_tokens)
            raw_out = result.stdout or ""
            answer = parse_llm_output(raw_out)

        if result.returncode != 0 and not answer.strip():
            err = (result.stderr or "").strip()[:500]
            answer = f"LLM process failed (exit {result.returncode}). {err}"

        if not answer.strip():
            err = (result.stderr or "").strip()[:400]
            hint = ""
            if not raw_out.strip():
                hint = " (stdout was empty — check llama-cli -f support or try a shorter -p test.)"
            answer = f"Model returned empty output.{hint} {err or '(no stderr)'}"

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
        "model": MODEL_PATH.split("\\")[-1].split("/")[-1]  # works on Windows and Linux
    }