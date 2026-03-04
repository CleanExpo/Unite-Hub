"""Tests for embedding generation."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.memory.embeddings import (
    EmbeddingProvider,
    OpenAIEmbeddingProvider,
    AnthropicEmbeddingProvider,
    SimpleEmbeddingProvider,
    get_embedding_provider,
)


class TestOpenAIEmbeddingProvider:
    """Test OpenAI embedding provider."""

    @pytest.mark.asyncio
    async def test_get_embedding_success(self):
        """Test successful embedding generation."""
        with patch("httpx.AsyncClient") as mock_client_class:
            # Mock HTTP response
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "data": [{"embedding": [0.1] * 1536}]
            }

            # Mock client instance
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client

            provider = OpenAIEmbeddingProvider("test-api-key")
            provider.client = mock_client

            embedding = await provider.get_embedding("test text")

            assert len(embedding) == 1536
            assert all(isinstance(x, float) for x in embedding)

            # Verify API call
            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert call_args[0][0] == "https://api.openai.com/v1/embeddings"
            assert call_args[1]["json"]["input"] == "test text"
            assert call_args[1]["json"]["model"] == "text-embedding-3-small"
            assert call_args[1]["json"]["dimensions"] == 1536

    @pytest.mark.asyncio
    async def test_get_embedding_http_error(self):
        """Test handling HTTP errors."""
        with patch("httpx.AsyncClient") as mock_client_class:
            import httpx

            # Mock HTTP error
            mock_response = MagicMock()
            mock_response.status_code = 401
            mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
                "Unauthorized",
                request=MagicMock(),
                response=mock_response,
            )

            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client

            provider = OpenAIEmbeddingProvider("invalid-key")
            provider.client = mock_client

            with pytest.raises(Exception) as exc_info:
                await provider.get_embedding("test text")

            assert "Failed to generate embedding" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_embedding_network_error(self):
        """Test handling network errors."""
        with patch("httpx.AsyncClient") as mock_client_class:
            import httpx

            # Mock network error
            mock_client = AsyncMock()
            mock_client.post.side_effect = httpx.ConnectError("Network error")
            mock_client_class.return_value = mock_client

            provider = OpenAIEmbeddingProvider("test-api-key")
            provider.client = mock_client

            with pytest.raises(Exception):
                await provider.get_embedding("test text")

    @pytest.mark.asyncio
    async def test_embedding_dimensions(self):
        """Test that embedding has correct dimensions."""
        with patch("httpx.AsyncClient") as mock_client_class:
            # Mock response with correct dimensions
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "data": [{"embedding": [0.1] * 1536}]
            }

            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client

            provider = OpenAIEmbeddingProvider("test-api-key")
            provider.client = mock_client

            embedding = await provider.get_embedding("test")

            assert len(embedding) == provider.dimensions
            assert len(embedding) == 1536


class TestAnthropicEmbeddingProvider:
    """Test Anthropic embedding provider."""

    @pytest.mark.asyncio
    async def test_get_embedding_placeholder(self):
        """Test placeholder implementation."""
        provider = AnthropicEmbeddingProvider("test-api-key")
        embedding = await provider.get_embedding("test text")

        # Should return zero vector as placeholder
        assert len(embedding) == 1536
        assert all(x == 0.0 for x in embedding)


class TestSimpleEmbeddingProvider:
    """Test simple fallback embedding provider."""

    @pytest.mark.asyncio
    async def test_get_embedding_deterministic(self):
        """Test that same text produces same embedding."""
        provider = SimpleEmbeddingProvider()

        embedding1 = await provider.get_embedding("test text")
        embedding2 = await provider.get_embedding("test text")

        assert embedding1 == embedding2
        assert len(embedding1) == 1536

    @pytest.mark.asyncio
    async def test_get_embedding_different_texts(self):
        """Test that different texts produce different embeddings."""
        provider = SimpleEmbeddingProvider()

        embedding1 = await provider.get_embedding("test text 1")
        embedding2 = await provider.get_embedding("test text 2")

        assert embedding1 != embedding2
        assert len(embedding1) == 1536
        assert len(embedding2) == 1536

    @pytest.mark.asyncio
    async def test_embedding_dimensions(self):
        """Test that embedding has correct dimensions."""
        provider = SimpleEmbeddingProvider()
        embedding = await provider.get_embedding("test")

        assert len(embedding) == 1536

    @pytest.mark.asyncio
    async def test_embedding_values(self):
        """Test that embedding values are in valid range."""
        provider = SimpleEmbeddingProvider()
        embedding = await provider.get_embedding("test text")

        # Values should be -1, 0, or 1
        assert all(x in [-1.0, 0.0, 1.0] for x in embedding)


class TestGetEmbeddingProvider:
    """Test embedding provider factory function."""

    def test_get_provider_openai(self):
        """Test getting OpenAI provider when API key is set."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}, clear=True):
            provider = get_embedding_provider()
            assert isinstance(provider, OpenAIEmbeddingProvider)

    def test_get_provider_anthropic(self):
        """Test getting Anthropic provider when only Anthropic key is set."""
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}, clear=True):
            provider = get_embedding_provider()
            assert isinstance(provider, AnthropicEmbeddingProvider)

    def test_get_provider_fallback(self):
        """Test getting simple provider when no API keys are set."""
        with patch.dict("os.environ", {}, clear=True):
            provider = get_embedding_provider()
            assert isinstance(provider, SimpleEmbeddingProvider)

    def test_get_provider_prefers_openai(self):
        """Test that OpenAI is preferred when both keys are set."""
        with patch.dict(
            "os.environ",
            {
                "OPENAI_API_KEY": "openai-key",
                "ANTHROPIC_API_KEY": "anthropic-key",
            },
            clear=True,
        ):
            provider = get_embedding_provider()
            assert isinstance(provider, OpenAIEmbeddingProvider)


