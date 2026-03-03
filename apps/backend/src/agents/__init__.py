"""Agents module."""

from .base_agent import BaseAgent
from .factory import AGENT_CONFIGS, create_agent, get_agent_capabilities, list_agent_types
from .marketing_agents import BusinessConsistencyAgent, CopywritingAgent
from .orchestrator import OrchestratorAgent
from .registry import AgentRegistry

__all__ = [
    "OrchestratorAgent",
    "BaseAgent",
    "AgentRegistry",
    "CopywritingAgent",
    "BusinessConsistencyAgent",
    # Agent Factory (recommended for creating new agents)
    "create_agent",
    "list_agent_types",
    "get_agent_capabilities",
    "AGENT_CONFIGS",
]
