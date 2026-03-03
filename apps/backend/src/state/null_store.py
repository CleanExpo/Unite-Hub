"""Null state store — drop-in replacement for SupabaseStateStore.

Returns empty results for all operations, allowing the app to start
and run without any external state backend. The null client chain
absorbs arbitrary chained calls like:

    store.client.table("x").select("*").eq("id", "1").execute()

This preserves the API contract for a future PostgreSQL migration.
"""

from datetime import datetime
from typing import Any
from uuid import uuid4

from src.utils import get_logger

logger = get_logger(__name__)


class _NullExecuteResult:
    """Result returned by _NullQueryBuilder.execute()."""

    def __init__(self) -> None:
        self.data: list[dict[str, Any]] = []
        self.count: int = 0


class _NullQueryBuilder:
    """Absorbs any chained query builder calls and returns empty results."""

    def __getattr__(self, name: str) -> Any:
        """Absorb any method call and return self for chaining."""
        def _chain(*args: Any, **kwargs: Any) -> "_NullQueryBuilder":
            return self
        return _chain

    def execute(self) -> _NullExecuteResult:
        """Terminal call — return empty result set."""
        return _NullExecuteResult()

    def single(self) -> "_NullQueryBuilder":
        """Chain method — return self."""
        return self


class _NullTableClient:
    """Mimics the Supabase client interface with table()/rpc() entry points."""

    def table(self, name: str) -> _NullQueryBuilder:
        return _NullQueryBuilder()

    def rpc(self, fn_name: str, params: dict[str, Any] | None = None) -> _NullQueryBuilder:
        return _NullQueryBuilder()


class NullStateStore:
    """No-op state store implementing the SupabaseStateStore interface.

    All read operations return empty results.
    All write operations silently succeed.
    """

    def __init__(self) -> None:
        self._client = _NullTableClient()

    @property
    def client(self) -> _NullTableClient:
        """Return the null client (no lazy init needed)."""
        return self._client

    # ── Conversations ──────────────────────────────────────────────

    async def save_conversation(
        self,
        conversation_id: str,
        user_id: str | None,
        messages: list[dict[str, Any]],
        context: dict[str, Any] | None = None,
    ) -> None:
        logger.debug("NullStateStore: save_conversation (no-op)", id=conversation_id)

    async def load_conversation(self, conversation_id: str) -> dict[str, Any] | None:
        return None

    async def get_user_conversations(
        self, user_id: str, limit: int = 50
    ) -> list[dict[str, Any]]:
        return []

    # ── Tasks ──────────────────────────────────────────────────────

    async def save_task(
        self,
        task_id: str,
        conversation_id: str | None,
        description: str,
        status: str,
        result: Any = None,
        error: str | None = None,
    ) -> None:
        logger.debug("NullStateStore: save_task (no-op)", id=task_id)

    async def load_task(self, task_id: str) -> dict[str, Any] | None:
        return None

    async def get_conversation_tasks(
        self, conversation_id: str
    ) -> list[dict[str, Any]]:
        return []

    # ── Agent Runs ─────────────────────────────────────────────────

    async def create_agent_run(
        self,
        task_id: str,
        user_id: str | None,
        agent_name: str,
        agent_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Return a synthetic run dict — callers dereference run['id']."""
        run_id = uuid4().hex
        return {
            "id": run_id,
            "task_id": task_id,
            "user_id": user_id,
            "agent_name": agent_name,
            "agent_id": agent_id,
            "status": "pending",
            "metadata": metadata or {},
            "started_at": datetime.now().isoformat(),
            "completed_at": None,
        }

    async def update_agent_run(
        self,
        run_id: str,
        status: str | None = None,
        current_step: str | None = None,
        progress_percent: float | None = None,
        result: Any = None,
        error: str | None = None,
        verification_attempts: int | None = None,
        verification_evidence: list[dict[str, Any]] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        return {"id": run_id, "status": status or "in_progress"}

    async def get_agent_run(self, run_id: str) -> dict[str, Any] | None:
        return None

    async def get_task_agent_runs(
        self, task_id: str, limit: int = 10
    ) -> list[dict[str, Any]]:
        return []

    async def get_active_agent_runs(
        self, user_id: str
    ) -> list[dict[str, Any]]:
        return []

    # ── Domain Memory ──────────────────────────────────────────────

    async def create_memory(
        self,
        domain: str,
        category: str,
        key: str,
        value: dict[str, Any],
        user_id: str | None = None,
        embedding: list[float] | None = None,
        source: str | None = None,
        tags: list[str] | None = None,
    ) -> dict[str, Any] | None:
        return {"id": uuid4().hex, "domain": domain, "category": category, "key": key}

    async def get_memory(self, memory_id: str) -> dict[str, Any] | None:
        return None

    async def update_memory(
        self, memory_id: str, updates: dict[str, Any]
    ) -> dict[str, Any] | None:
        return None

    async def delete_memory(self, memory_id: str) -> bool:
        return False

    async def query_memories(
        self,
        domain: str | None = None,
        category: str | None = None,
        user_id: str | None = None,
        tags: list[str] | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return []

    async def find_similar_memories(
        self,
        query_embedding: list[float],
        domain: str | None = None,
        user_id: str | None = None,
        match_threshold: float = 0.7,
        match_count: int = 10,
    ) -> list[dict[str, Any]]:
        return []
