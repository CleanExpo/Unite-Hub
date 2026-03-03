"""
Search API Routes

Implements document search using PostgreSQL full-text search (tsvector).
Uses SQLAlchemy ORM for type-safe queries and async/await pattern.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.error_handling import create_error_response
from src.auth.jwt import decode_access_token
from src.config.database import get_async_db
from src.db.models import Document, User
from src.utils import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/search", tags=["Search"])


# Response Models
class SearchResultItem(BaseModel):
    """Individual search result."""

    id: str
    title: str
    type: str | None = None
    snippet: str = Field(description="Content preview/highlight")
    relevance: float = Field(description="Relevance score 0-1")


class SearchResponse(BaseModel):
    """Paginated search results."""

    results: list[SearchResultItem]
    total: int = Field(description="Total matching documents")
    limit: int = Field(description="Results per page")
    offset: int = Field(description="Pagination offset")


# Request Models
class SearchRequest(BaseModel):
    """Search request parameters."""

    query: str = Field(min_length=1, description="Search query string")
    type: str | None = Field(None, description="Filter by document type")
    limit: int = Field(default=20, ge=1, le=100, description="Results per page")
    offset: int = Field(default=0, ge=0, description="Pagination offset")


async def get_current_user_id(
    authorization: str | None = None,
) -> str | None:
    """
    Extract user ID from JWT token in Authorization header.

    Args:
        authorization: Authorization header (Bearer <token>)

    Returns:
        User email if valid token, None for unauthenticated requests
    """
    if not authorization:
        return None

    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]
    payload = decode_access_token(token)

    if payload is None:
        return None

    return payload.get("sub")


@router.post(
    "",
    response_model=SearchResponse,
    summary="Search documents",
    description="Search documents using PostgreSQL full-text search with pagination",
    responses={
        400: {"description": "Invalid search query"},
        401: {"description": "Unauthorized"},
    },
)
async def search_documents(
    request: Request,
    search_request: SearchRequest,
    authorization: str | None = Query(None, description="Authorization header with JWT token"),
    db: AsyncSession = Depends(get_async_db),
) -> SearchResponse:
    """
    Search documents using PostgreSQL full-text search (tsvector).

    **Query Syntax:**
    - Simple words: "contractor"
    - Multiple words (AND): "contractor availability"
    - Phrases: Use individual words separated by spaces

    **Filtering:**
    - By type: Set type parameter (e.g., "contract", "policy")

    **Authentication:**
    - Optional: Send JWT token in Authorization header
    - If authenticated: Returns only user's documents
    - If not authenticated: Returns public/unowned documents

    **Response:**
    - results: List of matching documents with relevance scores
    - total: Total matching documents (not limited by pagination)
    - limit: Results per page (max 100)
    - offset: Pagination offset
    """
    try:
        # Validate search query
        query_text = search_request.query.strip()
        if not query_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Search query cannot be empty",
            )

        # Get current user (optional)
        user_email = await get_current_user_id(authorization)
        user_id = None

        if user_email:
            # Fetch user ID from database
            user_result = await db.execute(
                select(User.id).where(User.email == user_email)
            )
            user_id = user_result.scalar_one_or_none()

        # Build base query using SQLAlchemy ORM
        # Use PostgreSQL full-text search with to_tsvector
        # Match query words against document title and content
        fts_query = (
            select(
                Document.id,
                Document.title,
                Document.doc_metadata["type"].astext.label("doc_type"),
                Document.content,
                # Calculate relevance score using ts_rank
                func.ts_rank(
                    func.to_tsvector("english", Document.title + " " + Document.content),
                    func.plainto_tsquery("english", query_text),
                    32,  # RANK_CD flag for better normalization
                ).label("relevance"),
            )
            .where(
                # PostgreSQL full-text search: plainto_tsquery for safer parsing
                func.to_tsvector("english", Document.title + " " + Document.content).match(
                    func.plainto_tsquery("english", query_text)
                )
            )
        )

        # Filter by user if authenticated
        if user_id:
            fts_query = fts_query.where(Document.user_id == user_id)
        else:
            # Unauthenticated: only documents without a user_id
            fts_query = fts_query.where(Document.user_id.is_(None))

        # Filter by document type if provided
        if search_request.type:
            fts_query = fts_query.where(
                Document.doc_metadata["type"].astext == search_request.type
            )

        # Order by relevance score (descending)
        fts_query = fts_query.order_by(text("relevance DESC"))

        # Count total results (without pagination)
        count_query = fts_query.with_only_columns(func.count())
        total_result = await db.execute(count_query)
        total_count = total_result.scalar() or 0

        # Apply pagination
        paginated_query = fts_query.limit(search_request.limit).offset(search_request.offset)
        result = await db.execute(paginated_query)
        rows = result.all()

        # Format results
        results: list[SearchResultItem] = []
        for row in rows:
            doc_id, title, doc_type, content, relevance = row

            # Create snippet (first 150 chars of content)
            snippet = content[:150]
            if len(content) > 150:
                snippet += "..."

            results.append(
                SearchResultItem(
                    id=str(doc_id),
                    title=title,
                    type=doc_type,
                    snippet=snippet,
                    relevance=max(0.0, min(1.0, float(relevance or 0))),  # Normalize to 0-1
                )
            )

        return SearchResponse(
            results=results,
            total=total_count,
            limit=search_request.limit,
            offset=search_request.offset,
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning("Invalid search parameters", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid search parameters",
        )
    except Exception as e:
        logger.error("Search failed", error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Search operation failed",
            error_code="SEARCH_FAILED",
        )