class TestEmbeddingProviderInterface:
    """Test embedding provider interface."""

    @pytest.mark.asyncio
    async def test_provider_interface(self):
        """Test that all providers implement the interface correctly."""
        providers = [
            SimpleEmbeddingProvider(),
            AnthropicEmbeddingProvider("test-key"),
        ]

        for provider in providers:
            assert isinstance(provider, EmbeddingProvider)
            assert hasattr(provider, "get_embedding")

            # Test that get_embedding is async
            import inspect
            assert inspect.iscoroutinefunction(provider.get_embedding)

            # Test that it returns the right type
            embedding = await provider.get_embedding("test")
            assert isinstance(embedding, list)
            assert all(isinstance(x, float) for x in embedding)
            assert len(embedding) == 1536


class TestEmbeddingEdgeCases:
    """Test edge cases for embedding generation."""

    @pytest.mark.asyncio
    async def test_empty_string(self):
        """Test embedding generation for empty string."""
        provider = SimpleEmbeddingProvider()
        embedding = await provider.get_embedding("")

        assert len(embedding) == 1536

    @pytest.mark.asyncio
    async def test_very_long_text(self):
        """Test embedding generation for very long text."""
        provider = SimpleEmbeddingProvider()

        # Create a very long text (simulating max token limit)
        long_text = "test " * 10000

        embedding = await provider.get_embedding(long_text)

        assert len(embedding) == 1536

    @pytest.mark.asyncio
    async def test_special_characters(self):
        """Test embedding generation with special characters."""
        provider = SimpleEmbeddingProvider()

        text = "test 👍 émojis and spëcial çhars"
        embedding = await provider.get_embedding(text)

        assert len(embedding) == 1536

    @pytest.mark.asyncio
    async def test_unicode_text(self):
        """Test embedding generation with unicode text."""
        provider = SimpleEmbeddingProvider()

        texts = [
            "测试文本",  # Chinese
            "テストテキスト",  # Japanese
            "테스트 텍스트",  # Korean
            "النص التجريبي",  # Arabic
        ]

        for text in texts:
            embedding = await provider.get_embedding(text)
            assert len(embedding) == 1536
