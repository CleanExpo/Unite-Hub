"""Model selection logic for choosing the appropriate AI model."""

from typing import Literal

from src.config import get_settings

from .anthropic import AnthropicClient
from .base_provider import BaseLLMProvider
from .google import GoogleClient
from .ollama_provider import OllamaProvider
from .openrouter import OpenRouterClient

settings = get_settings()

ModelProvider = Literal["ollama", "anthropic", "google", "openrouter"]
ModelTier = Literal["opus", "sonnet", "haiku", "pro", "default"]


class ModelSelector:
    """Selects and instantiates the appropriate model client."""

    def __init__(self) -> None:
        self._clients: dict[str, BaseLLMProvider] = {}

    def get_client(
        self,
        provider: ModelProvider | None = None,
        tier: ModelTier = "default",
    ) -> BaseLLMProvider:
        """Get a model client for the specified provider and tier.

        Args:
            provider: The model provider to use (None = auto-select from settings)
            tier: The model tier/quality level

        Returns:
            An instantiated model client
        """
        # Auto-select provider from settings if not specified
        if provider is None:
            provider = self._get_default_provider()

        cache_key = f"{provider}:{tier}"

        if cache_key in self._clients:
            return self._clients[cache_key]

        client = self._create_client(provider, tier)
        self._clients[cache_key] = client
        return client

    def _get_default_provider(self) -> ModelProvider:
        """
        Get default provider from settings.

        Returns Ollama if:
        - AI_PROVIDER setting is "ollama"
        - No Anthropic API key is configured

        Returns:
            Default provider name
        """
        # Check settings preference
        if settings.ai_provider == "ollama":
            return "ollama"

        # Fallback to Ollama if no cloud API keys configured
        if not settings.anthropic_api_key:
            return "ollama"

        # Default to Anthropic if API key is available
        return "anthropic"

    def _create_client(
        self,
        provider: ModelProvider,
        tier: ModelTier,
    ) -> BaseLLMProvider:
        """Create a new client instance."""
        match provider:
            case "ollama":
                # Ollama uses configured model from settings
                return OllamaProvider()

            case "anthropic":
                model = self._get_anthropic_model(tier)
                return AnthropicClient(model=model)

            case "google":
                return GoogleClient()

            case "openrouter":
                model = self._get_openrouter_model(tier)
                return OpenRouterClient(model=model)

            case _:
                # Default to Ollama (self-contained)
                return OllamaProvider()

    def _get_anthropic_model(self, tier: ModelTier) -> str:
        """Get the Anthropic model string for a tier."""
        match tier:
            case "opus":
                return AnthropicClient.OPUS
            case "haiku":
                return AnthropicClient.HAIKU
            case _:
                return AnthropicClient.SONNET

    def _get_openrouter_model(self, tier: ModelTier) -> str:
        """Get the OpenRouter model string for a tier."""
        match tier:
            case "opus":
                return OpenRouterClient.CLAUDE_OPUS
            case "pro":
                return OpenRouterClient.GEMINI_PRO
            case _:
                return OpenRouterClient.CLAUDE_SONNET

    def select_for_task(
        self,
        task_complexity: Literal["simple", "moderate", "complex"],
        prefer_speed: bool = False,
    ) -> BaseLLMProvider:
        """Automatically select a model based on task requirements.

        Args:
            task_complexity: How complex the task is
            prefer_speed: Whether to prioritize speed over quality

        Returns:
            An appropriate model client
        """
        # Get default provider
        provider = self._get_default_provider()

        # If using Ollama, always return default (tier doesn't apply)
        if provider == "ollama":
            return self.get_client("ollama")

        # For cloud providers (Anthropic), select by tier
        if prefer_speed:
            return self.get_client(provider, "haiku")

        match task_complexity:
            case "simple":
                return self.get_client(provider, "haiku")
            case "moderate":
                return self.get_client(provider, "sonnet")
            case "complex":
                return self.get_client(provider, "opus")
            case _:
                return self.get_client(provider, "default")
