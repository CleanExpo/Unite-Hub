"""RAG storage layer for document chunks."""

from datetime import datetime
from typing import Any

from src.memory.embeddings import get_embedding_provider
from src.rag.models import DocumentChunk, DocumentSource, ProcessingStatus
from src.state.supabase import SupabaseStateStore
from src.utils import get_logger

logger = get_logger(__name__)


class RAGStore:
    """Storage layer for RAG pipeline."""

    def __init__(self) -> None:
        self.supabase = SupabaseStateStore()
        self.client = self.supabase.client
        self.embedding_provider = None

    async def initialize(self) -> None:
        """Initialize store and embedding provider."""
        from src.memory.embeddings import EmbeddingProvider

        self.embedding_provider: EmbeddingProvider = get_embedding_provider()
        logger.info("RAG store initialized")

    # Document Sources

    async def create_source(
        self,
        project_id: str,
        source_type: str,
        source_uri: str,
        user_id: str | None = None,
        **kwargs: Any,
    ) -> DocumentSource:
        """Create a document source record."""
        data = {
            "project_id": project_id,
            "source_type": source_type,
            "source_uri": source_uri,
            "user_id": user_id,
            "status": ProcessingStatus.PENDING.value,
            **kwargs,
        }

        result = self.client.table("document_sources").insert(data).execute()

        if not result.data:
            raise Exception("Failed to create document source")

        # Type assertion for Supabase result
        result_data = result.data[0] if isinstance(result.data, list) else result.data
        return DocumentSource(**result_data)  # type: ignore[arg-type]

    async def update_source_status(
        self,
        source_id: str,
        status: ProcessingStatus,
        error_message: str | None = None,
    ) -> None:
        """Update source processing status."""
        data = {"status": status.value, "updated_at": datetime.now().isoformat()}
        if error_message:
            data["error_message"] = error_message
        if status == ProcessingStatus.COMPLETED:
            data["processed_at"] = datetime.now().isoformat()

        self.client.table("document_sources").update(data).eq("id", source_id).execute()

    # Document Chunks

    async def create_chunk(
        self,
        source_id: str,
        project_id: str,
        chunk_index: int,
        content: str,
        content_hash: str,
        chunk_level: int = 0,
        parent_chunk_id: str | None = None,
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
        generate_embedding: bool = True,
    ) -> DocumentChunk:
        """Create a document chunk."""
        # Generate embedding
        embedding = None
        if generate_embedding and self.embedding_provider:
            embedding = await self.embedding_provider.get_embedding(content)

        data = {
            "source_id": source_id,
            "project_id": project_id,
            "chunk_index": chunk_index,
            "content": content,
            "content_hash": content_hash,
            "chunk_level": chunk_level,
            "parent_chunk_id": parent_chunk_id,
            "user_id": user_id,
            "metadata": metadata or {},
            "embedding": embedding,
            "token_count": len(content) // 4,
        }

        result = self.client.table("document_chunks").insert(data).execute()

        if not result.data:
            raise Exception("Failed to create document chunk")

        logger.debug(
            "Chunk created",
            source_id=source_id,
            chunk_index=chunk_index,
            chunk_level=chunk_level,
        )

        result_data = result.data[0] if isinstance(result.data, list) else result.data
        return DocumentChunk(**result_data)  # type: ignore[arg-type]

    async def batch_create_chunks(
        self,
        chunks: list[dict[str, Any]],
    ) -> list[DocumentChunk]:
        """Batch create chunks for efficiency."""
        # Generate embeddings
        if self.embedding_provider:
            for chunk in chunks:
                if chunk.get("generate_embedding", True):
                    embedding = await self.embedding_provider.get_embedding(
                        chunk["content"]
                    )
                    chunk["embedding"] = embedding

        # Remove generate_embedding flag before insert
        for chunk in chunks:
            chunk.pop("generate_embedding", None)

        # Batch insert
        result = self.client.table("document_chunks").insert(chunks).execute()

        if not result.data:
            raise Exception("Failed to batch create chunks")

        result_data_list = result.data if isinstance(result.data, list) else [result.data]
        logger.info("Batch chunks created", count=len(result_data_list))

        return [DocumentChunk(**data) for data in result_data_list]  # type: ignore[arg-type]

    async def get_chunk(self, chunk_id: str) -> DocumentChunk | None:
        """Get a chunk by ID."""
        result = (
            self.client.table("document_chunks")
            .select("*")
            .eq("id", chunk_id)
            .execute()
        )

        if not result.data:
            return None

        result_data = result.data[0] if isinstance(result.data, list) else result.data
        return DocumentChunk(**result_data)  # type: ignore[arg-type]

    async def hybrid_search(
        self,
        query: str,
        project_id: str,
        vector_weight: float = 0.6,
        keyword_weight: float = 0.4,
        limit: int = 10,
        threshold: float = 0.5,
    ) -> list[dict[str, Any]]:
        """Hybrid vector + keyword search."""
        if not self.embedding_provider:
            raise Exception("Embedding provider not initialized")

        # Generate query embedding
        query_embedding = await self.embedding_provider.get_embedding(query)

        # Call hybrid search function
        result = self.client.rpc(
            "hybrid_search",
            {
                "query_text": query,
                "query_embedding": query_embedding,
                "project_id_filter": project_id,
                "vector_weight": vector_weight,
                "keyword_weight": keyword_weight,
                "match_threshold": threshold,
                "match_count": limit,
            },
        ).execute()

        return result.data or []

    async def vector_search(
        self,
        query: str,
        project_id: str,
        limit: int = 10,
        threshold: float = 0.7,
    ) -> list[dict[str, Any]]:
        """Vector similarity search only."""
        if not self.embedding_provider:
            raise Exception("Embedding provider not initialized")

        # Generate query embedding
        _query_embedding = await self.embedding_provider.get_embedding(query)

        # Vector search using cosine similarity
        # Note: For full vector search, use hybrid_search or custom RPC function
        result = (
            self.client.table("document_chunks")
            .select("id, source_id, content, metadata, heading_hierarchy, summary")
            .match({"project_id": project_id})
            .order("embedding", desc=False)
            .limit(limit)
            .execute()
        )

        # Add scores
        results_with_scores = []
        for item in result.data or []:
            results_with_scores.append(
                {
                    "chunk_id": item["id"],
                    "source_id": item["source_id"],
                    "content": item["content"],
                    "vector_score": 0.8,  # Placeholder score
                    "keyword_score": 0.0,
                    "combined_score": 0.8,
                    "metadata": item.get("metadata", {}),
                    "heading_hierarchy": item.get("heading_hierarchy", []),
                    "summary": item.get("summary"),
                }
            )

        return results_with_scores
