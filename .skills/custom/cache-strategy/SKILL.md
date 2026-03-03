# Cache Strategy

> Caching patterns for Python (lru_cache, Redis) and Next.js (fetch cache, revalidation) in NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| **Skill ID**   | `cache-strategy`                                   |
| **Category**   | Data Processing                                    |
| **Complexity** | Medium                                             |
| **Complements**| `vector-search`, `api-contract`, `metrics-collector`|
| **Version**    | 1.0.0                                              |
| **Locale**     | en-AU                                              |

---

## Description

Codifies caching patterns across the NodeJS-Starter-V1 stack: Python in-memory caches (`@lru_cache`, dict caches), Redis integration (available via Docker Compose), Next.js fetch cache directives, and embedding vector caching. Covers cache-aside, write-through, TTL management, and invalidation strategies.

---

## When to Apply

### Positive Triggers

- Adding or modifying data access patterns that are read-heavy
- Implementing embedding or vector search queries (expensive to recompute)
- Configuring Next.js `fetch` with `cache` or `revalidate` options
- Setting up Redis for session, rate-limit, or query result caching
- Optimising API response times with memoisation
- Adding `@lru_cache` or `@functools.cache` decorators

### Negative Triggers

- Write-heavy paths where cache coherence cost exceeds read benefit
- Data that changes every request (real-time WebSocket streams)
- Security-sensitive data that must never be cached (tokens, passwords)
- One-shot batch operations that will not repeat

---

## Core Principles

### The Three Laws of Caching

1. **Cache Close to the Consumer**: Prefer in-process caches over network caches. Use Redis only when cross-process sharing is required.
2. **Bounded by Default**: Every cache entry must have a TTL or max-size bound. Unbounded caches are memory leaks.
3. **Invalidate Explicitly**: Never rely on TTL alone for correctness-critical data. Use explicit invalidation on write paths.

---

## Pattern 1: Python In-Memory Cache

### @lru_cache for Singleton Configuration

```python
from functools import lru_cache

@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance — computed once per process."""
    return Settings()
```

**Project Reference**: `apps/backend/src/config/settings.py:84-87` — `@lru_cache` on `get_settings()`. No `maxsize` parameter means unbounded (single entry for no-arg functions).

### Dict Cache with TTL

For caches that need expiration and size limits:

```python
import time
from typing import Any, TypeVar

T = TypeVar("T")

class TTLCache:
    """In-memory cache with TTL and max-size eviction."""

    def __init__(self, max_size: int = 256, ttl_seconds: int = 300) -> None:
        self._store: dict[str, tuple[Any, float]] = {}
        self._max_size = max_size
        self._ttl = ttl_seconds

    def get(self, key: str) -> Any | None:
        """Get a value if it exists and has not expired."""
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        """Set a value with TTL."""
        if len(self._store) >= self._max_size:
            self._evict_oldest()
        self._store[key] = (value, time.monotonic() + self._ttl)

    def invalidate(self, key: str) -> bool:
        """Explicitly invalidate a key."""
        return self._store.pop(key, None) is not None

    def clear(self) -> None:
        """Clear all entries."""
        self._store.clear()

    def _evict_oldest(self) -> None:
        """Evict the entry with the earliest expiry."""
        if not self._store:
            return
        oldest_key = min(self._store, key=lambda k: self._store[k][1])
        del self._store[oldest_key]
```

**Project Reference**: `apps/backend/src/skills/loader.py:22` — `self._cache: dict[str, dict[str, Any]]` is an unbounded dict cache without TTL. `apps/backend/src/agents/context_manager.py:48` — `self._context_cache: dict[str, Any]` with `clear_cache()` at line 443.

### When to Use Which

| Pattern | Use Case | Bound | TTL |
|---------|----------|:-----:|:---:|
| `@lru_cache` | Pure functions, singletons, config | `maxsize` param | No |
| `@lru_cache(maxsize=128)` | Repeated computations with bounded args | 128 entries | No |
| `TTLCache` | API responses, query results, embeddings | `max_size` param | Yes |
| Plain `dict` | Session-scoped scratch data (cleared on teardown) | Manual | No |

---

## Pattern 2: Redis Cache (Network)

### Infrastructure

Redis 7 is available via Docker Compose:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6380:6379"
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Project Reference**: `docker-compose.yml:24-33` — Redis service on port 6380 (mapped from 6379).

### Cache-Aside Pattern

The application checks the cache first; on miss, it queries the source and populates the cache:

