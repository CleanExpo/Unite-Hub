# API Versioning

> URL and header-based versioning with deprecation policies for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `api-versioning`                                         |
| **Category**   | API & Integration                                        |
| **Complexity** | Medium                                                   |
| **Complements**| `api-contract`, `changelog-generator`                    |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies API versioning patterns for NodeJS-Starter-V1: URL prefix versioning for FastAPI, header-based versioning for Next.js API routes, deprecation policies with sunset headers, version negotiation, migration guides, and backward-compatible evolution strategies.

---

## When to Apply

### Positive Triggers

- Introducing breaking changes to existing API endpoints
- Adding URL-based versioning (`/api/v1/`, `/api/v2/`) to FastAPI routes
- Implementing header-based version negotiation for the Next.js frontend
- Creating deprecation timelines and sunset policies for old versions
- Planning backward-compatible API evolution strategies

### Negative Triggers

- Database schema versioning (use Alembic migrations)
- Semantic versioning for npm/PyPI packages (use `changelog-generator` skill)
- Feature flags for gradual rollout (future `feature-flag` skill)
- Internal microservice contract evolution (use `api-contract` skill)

---

## Core Principles

### The Three Laws of API Versioning

1. **Version at the Router Level**: Group versioned endpoints under a single prefix (`/api/v1/`). Never version individual endpoints — it creates an inconsistent API surface.
2. **Deprecate Before Removing**: Every retired version must have a sunset period. Return `Deprecation` and `Sunset` headers for at least 90 days before removal.
3. **Default to Latest**: Unversioned requests route to the current stable version. Clients must opt-in to legacy versions, not opt-out.

---

## Pattern 1: URL Prefix Versioning (FastAPI)

### Router-Level Version Grouping

```python
from fastapi import APIRouter, FastAPI

# Version 1 router
v1_router = APIRouter(prefix="/api/v1", tags=["v1"])

@v1_router.get("/documents")
async def list_documents_v1():
    """V1: Returns flat document list."""
    return {"documents": [...]}

# Version 2 router
v2_router = APIRouter(prefix="/api/v2", tags=["v2"])

@v2_router.get("/documents")
async def list_documents_v2():
    """V2: Returns paginated documents with metadata."""
    return {"data": [...], "meta": {"total": 100, "page": 1}}

# Mount both versions
app = FastAPI()
app.include_router(v1_router)
app.include_router(v2_router)
```

**Project Reference**: `apps/backend/src/api/main.py` — all routers mount under `/api` without versioning. To introduce versioning: (1) rename existing routes to `/api/v1/`, (2) create new `/api/v2/` routers for breaking changes, (3) keep `/api/` as an alias to the latest stable version.

### Migration Strategy

```python
# Alias unversioned to latest
@app.get("/api/documents")
async def documents_latest():
    """Redirects to latest version."""
    return await list_documents_v2()
```

---

## Pattern 2: Header-Based Versioning (Next.js)

### Accept-Version Header

```typescript
import { NextRequest, NextResponse } from "next/server";

type VersionHandler = (request: NextRequest) => Promise<NextResponse>;

const VERSION_HANDLERS: Record<string, VersionHandler> = {
  "1": handleV1,
  "2": handleV2,
};

const CURRENT_VERSION = "2";

export async function GET(request: NextRequest) {
  const requestedVersion =
    request.headers.get("accept-version") ??
    request.nextUrl.searchParams.get("v") ??
    CURRENT_VERSION;

  const handler = VERSION_HANDLERS[requestedVersion];
  if (!handler) {
    return NextResponse.json(
      { error: `Unsupported API version: ${requestedVersion}` },
      { status: 400 },
    );
  }

  const response = await handler(request);

  // Add version headers
  response.headers.set("API-Version", requestedVersion);
  if (requestedVersion !== CURRENT_VERSION) {
    response.headers.set("Deprecation", "true");
    response.headers.set("Sunset", "2026-06-01T00:00:00Z");
  }

  return response;
}
```

**Use case**: When URL versioning is impractical (e.g., the frontend calls `/api/webhooks` and changing the URL would break provider configurations), use header-based versioning instead.

