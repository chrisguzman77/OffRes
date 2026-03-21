"""LLM assistant endpoints."""

from fastapi import APIRouter
from app.schemas.llm import AskRequest, AskResponse
from app.services.llm_service import ask_llm

router = APIRouter(prefix="/llm", tags=["LLM Assistant"])

@router.post("/ask", response_model=AskResponse)
def ask_question(req: AskRequest):
    """
    Ask a disaster-related question to the local LLM.
    The model runs entirely on-device using llama.cpp.
    Relevant knowledge base chunks are retrieved and included as context.
    """
    result = ask_llm(req.question, req.max_tokens)
    return AskResponse(**result)