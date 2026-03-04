"""
Document Management API Routes

CRUD operations for documents with filtering, sorting, and pagination.
Uses SQLAlchemy ORM for type-safe queries and async/await pattern.
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.error_handling import create_error_response
from src.auth.jwt import decode_access_token
from src.config.database import get_async_db
from src.db.models import Document, User
from src.utils import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/documents", tags=["Documents"])


# Response Models
class DocumentItem(BaseModel):
    """Document response model."""

    id: str
    title: str
    content: str | None = Field(None, description="Document content (preview only for lists)")
    metadata: dict = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class PaginationInfo(BaseModel):
    """Pagination information."""

    total: int = Field(description="Total matching documents")
    limit: int = Field(description="Results per page")
    offset: int = Field(description="Pagination offset")
    pages: int = Field(description="Total number of pages")


class DocumentListResponse(BaseModel):
    """Paginated list of documents."""

    data: list[DocumentItem]
    pagination: PaginationInfo


class DocumentCreateRequest(BaseModel):
    """Create document request."""

    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    metadata: dict = Field(default_factory=dict)


class DocumentUpdateRequest(BaseModel):
    """Update document request."""

    title: str | None = Field(None, min_length=1, max_length=255)
    content: str | None = Field(None, min_length=1)
    metadata: dict | None = Field(None)


async def get_current_user_id(
    authorization: str | None = None,
) -> str | None:
    """
    Extract user ID from JWT token in Authorization header.

    Args:
        authorization: Authorization header (Bearer <token>)

    Returns:
        User email if valid token, None if not authenticated
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


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List documents",
    description="Get paginated list of documents with filtering and sorting",
)
async def list_documents(
    request: Request,
    authorization: str | None = Query(None, description="Authorization header with JWT token"),
    # Filtering
    type: str | None = Query(None, description="Filter by document type"),
    author_id: str | None = Query(None, description="Filter by author (user_id)"),
    created_after: datetime | None = Query(None, description="Filter by creation date (>=)"),
    created_before: datetime | None = Query(None, description="Filter by creation date (<=)"),
    # Sorting
    sort_by: str = Query(
        "created",
        regex="^(created|updated|title)$",
        description="Sort field: created, updated, or title",
    ),
    sort_order: str = Query(
        "desc",
        regex="^(asc|desc)$",
        description="Sort order: asc or desc",
    ),
    # Pagination
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: AsyncSession = Depends(get_async_db),
) -> DocumentListResponse:
    """
    List documents with optional filtering and sorting.

    **Filtering:**
    - `type`: Filter by document type from metadata
    - `author_id`: Filter by document owner (user_id)
    - `created_after`: Filter documents created on or after this date
    - `created_before`: Filter documents created on or before this date

    **Sorting:**
    - `sort_by`: Field to sort by (created, updated, title)
    - `sort_order`: Sort direction (asc, desc)

    **Pagination:**
    - `limit`: Results per page (1-100, default 20)
    - `offset`: Skip this many results (for pagination)

    **Authentication:**
    - Optional: Send JWT token in Authorization header
    - If authenticated: Returns only user's documents
    - If not authenticated: Returns public/unowned documents
    """
    try:
        # Get current user (optional)
        user_email = await get_current_user_id(authorization)
        user_id = None

        if user_email:
            # Fetch user ID from database
            user_result = await db.execute(
                select(User.id).where(User.email == user_email)
            )
            user_id = user_result.scalar_one_or_none()

        # Build base query
        query = select(Document)

        # Apply filters
        filters = []

        # Filter by user if authenticated
        if user_id:
            filters.append(Document.user_id == user_id)
        else:
            # Unauthenticated: only public documents
            filters.append(Document.user_id.is_(None))

        # Filter by document type
        if type:
            filters.append(Document.doc_metadata["type"].astext == type)

        # Filter by author (if different from current user)
        if author_id:
            try:
                author_uuid = UUID(author_id)
                filters.append(Document.user_id == author_uuid)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid author_id format: {author_id}",
                )

        # Filter by created date range
        if created_after:
            filters.append(Document.created_at >= created_after)

        if created_before:
            filters.append(Document.created_at <= created_before)

        # Combine all filters with AND
        if filters:
            query = query.where(and_(*filters))

        # Apply sorting
        sort_column = {
            "created": Document.created_at,
            "updated": Document.updated_at,
            "title": Document.title,
        }.get(sort_by, Document.created_at)

        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        # Count total results
        count_query = select(func.count()).select_from(Document)
        if filters:
            count_query = count_query.where(and_(*filters))
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        # Apply pagination
        query = query.limit(limit).offset(offset)
        result = await db.execute(query)
        documents = result.scalars().all()

        # Format results
        items = [
            DocumentItem(
                id=str(doc.id),
                title=doc.title,
                content=doc.content[:200] + "..." if len(doc.content) > 200 else doc.content,
                metadata=doc.doc_metadata or {},
                created_at=doc.created_at,
                updated_at=doc.updated_at,
            )
            for doc in documents
        ]

        # Calculate pagination
        pages = (total_count + limit - 1) // limit if total_count > 0 else 0

        return DocumentListResponse(
            data=items,
            pagination=PaginationInfo(
                total=total_count,
                limit=limit,
                offset=offset,
                pages=pages,
            ),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list documents", error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to retrieve documents",
            error_code="LIST_DOCUMENTS_FAILED",
        )


