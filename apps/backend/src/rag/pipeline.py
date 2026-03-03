"""RAG pipeline orchestrator."""

from typing import Any

from src.rag.chunkers import get_chunker
from src.rag.models import PipelineConfig, ProcessingStatus, SourceType
from src.rag.parsers import get_parser
from src.rag.storage import RAGStore
from src.utils import get_logger

logger = get_logger(__name__)


class RAGPipeline:
    """Orchestrates document ingestion pipeline."""

    def __init__(self) -> None:
        self.store = RAGStore()

    async def initialize(self) -> None:
        """Initialize pipeline components."""
        await self.store.initialize()
        logger.info("RAG pipeline initialized")

    async def process_document(
        self,
        content: bytes,
        mime_type: str,
        project_id: str,
        source_uri: str,
        config: PipelineConfig,
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> str:
        """
        Process a document through the full pipeline.

        Returns:
            source_id of the processed document
        """
        source_id = None

        try:
            # 1. Create source record
            source = await self.store.create_source(
                project_id=project_id,
                source_type=SourceType.UPLOAD.value,
                source_uri=source_uri,
                user_id=user_id,
                mime_type=mime_type,
                file_size_bytes=len(content),
                metadata=metadata or {},
            )
            source_id = source.id

            # Update status to processing
            await self.store.update_source_status(source_id, ProcessingStatus.PROCESSING)

            # 2. Parse document
            logger.info("Parsing document", source_id=source_id, mime_type=mime_type)
            parser = get_parser(mime_type)
            parsed = await parser.parse(content, metadata or {})

            text = parsed["text"]
            structure = parsed.get("structure", [])

            # 3. Chunk document
            logger.info(
                "Chunking document",
                source_id=source_id,
                strategy=config.chunking_strategy,
            )
            chunker = get_chunker(config.chunking_strategy)
            chunks = await chunker.chunk(
                text=text,
                config={
                    "chunk_size": config.chunk_size,
                    "chunk_overlap": config.chunk_overlap,
                    "parent_chunk_size": config.parent_chunk_size,
                },
                structure=structure,
            )

            logger.info("Created chunks", count=len(chunks), source_id=source_id)

            # 4. Prepare chunks for storage
            chunk_data = []
            for i, chunk in enumerate(chunks):
                chunk_dict = {
                    "source_id": source_id,
                    "project_id": project_id,
                    "user_id": user_id,
                    "chunk_index": i,
                    "chunk_level": chunk["chunk_level"],
                    "parent_chunk_id": None,  # Will be resolved if needed
                    "content": chunk["content"],
                    "content_hash": chunker.calculate_hash(chunk["content"]),
                    "token_count": chunk["token_count"],
                    "metadata": chunk.get("metadata", {}),
                    "generate_embedding": config.generate_embeddings,
                }
                chunk_data.append(chunk_dict)

            # 5. Store chunks
            await self.store.batch_create_chunks(chunk_data)

            # 6. Update source status
            await self.store.update_source_status(source_id, ProcessingStatus.COMPLETED)

            logger.info(
                "Document processing completed",
                source_id=source_id,
                chunks_created=len(chunks),
            )

            return source_id

        except Exception as e:
            logger.error("Pipeline processing failed", error=str(e), source_id=source_id)
            if source_id:
                await self.store.update_source_status(
                    source_id,
                    ProcessingStatus.FAILED,
                    error_message=str(e),
                )
            raise
