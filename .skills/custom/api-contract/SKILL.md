---
name: api-contract
description: >-
  Typed API contract patterns enforcing consistency between FastAPI backend
  (Pydantic response models) and Next.js frontend (Zod response schemas).
  Covers schema location conventions, OpenAPI documentation, error response
  contracts, and versioning strategy.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '1.0.0'
  locale: en-AU
---

# API Contract - Typed Frontend/Backend Contracts

Ensures every API endpoint has a typed contract: Pydantic models on the backend, Zod response schemas on the frontend, and documented error responses. Bridges the gap between `apps/backend/src/api/` and `apps/web/lib/api/`.

## Description

Enforces type-safe API contracts across the FastAPI backend and Next.js frontend. Every endpoint must declare a Pydantic `response_model`, have a matching Zod schema on the frontend, and document error responses via OpenAPI. Prevents schema drift, untyped responses, and manual type definitions by mandating a single source of truth through the Contract Triangle pattern.

## When to Apply

### Positive Triggers

- Creating or modifying API endpoints (FastAPI routes)
- Adding frontend API calls (`apiClient.get/post/put/patch/delete`)
- Reviewing type safety between backend responses and frontend consumers
- Documenting API error responses
- Planning API versioning or deprecation
- User mentions: "API contract", "endpoint", "response type", "OpenAPI", "schema"

### Negative Triggers

- Validating user input forms (use `data-validation` instead)
- Classifying error codes (use `error-taxonomy` instead)
- Implementing retry logic or resilience (use `retry-strategy` when available)
- Working on WebSocket or real-time protocols (separate concern)

## Core Directives

### The Contract Triangle

```
Backend (Pydantic)  ←──  Contract  ──→  Frontend (Zod)
        ↓                                     ↓
   response_model                      z.infer<typeof schema>
        ↓                                     ↓
   OpenAPI spec                        Type-safe apiClient
```

Every endpoint must have:

1. **Backend**: Pydantic `response_model` on the route decorator
2. **Frontend**: Zod schema validating the response shape
3. **Documentation**: Error responses listed in `responses={}` dict

### Field Name Convention

Use **snake_case** consistently across both sides:

```python
# Backend (Pydantic)
class DocumentItem(BaseModel):
    created_at: datetime
    error_code: str
```

```typescript
// Frontend (Zod) — mirror the snake_case
const documentItemSchema = z.object({
  created_at: z.string().datetime(),
  error_code: z.string(),
});
```

Do NOT convert to camelCase on the frontend. The API contract is snake_case end-to-end.

---

## Backend Patterns (FastAPI + Pydantic)

### Schema Location Convention

The project already uses two patterns. Standardise to:

| Schema Scope | Location | When to Use |
|-------------|---------|-------------|
| Route-specific | Inline in route file | Used by 1 endpoint only (e.g., `DocumentCreateRequest`) |
| Shared across routes | `apps/backend/src/api/schemas/{domain}.py` | Used by 2+ endpoints or referenced by frontend |
| Domain models | `apps/backend/src/models/` | Business logic models, not request/response shapes |

**Existing examples**:
- Inline: `apps/backend/src/api/routes/documents.py` (DocumentItem, DocumentListResponse)
- Shared: `apps/backend/src/api/schemas/workflow_builder.py` (WorkflowNodeResponse, etc.)
- Domain: `apps/backend/src/models/contractor.py` (Contractor, Location, ErrorResponse)

### Response Model on Every Route

Every route MUST declare `response_model`:

```python
# GOOD: Explicit response model
@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List documents",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorised"},
        500: {"model": ErrorResponse, "description": "Internal error"},
    },
)
async def list_documents(...) -> DocumentListResponse:
    ...

# BAD: Untyped dict response
@router.get("/data")
async def get_data() -> dict:
    return {"stuff": "things"}
```

### Standard Response Wrappers

Use consistent wrapper patterns for list endpoints:

```python
from pydantic import BaseModel, Field


class PaginationInfo(BaseModel):
    """Reusable pagination metadata."""

    total: int = Field(description="Total matching items")
    limit: int = Field(description="Results per page")
    offset: int = Field(description="Current offset")
    pages: int = Field(description="Total number of pages")


class PaginatedResponse(BaseModel):
    """Generic paginated response base. Subclass with typed `data` field."""

    pagination: PaginationInfo
```

