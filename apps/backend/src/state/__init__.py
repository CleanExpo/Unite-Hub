"""State management module."""

from .events import AgentEventPublisher
from .manager import StateManager
from .null_store import NullStateStore

# Backwards compatibility alias
SupabaseStateStore = NullStateStore


def get_state_store() -> NullStateStore:
    """Factory function for the active state store."""
    return NullStateStore()


__all__ = [
    "AgentEventPublisher",
    "NullStateStore",
    "StateManager",
    "SupabaseStateStore",
    "get_state_store",
]
