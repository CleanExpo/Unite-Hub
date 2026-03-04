"""Embedding generation for semantic search in domain memory.

This module provides embedding generation using the Anthropic API (Claude embeddings)
or OpenAI API as a fallback. Embeddings enable semantic search across memory entries.
"""

import os
from abc import ABC, abstractmethod

import httpx

from src.utils import get_logger

logger = get_logger(__name__)


class EmbeddingProvider(ABC):
    """Abstract base class for embedding providers."""

    @abstractmethod
    async def get_embedding(self, text: str) -> list[float]:
        """Generate embedding for text.

        Args:
            text: Text to embed

        Returns:
            Embedding vector (1536 dimensions)
        """
        pass


class AnthropicEmbeddingProvider(EmbeddingProvider):
    """Anthropic embedding provider using Claude embeddings.

    Note: As of now, Anthropic doesn't have a dedicated embeddings endpoint.
    This is a placeholder for when they release one. For now, we use OpenAI.
    """

    def __init__(self, api_key: str) -> None:
        """Initialize with API key."""
        self.api_key = api_key
        self.client = httpx.AsyncClient()

    async def get_embedding(self, text: str) -> list[float]:
        """Generate embedding using Anthropic API.

        Currently falls back to simple text representation.
        TODO: Update when Anthropic releases embeddings endpoint.
        """
        # Placeholder: Return zero vector until Anthropic releases embeddings
        logger.warning("Anthropic embeddings not yet available, using zero vector")
        return [0.0] * 1536


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI embedding provider using text-embedding-3-small model."""

    def __init__(self, api_key: str) -> None:
        """Initialize with API key."""
        self.api_key = api_key
        self.client = httpx.AsyncClient()
        self.model = "text-embedding-3-small"
        self.dimensions = 1536

    async def get_embedding(self, text: str) -> list[float]:
        """Generate embedding using OpenAI API.

        Args:
            text: Text to embed (max ~8k tokens)

        Returns:
            Embedding vector (1536 dimensions)

        Raises:
            Exception: If API call fails
        """
        try:
            response = await self.client.post(
                "https://api.openai.com/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "input": text,
                    "model": self.model,
                    "dimensions": self.dimensions,
                },
                timeout=30.0,
            )

            response.raise_for_status()
            data = response.json()

            embedding = data["data"][0]["embedding"]
            logger.debug(
                "Embedding generated",
                model=self.model,
                dimensions=len(embedding),
                text_length=len(text),
            )

            return embedding

        except httpx.HTTPStatusError as e:
            logger.error(
                "OpenAI API error",
                status_code=e.response.status_code,
                error=str(e),
            )
            raise Exception(f"Failed to generate embedding: {e}")
        except Exception as e:
            logger.error("Embedding generation failed", error=str(e))
            raise


class SimpleEmbeddingProvider(EmbeddingProvider):
    """Simple fallback embedding provider (for testing/development).

    Generates deterministic embeddings based on text hash.
    NOT suitable for production use.
    """

    async def get_embedding(self, text: str) -> list[float]:
        """Generate simple hash-based embedding.

        Args:
            text: Text to embed

        Returns:
            Deterministic embedding vector (1536 dimensions)
        """
        # Simple hash-based embedding for testing
        import hashlib

        # Hash text to get deterministic seed
        hash_obj = hashlib.sha256(text.encode())
        hash_bytes = hash_obj.digest()

        # Convert to floats in range [-1, 1]
        embedding = []
        for i in range(0, min(len(hash_bytes), 192), 1):
            # 192 bytes = 1536 dimensions (8 bits per dimension)
            byte_val = hash_bytes[i]
            for bit in range(8):
                # Extract bit and convert to -1 or 1
                bit_val = (byte_val >> bit) & 1
                embedding.append(float(bit_val * 2 - 1))

        # Pad to 1536 dimensions
        while len(embedding) < 1536:
            embedding.append(0.0)

        logger.warning(
            "Using simple embedding provider (development only)",
            text_length=len(text),
        )

        return embedding[:1536]


def get_embedding_provider() -> EmbeddingProvider:
    """Get the configured embedding provider.

    Checks environment variables for API keys and returns appropriate provider:
    1. OpenAI (OPENAI_API_KEY) - preferred
    2. Anthropic (ANTHROPIC_API_KEY) - placeholder until embeddings available
    3. Simple provider (fallback for development)

    Returns:
        Configured EmbeddingProvider instance
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    if openai_key:
        logger.info("Using OpenAI embedding provider")
        return OpenAIEmbeddingProvider(openai_key)
    elif anthropic_key:
        logger.warning(
            "Anthropic embeddings not yet available, using placeholder provider"
        )
        return AnthropicEmbeddingProvider(anthropic_key)
    else:
        logger.warning(
            "No embedding API key found, using simple provider (development only)"
        )
        return SimpleEmbeddingProvider()
