"""Pydantic schemas for LLM endpoints."""

from pydantic import BaseModel

class AskRequest(BaseModel):
    question: str
    max_tokens: int = 512

class AskResponse(BaseModel):
    question: str
    answer: str
    context_used: str  # Which KB chunks were retrieved
    model: str