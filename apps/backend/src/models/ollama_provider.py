"""
Ollama Provider

Local LLM provider using Ollama.
Runs models locally without requiring API keys.
"""


import httpx

from src.config import get_settings
from src.utils import get_logger

from .base_provider import BaseLLMProvider

settings = get_settings()
logger = get_logger(__name__)


class OllamaProvider(BaseLLMProvider):
    """
    Ollama LLM Provider (local, self-hosted).

    Default models:
    - llama3.1:8b for generation (good balance of speed/quality)
    - nomic-embed-text for embeddings
    """

    # Default models
    DEFAULT_MODEL = "llama3.1:8b"
    DEFAULT_EMBEDDING_MODEL = "nomic-embed-text"

    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        embedding_model: str | None = None,
    ) -> None:
        """
        Initialize Ollama provider.

        Args:
            base_url: Ollama server URL (default: http://localhost:11434)
            model: Model name for generation (default: llama3.1:8b)
            embedding_model: Model for embeddings (default: nomic-embed-text)
        """
        self.base_url = base_url or getattr(settings, "ollama_base_url", "http://localhost:11434")
        self.model = model or getattr(settings, "ollama_model", self.DEFAULT_MODEL)
        self.embedding_model = embedding_model or getattr(
            settings, "ollama_embedding_model", self.DEFAULT_EMBEDDING_MODEL
        )
        self.max_tokens = settings.max_tokens
        self.temperature = settings.temperature

    async def complete(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> str:
        """
        Generate a completion from Ollama.

        Args:
            prompt: The user prompt
            system: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature

        Returns:
            The model's response text
        """
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature or self.temperature,
                        "num_predict": max_tokens or self.max_tokens,
                    },
                }

                if system:
                    payload["system"] = system

                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                )

                response.raise_for_status()
                result = response.json()

                return result.get("response", "")

        except httpx.ConnectError:
            error_msg = (
                f"Cannot connect to Ollama at {self.base_url}. "
                "Make sure Ollama is running: ollama serve"
            )
            logger.error(error_msg)
            raise ConnectionError(error_msg)
        except Exception as e:
            logger.error("Ollama API error", error=str(e))
            raise

    async def chat(
        self,
        messages: list[dict[str, str]],
        system: str | None = None,
    ) -> str:
        """
        Multi-turn chat completion with Ollama.

        Args:
            messages: List of message dicts with 'role' and 'content'
            system: Optional system prompt

        Returns:
            The model's response text
        """
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Convert messages to Ollama format
                ollama_messages = []
                for msg in messages:
                    ollama_messages.append({
                        "role": msg["role"],
                        "content": msg["content"],
                    })

                payload = {
                    "model": self.model,
                    "messages": ollama_messages,
                    "stream": False,
                    "options": {
                        "temperature": self.temperature,
                        "num_predict": self.max_tokens,
                    },
                }

                if system:
                    # Add system message as first message
                    payload["messages"].insert(0, {
                        "role": "system",
                        "content": system,
                    })

                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                )

                response.raise_for_status()
                result = response.json()

                return result.get("message", {}).get("content", "")

        except httpx.ConnectError:
            error_msg = (
                f"Cannot connect to Ollama at {self.base_url}. "
                "Make sure Ollama is running: ollama serve"
            )
            logger.error(error_msg)
            raise ConnectionError(error_msg)
        except Exception as e:
            logger.error("Ollama chat error", error=str(e))
            raise

    async def generate_embeddings(self, text: str) -> list[float]:
        """
        Generate embeddings using Ollama.

        Args:
            text: Text to embed

        Returns:
            Embedding vector
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={
                        "model": self.embedding_model,
                        "prompt": text,
                    },
                )

                response.raise_for_status()
                result = response.json()

                return result.get("embedding", [])

        except httpx.ConnectError:
            error_msg = (
                f"Cannot connect to Ollama at {self.base_url}. "
                "Make sure Ollama is running: ollama serve"
            )
            logger.error(error_msg)
            raise ConnectionError(error_msg)
        except Exception as e:
            logger.error("Ollama embeddings error", error=str(e))
            raise

    @property
    def provider_name(self) -> str:
        """Get provider name."""
        return "ollama"

    @property
    def model_name(self) -> str:
        """Get current model name."""
        return self.model

    @property
    def supports_tools(self) -> bool:
        """Ollama doesn't support tool use yet."""
        return False

    async def health_check(self) -> bool:
        """
        Check if Ollama server is accessible.

        Returns:
            True if Ollama is running, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> list[str]:
        """
        List available models on Ollama server.

        Returns:
            List of model names
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                result = response.json()

                return [model["name"] for model in result.get("models", [])]
        except Exception as e:
            logger.error("Failed to list Ollama models", error=str(e))
            return []
