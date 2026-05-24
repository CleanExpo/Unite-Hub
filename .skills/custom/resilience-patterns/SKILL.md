# Resilience Patterns

> Bulkhead isolation, timeout policies, fallback strategies, and hedging patterns for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `resilience-patterns`                                    |
| **Category**   | Error Handling & Resilience                              |
| **Complexity** | High                                                     |
| **Complements**| `retry-strategy`, `graceful-shutdown`, `health-check`    |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies resilience patterns for NodeJS-Starter-V1: bulkhead isolation to contain failures, timeout policies for external calls, fallback strategies when dependencies are unavailable, hedged requests for latency-sensitive paths, cascading failure prevention, and degraded mode operation for the AI provider layer.

---

## When to Apply

### Positive Triggers

- Isolating failures in AI provider calls from affecting other services
- Adding timeout policies to external API calls (Ollama, Anthropic, Stripe)
- Implementing fallback behaviour when a dependency is unavailable
- Preventing cascading failures across the multi-agent backend
- Building degraded mode for when AI providers are down
- Adding hedged requests for latency-critical operations

### Negative Triggers

- Retry logic with exponential backoff (use `retry-strategy` skill)
- Rate limiting inbound requests (use `rate-limiter` skill)
- Process shutdown and connection draining (use `graceful-shutdown` skill)
- Error classification and codes (use `error-taxonomy` skill)

---

## Core Principles

### The Three Laws of Resilience

1. **Isolate Blast Radius**: A failing dependency must not consume all resources. Use bulkheads (semaphores, thread pools) to limit concurrent calls per dependency.
2. **Fail Fast, Recover Slow**: Timeouts must be shorter than the caller's patience. Circuit breakers open immediately on threshold, close gradually with half-open probes.
3. **Always Have a Fallback**: Every external call must have a degraded-but-functional alternative. Cached response, default value, or graceful error — never an unhandled crash.

---

## Pattern 1: Bulkhead Isolation (Python)

### Semaphore-Based Resource Limiting

```python
import asyncio
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator


class Bulkhead:
    """Limits concurrent access to a resource to prevent cascade failure."""

    def __init__(self, name: str, max_concurrent: int, max_queue: int = 0) -> None:
        self.name = name
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.max_concurrent = max_concurrent
        self.max_queue = max_queue
        self._queued = 0

    @asynccontextmanager
    async def acquire(self) -> AsyncGenerator[None, None]:
        if self._queued >= self.max_queue:
            raise BulkheadFullError(
                f"Bulkhead '{self.name}' rejected: {self._queued} queued"
            )
        self._queued += 1
        try:
            await self.semaphore.acquire()
            self._queued -= 1
            yield
        finally:
            self.semaphore.release()


class BulkheadFullError(Exception):
    pass


# Configure per-dependency bulkheads
BULKHEADS = {
    "ollama": Bulkhead("ollama", max_concurrent=5, max_queue=10),
    "anthropic": Bulkhead("anthropic", max_concurrent=10, max_queue=20),
    "stripe": Bulkhead("stripe", max_concurrent=3, max_queue=5),
    "database": Bulkhead("database", max_concurrent=20, max_queue=50),
}
```

**Usage**:
```python
async with BULKHEADS["ollama"].acquire():
    result = await ollama_provider.complete(prompt)
```

**Project Reference**: `apps/backend/src/models/ollama_provider.py` and `anthropic.py` — both call external APIs without concurrency limits. If Ollama hangs, all request threads block on it. Wrapping in bulkheads prevents one slow provider from exhausting the connection pool.

---

## Pattern 2: Timeout Policy

### Configurable Timeout Wrapper

```python
import asyncio


class TimeoutPolicy:
    """Enforce maximum execution time for async operations."""

    def __init__(self, seconds: float, name: str = "") -> None:
        self.seconds = seconds
        self.name = name

    async def execute(self, coro):
        """Execute coroutine with timeout."""
        try:
            return await asyncio.wait_for(coro, timeout=self.seconds)
        except asyncio.TimeoutError:
            raise TimeoutPolicyError(
                f"Operation '{self.name}' timed out after {self.seconds}s"
            )


class TimeoutPolicyError(Exception):
    pass


# Per-dependency timeout configuration
TIMEOUTS = {
    "ollama_complete": TimeoutPolicy(30.0, "ollama_complete"),
    "ollama_embed": TimeoutPolicy(10.0, "ollama_embed"),
    "anthropic_complete": TimeoutPolicy(60.0, "anthropic_complete"),
    "stripe_api": TimeoutPolicy(15.0, "stripe_api"),
    "database_query": TimeoutPolicy(5.0, "database_query"),
}
```

**Rule**: Timeout values should decrease as you move closer to the user. Edge (3s) < API gateway (10s) < Backend service (30s) < AI provider (60s). This prevents upstream callers from waiting on already-expired downstream requests.

---

## Pattern 3: Fallback Strategy

### Graceful Degradation for AI Providers

```python
from typing import Callable, TypeVar

T = TypeVar("T")


class FallbackChain:
    """Execute operations with fallback alternatives."""

    def __init__(self, name: str) -> None:
        self.name = name
        self.strategies: list[tuple[str, Callable]] = []

    def add(self, name: str, fn: Callable) -> "FallbackChain":
        self.strategies.append((name, fn))
        return self

    async def execute(self, *args, **kwargs) -> T:
        last_error = None
        for strategy_name, fn in self.strategies:
            try:
                return await fn(*args, **kwargs)
            except Exception as e:
                last_error = e
                logger.warning(
                    "fallback_triggered",
                    chain=self.name,
                    failed=strategy_name,
                    error=str(e),
                )
        raise FallbackExhaustedError(
            f"All strategies failed for '{self.name}'", last_error
        )


class FallbackExhaustedError(Exception):
    def __init__(self, message: str, cause: Exception | None = None) -> None:
        super().__init__(message)
        self.__cause__ = cause
```

