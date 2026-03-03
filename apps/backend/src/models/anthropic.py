"""Anthropic Claude API Client - Bleeding Edge 2025/2026 Implementation.

Verified Features (2025-01-23):
- Extended Thinking with budget_tokens (1024-128000)
- Prompt Caching (GA - ephemeral, no beta header required)
- Computer Use (Beta)
- Interleaved Thinking (Beta)
- 128K Output (Beta)
- Advanced Tool Use (Beta)

Sources:
- docs.anthropic.com/en/docs/build-with-claude/extended-thinking
- docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- docs.anthropic.com/en/docs/build-with-claude/computer-use
"""

from dataclasses import dataclass
from typing import Any, Literal, NotRequired, TypedDict

from anthropic import AsyncAnthropic

from src.config import get_settings
from src.utils import get_logger

from .base_provider import BaseLLMProvider

settings = get_settings()
logger = get_logger(__name__)


# ============================================================================
# Model Identifiers (Verified 2025)
# ============================================================================

class ClaudeModels:
    """Claude model identifiers - updated January 2025."""

    # Claude 4.5 Family (Latest)
    OPUS_4_5 = "claude-opus-4-5-20251101"
    SONNET_4_5 = "claude-sonnet-4-5-20250929"
    HAIKU_4_5 = "claude-haiku-4-5-20251001"

    # Claude 4 Family
    OPUS_4_1 = "claude-opus-4-1-20250805"
    OPUS_4 = "claude-opus-4-20250514"
    SONNET_4 = "claude-sonnet-4-20250514"

    # Claude 3.7 (Extended Thinking Pioneer)
    SONNET_3_7 = "claude-3-7-sonnet-20250219"


# ============================================================================
# Beta Headers (Verified 2025-01-23)
# ============================================================================

class BetaHeaders:
    """Beta feature headers - verified via Brave Search."""

    # Computer Use - Model-specific
    COMPUTER_USE_OPUS_4_5 = "computer-use-2025-11-24"
    COMPUTER_USE_STANDARD = "computer-use-2025-01-24"

    # Extended Thinking
    INTERLEAVED_THINKING = "interleaved-thinking-2025-05-14"

    # Output Extensions
    OUTPUT_128K = "output-128k-2025-02-19"

    # Advanced Tool Use (Opus 4.5 / Sonnet 4.5)
    ADVANCED_TOOL_USE = "advanced-tool-use-2025-11-20"

    # Structured Outputs
    STRUCTURED_OUTPUTS = "structured-outputs-2025-11-13"

    # Context Management (Memory & Editing)
    CONTEXT_MANAGEMENT = "context-management-2025-06-27"

    # Effort Parameter (Opus 4.5 Only)
    EFFORT = "effort-2025-11-24"

    # NOTE: Prompt caching is GA - NO HEADER REQUIRED
    # PROMPT_CACHING = "prompt-caching-2024-07-31"  # DEPRECATED


# ============================================================================
# Type Definitions
# ============================================================================

class CacheControl(TypedDict):
    """Cache control for prompt caching (GA)."""
    type: Literal["ephemeral"]
    ttl: NotRequired[Literal["1h"]]


class ThinkingConfig(TypedDict):
    """Extended thinking configuration."""
    type: Literal["enabled", "disabled"]
    budget_tokens: int


class ContentBlockText(TypedDict):
    """Text content block."""
    type: Literal["text"]
    text: str
    cache_control: NotRequired[CacheControl]


class ContentBlockThinking(TypedDict):
    """Thinking content block."""
    type: Literal["thinking"]
    thinking: str


class ToolUseBlock(TypedDict):
    """Tool use content block."""
    type: Literal["tool_use"]
    id: str
    name: str
    input: dict[str, Any]


ContentBlock = ContentBlockText | ContentBlockThinking | ToolUseBlock


