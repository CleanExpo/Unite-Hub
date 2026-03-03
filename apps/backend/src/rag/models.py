"""Pydantic models for RAG pipeline."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class SourceType(str, Enum):
    """Document source types."""

    UPLOAD = "upload"
    URL = "url"
    GOOGLE_DRIVE = "google_drive"
    NOTION = "notion"
    CONFLUENCE = "confluence"
    GITHUB = "github"


class ProcessingStatus(str, Enum):
    """Document processing status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class ChunkingStrategy(str, Enum):
    """Chunking strategies."""

    FIXED_SIZE = "fixed_size"
    SEMANTIC = "semantic"
    RECURSIVE = "recursive"
    PARENT_CHILD = "parent_child"
    CODE_AWARE = "code_aware"


class SearchType(str, Enum):
    """Search types."""

    VECTOR = "vector"
    KEYWORD = "keyword"
    HYBRID = "hybrid"


class DocumentUploadRequest(BaseModel):
    """Request to upload a document."""

    project_id: str
    filename: str
    content: str  # Base64 encoded or text
    mime_type: str = "text/plain"
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class PipelineConfig(BaseModel):
    """Configuration for document processing pipeline."""

    chunking_strategy: ChunkingStrategy = ChunkingStrategy.PARENT_CHILD
    chunk_size: int = 512
    chunk_overlap: int = 50
    parent_chunk_size: int = 2048

    # Enrichment
    enable_summarization: bool = False
    enable_entity_extraction: bool = False
    enable_classification: bool = False

    # Indexing
    generate_embeddings: bool = True
    generate_keywords: bool = True


class DocumentSource(BaseModel):
    """Document source record."""

    id: str
    user_id: str | None = None
    project_id: str
    source_type: SourceType
    source_uri: str
    original_filename: str | None = None
    mime_type: str | None = None
    file_size_bytes: int | None = None
    status: ProcessingStatus
    error_message: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str
    processed_at: str | None = None


class DocumentChunk(BaseModel):
    """Document chunk record."""

    id: str
    source_id: str
    user_id: str | None = None
    project_id: str
    parent_chunk_id: str | None = None
    chunk_index: int
    chunk_level: int
    content: str
    content_hash: str
    token_count: int | None = None
    embedding: list[float] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    heading_hierarchy: list[str] = Field(default_factory=list)
    summary: str | None = None
    entities: list[dict[str, Any]] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    classification_tags: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str


class SearchRequest(BaseModel):
    """Search request."""

    query: str
    project_id: str
    search_type: SearchType = SearchType.HYBRID
    filters: dict[str, Any] = Field(default_factory=dict)
    limit: int = 10
    offset: int = 0
    vector_weight: float = 0.6
    keyword_weight: float = 0.4
    min_score: float = 0.5
    enable_reranking: bool = True


class SearchResult(BaseModel):
    """Search result item."""

    chunk_id: str
    source_id: str
    content: str
    vector_score: float
    keyword_score: float
    combined_score: float
    rerank_score: float | None = None
    metadata: dict[str, Any]
    heading_hierarchy: list[str]
    summary: str | None = None


class SearchResponse(BaseModel):
    """Search response."""

    query: str
    results: list[SearchResult]
    total_count: int
    search_type: SearchType
    execution_time_ms: float
    retrieved_at: str = Field(default_factory=lambda: datetime.now().isoformat())