---

## Pattern 3: Deprecation Policy

### Sunset Headers and Timeline

```python
from datetime import date
from fastapi import Response


DEPRECATION_SCHEDULE: dict[str, date] = {
    "v1": date(2026, 6, 1),  # Sunset: 01/06/2026
}


def add_deprecation_headers(response: Response, version: str) -> None:
    """Add deprecation and sunset headers for old API versions."""
    sunset_date = DEPRECATION_SCHEDULE.get(version)
    if sunset_date:
        response.headers["Deprecation"] = "true"
        response.headers["Sunset"] = sunset_date.isoformat()
        response.headers["Link"] = (
            '</api/v2/docs>; rel="successor-version"'
        )
```

### Deprecation Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| **Announce** | Day 0 | Add `Deprecation: true` header to v1 responses |
| **Warn** | 0–60 days | Log warnings when v1 endpoints are called |
| **Sunset** | 60–90 days | Return `Sunset` header with removal date |
| **Remove** | Day 90+ | Return 410 Gone for v1 endpoints |

### 410 Gone Response

```python
@v1_router.get("/documents")
async def list_documents_v1_gone():
    """V1 has been sunset. Use V2."""
    return JSONResponse(
        status_code=410,
        content={
            "detail": "API v1 has been retired",
            "migration_guide": "/docs/migration/v1-to-v2",
            "current_version": "/api/v2/documents",
        },
    )
```

---

## Pattern 4: Backward-Compatible Evolution

### Non-Breaking Change Strategies

| Strategy | Example | Breaking? |
|----------|---------|:---------:|
| Add optional fields | New `metadata` field in response | No |
| Add new endpoints | `GET /api/v1/documents/stats` | No |
| Add query parameters | `?include=metadata` | No |
| Change field type | `id: number` → `id: string` | **Yes** |
| Remove fields | Drop `legacy_status` from response | **Yes** |
| Rename endpoints | `/users` → `/accounts` | **Yes** |

**Rule**: If a change is non-breaking, add it to the current version. Only create a new version for breaking changes. Over-versioning fragments the API and increases maintenance burden.

---

## Pattern 5: Version Discovery Endpoint

### API Version Metadata

```python
@app.get("/api/versions")
async def list_versions():
    """List all API versions with their status."""
    return {
        "versions": [
            {
                "version": "v1",
                "status": "deprecated",
                "sunset": "2026-06-01",
                "docs": "/api/v1/docs",
            },
            {
                "version": "v2",
                "status": "stable",
                "docs": "/api/v2/docs",
            },
        ],
        "current": "v2",
    }
```

**Complements**: `changelog-generator` skill — link each version to its changelog entry. `api-contract` skill — generate OpenAPI specs per version.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Versioning individual endpoints | Inconsistent API surface | Version at the router/prefix level |
| No deprecation period | Clients break without warning | 90-day sunset with headers |
| Creating a new version for every change | Version explosion, maintenance burden | Only version for breaking changes |
| No version discovery endpoint | Clients cannot find available versions | `/api/versions` metadata endpoint |
| Hardcoded version in frontend | Version change requires frontend deploy | Read version from config or header |
| Removing old version without 410 | Clients get confusing 404 errors | Return 410 Gone with migration guide |

---

## Checklist

Before merging api-versioning changes:

- [ ] URL prefix versioning for FastAPI (`/api/v1/`, `/api/v2/`)
- [ ] Unversioned `/api/` routes alias to latest stable version
- [ ] `Deprecation` and `Sunset` headers on deprecated versions
- [ ] 90-day deprecation timeline documented and enforced
- [ ] 410 Gone responses for retired versions with migration links
- [ ] Version discovery endpoint at `/api/versions`
- [ ] Non-breaking changes added to current version, not new version

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### API Versioning Implementation

**Strategy**: [URL prefix / header-based / query param]
**Current Version**: [v1 / v2]
**Deprecated Versions**: [list with sunset dates]
**Deprecation Period**: [90 days / custom]
**Discovery Endpoint**: [/api/versions / disabled]
**Migration Guide**: [documented / not yet]
```
