"""Usage tracking for API calls and costs."""

from decimal import Decimal
from typing import Any

from src.state.supabase import SupabaseStateStore
from src.utils import get_logger

logger = get_logger(__name__)


# Model pricing (updated as of December 2024)
MODEL_PRICING = {
    # Anthropic models
    "claude-opus-4-5-20251101": {
        "input": Decimal("0.000015"),  # $15 per million tokens
        "output": Decimal("0.000075"),  # $75 per million tokens
    },
    "claude-sonnet-4-5-20250929": {
        "input": Decimal("0.000003"),  # $3 per million tokens
        "output": Decimal("0.000015"),  # $15 per million tokens
    },
    "claude-3-5-sonnet-20241022": {
        "input": Decimal("0.000003"),  # $3 per million tokens
        "output": Decimal("0.000015"),  # $15 per million tokens
    },
    "claude-3-5-haiku-20241022": {
        "input": Decimal("0.0000008"),  # $0.80 per million tokens
        "output": Decimal("0.000004"),  # $4 per million tokens
    },
    # OpenAI models
    "text-embedding-3-small": {
        "input": Decimal("0.00000002"),  # $0.02 per million tokens
        "output": Decimal("0"),  # No output for embeddings
    },
    "text-embedding-3-large": {
        "input": Decimal("0.00000013"),  # $0.13 per million tokens
        "output": Decimal("0"),
    },
}


class UsageTracker:
    """Track API usage and costs."""

    def __init__(self) -> None:
        self.supabase = SupabaseStateStore()

    async def track_api_call(
        self,
        agent_run_id: str,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Track an API call for cost analysis."""
        try:
            # Get pricing for model
            pricing = MODEL_PRICING.get(
                model,
                {
                    "input": Decimal("0.000001"),  # Default fallback
                    "output": Decimal("0.000005"),
                },
            )

            data = {
                "agent_run_id": agent_run_id,
                "provider": provider,
                "model": model,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cost_per_input_token": float(pricing["input"]),
                "cost_per_output_token": float(pricing["output"]),
                "metadata": metadata or {},
            }

            self.supabase.client.table("api_usage").insert(data).execute()

            logger.debug(
                "API usage tracked",
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
            )

        except Exception as e:
            logger.error("Failed to track API usage", error=str(e))
            # Don't raise - telemetry failures shouldn't break execution


# Global instance
_tracker: UsageTracker | None = None


def get_tracker() -> UsageTracker:
    """Get global usage tracker instance."""
    global _tracker
    if _tracker is None:
        _tracker = UsageTracker()
    return _tracker


async def track_api_call(
    agent_run_id: str,
    provider: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Convenience function to track API call."""
    tracker = get_tracker()
    await tracker.track_api_call(
        agent_run_id=agent_run_id,
        provider=provider,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        metadata=metadata,
    )
