"""Tests for document chunking strategies."""

import pytest

from src.rag.chunkers import (
    ParentChildChunker,
    FixedSizeChunker,
    get_chunker,
)
from src.rag.models import ChunkingStrategy


@pytest.mark.asyncio
async def test_parent_child_chunker():
    """Test parent-child chunking strategy."""
    chunker = ParentChildChunker()

    # Create test text (simulate 10,000 chars = ~2500 tokens)
    text = "This is a test sentence. " * 400  # ~10,000 chars

    config = {"chunk_size": 512, "parent_chunk_size": 2048, "chunk_overlap": 50}

    chunks = await chunker.chunk(text, config)

    # Verify chunks created
    assert len(chunks) > 0

    # Verify parent chunks exist (level 1)
    parent_chunks = [c for c in chunks if c["chunk_level"] == 1]
    assert len(parent_chunks) > 0

    # Verify child chunks exist (level 0)
    child_chunks = [c for c in chunks if c["chunk_level"] == 0]
    assert len(child_chunks) > 0

    # Verify child chunks have parent references
    assert any(c.get("parent_index") is not None for c in child_chunks)


@pytest.mark.asyncio
async def test_fixed_size_chunker():
    """Test fixed-size chunking with overlap."""
    chunker = FixedSizeChunker()

    text = "Word " * 1000  # 5000 chars

    config = {"chunk_size": 256, "chunk_overlap": 50}

    chunks = await chunker.chunk(text, config)

    # Verify chunks created
    assert len(chunks) > 0

    # Verify all chunks are level 0 (no parent-child)
    assert all(c["chunk_level"] == 0 for c in chunks)

    # Verify chunks have reasonable size
    for chunk in chunks:
        assert len(chunk["content"]) > 0
        assert chunk["token_count"] > 0


@pytest.mark.asyncio
async def test_get_chunker():
    """Test chunker factory."""
    # Parent-child
    chunker1 = get_chunker(ChunkingStrategy.PARENT_CHILD)
    assert isinstance(chunker1, ParentChildChunker)

    # Fixed size
    chunker2 = get_chunker(ChunkingStrategy.FIXED_SIZE)
    assert isinstance(chunker2, FixedSizeChunker)


@pytest.mark.asyncio
async def test_token_estimation():
    """Test token estimation accuracy."""
    chunker = FixedSizeChunker()

    text = "This is a test."  # 4 words ~ 4-5 tokens
    estimated = chunker.estimate_tokens(text)

    # Should be roughly 4-5 (1 token = 4 chars)
    assert estimated >= 3
    assert estimated <= 6


@pytest.mark.asyncio
async def test_content_hash():
    """Test SHA256 hash generation."""
    chunker = FixedSizeChunker()

    text1 = "Hello world"
    text2 = "Hello world"
    text3 = "Different text"

    hash1 = chunker.calculate_hash(text1)
    hash2 = chunker.calculate_hash(text2)
    hash3 = chunker.calculate_hash(text3)

    # Same content = same hash
    assert hash1 == hash2

    # Different content = different hash
    assert hash1 != hash3

    # Hash should be 64 hex characters (SHA256)
    assert len(hash1) == 64
    assert all(c in "0123456789abcdef" for c in hash1)
