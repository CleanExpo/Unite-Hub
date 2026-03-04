"""Context Manager - Manages context window efficiency across multi-agent workflows.

Handles:
- Context partitioning (each agent gets only relevant context)
- Progressive summarization (compress old messages)
- Deferred loading (load skills/tools on-demand)
- Token usage tracking
- Smart caching
"""

from typing import Any

from pydantic import BaseModel, Field

from src.utils import get_logger

logger = get_logger(__name__)


class Context(BaseModel):
    """Context data for an agent."""

    agent_type: str
    task_description: str
    relevant_files: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    memory_domain: str | None = None
    history_summary: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class TokenStats(BaseModel):
    """Token usage statistics."""

    total_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    cached_tokens: int = 0
    tokens_saved: int = 0
    reduction_percentage: float = 0.0


class ContextManager:
    """Manages context window efficiency across multi-agent workflows."""

    def __init__(self) -> None:
        """Initialize context manager."""
        self._context_cache: dict[str, Any] = {}
        self._token_tracking: dict[str, TokenStats] = {}

    async def partition_context(
        self,
        task: dict[str, Any],
        available_context: dict[str, Any]
    ) -> dict[str, Context]:
        """Partition context for multiple agents.

        Each agent receives only the context relevant to its domain.

        Args:
            task: Task to partition context for
            available_context: All available context

        Returns:
            Dict mapping agent_type to its partitioned context
        """
        partitioned: dict[str, Context] = {}

        # Determine which agents are needed
        agents_needed = self._determine_required_agents(task)

        for agent_type in agents_needed:
            # Extract only relevant context for this agent
            relevant_context = await self._extract_relevant_context(
                agent_type=agent_type,
                task=task,
                full_context=available_context
            )

            partitioned[agent_type] = Context(
                agent_type=agent_type,
                task_description=task.get("description", ""),
                relevant_files=relevant_context.get("files", []),
                skills=relevant_context.get("skills", []),
                memory_domain=relevant_context.get("memory_domain"),
                metadata=relevant_context.get("metadata", {})
            )

        logger.info(
            "Context partitioned",
            task_id=task.get("id"),
            agents=list(partitioned.keys())
        )

        return partitioned

    def _determine_required_agents(
        self,
        task: dict[str, Any]
    ) -> list[str]:
        """Determine which agent types are needed for a task.

        Args:
            task: Task definition

        Returns:
            List of required agent types
        """
        description = task.get("description", "").lower()
        agents_needed = []

        # Simple keyword-based determination
        if any(kw in description for kw in ["frontend", "ui", "component", "react", "page"]):
            agents_needed.append("frontend")

        if any(kw in description for kw in ["backend", "api", "endpoint", "service"]):
            agents_needed.append("backend")

        if any(kw in description for kw in ["database", "migration", "schema", "sql"]):
            agents_needed.append("database")

        # Always include test agent for new features
        if "feature" in description or "implement" in description:
            agents_needed.append("test")

        # Always include review agent
        agents_needed.append("review")

        return agents_needed or ["general"]

    async def _extract_relevant_context(
        self,
        agent_type: str,
        task: dict[str, Any],
        full_context: dict[str, Any]
    ) -> dict[str, Any]:
        """Extract only relevant context for an agent type.

        Args:
            agent_type: Type of agent
            task: Task definition
            full_context: All available context

        Returns:
            Relevant context subset
        """
        relevance_filters = {
            "frontend": {
                "file_patterns": ["*.tsx", "*.ts", "*.css", "*.jsx", "*.js"],
                "paths": ["apps/web/", "components/", "app/"],
                "skills": ["NEXTJS.md", "COMPONENTS.md", "TAILWIND.md"],
                "memory_domain": "frontend"
            },
            "backend": {
                "file_patterns": ["*.py"],
                "paths": ["apps/backend/src/", "agents/", "api/"],
                "skills": ["FASTAPI.md", "LANGGRAPH.md", "AGENTS.md"],
                "memory_domain": "backend"
            },
            "database": {
                "file_patterns": ["*.sql"],
                "paths": ["supabase/migrations/", "supabase/functions/"],
                "skills": ["SUPABASE.md", "MIGRATIONS.md"],
                "memory_domain": "database"
            },
            "test": {
                "file_patterns": ["test_*.py", "*.test.ts", "*.spec.ts"],
                "paths": ["tests/", "__tests__/"],
                "skills": ["TESTING.md"],
                "memory_domain": "testing"
            },
            "review": {
                "file_patterns": ["*"],  # Review needs broader view
                "paths": [],
                "skills": ["CODE_REVIEW.md"],
                "memory_domain": "knowledge"
            }
        }

        filters = relevance_filters.get(agent_type, {})

        # Filter files
        relevant_files = []
        all_files = full_context.get("files", [])

        if agent_type == "review":
            # Review needs all changed files
            relevant_files = all_files
        else:
            # Filter by patterns and paths
            for file_path in all_files:
                # Check patterns
                matches_pattern = any(
                    file_path.endswith(pattern.replace("*", ""))
                    for pattern in filters.get("file_patterns", [])
                )

                # Check paths
                matches_path = any(
                    path in file_path
                    for path in filters.get("paths", [])
                )

                if matches_pattern or matches_path:
                    relevant_files.append(file_path)

        return {
            "files": relevant_files,
            "skills": filters.get("skills", []),
            "memory_domain": filters.get("memory_domain"),
            "metadata": {
                "filtered_from": len(all_files),
                "filtered_to": len(relevant_files),
                "reduction_percentage": (
                    100 * (1 - len(relevant_files) / len(all_files))
                    if all_files
                    else 0
                )
            }
        }

    async def compress_history(
        self,
        messages: list[dict[str, Any]],
        max_messages: int = 10
    ) -> dict[str, Any]:
        """Compress message history via progressive summarization.

        Args:
            messages: Full message history
            max_messages: Max messages to keep uncompressed

        Returns:
            Dict with summary and recent messages
        """
        if len(messages) <= max_messages:
            # No compression needed
            return {
                "summary": None,
                "recent_messages": messages,
                "compressed": False
            }

        # Split into old and recent
        old_messages = messages[:-max_messages]
        recent_messages = messages[-max_messages:]

        # Summarize old messages
        summary = await self._summarize_messages(old_messages)

        logger.info(
            "Message history compressed",
            total_messages=len(messages),
            summarized=len(old_messages),
            kept_recent=len(recent_messages)
        )

        return {
            "summary": summary,
            "recent_messages": recent_messages,
            "compressed": True,
            "compression_ratio": len(old_messages) / len(messages)
        }

    async def _summarize_messages(
        self,
        messages: list[dict[str, Any]]
    ) -> str:
        """Summarize a list of messages.

        Args:
            messages: Messages to summarize

        Returns:
            Summary text
        """
        # Extract key points from messages
        key_points = []

        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")

            if role == "assistant" and "completed" in content.lower():
                key_points.append(f"Completed: {content[:100]}")
            elif role == "user":
                key_points.append(f"Request: {content[:100]}")

        summary = f"Previous session summary ({len(messages)} messages):\n"
        summary += "\n".join(f"- {point}" for point in key_points[:10])

        return summary

    async def load_relevant_only(
        self,
        agent_type: str,
        task: dict[str, Any]
    ) -> dict[str, Any]:
        """Load only relevant skills, tools, and data for an agent.

        Implements deferred loading to minimize upfront context.

        Args:
            agent_type: Type of agent
            task: Task definition

        Returns:
            Relevant context ready to load
        """
        context = {
            "agent_type": agent_type,
            "task_id": task.get("id"),
            "skills_metadata": [],  # Just metadata, full skills loaded on-demand
            "tools_metadata": [],  # Just metadata, full tools loaded on-demand
            "deferred_loading_enabled": True
        }

        # Determine relevant skills (metadata only)
        relevant_skills = self._get_relevant_skills(agent_type)
        context["skills_metadata"] = [
            {"name": skill, "description": f"Skill for {agent_type}"}
            for skill in relevant_skills
        ]

        # Determine relevant tools (metadata only)
        relevant_tools = self._get_relevant_tools(agent_type)
        context["tools_metadata"] = [
            {"name": tool, "description": f"Tool for {agent_type}"}
            for tool in relevant_tools
        ]

        logger.debug(
            "Relevant context prepared",
            agent_type=agent_type,
            skills=len(relevant_skills),
            tools=len(relevant_tools)
        )

        return context

    def _get_relevant_skills(self, agent_type: str) -> list[str]:
        """Get relevant skills for an agent type."""
        skill_mapping = {
            "frontend": ["NEXTJS.md", "COMPONENTS.md", "TAILWIND.md"],
            "backend": ["FASTAPI.md", "LANGGRAPH.md", "AGENTS.md"],
            "database": ["SUPABASE.md", "MIGRATIONS.md"],
            "test": ["TESTING.md"],
            "review": ["CODE_REVIEW.md"],
        }

        # Always include core skills
        core_skills = ["VERIFICATION.md", "SELF_CORRECTION.md"]

        return core_skills + skill_mapping.get(agent_type, [])

    def _get_relevant_tools(self, agent_type: str) -> list[str]:
        """Get relevant tools for an agent type."""
        tool_mapping = {
            "frontend": ["build_frontend", "test_frontend", "lint_frontend"],
            "backend": ["test_backend", "mypy", "ruff"],
            "database": ["run_migration", "query_database", "test_migration"],
            "test": ["run_tests", "coverage_report"],
            "review": ["git_diff", "analyze_code"],
        }

        return tool_mapping.get(agent_type, [])

    async def track_token_usage(
        self,
        agent_id: str,
        tokens_used: int,
        context_type: str = "standard"
    ) -> TokenStats:
        """Track token usage for monitoring.

        Args:
            agent_id: Agent identifier
            tokens_used: Number of tokens used
            context_type: Type of context (standard, partitioned, compressed)

        Returns:
            Updated token statistics
        """
        if agent_id not in self._token_tracking:
            self._token_tracking[agent_id] = TokenStats()

        stats = self._token_tracking[agent_id]
        stats.total_tokens += tokens_used

        logger.debug(
            "Token usage tracked",
            agent_id=agent_id,
            tokens=tokens_used,
            context_type=context_type,
            total=stats.total_tokens
        )

        return stats

    async def estimate_tokens_saved(
        self,
        original_context_size: int,
        optimized_context_size: int
    ) -> dict[str, Any]:
        """Estimate tokens saved via context optimization.

        Args:
            original_context_size: Size before optimization
            optimized_context_size: Size after optimization

        Returns:
            Savings statistics
        """
        tokens_saved = original_context_size - optimized_context_size
        reduction_percentage = (
            100 * tokens_saved / original_context_size
            if original_context_size > 0
            else 0
        )

        return {
            "original_size": original_context_size,
            "optimized_size": optimized_context_size,
            "tokens_saved": tokens_saved,
            "reduction_percentage": reduction_percentage
        }

    def get_cache_stats(self) -> dict[str, Any]:
        """Get context cache statistics.

        Returns:
            Cache statistics
        """
        return {
            "cached_contexts": len(self._context_cache),
            "tracked_agents": len(self._token_tracking),
            "total_tokens_tracked": sum(
                stats.total_tokens
                for stats in self._token_tracking.values()
            )
        }

    async def clear_cache(self) -> None:
        """Clear context cache."""
        cache_size = len(self._context_cache)
        self._context_cache.clear()

        logger.info(
            "Context cache cleared",
            entries_removed=cache_size
        )