@router.post(
    "",
    response_model=DocumentItem,
    status_code=status.HTTP_201_CREATED,
    summary="Create document",
    description="Create a new document",
    responses={
        401: {"description": "Unauthorized (authentication required)"},
    },
)
async def create_document(
    request: Request,
    document: DocumentCreateRequest,
    authorization: str | None = Query(None, description="Authorization header with JWT token"),
    db: AsyncSession = Depends(get_async_db),
) -> DocumentItem:
    """
    Create a new document.

    **Authentication:** Required - must provide JWT token in Authorization header

    **Request:**
    - `title`: Document title (required)
    - `content`: Document content (required)
    - `metadata`: Optional metadata object (e.g., `{"type": "contract"}`)

    **Response:** Created document with id and timestamps
    """
    try:
        # Get current user (required for creation)
        user_email = await get_current_user_id(authorization)
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to create documents",
            )

        # Fetch user ID
        user_result = await db.execute(
            select(User.id).where(User.email == user_email)
        )
        user_id = user_result.scalar_one_or_none()

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        # Create document
        new_doc = Document(
            user_id=user_id,
            title=document.title,
            content=document.content,
            metadata=document.doc_metadata or {},
        )

        db.add(new_doc)
        await db.commit()
        await db.refresh(new_doc)

        return DocumentItem(
            id=str(new_doc.id),
            title=new_doc.title,
            content=new_doc.content,
            metadata=new_doc.doc_metadata or {},
            created_at=new_doc.created_at,
            updated_at=new_doc.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create document", error=str(e))
        await db.rollback()
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to create document",
            error_code="CREATE_DOCUMENT_FAILED",
        )


@router.get(
    "/{document_id}",
    response_model=DocumentItem,
    summary="Get document",
    description="Retrieve a single document by ID",
    responses={
        404: {"description": "Document not found"},
    },
)
async def get_document(
    request: Request,
    document_id: str,
    authorization: str | None = Query(None, description="Authorization header with JWT token"),
    db: AsyncSession = Depends(get_async_db),
) -> DocumentItem:
    """
    Get a single document by ID.

    **Authentication:** Optional
    - If authenticated: Can access own documents
    - If not authenticated: Can only access public documents

    **Response:** Full document details
    """
    try:
        # Validate UUID format
        try:
            doc_uuid = UUID(document_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document ID format: {document_id}",
            )

        # Get current user (optional)
        user_email = await get_current_user_id(authorization)
        user_id = None

        if user_email:
            user_result = await db.execute(
                select(User.id).where(User.email == user_email)
            )
            user_id = user_result.scalar_one_or_none()

        # Build query
        query = select(Document).where(Document.id == doc_uuid)

        # Filter by ownership or public access
        if user_id:
            query = query.where(
                (Document.user_id == user_id) | (Document.user_id.is_(None))
            )
        else:
            query = query.where(Document.user_id.is_(None))

        result = await db.execute(query)
        document = result.scalar_one_or_none()

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_id} not found",
            )

        return DocumentItem(
            id=str(document.id),
            title=document.title,
            content=document.content,
            metadata=document.doc_metadata or {},
            created_at=document.created_at,
            updated_at=document.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to retrieve document", error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to retrieve document",
            error_code="GET_DOCUMENT_FAILED",
        )


