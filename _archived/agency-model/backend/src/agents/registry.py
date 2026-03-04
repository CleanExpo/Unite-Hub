"""Agent registry for managing available agents."""

from typing import Any

from src.utils import get_logger

from .base_agent import (
    BackendAgent,
    BaseAgent,
    DatabaseAgent,
    DevOpsAgent,
    FrontendAgent,
    GeneralAgent,
)
from .marketing_agents import BusinessConsistencyAgent, CopywritingAgent

logger = get_logger(__name__)


class AgentRegistry:
    """Registry for managing and retrieving agents."""

    def __init__(self) -> None:
        self._agents: dict[str, BaseAgent] = {}
        self._category_mapping: dict[str, str] = {}
        self._initialize_default_agents()

    def _initialize_default_agents(self) -> None:
        """Initialize the default set of agents."""
        default_agents = [
            FrontendAgent(),
            BackendAgent(),
            DatabaseAgent(),
            DevOpsAgent(),
            GeneralAgent(),
            # Marketing agents
            CopywritingAgent(),
            BusinessConsistencyAgent(),
        ]

        for agent in default_agents:
            self.register(agent)

        # Set up category mappings
        self._category_mapping = {
            "frontend": "frontend",
            "backend": "backend",
            "database": "database",
            "devops": "devops",
            "general": "general",
            # Marketing categories
            "copywriting": "copywriting",
            "copy": "copywriting",
            "content": "copywriting",
            "consistency": "business_consistency",
            "nap": "business_consistency",
            "local_seo": "business_consistency",
            "schema": "business_consistency",
            "geo": "business_consistency",
        }

    def register(self, agent: BaseAgent) -> None:
        """Register an agent.

        Args:
            agent: The agent to register
        """
        self._agents[agent.name] = agent
        logger.info("Registered agent", name=agent.name, capabilities=agent.capabilities)

    def get_agent(self, name: str) -> BaseAgent | None:
        """Get an agent by name.

        Args:
            name: The name of the agent

        Returns:
            The agent if found, None otherwise
        """
        return self._agents.get(name)

    def get_agent_for_category(self, category: str) -> BaseAgent | None:
        """Get an agent for a specific category.

        Args:
            category: The task category

        Returns:
            The appropriate agent for the category
        """
        agent_name = self._category_mapping.get(category, "general")
        return self._agents.get(agent_name)

    def get_agent_for_task(self, task_description: str) -> BaseAgent | None:
        """Find the best agent for a given task.

        Args:
            task_description: Description of the task

        Returns:
            The best matching agent
        """
        for agent in self._agents.values():
            if agent.can_handle(task_description):
                return agent

        # Fall back to general agent
        return self._agents.get("general")

    def list_agents(self) -> list[dict[str, Any]]:
        """List all registered agents.

        Returns:
            List of agent information
        """
        return [
            {
                "name": agent.name,
                "capabilities": agent.capabilities,
            }
            for agent in self._agents.values()
        ]
