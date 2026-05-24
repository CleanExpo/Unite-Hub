# Data Transform

> ETL pipelines, data mapping, normalisation, and streaming transforms for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `data-transform`                                         |
| **Category**   | Data Processing                                          |
| **Complexity** | Medium                                                   |
| **Complements**| `data-validation`, `csv-processor`, `queue-worker`       |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies data transformation patterns for NodeJS-Starter-V1: typed data mappers between API and database layers, ETL pipelines with validation steps, streaming transforms for large datasets, snake_case/camelCase conversion, Pydantic model-to-model transforms, and normalisation patterns for nested data.

---

## When to Apply

### Positive Triggers

- Mapping between database models and API response schemas
- Converting snake_case (Python) to camelCase (TypeScript) or vice versa
- Building ETL pipelines for data import/export
- Normalising nested API responses into flat structures
- Transforming data between different provider formats (Ollama ↔ Anthropic)
- Streaming large datasets through transformation steps

### Negative Triggers

- Input validation and sanitisation (use `data-validation` skill)
- CSV-specific parsing and generation (use `csv-processor` skill)
- Database migrations and schema changes (use Alembic directly)
- Search indexing transforms (use `search-indexer` skill)

---

## Core Principles

### The Three Laws of Data Transforms

1. **Type In, Type Out**: Every transform function takes a typed input and returns a typed output. No `Any → Any` mappers — they hide bugs.
2. **Validate at Boundaries, Transform Between**: Validate data on entry (API input) and exit (API output). Between those boundaries, transformations operate on already-validated types.
3. **Pipeline Over Nesting**: Compose transforms as a flat pipeline `A → B → C`, not nested calls `c(b(a(data)))`. Pipelines are debuggable; nesting is not.

---

## Pattern 1: Typed Data Mapper (Python)

### Model-to-Model Transform

```python
from pydantic import BaseModel


class UserDB(BaseModel):
    """Database representation."""
    id: str
    email: str
    full_name: str | None
    is_active: bool
    is_admin: bool
    created_at: str
    last_login_at: str | None


class UserResponse(BaseModel):
    """API response representation."""
    id: str
    email: str
    fullName: str | None
    isActive: bool
    role: str
    createdAt: str
    lastLoginAt: str | None


def user_db_to_response(user: UserDB) -> UserResponse:
    """Transform database user to API response."""
    return UserResponse(
        id=user.id,
        email=user.email,
        fullName=user.full_name,
        isActive=user.is_active,
        role="admin" if user.is_admin else "user",
        createdAt=user.created_at,
        lastLoginAt=user.last_login_at,
    )
```

**Project Reference**: `apps/backend/src/auth/models.py:52-62` — the `User.to_dict()` method returns a raw dict with snake_case keys. Replace with a typed `UserResponse` model for consistent API output.

---

## Pattern 2: Generic Case Converter (Python)

### Snake ↔ Camel Conversion

```python
import re


def to_camel_case(data: dict) -> dict:
    """Convert dict keys from snake_case to camelCase."""
    result = {}
    for key, value in data.items():
        camel_key = re.sub(r"_([a-z])", lambda m: m.group(1).upper(), key)
        if isinstance(value, dict):
            result[camel_key] = to_camel_case(value)
        elif isinstance(value, list):
            result[camel_key] = [
                to_camel_case(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            result[camel_key] = value
    return result


def to_snake_case(data: dict) -> dict:
    """Convert dict keys from camelCase to snake_case."""
    result = {}
    for key, value in data.items():
        snake_key = re.sub(r"([A-Z])", r"_\1", key).lower().lstrip("_")
        if isinstance(value, dict):
            result[snake_key] = to_snake_case(value)
        elif isinstance(value, list):
            result[snake_key] = [
                to_snake_case(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            result[snake_key] = value
    return result
```

**Use case**: FastAPI returns snake_case, Next.js expects camelCase. Apply `to_camel_case` in a FastAPI response middleware or in the `api-client` skill's response handler.

---

## Pattern 3: Transform Pipeline

### Composable Step-Based Pipeline

```python
from typing import Callable, TypeVar

T = TypeVar("T")


class Pipeline:
    """Composable data transformation pipeline."""

    def __init__(self, name: str) -> None:
        self.name = name
        self.steps: list[tuple[str, Callable]] = []

    def add(self, name: str, fn: Callable) -> "Pipeline":
        self.steps.append((name, fn))
        return self

    def execute(self, data: T) -> T:
        result = data
        for step_name, fn in self.steps:
            result = fn(result)
        return result
```