Subclass for each domain:

```python
class DocumentListResponse(BaseModel):
    data: list[DocumentItem]
    pagination: PaginationInfo
```

### Error Response Contract

Every route should document error responses using the `ErrorResponse` model from `error-taxonomy`:

```python
from src.models.contractor import ErrorResponse

@router.post(
    "",
    response_model=DocumentItem,
    status_code=201,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorised"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        409: {"model": ErrorResponse, "description": "Duplicate resource"},
    },
)
```

### OpenAPI Metadata

Ensure every route has:

```python
@router.get(
    "/path",
    response_model=ResponseType,           # Required
    summary="Short description",            # Required (appears in sidebar)
    description="Detailed description",     # Recommended
    tags=["Domain"],                        # Required (groups in docs)
    responses={...},                        # Required (error documentation)
)
```

The FastAPI app already generates OpenAPI at `/docs` (Swagger) and `/redoc`.

---

## Frontend Patterns (Zod + apiClient)

### Response Schema Convention

Create Zod schemas that mirror backend Pydantic models:

```typescript
// apps/web/lib/api/schemas/documents.ts
import * as z from 'zod';

// Mirror of backend DocumentItem
const documentItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  metadata: z.record(z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
});

// Mirror of backend PaginationInfo
const paginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  pages: z.number(),
});

// Mirror of backend DocumentListResponse
const documentListResponseSchema = z.object({
  data: z.array(documentItemSchema),
  pagination: paginationSchema,
});

// Infer types — never define manually
type DocumentItem = z.infer<typeof documentItemSchema>;
type DocumentListResponse = z.infer<typeof documentListResponseSchema>;

export {
  documentItemSchema,
  documentListResponseSchema,
  type DocumentItem,
  type DocumentListResponse,
};
```

### Schema File Location

```
apps/web/lib/api/
├── client.ts              # Existing fetch wrapper
├── auth.ts                # Existing auth API
└── schemas/               # NEW: Response schemas
    ├── common.ts          # Pagination, ErrorResponse
    ├── documents.ts       # Document schemas
    ├── workflows.ts       # Workflow schemas
    ├── agents.ts          # Agent/discovery schemas
    └── contractors.ts     # Contractor schemas
```

### Validated API Calls

Wrap `apiClient` calls with Zod parsing for runtime safety:

```typescript
import { apiClient } from '@/lib/api/client';
import {
  documentListResponseSchema,
  type DocumentListResponse,
} from '@/lib/api/schemas/documents';

export async function listDocuments(
  params?: { limit?: number; offset?: number }
): Promise<DocumentListResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));

  const raw = await apiClient.get(`/api/documents?${query}`);
  return documentListResponseSchema.parse(raw);
}
```

### Error Response Schema

Mirror the backend `ErrorResponse` on the frontend:

```typescript
// apps/web/lib/api/schemas/common.ts
import * as z from 'zod';

const errorResponseSchema = z.object({
  detail: z.string(),
  error_code: z.string().optional(),
  severity: z.enum(['fatal', 'error', 'warning']).optional(),
  field: z.string().optional(),
});

type ErrorResponse = z.infer<typeof errorResponseSchema>;

export { errorResponseSchema, type ErrorResponse };
```

---

## Contract Checklist

When adding or modifying an API endpoint:

### Backend

- [ ] Route has `response_model` declared
- [ ] Route has `summary` and `tags`
- [ ] Error responses documented in `responses={}` dict
- [ ] Pydantic model has `Field(description=...)` on all fields
- [ ] Schema uses `ConfigDict(from_attributes=True)` if mapping from ORM

### Frontend

- [ ] Matching Zod schema exists in `apps/web/lib/api/schemas/`
- [ ] Types inferred via `z.infer`, not manually defined
- [ ] API call parses response through Zod schema
- [ ] Field names match backend snake_case exactly

### Cross-Stack

- [ ] Field names identical between Pydantic and Zod schemas
- [ ] Nullable fields use `Optional` (backend) and `.nullable()` (frontend)
- [ ] Date fields use ISO 8601 strings in transit
- [ ] Pagination follows the `PaginationInfo` pattern

---

