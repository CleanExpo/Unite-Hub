"""Tests for the orchestrator agent."""

import pytest

from src.agents.orchestrator import OrchestratorAgent, TaskStatus


@pytest.fixture
def orchestrator() -> OrchestratorAgent:
    """Create an orchestrator instance."""
    return OrchestratorAgent()


class TestOrchestratorAgent:
    """Tests for OrchestratorAgent."""

    @pytest.mark.asyncio
    async def test_run_basic_task(self, orchestrator: OrchestratorAgent) -> None:
        """Test running a basic task."""
        result = await orchestrator.run("Test task description")

        assert "task_id" in result
        assert "completed" in result
        assert "failed" in result
        assert "tasks" in result

    @pytest.mark.asyncio
    async def test_categorize_frontend_task(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Test that frontend tasks are categorized correctly."""
        category = orchestrator._categorize_task("Build a React component")
        assert category == "frontend"

    @pytest.mark.asyncio
    async def test_categorize_backend_task(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Test that backend tasks are categorized correctly."""
        category = orchestrator._categorize_task("Create an API endpoint")
        assert category == "backend"

    @pytest.mark.asyncio
    async def test_categorize_database_task(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Test that database tasks are categorized correctly."""
        category = orchestrator._categorize_task("Write a SQL migration")
        assert category == "database"

    @pytest.mark.asyncio
    async def test_categorize_devops_task(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Test that devops tasks are categorized correctly."""
        category = orchestrator._categorize_task("Deploy the Docker container")
        assert category == "devops"

    @pytest.mark.asyncio
    async def test_categorize_general_task(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Test that generic tasks are categorized as general."""
        category = orchestrator._categorize_task("Do something random")
        assert category == "general"

    @pytest.mark.asyncio
    async def test_task_with_context(self, orchestrator: OrchestratorAgent) -> None:
        """Test running a task with context."""
        result = await orchestrator.run(
            "Process this task",
            context={"user_id": "test-user", "extra": "data"},
        )

        assert result["task_id"] is not None
