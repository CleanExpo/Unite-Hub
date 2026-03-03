"""
Base LLM Provider Interface

Abstract base class for all AI model providers (Ollama, Anthropic, etc.)
"""

from abc import ABC, abstractmethod
from typing import Any


class BaseLLMProvider(ABC):
    """
    Abstract base class for LLM providers.

    All providers (Ollama, Anthropic, Google, etc.) must implement this interface
    to ensure consistent API across different backends.
    """

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> str:
        """
        Generate a single completion from a prompt.

        Args:
            prompt: The user prompt
            system: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature (0.0-1.0)

        Returns:
            The model's response text
        """
        pass

    @abstractmethod
    async def chat(
        self,
        messages: list[dict[str, str]],
        system: str | None = None,
    ) -> str:
        """
        Multi-turn chat completion.

        Args:
            messages: List of message dicts with 'role' and 'content'
            system: Optional system prompt

        Returns:
            The model's response text
        """
        pass

    @abstractmethod
    async def generate_embeddings(self, text: str) -> list[float]:
        """
        Generate embeddings for text (for RAG/semantic search).

        Args:
            text: Text to embed

        Returns:
            Embedding vector (typically 1536 dimensions)
        """
        pass

    async def with_tools(
        self,
        prompt: str,
        tools: list[dict[str, Any]],
        system: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate a completion with tool use (optional, not all providers support this).

        Args:
            prompt: The user prompt
            tools: List of tool definitions
            system: Optional system prompt

        Returns:
            The model's response including tool calls

        Raises:
            NotImplementedError: If provider doesn't support tool use
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} does not support tool use"
        )

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """
        Get the provider name (e.g., "ollama", "anthropic").

        Returns:
            Provider name string
        """
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """
        Get the current model name.

        Returns:
            Model name string
        """
        pass

    @property
    def supports_tools(self) -> bool:
        """
        Check if provider supports tool use.

        Returns:
            True if provider supports tools, False otherwise
        """
        return False