**Usage**:
```python
export_pipeline = (
    Pipeline("user-export")
    .add("fetch", lambda _: db.query(User).all())
    .add("to_dict", lambda users: [u.to_dict() for u in users])
    .add("camel_case", lambda rows: [to_camel_case(r) for r in rows])
    .add("filter_active", lambda rows: [r for r in rows if r["isActive"]])
)
result = export_pipeline.execute(None)
```

**Complements**: `csv-processor` skill — add a final `.add("to_csv", rows_to_csv)` step for CSV export. `queue-worker` skill — run heavy pipelines as background jobs.

---

## Pattern 4: Streaming Transform (Python)

### Generator-Based Large Dataset Processing

```python
from collections.abc import AsyncGenerator, Iterable
from typing import Callable


async def stream_transform(
    source: AsyncGenerator,
    transforms: list[Callable],
    batch_size: int = 100,
) -> AsyncGenerator:
    """Apply transforms to a stream of records in batches."""
    batch: list = []
    async for record in source:
        batch.append(record)
        if len(batch) >= batch_size:
            for transform in transforms:
                batch = [transform(item) for item in batch]
            for item in batch:
                yield item
            batch = []

    # Flush remaining
    if batch:
        for transform in transforms:
            batch = [transform(item) for item in batch]
        for item in batch:
            yield item
```

**Use case**: Transforming thousands of documents for re-indexing without loading all into memory. Pairs with `search-indexer` for bulk index rebuilds.

---

## Pattern 5: Provider Response Normalisation

### Unified AI Response Format

```python
class NormalisedAIResponse(BaseModel):
    """Unified response from any AI provider."""
    content: str
    model: str
    provider: str
    usage: dict[str, int]  # prompt_tokens, completion_tokens, total_tokens
    latency_ms: float


def normalise_ollama_response(raw: dict) -> NormalisedAIResponse:
    return NormalisedAIResponse(
        content=raw["message"]["content"],
        model=raw["model"],
        provider="ollama",
        usage={
            "prompt_tokens": raw.get("prompt_eval_count", 0),
            "completion_tokens": raw.get("eval_count", 0),
            "total_tokens": raw.get("prompt_eval_count", 0) + raw.get("eval_count", 0),
        },
        latency_ms=raw.get("total_duration", 0) / 1_000_000,
    )


def normalise_anthropic_response(raw: dict) -> NormalisedAIResponse:
    return NormalisedAIResponse(
        content=raw["content"][0]["text"],
        model=raw["model"],
        provider="anthropic",
        usage={
            "prompt_tokens": raw["usage"]["input_tokens"],
            "completion_tokens": raw["usage"]["output_tokens"],
            "total_tokens": raw["usage"]["input_tokens"] + raw["usage"]["output_tokens"],
        },
        latency_ms=0,  # Calculated by caller
    )
```

**Project Reference**: `apps/backend/src/models/ollama_provider.py` and `anthropic.py` — each provider returns different response shapes. The normalisation layer unifies them so downstream code (agents, metrics) doesn't need provider-specific parsing.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| `dict → dict` without types | Bugs hidden in key name typos | Pydantic model → Pydantic model |
| Nested transform calls `c(b(a(x)))` | Unreadable, hard to debug | Pipeline with named steps |
| Converting case in every handler | Duplicated, inconsistent | Middleware or interceptor-level conversion |
| Loading entire dataset for transform | Memory overflow on large data | Generator-based streaming transform |
| Different response shapes per provider | Every consumer needs provider checks | Normalised response model |
| Mixing validation and transformation | Unclear where errors originate | Validate at boundary, transform between |

---

## Checklist

Before merging data-transform changes:

- [ ] Typed mappers between database models and API response schemas
- [ ] Generic `to_camel_case` / `to_snake_case` converters handle nested data
- [ ] Transform pipeline with named steps for complex multi-step transforms
- [ ] Streaming transform for large datasets with configurable batch size
- [ ] AI provider response normalised to unified `NormalisedAIResponse`
- [ ] Case conversion applied at middleware level, not per-handler

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Data Transform Implementation

**Mapper Pattern**: [typed model-to-model / generic dict]
**Case Conversion**: [middleware / interceptor / manual]
**Pipeline**: [named steps / inline]
**Streaming**: [generator-based / batch / in-memory]
**Normalisation**: [AI providers / API responses / both]
```
