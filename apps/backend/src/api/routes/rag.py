"""RAG pipeline API routes."""

import time

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from src.api.error_handling import create_error_response
from src.rag.models import (
    PipelineConfig,
    SearchRequest,
    SearchResponse,
    SearchResult,
    SearchType,
)
from src.rag.pipeline import RAGPipeline
from src.rag.storage import RAGStore
from src.utils import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/rag", tags=["RAG"])

# Global instances (initialized on first use)
_pipeline: RAGPipeline | None = None
_store: RAGStore | None = None


async def get_pipeline() -> RAGPipeline:
    """Get initialized pipeline."""
    global _pipeline
    if _pipeline is None:
        _pipeline = RAGPipeline()
        await _pipeline.initialize()
    return _pipeline


async def get_store() -> RAGStore:
    """Get initialized store."""
    global _store
    if _store is None:
        _store = RAGStore()
        await _store.initialize()
    return _store


@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    project_id: str = Form(...),
    config: str | None = Form(None),
    user_id: str | None = Form(None),
) -> dict:
    """Upload and process a document."""
    try:
        # Read file
        content = await file.read()

        # Parse config
        pipeline_config = PipelineConfig()
        if config:
            import json

            config_dict = json.loads(config)
            pipeline_config = PipelineConfig(**config_dict)

        # Process through pipeline
        pipeline = await get_pipeline()
        source_id = await pipeline.process_document(
            content=content,
            mime_type=file.content_type or "text/plain",
            project_id=project_id,
            source_uri=file.filename or "upload",
            config=pipeline_config,
            user_id=user_id,
            metadata={"original_filename": file.filename},
        )

        return {
            "status": "success",
            "source_id": source_id,
            "message": "Document uploaded and processed",
        }

    except Exception as e:
        logger.error("Document upload failed", error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Document upload failed",
            error_code="UPLOAD_ERROR",
        )


@router.post("/search", response_model=SearchResponse)
async def search_documents(request: Request, search_request: SearchRequest) -> SearchResponse:
    """Search documents using vector, keyword, or hybrid search."""
    try:
        start_time = time.time()

        store = await get_store()

        # Execute search based on type
        if search_request.search_type == SearchType.HYBRID:
            results = await store.hybrid_search(
                query=search_request.query,
                project_id=search_request.project_id,
                vector_weight=search_request.vector_weight,
                keyword_weight=search_request.keyword_weight,
                limit=search_request.limit,
                threshold=search_request.min_score,
            )
        elif search_request.search_type == SearchType.VECTOR:
            results = await store.vector_search(
                query=search_request.query,
                project_id=search_request.project_id,
                limit=search_request.limit,
                threshold=search_request.min_score,
            )
        else:
            raise HTTPException(
                status_code=400, detail="Keyword-only search not yet implemented"
            )

        execution_time = (time.time() - start_time) * 1000

        # Format results
        search_results = [
            SearchResult(
                chunk_id=r["chunk_id"],
                source_id=r.get("source_id", ""),
                content=r["content"],
                vector_score=r.get("vector_score", 0.0),
                keyword_score=r.get("keyword_score", 0.0),
                combined_score=r.get("combined_score", 0.0),
                rerank_score=None,
                metadata=r.get("metadata", {}),
                heading_hierarchy=r.get("heading_hierarchy", []),
                summary=r.get("summary"),
            )
            for r in results
        ]

        return SearchResponse(
            query=search_request.query,
            results=search_results,
            total_count=len(search_results),
            search_type=search_request.search_type,
            execution_time_ms=execution_time,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Search failed", error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Search failed",
            error_code="SEARCH_ERROR",
        )


@router.get("/sources/{source_id}")
async def get_source(source_id: str) -> dict:
    """Get document source details."""
    store = await get_store()

    result = store.client.table("document_sources").select("*").eq("id", source_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Source not found")

    return result.data[0]
