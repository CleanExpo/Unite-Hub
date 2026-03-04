"""Document chunking strategies."""

import hashlib
from abc import ABC, abstractmethod
from typing import Any

from src.rag.models import ChunkingStrategy


class Chunker(ABC):
    """Abstract base for chunking strategies."""

    @abstractmethod
    async def chunk(
        self,
        text: str,
        config: dict[str, Any],
        structure: list[dict[str, Any]] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Chunk text into pieces.

        Returns:
            List of chunks with structure:
            {
                "content": str,
                "chunk_index": int,
                "chunk_level": int,  # 0 = child, 1 = parent
                "parent_index": Optional[int],
                "token_count": int,
                "metadata": dict
            }
        """
        pass

    def estimate_tokens(self, text: str) -> int:
        """Rough token estimation (1 token ~= 4 chars)."""
        return len(text) // 4

    def calculate_hash(self, content: str) -> str:
        """Calculate SHA256 hash of content."""
        return hashlib.sha256(content.encode()).hexdigest()


class ParentChildChunker(Chunker):
    """
    Parent-child chunking for context retrieval.

    Creates small child chunks for retrieval and large parent chunks for context.
    """

    async def chunk(
        self,
        text: str,
        config: dict[str, Any],
        structure: list[dict[str, Any]] | None = None,
    ) -> list[dict[str, Any]]:
        child_size = config.get("chunk_size", 512)
        parent_size = config.get("parent_chunk_size", 2048)
        overlap = config.get("chunk_overlap", 50)

        chunks: list[dict[str, Any]] = []

        # Create parent chunks
        parent_char_size = parent_size * 4
        start = 0
        parent_index = 0

        while start < len(text):
            end = min(start + parent_char_size, len(text))
            parent_text = text[start:end]

            parent_chunk_dict = {
                "content": parent_text,
                "chunk_index": len(chunks),
                "chunk_level": 1,  # Parent
                "parent_index": None,
                "token_count": self.estimate_tokens(parent_text),
                "metadata": {
                    "start_char": start,
                    "end_char": end,
                    "is_parent": True,
                },
            }

            parent_actual_index = len(chunks)
            chunks.append(parent_chunk_dict)

            # Create child chunks within this parent
            child_chunks = await self._create_child_chunks(
                parent_text, child_size, overlap, parent_actual_index
            )
            chunks.extend(child_chunks)

            start = end
            parent_index += 1

        return chunks

    async def _create_child_chunks(
        self,
        parent_text: str,
        child_size: int,
        overlap: int,
        parent_chunk_index: int,
    ) -> list[dict[str, Any]]:
        """Create child chunks within a parent chunk."""
        child_char_size = child_size * 4
        overlap_chars = overlap * 4

        chunks = []
        start = 0

        while start < len(parent_text):
            end = min(start + child_char_size, len(parent_text))
            child_text = parent_text[start:end]

            chunks.append(
                {
                    "content": child_text,
                    "chunk_index": 0,  # Will be set when added to main list
                    "chunk_level": 0,  # Child
                    "parent_index": parent_chunk_index,
                    "token_count": self.estimate_tokens(child_text),
                    "metadata": {"parent_chunk_index": parent_chunk_index, "is_child": True},
                }
            )

            start = end - overlap_chars if end < len(parent_text) else end

        return chunks


class FixedSizeChunker(Chunker):
    """Fixed-size chunking with overlap."""

    async def chunk(
        self,
        text: str,
        config: dict[str, Any],
        structure: list[dict[str, Any]] | None = None,
    ) -> list[dict[str, Any]]:
        chunk_size = config.get("chunk_size", 512)
        overlap = config.get("chunk_overlap", 50)

        chunk_chars = chunk_size * 4
        overlap_chars = overlap * 4

        chunks = []
        start = 0
        index = 0

        while start < len(text):
            end = min(start + chunk_chars, len(text))
            chunk_text = text[start:end]

            chunks.append(
                {
                    "content": chunk_text,
                    "chunk_index": index,
                    "chunk_level": 0,
                    "parent_index": None,
                    "token_count": self.estimate_tokens(chunk_text),
                    "metadata": {"start_char": start, "end_char": end},
                }
            )

            start = end - overlap_chars if end < len(text) else end
            index += 1

        return chunks


def get_chunker(strategy: ChunkingStrategy) -> Chunker:
    """Get chunker for strategy."""
    chunkers = {
        ChunkingStrategy.FIXED_SIZE: FixedSizeChunker,
        ChunkingStrategy.PARENT_CHILD: ParentChildChunker,
        ChunkingStrategy.SEMANTIC: FixedSizeChunker,  # Fallback to fixed size
        ChunkingStrategy.CODE_AWARE: FixedSizeChunker,  # Fallback to fixed size
        ChunkingStrategy.RECURSIVE: FixedSizeChunker,  # Fallback to fixed size
    }

    chunker_class = chunkers.get(strategy, ParentChildChunker)
    return chunker_class()
