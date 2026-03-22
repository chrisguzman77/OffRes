"""
Lightweight knowledge base for disaster-related RAG.

Loads markdown files from the knowledge_base directory,
splits them into chunks, and uses BM25 for retrieval.
This runs entirely offline — no embeddings API needed.
"""

import os
import re
from pathlib import Path
from rank_bm25 import BM25Okapi
from app.config import KB_DIR


class KnowledgeBase:
    """
    Simple BM25-based retrieval over markdown documents.
    Each document is split into chunks of ~200 words.
    """

    def __init__(self):
        self.chunks: list[str] = []
        self.chunk_sources: list[str] = []  # Which file each chunk came from
        self.bm25 = None
        self._load()

    def _load(self):
        """Load all .md files from the knowledge base directory."""
        kb_path = Path(KB_DIR)
        if not kb_path.exists():
            print(f"WARNING: Knowledge base directory not found: {KB_DIR}")
            return

        for md_file in sorted(kb_path.glob("*.md")):
            text = md_file.read_text(encoding="utf-8")
            file_chunks = self._split_into_chunks(text, chunk_size=200)
            for chunk in file_chunks:
                self.chunks.append(chunk)
                self.chunk_sources.append(md_file.stem)

        if self.chunks:
            # Tokenize for BM25 (simple whitespace + lowercase)
            tokenized = [self._tokenize(c) for c in self.chunks]
            self.bm25 = BM25Okapi(tokenized)
            print(f"Knowledge base loaded: {len(self.chunks)} chunks from {len(set(self.chunk_sources))} files")
        else:
            print("WARNING: Knowledge base is empty")

    def _split_into_chunks(self, text: str, chunk_size: int = 200) -> list[str]:
        """Split text into chunks of approximately chunk_size words."""
        # Split on double newlines first (paragraph boundaries)
        paragraphs = re.split(r'\n\s*\n', text)
        chunks = []
        current_chunk = []
        current_words = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            word_count = len(para.split())

            if current_words + word_count > chunk_size and current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = [para]
                current_words = word_count
            else:
                current_chunk.append(para)
                current_words += word_count

        if current_chunk:
            chunks.append('\n\n'.join(current_chunk))

        return chunks

    def _tokenize(self, text: str) -> list[str]:
        """Simple tokenization: lowercase, split on non-alphanumeric."""
        return re.findall(r'[a-z0-9]+', text.lower())

    def retrieve(self, query: str, top_k: int = 3) -> list[dict]:
        """
        Retrieve the top_k most relevant chunks for a query.
        Returns list of {text, source, score}.
        """
        if not self.bm25 or not self.chunks:
            return []

        tokenized_query = self._tokenize(query)
        scores = self.bm25.get_scores(tokenized_query)

        # Get top_k indices
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

        results = []
        for idx in top_indices:
            if scores[idx] > 0:  # Only include chunks with some relevance
                results.append({
                    "text": self.chunks[idx],
                    "source": self.chunk_sources[idx],
                    "score": float(scores[idx])
                })

        return results


# Singleton instance — loaded once when the module is imported
kb = KnowledgeBase()