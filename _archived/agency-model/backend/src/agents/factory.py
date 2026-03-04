"""Agent factory for creating agents from configuration.

This module eliminates code duplication by using a configuration-driven approach
to create specialized agents. Instead of defining separate classes for each agent,
we define their capabilities in a configuration dictionary and create instances
using a factory function.
"""

import uuid
from typing import Any

from src.utils import get_logger

from .base_agent import BaseAgent

logger = get_logger(__name__)


# Agent configurations define name and capabilities for each agent type
AGENT_CONFIGS = {
    "frontend": {
        "name": "frontend",
        "capabilities": ["frontend", "react", "next", "component", "ui", "css", "tailwind"],
    },
    "backend": {
        "name": "backend",
        "capabilities": ["backend", "api", "python", "fastapi", "langgraph", "agent"],
    },
    "database": {
        "name": "database",
        "capabilities": ["database", "sql", "supabase", "migration", "query", "schema"],
    },
    "devops": {
        "name": "devops",
        "capabilities": ["devops", "docker", "deploy", "ci", "cd", "infrastructure"],
    },
    "general": {
        "name": "general",
        "capabilities": ["general", "help", "question", "explain"],
    },
}


class ConfiguredAgent(BaseAgent):
    """A dynamically configured agent that executes tasks based on configuration.

    This class replaces the need for separate FrontendAgent, BackendAgent, etc.
    by accepting configuration at initialization time.
    """

    def __init__(self, name: str, capabilities: list[str]) -> None:
        super().__init__(name=name, capabilities=capabilities)

    async def execute(
        self,
        task_description: str,
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute a task.

        Args:
            task_description: Description of the task to execute
            context: Additional context for the task

        Returns:
            Result with task output for verification
        """
        task_id = f"{self.name}_{uuid.uuid4().hex[:8]}"
        self.start_task(task_id)

        self.logger.info("Executing task", task=task_description, agent=self.name)

        # Task execution result (pending verification)
        result = {"status": "pending_verification", "task": task_description}

        return {
            **result,
            "task_output": self.get_task_output().model_dump(),
        }


def create_agent(agent_type: str) -> BaseAgent:
    """Factory function to create agents from configuration.

    Args:
        agent_type: Type of agent to create (frontend, backend, database, devops, general)

    Returns:
        Configured agent instance

    Raises:
        ValueError: If agent_type is not recognized

    Example:
        >>> frontend_agent = create_agent("frontend")
        >>> backend_agent = create_agent("backend")
    """
    if agent_type not in AGENT_CONFIGS:
        raise ValueError(
            f"Unknown agent type: {agent_type}. "
            f"Valid types: {', '.join(AGENT_CONFIGS.keys())}"
        )

    config = AGENT_CONFIGS[agent_type]
    logger.info("Creating agent", type=agent_type, name=config["name"])

    return ConfiguredAgent(
        name=config["name"],
        capabilities=config["capabilities"],
    )


def list_agent_types() -> list[str]:
    """List all available agent types.

    Returns:
        List of agent type identifiers
    """
    return list(AGENT_CONFIGS.keys())


def get_agent_capabilities(agent_type: str) -> list[str]:
    """Get capabilities for a specific agent type.

    Args:
        agent_type: Type of agent

    Returns:
        List of capabilities for that agent type

    Raises:
        ValueError: If agent_type is not recognized
    """
    if agent_type not in AGENT_CONFIGS:
        raise ValueError(f"Unknown agent type: {agent_type}")

    return AGENT_CONFIGS[agent_type]["capabilities"]