**Usage for AI provider fallback**:
```python
ai_fallback = (
    FallbackChain("ai_complete")
    .add("anthropic", lambda p: anthropic.complete(p))
    .add("ollama", lambda p: ollama.complete(p))
    .add("cached", lambda p: cache.get(f"ai:{hash(p)}"))
    .add("default", lambda p: "Service temporarily unavailable")
)

result = await ai_fallback.execute(prompt)
```

**Project Reference**: `apps/backend/src/models/selector.py` — the existing provider selector picks one provider. The fallback chain tries primary → secondary → cached → default, making the AI layer resilient to individual provider outages.

---

## Pattern 4: Hedged Requests (TypeScript)

### Parallel Requests with First-Response Wins

```typescript
async function hedgedFetch<T>(
  fetchers: Array<() => Promise<T>>,
  delayMs = 200,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const errors: Error[] = [];

    fetchers.forEach((fn, index) => {
      setTimeout(async () => {
        if (settled) return;
        try {
          const result = await fn();
          if (!settled) {
            settled = true;
            resolve(result);
          }
        } catch (err) {
          errors.push(err as Error);
          if (errors.length === fetchers.length && !settled) {
            settled = true;
            reject(new Error("All hedged requests failed"));
          }
        }
      }, index * delayMs);
    });
  });
}
```

**Use case**: When the backend supports multiple AI providers, fire the request to the primary after 0ms and the secondary after 200ms. Whichever responds first wins. Cancel the slower one if the first returns.

---

## Pattern 5: Combined Resilience Policy

### Composing Bulkhead + Timeout + Fallback

```python
async def resilient_ai_call(prompt: str) -> str:
    """AI completion with full resilience stack."""
    try:
        async with BULKHEADS["anthropic"].acquire():
            return await TIMEOUTS["anthropic_complete"].execute(
                anthropic.complete(prompt)
            )
    except (BulkheadFullError, TimeoutPolicyError):
        # Fallback to local provider
        try:
            async with BULKHEADS["ollama"].acquire():
                return await TIMEOUTS["ollama_complete"].execute(
                    ollama.complete(prompt)
                )
        except (BulkheadFullError, TimeoutPolicyError):
            return "AI service temporarily unavailable. Please try again."
```

**Execution order**: Bulkhead (reject if full) → Timeout (cancel if slow) → Fallback (try next provider). Each layer adds protection without duplicating logic.

**Complements**: `retry-strategy` skill — wrap the entire `resilient_ai_call` with `retry_async()` for transient network errors. `health-check` skill — expose bulkhead utilisation and timeout rates in the deep health endpoint.

---

## Pattern 6: Degraded Mode Configuration

### Feature Availability Matrix

```python
from enum import Enum


class ServiceStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"


DEGRADED_MODE_CONFIG = {
    "ai_complete": {
        ServiceStatus.HEALTHY: "full_response",
        ServiceStatus.DEGRADED: "cached_or_short_response",
        ServiceStatus.UNAVAILABLE: "static_fallback_message",
    },
    "search": {
        ServiceStatus.HEALTHY: "hybrid_fts_vector",
        ServiceStatus.DEGRADED: "fts_only",
        ServiceStatus.UNAVAILABLE: "title_match_only",
    },
    "embeddings": {
        ServiceStatus.HEALTHY: "generate_new",
        ServiceStatus.DEGRADED: "use_cached",
        ServiceStatus.UNAVAILABLE: "skip_embedding",
    },
}
```

Expose the current mode via the health endpoint so the frontend can adjust its UI accordingly (e.g., show "Limited AI features" banner when degraded).

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| No concurrency limit on external calls | One slow dependency blocks everything | Bulkhead with `max_concurrent` per dependency |
| Same timeout for all operations | AI calls (60s) timeout at DB speed (5s) | Per-dependency timeout configuration |
| Hard failure when provider is down | Entire application unusable | Fallback chain with degraded mode |
| Retry without timeout | Retries compound latency | Timeout wraps the entire retry loop |
| No fallback for cached data | Cache miss + provider down = crash | Stale cache acceptable in degraded mode |
| Ignoring bulkhead rejection | Queuing indefinitely | Fail fast with `BulkheadFullError`, return 503 |

---

## Checklist

Before merging resilience-patterns changes:

- [ ] Bulkheads configured per external dependency with `max_concurrent` limits
- [ ] Timeout policies set per operation type (AI > API > DB)
- [ ] Fallback chain for AI provider layer (primary → secondary → cached → default)
- [ ] Hedged requests for latency-critical paths
- [ ] Combined policy: bulkhead → timeout → fallback composition
- [ ] Degraded mode configuration for each service capability
- [ ] Health endpoint exposes bulkhead utilisation and circuit breaker state
- [ ] `BulkheadFullError` returns 503 Service Unavailable, not 500

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Resilience Implementation

**Bulkheads**: [per-dependency / global], limits=[ollama:5, anthropic:10, db:20]
**Timeouts**: [per-operation], values=[ai:60s, api:15s, db:5s]
**Fallback**: [chain / single / none], strategies=[primary, secondary, cached, default]
**Hedging**: [enabled / disabled], delay=[200ms]
**Degraded Mode**: [configured / not configured]
**Integration**: [retry-strategy / health-check / both]
```
