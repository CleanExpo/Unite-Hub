# GraphQL Patterns

> Schema design, resolver patterns, dataloader optimisation, and type-safe client integration for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `graphql-patterns`                                       |
| **Category**   | API & Integration                                        |
| **Complexity** | High                                                     |
| **Complements**| `api-contract`, `data-validation`, `cache-strategy`      |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies GraphQL patterns for NodeJS-Starter-V1: schema-first design with SDL, resolver patterns for FastAPI (Strawberry) and Next.js (Apollo/urql), dataloader for N+1 query prevention, pagination with cursor-based connections, error handling with union types, and type-safe client code generation.

---

## When to Apply

### Positive Triggers

- Adding a GraphQL API alongside the existing REST endpoints
- Implementing complex nested data queries that suffer from over/under-fetching
- Building real-time subscriptions for dashboard updates
- Generating type-safe client code from the GraphQL schema
- Implementing cursor-based pagination for large datasets

### Negative Triggers

- Simple CRUD endpoints (REST with `api-contract` is simpler)
- File uploads (use REST multipart endpoints)
- Webhook receivers (use `webhook-handler` skill)
- Rate limiting (use `rate-limiter` skill, applies to both REST and GraphQL)

---

## Core Principles

### The Three Laws of GraphQL

1. **Schema First**: Define the schema before writing resolvers. The schema is the contract — clients code against it, tools generate from it, documentation derives from it.
2. **Dataloader Everything**: Every resolver that touches the database must use a dataloader. N+1 queries are the most common GraphQL performance catastrophe.
3. **Errors Are Data**: Use union types for expected errors (`UserNotFoundError | User`). Reserve GraphQL errors for unexpected failures only.

---

## Pattern 1: Schema Design (Strawberry/Python)

### Type-Safe Schema with Strawberry

```python
import strawberry
from datetime import datetime


@strawberry.type
class User:
    id: str
    email: str
    full_name: str | None
    role: str
    created_at: datetime


@strawberry.type
class Document:
    id: str
    title: str
    content: str
    author: User
    created_at: datetime
    updated_at: datetime


@strawberry.type
class PageInfo:
    has_next_page: bool
    has_previous_page: bool
    start_cursor: str | None
    end_cursor: str | None


@strawberry.type
class DocumentEdge:
    cursor: str
    node: Document


@strawberry.type
class DocumentConnection:
    edges: list[DocumentEdge]
    page_info: PageInfo
    total_count: int
```

---

## Pattern 2: Resolvers with Dataloader

### N+1 Prevention

```python
from strawberry.dataloader import DataLoader


async def load_users(keys: list[str]) -> list[User]:
    """Batch load users by ID — called once per request batch."""
    users = await db.execute(
        select(UserModel).where(UserModel.id.in_(keys))
    )
    user_map = {str(u.id): u for u in users}
    return [user_map.get(key) for key in keys]


@strawberry.type
class Query:
    @strawberry.field
    async def documents(
        self,
        info,
        first: int = 20,
        after: str | None = None,
    ) -> DocumentConnection:
        """Paginated document list with cursor-based pagination."""
        query = select(DocumentModel).order_by(DocumentModel.created_at.desc())

        if after:
            cursor_date = decode_cursor(after)
            query = query.where(DocumentModel.created_at < cursor_date)

        query = query.limit(first + 1)
        results = await db.execute(query)
        docs = list(results)

        has_next = len(docs) > first
        if has_next:
            docs = docs[:first]

        edges = [
            DocumentEdge(
                cursor=encode_cursor(doc.created_at),
                node=await to_graphql_document(doc, info),
            )
            for doc in docs
        ]

        return DocumentConnection(
            edges=edges,
            page_info=PageInfo(
                has_next_page=has_next,
                has_previous_page=after is not None,
                start_cursor=edges[0].cursor if edges else None,
                end_cursor=edges[-1].cursor if edges else None,
            ),
            total_count=await get_total_count(),
        )


# Dataloader setup per request
def get_context():
    return {"user_loader": DataLoader(load_fn=load_users)}
```

---

## Pattern 3: Error Handling with Union Types

### Typed Errors as Data

```python
@strawberry.type
class NotFoundError:
    message: str
    entity: str


@strawberry.type
class ValidationError:
    message: str
    field: str


DocumentResult = strawberry.union("DocumentResult", [Document, NotFoundError, ValidationError])


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def update_document(
        self,
        id: str,
        title: str | None = None,
        content: str | None = None,
    ) -> DocumentResult:
        doc = await db.get(DocumentModel, id)
        if not doc:
            return NotFoundError(message=f"Document {id} not found", entity="Document")

        if title and len(title) > 500:
            return ValidationError(message="Title exceeds 500 characters", field="title")

        # Update and return
        if title:
            doc.title = title
        if content:
            doc.content = content
        await db.commit()

        return to_graphql_document(doc)
```

---

## Pattern 4: FastAPI + Strawberry Integration

### Mounting GraphQL on Existing API

```python
import strawberry
from strawberry.fastapi import GraphQLRouter

schema = strawberry.Schema(query=Query, mutation=Mutation)

graphql_router = GraphQLRouter(
    schema,
    context_getter=get_context,
    path="/graphql",
)

# Mount alongside REST routes
app.include_router(graphql_router, prefix="/api")
```

**Project Reference**: `apps/backend/src/api/main.py` — mount `graphql_router` alongside existing REST routers. GraphQL lives at `/api/graphql` while REST stays at `/api/v1/`.

---

## Pattern 5: Type-Safe Client (TypeScript)

### Code Generation from Schema

```typescript
// Generated types from GraphQL schema (via graphql-codegen)
interface DocumentsQuery {
  documents: {
    edges: {
      cursor: string;
      node: {
        id: string;
        title: string;
        content: string;
        author: { id: string; fullName: string | null };
      };
    }[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    totalCount: number;
  };
}

// Usage with urql or Apollo
const DOCUMENTS_QUERY = `
  query Documents($first: Int!, $after: String) {
    documents(first: $first, after: $after) {
      edges {
        cursor
        node { id title content author { id fullName } }
      }
      pageInfo { hasNextPage endCursor }
      totalCount
    }
  }
`;
```

**Complements**: `api-contract` skill — GraphQL schema serves as the typed contract between frontend and backend. `cache-strategy` skill — add response caching for frequently queried fields.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| No dataloader | N+1 queries on every nested field | DataLoader for all DB access |
| Throwing errors for expected cases | Client cannot distinguish error types | Union types for expected errors |
| Offset-based pagination | Inconsistent on data changes | Cursor-based connections |
| Exposing all database fields | Over-exposure, schema coupling | Purpose-built GraphQL types |
| No query depth limiting | Malicious nested queries crash server | Depth and complexity limits |

---

## Checklist

Before merging graphql-patterns changes:

- [ ] Strawberry schema with typed Query and Mutation
- [ ] DataLoader for all resolver database access
- [ ] Cursor-based pagination with `Connection` pattern
- [ ] Union types for expected errors
- [ ] GraphQL mounted at `/api/graphql` alongside REST
- [ ] Query depth and complexity limits configured
- [ ] Type-safe client code generation pipeline

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### GraphQL Implementation

**Library**: [Strawberry / Ariadne / Apollo Server]
**Schema**: [code-first / schema-first / SDL]
**Dataloader**: [per-request / global]
**Pagination**: [cursor-based connections / offset]
**Error Handling**: [union types / GraphQL errors]
**Client Codegen**: [graphql-codegen / manual types]
```