```python
import json
from typing import Any

import redis.asyncio as redis

class RedisCache:
    """Redis cache-aside implementation."""

    def __init__(self, url: str = "redis://localhost:6380") -> None:
        self._client = redis.from_url(url, decode_responses=True)

    async def get_or_fetch(
        self,
        key: str,
        fetch_fn: Any,  # Callable[[], Awaitable[Any]]
        ttl_seconds: int = 300,
    ) -> Any:
        """Get from cache or fetch and cache."""
        # Check cache
        cached = await self._client.get(key)
        if cached is not None:
            return json.loads(cached)

        # Cache miss — fetch from source
        value = await fetch_fn()

        # Store in cache
        await self._client.setex(key, ttl_seconds, json.dumps(value))

        return value

    async def invalidate(self, key: str) -> None:
        """Invalidate a single key."""
        await self._client.delete(key)

    async def invalidate_pattern(self, pattern: str) -> None:
        """Invalidate all keys matching a pattern."""
        async for key in self._client.scan_iter(match=pattern):
            await self._client.delete(key)

    async def close(self) -> None:
        """Close the Redis connection (for graceful shutdown)."""
        await self._client.aclose()
```

### Cache Key Conventions

```python
# Pattern: {domain}:{entity}:{id}:{variant}
CACHE_KEYS = {
    "embedding": "embed:{provider}:{hash}",       # Embedding vectors
    "search":    "search:{query_hash}:{limit}",    # Search results
    "user":      "user:{user_id}:profile",         # User profiles
    "health":    "health:deep:latest",             # Health check results
    "settings":  "settings:{environment}",         # Configuration
}
```

**Rule**: Always namespace keys by domain. Use colons as separators. Include a version or variant suffix when the cache schema changes.

---

## Pattern 3: Embedding Cache

Vector embeddings are expensive to compute (API call or model inference). Cache aggressively:

```python
import hashlib

class EmbeddingCache:
    """Cache for embedding vectors to avoid recomputation."""

    def __init__(self, cache: TTLCache | None = None) -> None:
        self._cache = cache or TTLCache(max_size=1024, ttl_seconds=3600)

    def _hash_text(self, text: str) -> str:
        """Create a deterministic hash for cache key."""
        return hashlib.sha256(text.encode()).hexdigest()[:16]

    async def get_or_compute(
        self,
        text: str,
        provider: Any,  # EmbeddingProvider
    ) -> list[float]:
        """Get cached embedding or compute via provider."""
        key = f"embed:{self._hash_text(text)}"
        cached = self._cache.get(key)
        if cached is not None:
            return cached

        embedding = await provider.get_embedding(text)
        self._cache.set(key, embedding)
        return embedding
```

**Project Reference**: `apps/backend/src/memory/embeddings.py` — `EmbeddingProvider.get_embedding()` is called per-query with no caching. `apps/backend/src/rag/storage.py` — `hybrid_search()` calls `get_embedding()` on every search request.

### TTL Guidelines for Embeddings

| Provider | Model | TTL | Rationale |
|----------|-------|-----|-----------|
| OpenAI | text-embedding-3-small | 24h | Model version pinned, deterministic |
| Ollama | nomic-embed-text | 24h | Local model, deterministic |
| Simple | hash-based | Infinite | Test provider, always deterministic |

**Rule**: Embedding caches can have long TTLs because the same text produces the same vector for a given model version. Invalidate the entire cache when the model is upgraded.

---

## Pattern 4: Next.js Fetch Cache

### Server Components — Static Data

```typescript
// Data that rarely changes — cache for 1 hour
const data = await fetch(`${BACKEND_URL}/api/settings`, {
  next: { revalidate: 3600 },
});
```

### Server Components — Dynamic Data

```typescript
// Data that must be fresh every request
const data = await fetch(`${BACKEND_URL}/api/agents/status`, {
  cache: 'no-store',
});
```

**Project Reference**: `apps/web/lib/api/server.ts:57` — default is `cache: 'no-store'` (no caching). This is correct for authenticated API calls where freshness matters.

### Revalidation Strategies

| Strategy | Directive | Use Case |
|----------|-----------|----------|
| No cache | `cache: 'no-store'` | User-specific data, real-time status |
| Time-based | `next: { revalidate: N }` | Reference data, configuration |
| On-demand | `revalidateTag(tag)` | After mutation, explicit invalidation |
| Static | `force-cache` | Build-time data, rarely changes |

### On-Demand Revalidation

```typescript
// In a Server Action or Route Handler after mutation:
import { revalidateTag } from 'next/cache';

export async function updateContractor(id: string, data: ContractorUpdate) {
  await serverApiClient.put(`/api/contractors/${id}`, data);
  revalidateTag(`contractor-${id}`);
  revalidateTag('contractors-list');
}

// Tag the fetch that should be invalidated:
const contractor = await fetch(`${BACKEND_URL}/api/contractors/${id}`, {
  next: { tags: [`contractor-${id}`] },
});
```

---

## Pattern 5: Cache Invalidation

