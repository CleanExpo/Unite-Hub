"""OpenRouter API client for multi-model access."""

from openai import AsyncOpenAI

from src.config import get_settings
from src.utils import get_logger

settings = get_settings()
logger = get_logger(__name__)


class OpenRouterClient:
    """Client for OpenRouter API (OpenAI-compatible)."""

    # Available models via OpenRouter
    CLAUDE_OPUS = "anthropic/claude-opus-4-5"
    CLAUDE_SONNET = "anthropic/claude-sonnet-4-5"
    GEMINI_PRO = "google/gemini-2.0-flash-exp"

    def __init__(self, model: str | None = None) -> None:
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )
        self.model = model or self.CLAUDE_SONNET
        self.max_tokens = settings.max_tokens
        self.temperature = settings.temperature

    async def complete(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> str:
        """Generate a completion via OpenRouter.

        Args:
            prompt: The user prompt
            system: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature

        Returns:
            The model's response text
        """
        try:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})

            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature or self.temperature,
                messages=messages,
            )

            return response.choices[0].message.content or ""

        except Exception as e:
            logger.error("OpenRouter API error", error=str(e))
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
            full_messages = []
            if system:
                full_messages.append({"role": "system", "content": system})
            full_messages.extend(messages)

            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=full_messages,
            )

            return response.choices[0].message.content or ""

        except Exception as e:
            logger.error("OpenRouter chat error", error=str(e))
            raise
