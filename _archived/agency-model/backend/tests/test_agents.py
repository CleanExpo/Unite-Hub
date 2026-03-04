"""Tests for agent implementations."""

import pytest

from src.agents.base_agent import (
    BaseAgent,
    FrontendAgent,
    BackendAgent,
    DatabaseAgent,
    DevOpsAgent,
    GeneralAgent,
    VerificationResult,
)
from src.agents.registry import AgentRegistry


class TestBaseAgent:
    """Tests for base agent functionality."""

    def test_verification_result_model(self) -> None:
        """Test VerificationResult model."""
        result = VerificationResult(success=True)
        assert result.success is True
        assert result.error is None

        result = VerificationResult(success=False, error="Test error")
        assert result.success is False
        assert result.error == "Test error"


class TestAgentRegistry:
    """Tests for agent registry."""

    @pytest.fixture
    def registry(self) -> AgentRegistry:
        """Create a registry instance."""
        return AgentRegistry()

    def test_default_agents_registered(self, registry: AgentRegistry) -> None:
        """Test that default agents are registered."""
        agents = registry.list_agents()
        agent_names = [a["name"] for a in agents]

        assert "frontend" in agent_names
        assert "backend" in agent_names
        assert "database" in agent_names
        assert "devops" in agent_names
        assert "general" in agent_names

    def test_get_agent_by_name(self, registry: AgentRegistry) -> None:
        """Test getting an agent by name."""
        agent = registry.get_agent("frontend")
        assert agent is not None
        assert agent.name == "frontend"

    def test_get_nonexistent_agent(self, registry: AgentRegistry) -> None:
        """Test getting a nonexistent agent."""
        agent = registry.get_agent("nonexistent")
        assert agent is None

    def test_get_agent_for_category(self, registry: AgentRegistry) -> None:
        """Test getting an agent for a category."""
        agent = registry.get_agent_for_category("frontend")
        assert agent is not None
        assert agent.name == "frontend"

    def test_get_agent_for_task(self, registry: AgentRegistry) -> None:
        """Test finding the best agent for a task."""
        agent = registry.get_agent_for_task("Build a React component")
        assert agent is not None
        assert agent.name == "frontend"


class TestFrontendAgent:
    """Tests for frontend agent."""

    @pytest.fixture
    def agent(self) -> FrontendAgent:
        """Create a frontend agent."""
        return FrontendAgent()

    def test_can_handle_frontend_tasks(self, agent: FrontendAgent) -> None:
        """Test that frontend agent handles frontend tasks."""
        assert agent.can_handle("Build a React component")
        assert agent.can_handle("Create a Next.js page")
        assert agent.can_handle("Style with Tailwind CSS")

    def test_cannot_handle_backend_tasks(self, agent: FrontendAgent) -> None:
        """Test that frontend agent doesn't handle backend tasks."""
        assert not agent.can_handle("Create an API endpoint")
        assert not agent.can_handle("Write a database migration")

    @pytest.mark.asyncio
    async def test_execute_task(self, agent: FrontendAgent) -> None:
        """Test executing a frontend task."""
        result = await agent.execute("Build a button component")
        assert result["status"] == "pending_verification"


class TestBackendAgent:
    """Tests for backend agent."""

    @pytest.fixture
    def agent(self) -> BackendAgent:
        """Create a backend agent."""
        return BackendAgent()

    def test_can_handle_backend_tasks(self, agent: BackendAgent) -> None:
        """Test that backend agent handles backend tasks."""
        assert agent.can_handle("Create an API endpoint")
        assert agent.can_handle("Build a Python service")
        assert agent.can_handle("Implement a LangGraph agent")

    @pytest.mark.asyncio
    async def test_execute_task(self, agent: BackendAgent) -> None:
        """Test executing a backend task."""
        result = await agent.execute("Create an API endpoint")
        assert result["status"] == "pending_verification"
