"""Webhook routes for external integrations."""

import hashlib
import hmac
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from src.api.error_handling import create_error_response
from src.config import get_settings
from src.utils import get_logger

router = APIRouter()
logger = get_logger(__name__)
settings = get_settings()


class WebhookPayload(BaseModel):
    """Webhook payload model."""

    event: str
    data: dict[str, Any]


class WebhookResponse(BaseModel):
    """Webhook response model."""

    received: bool
    event: str


def _verify_webhook_signature(payload_body: bytes, signature: str | None) -> bool:
    """Verify HMAC-SHA256 webhook signature.

    Returns True if no webhook_secret is configured (allows unsigned
    webhooks in development). In production, always configure WEBHOOK_SECRET.
    """
    if not settings.webhook_secret:
        return True  # No secret configured — skip verification
    if not signature:
        return False

    expected = hmac.new(
        settings.webhook_secret.encode(),
        payload_body,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(f"sha256={expected}", signature)


@router.post("/webhooks", response_model=WebhookResponse)
async def handle_webhook(
    request: Request,
    payload: WebhookPayload,
) -> WebhookResponse:
    """Handle incoming webhooks."""
    # Verify signature
    raw_body = await request.body()
    signature = request.headers.get("X-Webhook-Signature")

    if not _verify_webhook_signature(raw_body, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        logger.info("Received webhook", event=payload.event)

        # Process different webhook events
        match payload.event:
            case "task.completed":
                await _handle_task_completed(payload.data)
            case "task.failed":
                await _handle_task_failed(payload.data)
            case "agent.status":
                await _handle_agent_status(payload.data)
            case _:
                logger.warning("Unknown webhook event", event=payload.event)

        return WebhookResponse(received=True, event=payload.event)

    except Exception as e:
        logger.error("Webhook processing error", error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Webhook processing failed",
            error_code="WEBHOOK_ERROR",
        )


async def _handle_task_completed(data: dict[str, Any]) -> None:
    """Handle task completed event."""
    logger.info("Task completed", task_id=data.get("task_id"))


async def _handle_task_failed(data: dict[str, Any]) -> None:
    """Handle task failed event."""
    logger.warning("Task failed", task_id=data.get("task_id"), error=data.get("error"))


async def _handle_agent_status(data: dict[str, Any]) -> None:
    """Handle agent status update."""
    logger.info("Agent status update", agent_id=data.get("agent_id"), status=data.get("status"))