## Versioning Strategy

### URL-Based Versioning (When Ready)

When the API needs breaking changes:

```python
# apps/backend/src/api/main.py

# Version 1 (current)
app.include_router(documents.router, prefix="/api/v1", tags=["Documents v1"])

# Version 2 (new)
app.include_router(documents_v2.router, prefix="/api/v2", tags=["Documents v2"])
```

### Deprecation Headers

Mark deprecated endpoints with headers:

```python
from fastapi import Response

@router.get("/old-endpoint", deprecated=True)
async def old_endpoint(response: Response):
    response.headers["Deprecation"] = "true"
    response.headers["Sunset"] = "2026-06-01"
    response.headers["Link"] = '</api/v2/new-endpoint>; rel="successor-version"'
    return {"data": "still works"}
```

### Breaking Change Rules

A change is **breaking** if it:

- Removes a field from a response
- Changes a field's type
- Makes an optional request field required
- Changes the URL path or method
- Removes an endpoint

A change is **non-breaking** if it:

- Adds a new optional field to a response
- Adds a new optional query parameter
- Adds a new endpoint
- Adds a new enum value

---

## Detection Rules

Grep for contract violations:

```bash
# Backend: Routes missing response_model
rg "def (get|post|put|patch|delete)_" apps/backend/src/api/routes/ | \
  rg -v "response_model"

# Backend: Routes returning raw dict
rg "-> dict" apps/backend/src/api/routes/

# Frontend: Unvalidated API calls (no .parse())
rg "apiClient\.(get|post|put|patch|delete)" apps/web/ | \
  rg -v "Schema\.parse"
```

## Anti-Patterns

| Pattern | Problem | Correct Approach |
| ------- | ------- | ---------------- |
| Untyped API responses (`-> dict`) | No compile-time or runtime validation, silent breakage | Declare `response_model` on every route with a Pydantic model |
| Frontend/backend schema drift | Field mismatches cause runtime errors in production | Mirror Pydantic models with Zod schemas; validate with `.parse()` |
| No response envelope pattern | Inconsistent list responses, missing pagination metadata | Use `PaginatedResponse` wrapper with `data` and `pagination` fields |
| Manual type synchronisation | Types fall out of sync as endpoints evolve | Infer frontend types via `z.infer<typeof schema>`, never define manually |
| Missing error response documentation | Consumers cannot handle failures gracefully | Document all error codes in `responses={}` dict using `ErrorResponse` model |

## Checklist

- [ ] Pydantic `response_model` defined on every route decorator
- [ ] Zod client schemas match backend Pydantic models (field names, types, nullability)
- [ ] API envelope pattern used for list endpoints (`data` + `pagination`)
- [ ] OpenAPI spec generated with `summary`, `tags`, and `responses` on all routes
- [ ] Error responses documented using `ErrorResponse` model
- [ ] Frontend API calls parse responses through Zod schemas (`.parse()`)

## Response Format

```
[AGENT_ACTIVATED]: API Contract
[PHASE]: {Audit | Implementation | Review}
[STATUS]: {in_progress | complete}

{contract analysis or implementation guidance}

[NEXT_ACTION]: {what to do next}
```

## Integration Points

### Error Taxonomy

Error responses use `ErrorResponse` from `error-taxonomy`. Every `responses={}` dict references the canonical error model.

### Data Validation

`data-validation` handles **request** validation (Zod for forms, Pydantic for bodies). `api-contract` handles **response** validation (Zod schemas mirroring Pydantic response models).

```
Request:  User → Zod (form) → fetch → Pydantic (body) → Service
Response: Service → Pydantic (response_model) → JSON → Zod (parse) → Component
```

### Council of Logic (Shannon Check)

- Response schemas must be minimal — return only what the frontend needs
- No duplicating the same schema across multiple files — compose from shared base schemas
- Pagination wrapper is reusable, not redefined per domain

## Australian Localisation (en-AU)

- **Date Format**: ISO 8601 in API transit; DD/MM/YYYY in UI display
- **Currency**: AUD ($) — amounts as integers (cents) in API, formatted in UI
- **Spelling**: serialisation, authorisation, organisation, analyse, centre, colour
- **Timezone**: AEST/AEDT — store UTC in database, convert in frontend