@router.patch(
    "/{document_id}",
    response_model=DocumentItem,
    summary="Update document",
    description="Update an existing document (partial update)",
    responses={
        401: {"description": "Unauthorized (not document owner)"},
        404: {"description": "Document not found"},
    },
)
async def update_document(
    request: Request,
    document_id: str,
    updates: DocumentUpdateRequest,
    authorization: str | None = Query(None, description="Authorization header with JWT token"),
    db: AsyncSession = Depends(get_async_db),
) -> DocumentItem:
    """
    Update a document (partial update).

    **Authentication:** Required - must be document owner

    **Request:** Provide only fields to update:
    - `title`: New title (optional)
    - `content`: New content (optional)
    - `metadata`: Updated metadata (optional)

    **Response:** Updated document
    """
    try:
        # Validate UUID format
        try:
            doc_uuid = UUID(document_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document ID format: {document_id}",
            )

        # Get current user (required)
        user_email = await get_current_user_id(authorization)
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to update documents",
            )

        # Fetch user ID
        user_result = await db.execute(
            select(User.id).where(User.email == user_email)
        )
        user_id = user_result.scalar_one_or_none()

        # Get document
        query = select(Document).where(
            and_(Document.id == doc_uuid, Document.user_id == user_id)
        )
        result = await db.execute(query)
        document = result.scalar_one_or_none()

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_id} not found or you don't have permission",
            )

        # Apply updates
        if updates.title is not None:
            document.title = updates.title
        if updates.content is not None:
            document.content = updates.content
        if updates.metadata is not None:
            document.doc_metadata = updates.metadata

        await db.commit()
        await db.refresh(document)

        return DocumentItem(
            id=str(document.id),
            title=document.title,
            content=document.content,
            metadata=document.doc_metadata or {},
            created_at=document.created_at,
            updated_at=document.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update document", error=str(e))
        await db.rollback()
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to update document",
            error_code="UPDATE_DOCUMENT_FAILED",
        )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete document",
    description="Delete a document",
    responses={
        401: {"description": "Unauthorized (not document owner)"},
        404: {"description": "Document not found"},
    },
)
async def delete_document(
    request: Request,
    document_id: str,
    authorization: str | None = Query(None, description="Authorization header with JWT token"),
    db: AsyncSession = Depends(get_async_db),
) -> None:
    """
    Delete a document.

    **Authentication:** Required - must be document owner

    **Response:** 204 No Content on success
    """
    try:
        # Validate UUID format
        try:
            doc_uuid = UUID(document_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document ID format: {document_id}",
            )

        # Get current user (required)
        user_email = await get_current_user_id(authorization)
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to delete documents",
            )

        # Fetch user ID
        user_result = await db.execute(
            select(User.id).where(User.email == user_email)
        )
        user_id = user_result.scalar_one_or_none()

        # Get document
        query = select(Document).where(
            and_(Document.id == doc_uuid, Document.user_id == user_id)
        )
        result = await db.execute(query)
        document = result.scalar_one_or_none()

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_id} not found or you don't have permission",
            )

        # Delete document
        await db.delete(document)
        await db.commit()

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete document", error=str(e))
        await db.rollback()
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to delete document",
            error_code="DELETE_DOCUMENT_FAILED",
        )