@dataclass
class BetaFeatureConfig:
    """Configuration for beta features."""

    computer_use: bool = False
    computer_display_width: int = 1920
    computer_display_height: int = 1080

    extended_thinking: bool = False
    thinking_budget_tokens: int = 10000
    interleaved_thinking: bool = False

    prompt_caching: bool = True  # GA - always recommended
    cache_system_prompt: bool = True
    cache_tools: bool = True
    cache_ttl: Literal["default", "1h"] = "default"

    output_128k: bool = False
    advanced_tool_use: bool = False
    structured_outputs: bool = False
    context_management: bool = False
    effort: bool = False  # Opus 4.5 only


# ============================================================================
# Thinking Limits
# ============================================================================

THINKING_MIN_BUDGET = 1024
THINKING_MAX_BUDGET = 128000


# ============================================================================
# Anthropic Client
# ============================================================================

class AnthropicClient(BaseLLMProvider):
    """Client for Anthropic Claude API with bleeding-edge 2025 features.

    Features:
        - Extended Thinking with budget_tokens validation
        - Prompt Caching (GA) with ephemeral cache_control
        - Computer Use (Beta) with model-specific headers
        - Interleaved Thinking (Beta)
        - 128K Output (Beta)
        - Advanced Tool Use (Beta)
    """

    # Expose model constants
    OPUS = ClaudeModels.OPUS_4_5
    SONNET = ClaudeModels.SONNET_4_5
    HAIKU = ClaudeModels.HAIKU_4_5

    def __init__(
        self,
        model: str | None = None,
        features: BetaFeatureConfig | None = None,
    ) -> None:
        """Initialize Anthropic client.

        Args:
            model: Model identifier (defaults to Sonnet 4.5)
            features: Beta feature configuration
        """
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = model or self.SONNET
        self.max_tokens = settings.max_tokens
        self.temperature = settings.temperature
        self.features = features or BetaFeatureConfig()

    # ========================================================================
    # Beta Header Building
    # ========================================================================

    def _build_beta_headers(self) -> list[str]:
        """Build beta header list based on enabled features."""
        headers: list[str] = []

        if self.features.computer_use:
            header = (
                BetaHeaders.COMPUTER_USE_OPUS_4_5
                if self.model == ClaudeModels.OPUS_4_5
                else BetaHeaders.COMPUTER_USE_STANDARD
            )
            headers.append(header)

        if self.features.interleaved_thinking:
            headers.append(BetaHeaders.INTERLEAVED_THINKING)

        if self.features.output_128k:
            headers.append(BetaHeaders.OUTPUT_128K)

        if self.features.advanced_tool_use:
            headers.append(BetaHeaders.ADVANCED_TOOL_USE)

        if self.features.structured_outputs:
            headers.append(BetaHeaders.STRUCTURED_OUTPUTS)

        if self.features.context_management:
            headers.append(BetaHeaders.CONTEXT_MANAGEMENT)

        if self.features.effort and self.model == ClaudeModels.OPUS_4_5:
            headers.append(BetaHeaders.EFFORT)

        return headers

    # ========================================================================
    # Prompt Caching Helpers
    # ========================================================================

    def _create_cached_system(self, system: str) -> list[ContentBlockText]:
        """Create cacheable system prompt (GA feature)."""
        if not self.features.prompt_caching or not self.features.cache_system_prompt:
            # Return as plain text
            return [{"type": "text", "text": system}]

        cache_control: CacheControl = {"type": "ephemeral"}
        if self.features.cache_ttl == "1h":
            cache_control["ttl"] = "1h"

        return [{"type": "text", "text": system, "cache_control": cache_control}]

    def _add_cache_to_tools(
        self, tools: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Add cache_control to tool definitions."""
        if not self.features.prompt_caching or not self.features.cache_tools:
            return tools

        cache_control: CacheControl = {"type": "ephemeral"}
        if self.features.cache_ttl == "1h":
            cache_control["ttl"] = "1h"

        return [{**tool, "cache_control": cache_control} for tool in tools]

    # ========================================================================
    # Extended Thinking
    # ========================================================================

    def _create_thinking_config(
        self, budget_tokens: int | None = None
    ) -> ThinkingConfig:
        """Create validated thinking configuration.

        Args:
            budget_tokens: Override default budget (1024-128000)

        Returns:
            ThinkingConfig dict

        Raises:
            ValueError: If budget_tokens outside valid range
        """
        budget = budget_tokens or self.features.thinking_budget_tokens

        if budget < THINKING_MIN_BUDGET:
            raise ValueError(
                f"budget_tokens must be at least {THINKING_MIN_BUDGET}, got {budget}"
            )

        if budget > THINKING_MAX_BUDGET:
            raise ValueError(
                f"budget_tokens cannot exceed {THINKING_MAX_BUDGET}, got {budget}"
            )

        return {"type": "enabled", "budget_tokens": budget}

    # ========================================================================
    # Core API Methods
    # ========================================================================

    async def complete(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> str:
        """Generate a completion from Claude.

        Args:
            prompt: The user prompt
            system: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature

        Returns:
            The model's response text
        """
        try:
            messages = [{"role": "user", "content": prompt}]

            # Build request kwargs
            kwargs: dict[str, Any] = {
                "model": self.model,
                "max_tokens": max_tokens or self.max_tokens,
                "temperature": temperature or self.temperature,
                "messages": messages,
            }

            # Add cached system prompt if provided
            if system:
                if self.features.prompt_caching:
                    kwargs["system"] = self._create_cached_system(system)
                else:
                    kwargs["system"] = system

            # Add beta headers if any features enabled
            beta_headers = self._build_beta_headers()
            if beta_headers:
                kwargs["betas"] = beta_headers

            response = await self.client.messages.create(**kwargs)

            return self._extract_text(response.content)

        except Exception as e:
            logger.error("Anthropic API error", error=str(e))
            raise

    async def chat(
        self,
        messages: list[dict[str, str]],
        system: str | None = None,
    ) -> str:
        """Multi-turn chat completion.

        Args:
            messages: List of message dicts with 'role' and 'content'
            system: Optional system prompt

        Returns:
            The model's response text
        """
        try:
            kwargs: dict[str, Any] = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
                "messages": messages,
            }

            if system:
                if self.features.prompt_caching:
                    kwargs["system"] = self._create_cached_system(system)
                else:
                    kwargs["system"] = system

            beta_headers = self._build_beta_headers()
            if beta_headers:
                kwargs["betas"] = beta_headers

            response = await self.client.messages.create(**kwargs)

            return self._extract_text(response.content)

        except Exception as e:
            logger.error("Anthropic chat error", error=str(e))
            raise

    async def with_tools(
        self,
        prompt: str,
        tools: list[dict[str, Any]],
        system: str | None = None,
    ) -> dict[str, Any]:
        """Generate a completion with tool use.

        Args:
            prompt: The user prompt
            tools: List of tool definitions
            system: Optional system prompt

        Returns:
            The model's response including tool calls
        """
        try:
            kwargs: dict[str, Any] = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
                "messages": [{"role": "user", "content": prompt}],
                "tools": self._add_cache_to_tools(tools),
            }

            if system:
                if self.features.prompt_caching:
                    kwargs["system"] = self._create_cached_system(system)
                else:
                    kwargs["system"] = system

            beta_headers = self._build_beta_headers()
            if beta_headers:
                kwargs["betas"] = beta_headers

            response = await self.client.messages.create(**kwargs)

            return {
                "content": response.content,
                "stop_reason": response.stop_reason,
                "usage": response.usage,
            }

        except Exception as e:
            logger.error("Anthropic tool use error", error=str(e))
            raise

    # ========================================================================
    # Extended Thinking Methods
    # ========================================================================

    async def think(
        self,
        prompt: str,
        system: str | None = None,
        budget_tokens: int | None = None,
        max_tokens: int | None = None,
    ) -> dict[str, Any]:
        """Generate completion with extended thinking.

        Extended thinking allows Claude to perform step-by-step reasoning
        before providing a final answer.

        Args:
            prompt: The user prompt
            system: Optional system prompt
            budget_tokens: Thinking budget (1024-128000)
            max_tokens: Maximum output tokens

        Returns:
            Dict with 'text', 'thinking', and 'usage' keys
        """
        if not self.features.extended_thinking:
            logger.warning("Extended thinking not enabled, falling back to standard")
            text = await self.complete(prompt, system, max_tokens)
            return {"text": text, "thinking": [], "usage": None}

        try:
            thinking_config = self._create_thinking_config(budget_tokens)
            output_tokens = max_tokens or self.max_tokens

            # Validate budget vs max_tokens (unless interleaved)
            if not self.features.interleaved_thinking:
                if thinking_config["budget_tokens"] >= output_tokens:
                    raise ValueError(
                        "budget_tokens must be less than max_tokens "
                        "(unless using interleaved thinking)"
                    )

            kwargs: dict[str, Any] = {
                "model": self.model,
                "max_tokens": output_tokens,
                "messages": [{"role": "user", "content": prompt}],
                "thinking": thinking_config,
            }

            if system:
                if self.features.prompt_caching:
                    kwargs["system"] = self._create_cached_system(system)
                else:
                    kwargs["system"] = system

            beta_headers = self._build_beta_headers()
            if beta_headers:
                kwargs["betas"] = beta_headers

            response = await self.client.messages.create(**kwargs)

            return {
                "text": self._extract_text(response.content),
                "thinking": self._extract_thinking(response.content),
                "usage": response.usage,
            }

        except Exception as e:
            logger.error("Anthropic thinking error", error=str(e))
            raise

    async def think_with_tools(
        self,
        prompt: str,
        tools: list[dict[str, Any]],
        system: str | None = None,
        budget_tokens: int | None = None,
        max_tokens: int | None = None,
    ) -> dict[str, Any]:
        """Generate completion with thinking AND tools (interleaved).

        This uses interleaved thinking where Claude reasons between tool calls.

        Args:
            prompt: The user prompt
            tools: List of tool definitions
            system: Optional system prompt
            budget_tokens: Thinking budget (1024-128000)
            max_tokens: Maximum output tokens

        Returns:
            Dict with 'content', 'thinking', 'tool_calls', and 'usage'
        """
        # Enable interleaved thinking for tool use
        original_interleaved = self.features.interleaved_thinking
        self.features.interleaved_thinking = True

        try:
            thinking_config = self._create_thinking_config(budget_tokens)

            kwargs: dict[str, Any] = {
                "model": self.model,
                "max_tokens": max_tokens or self.max_tokens,
                "messages": [{"role": "user", "content": prompt}],
                "tools": self._add_cache_to_tools(tools),
                "thinking": thinking_config,
            }

            if system:
                if self.features.prompt_caching:
                    kwargs["system"] = self._create_cached_system(system)
                else:
                    kwargs["system"] = system

            beta_headers = self._build_beta_headers()
            if beta_headers:
                kwargs["betas"] = beta_headers

            response = await self.client.messages.create(**kwargs)

            return {
                "content": response.content,
                "text": self._extract_text(response.content),
                "thinking": self._extract_thinking(response.content),
                "tool_calls": self._extract_tool_calls(response.content),
                "stop_reason": response.stop_reason,
                "usage": response.usage,
            }

        except Exception as e:
            logger.error("Anthropic interleaved thinking error", error=str(e))
            raise
        finally:
            # Restore original setting
            self.features.interleaved_thinking = original_interleaved

    # ========================================================================
    # Computer Use Methods
    # ========================================================================

    def create_computer_tool(
        self,
        display_width: int | None = None,
        display_height: int | None = None,
        display_number: int | None = None,
    ) -> dict[str, Any]:
        """Create computer use tool definition.

        Args:
            display_width: Screen width in pixels
            display_height: Screen height in pixels
            display_number: Display number (optional)

        Returns:
            Computer tool definition for API
        """
        width = display_width or self.features.computer_display_width
        height = display_height or self.features.computer_display_height

        # Use appropriate tool type based on model
        tool_type = (
            "computer_20251124"
            if self.model == ClaudeModels.OPUS_4_5
            else "computer_20250124"
        )

        tool: dict[str, Any] = {
            "type": tool_type,
            "name": "computer",
            "display_width_px": width,
            "display_height_px": height,
        }

        if display_number is not None:
            tool["display_number"] = display_number

        return tool

    # ========================================================================
    # Content Extraction Helpers
    # ========================================================================

    @staticmethod
    def _extract_text(content: list[Any]) -> str:
        """Extract text from content blocks."""
        texts = []
        for block in content:
            if hasattr(block, "type") and block.type == "text":
                texts.append(block.text)
            elif isinstance(block, dict) and block.get("type") == "text":
                texts.append(block.get("text", ""))
        return "".join(texts)

    @staticmethod
    def _extract_thinking(content: list[Any]) -> list[str]:
        """Extract thinking from content blocks."""
        thinking = []
        for block in content:
            if hasattr(block, "type") and block.type == "thinking":
                thinking.append(block.thinking)
            elif isinstance(block, dict) and block.get("type") == "thinking":
                thinking.append(block.get("thinking", ""))
        return thinking

    @staticmethod
    def _extract_tool_calls(content: list[Any]) -> list[dict[str, Any]]:
        """Extract tool use blocks from content."""
        tool_calls = []
        for block in content:
            if hasattr(block, "type") and block.type == "tool_use":
                tool_calls.append({
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })
            elif isinstance(block, dict) and block.get("type") == "tool_use":
                tool_calls.append({
                    "id": block.get("id"),
                    "name": block.get("name"),
                    "input": block.get("input"),
                })
        return tool_calls

    # ========================================================================
    # Embeddings (Not Supported)
    # ========================================================================

    async def generate_embeddings(self, text: str) -> list[float]:
        """Generate embeddings (Anthropic doesn't provide embeddings API).

        Note: Anthropic doesn't offer an embeddings API. Consider using:
        - Ollama with nomic-embed-text for local embeddings
        - OpenAI embeddings API for cloud embeddings

        Raises:
            NotImplementedError: Anthropic doesn't support embeddings
        """
        raise NotImplementedError(
            "Anthropic doesn't provide an embeddings API. "
            "Use Ollama (nomic-embed-text) or OpenAI for embeddings."
        )

    # ========================================================================
    # Properties
    # ========================================================================

    @property
    def provider_name(self) -> str:
        """Get provider name."""
        return "anthropic"

    @property
    def model_name(self) -> str:
        """Get current model name."""
        return self.model

    @property
    def supports_tools(self) -> bool:
        """Anthropic supports tool use."""
        return True

    @property
    def supports_thinking(self) -> bool:
        """Anthropic supports extended thinking."""
        return True


# ============================================================================
# Factory Functions
# ============================================================================

def create_thinking_client(
    model: str | None = None,
    budget_tokens: int = 16000,
) -> AnthropicClient:
    """Create client configured for extended thinking."""
    return AnthropicClient(
        model=model,
        features=BetaFeatureConfig(
            extended_thinking=True,
            thinking_budget_tokens=budget_tokens,
            prompt_caching=True,
            cache_system_prompt=True,
        ),
    )


def create_computer_use_client(
    model: str | None = None,
    display_width: int = 1920,
    display_height: int = 1080,
) -> AnthropicClient:
    """Create client configured for computer use."""
    return AnthropicClient(
        model=model,
        features=BetaFeatureConfig(
            computer_use=True,
            computer_display_width=display_width,
            computer_display_height=display_height,
            prompt_caching=True,
            cache_system_prompt=True,
            cache_tools=True,
        ),
    )


def create_long_output_client(model: str | None = None) -> AnthropicClient:
    """Create client configured for 128K output."""
    return AnthropicClient(
        model=model,
        features=BetaFeatureConfig(
            output_128k=True,
            prompt_caching=True,
            cache_system_prompt=True,
        ),
    )