### Write-Through Invalidation

When the application writes data, invalidate the cache synchronously:

```python
async def update_document(
    self,
    doc_id: str,
    content: str,
    cache: RedisCache,
    db: AsyncSession,
) -> Document:
    """Update document and invalidate all related caches."""
    # Write to database
    doc = await self._update_in_db(db, doc_id, content)

    # Invalidate specific key
    await cache.invalidate(f"doc:{doc_id}")

    # Invalidate search caches (content changed → stale results)
    await cache.invalidate_pattern("search:*")

    # Invalidate embedding cache for this document
    await cache.invalidate(f"embed:{doc_id}:*")

    return doc
```

### Invalidation Scope Rules

| Change Type | Invalidation Scope |
|-------------|-------------------|
| Single entity update | `{entity}:{id}` |
| Entity deletion | `{entity}:{id}` + related list caches |
| Content change | Entity cache + search/embedding caches |
| Schema migration | Full cache flush |
| Model upgrade | All embedding caches |

---

## Pattern 6: Graceful Shutdown Integration

Caches must drain cleanly during shutdown:

```python
async def drain_and_teardown() -> None:
    """Shutdown hook — close cache connections."""
    # Close Redis connections
    await redis_cache.close()

    # In-memory caches are garbage-collected with the process
    # No explicit cleanup needed for TTLCache or lru_cache
```

**Complements**: `graceful-shutdown` skill — Redis connections must be closed in the drain phase, after active requests complete but before process exit.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------|
| Unbounded dict cache | Memory grows until OOM | Use `TTLCache` with `max_size` |
| `@lru_cache` on methods with `self` | Each instance gets its own cache; `self` is part of the key | Use `@lru_cache` on module-level functions or use `__hash__` |
| Caching errors/exceptions | Failed results cached forever | Only cache successful results |
| TTL-only invalidation for writes | Stale reads for up to TTL duration | Explicit invalidation on write path |
| Caching user-specific data in shared cache | Data leaks between users | Include `user_id` in cache key |
| `force-cache` on authenticated endpoints | Stale or wrong-user data served | Use `no-store` for auth'd requests |
| Caching mutable objects | Caller mutates cached reference | Return copies or use immutable types |

---

## Monitoring

Track cache performance with the `metrics-collector` skill:

```python
from src.metrics import MetricsCollector

metrics = MetricsCollector()

# Track hit/miss ratio
async def cached_query(key: str, fetch_fn) -> Any:
    cached = cache.get(key)
    if cached is not None:
        await metrics.increment("cache_hits", tags={"cache": "embedding"})
        return cached

    await metrics.increment("cache_misses", tags={"cache": "embedding"})
    value = await fetch_fn()
    cache.set(key, value)
    return value
```

### Key Metrics

| Metric | Type | Alert Threshold |
|--------|------|----------------|
| `cache_hit_ratio` | Gauge | < 0.5 (50%) |
| `cache_evictions` | Counter | Spike indicates undersized cache |
| `cache_latency_ms` | Histogram | p99 > 10ms for in-memory |
| `cache_size_bytes` | Gauge | Approaching memory limit |

---

## Decision Matrix

Use this to choose the right caching layer:

```
Is the data shared across processes?
  ├─ Yes → Redis
  │   ├─ Needs pub/sub invalidation? → Redis with keyspace notifications
  │   └─ Simple key-value? → Redis GET/SETEX
  └─ No → In-process
      ├─ Pure function, fixed args? → @lru_cache
      ├─ Needs TTL? → TTLCache
      ├─ Needs max-size only? → @lru_cache(maxsize=N)
      └─ Session-scoped scratch? → Plain dict

Is this a Next.js fetch?
  ├─ User-specific or real-time? → cache: 'no-store'
  ├─ Reference data? → next: { revalidate: N }
  ├─ Mutation just happened? → revalidateTag(tag)
  └─ Build-time only? → force-cache
```

---

## Checklist

Before merging code that adds or modifies caching:

- [ ] Every cache has a TTL or max-size bound
- [ ] Cache keys include namespace and relevant identifiers
- [ ] Write paths explicitly invalidate affected cache entries
- [ ] User-specific data includes `user_id` in the key
- [ ] Error/exception results are not cached
- [ ] Redis connections are closed during graceful shutdown
- [ ] Cache metrics (hits, misses, evictions) are tracked
- [ ] `no-store` is used for authenticated Next.js fetches

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Cache Implementation

**Layer**: [in-memory / Redis / Next.js fetch]
**Pattern**: [cache-aside / write-through / on-demand revalidation]
**Key Format**: [namespace:entity:id]
**TTL**: [seconds]
**Max Size**: [entries]
**Invalidation**: [explicit on write / TTL expiry / revalidateTag]
```
