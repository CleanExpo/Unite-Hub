"""Chat routes for AI agent interaction."""

from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from src.agents.orchestrator import OrchestratorAgent
from src.api.error_handling import create_error_response
from src.utils import get_logger

router = APIRouter()
logger = get_logger(__name__)


class ChatRequest(BaseModel):
    """Chat request model."""

    message: str
    conversation_id: str | None = None
    user_id: str | None = None


class ChatResponse(BaseModel):
    """Chat response model."""

    response: str
    conversation_id: str
    task_status: dict[str, Any] | None = None


def get_orchestrator() -> OrchestratorAgent:
    """Dependency to get orchestrator agent."""
    return OrchestratorAgent()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: Request,
    chat_request: ChatRequest,
    orchestrator: OrchestratorAgent = Depends(get_orchestrator),
) -> ChatResponse:
    """Process a chat message through the AI agent."""
    try:
        user_id = getattr(request.state, "user_id", chat_request.user_id)

        logger.info(
            "Processing chat request",
            user_id=user_id,
            conversation_id=chat_request.conversation_id,
        )

        result = await orchestrator.run(
            task_description=chat_request.message,
            context={
                "user_id": user_id,
                "conversation_id": chat_request.conversation_id,
            },
        )

        # Generate response based on orchestrator result
        response_text = _generate_response(result)

        return ChatResponse(
            response=response_text,
            conversation_id=chat_request.conversation_id or result.get("task_id", "new"),
            task_status=result.get("tasks", [{}])[0] if result.get("tasks") else None,
        )

    except Exception as e:
        logger.error("Chat processing error", error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Chat processing failed",
            error_code="CHAT_ERROR",
        )


def _generate_response(result: dict[str, Any]) -> str:
    """Generate a user-friendly response from the orchestrator result."""
    if result.get("completed", 0) > 0:
        tasks = result.get("tasks", [])
        if tasks:
            task = tasks[0]
            if task.get("status") == "completed":
                return f"Task completed successfully: {task.get('description', 'Unknown task')}"
            elif task.get("status") == "failed":
                return f"Task failed: {task.get('error_history', ['Unknown error'])[-1]}"

    return "I've processed your request. How can I help further?"
