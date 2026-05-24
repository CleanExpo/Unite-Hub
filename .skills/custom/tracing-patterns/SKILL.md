# Tracing Patterns

> Distributed tracing with span context propagation across FastAPI, Next.js, and agent workflows in NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| **Skill ID**   | `tracing-patterns`                                             |
| **Category**   | Observability & DevOps                                         |
| **Complexity** | High                                                           |
| **Complements**| `metrics-collector`, `structured-logging`, `health-check`      |
| **Requires**   | `metrics-collector`                                            |
| **Version**    | 1.0.0                                                          |
| **Locale**     | en-AU                                                          |

---

## Description

Codifies distributed tracing for NodeJS-Starter-V1: trace context creation, W3C Trace Context propagation between frontend and backend, span hierarchy for agent orchestration, structlog context variable injection, database query spans, and integration with the existing metrics-collector and structured-logging skills.

---

## When to Apply

### Positive Triggers

- Adding cross-service request tracing between Next.js and FastAPI
- Instrumenting agent orchestrator → specialist → tool call chains
- Debugging latency across multiple services or subagent executions
- Implementing `traceparent` / `tracestate` header propagation
- Adding trace context to structured log entries
- Correlating metrics with specific request traces

### Negative Triggers

- Single-function debugging (use `structured-logging` instead)
- Aggregate metric collection without per-request detail (use `metrics-collector`)
- Health probe endpoints (lightweight, no tracing overhead)
- Static asset serving or build-time generation

---

## Core Principles

### The Three Laws of Tracing

1. **Every Request Gets a Trace**: Generate a `trace_id` at the entry point. Never allow requests without trace context.
2. **Spans Nest, Never Overlap**: Child spans start after and end before their parent. Parallel children share a parent but each gets a unique `span_id`.
3. **Context Propagates Automatically**: Use framework-native mechanisms (structlog contextvars, HTTP headers) so developers never manually pass trace context.

---

## Trace Context Model

### Data Structure

```python
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import uuid4

class SpanKind(str, Enum):
    SERVER = "server"
    CLIENT = "client"
    INTERNAL = "internal"

@dataclass
class SpanContext:
    trace_id: str = field(default_factory=lambda: uuid4().hex)
    span_id: str = field(default_factory=lambda: uuid4().hex[:16])
    parent_span_id: str | None = None
    span_name: str = ""
    span_kind: SpanKind = SpanKind.INTERNAL
    started_at: str = field(default_factory=lambda: datetime.now().isoformat())
    ended_at: str | None = None
    attributes: dict[str, str | int | float | bool] = field(default_factory=dict)
    status: str = "ok"  # ok | error

    def child(self, name: str, kind: SpanKind = SpanKind.INTERNAL) -> "SpanContext":
        return SpanContext(
            trace_id=self.trace_id,
            parent_span_id=self.span_id,
            span_name=name,
            span_kind=kind,
        )

    def to_traceparent(self) -> str:
        return f"00-{self.trace_id}-{self.span_id}-01"

    @classmethod
    def from_traceparent(cls, header: str) -> "SpanContext":
        parts = header.split("-")
        if len(parts) != 4:
            return cls()
        return cls(trace_id=parts[1], parent_span_id=parts[2])
```

---

## Pattern 1: FastAPI Middleware (Server Spans)

### Trace Context Middleware

Create a root span for every incoming request, extract or generate trace context, and inject it into structlog contextvars:

```python
import structlog
from contextvars import ContextVar
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from src.utils import get_logger

logger = get_logger(__name__)

# Context variable for current span — accessible anywhere in the request
current_span: ContextVar[SpanContext | None] = ContextVar("current_span", default=None)


class TracingMiddleware(BaseHTTPMiddleware):
    """Creates root span for every request and propagates trace context."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Extract or generate trace context
        traceparent = request.headers.get("traceparent")
        if traceparent:
            span = SpanContext.from_traceparent(traceparent)
            span.span_name = f"{request.method} {request.url.path}"
            span.span_kind = SpanKind.SERVER
        else:
            span = SpanContext(
                span_name=f"{request.method} {request.url.path}",
                span_kind=SpanKind.SERVER,
            )

        # Store in context variable
        token = current_span.set(span)

        # Bind trace context to structlog for automatic inclusion in all logs
        structlog.contextvars.bind_contextvars(
            trace_id=span.trace_id,
            span_id=span.span_id,
            request_path=request.url.path,
            request_method=request.method,
        )

        try:
            response = await call_next(request)

            span.status = "ok" if response.status_code < 500 else "error"
            span.attributes["http.status_code"] = response.status_code

            # Propagate trace context in response headers
            response.headers["traceparent"] = span.to_traceparent()

            return response

        except Exception as exc:
            span.status = "error"
            span.attributes["error.type"] = type(exc).__name__
            span.attributes["error.message"] = str(exc)
            raise

        finally:
            span.ended_at = datetime.now().isoformat()
            current_span.reset(token)
            structlog.contextvars.unbind_contextvars(
                "trace_id", "span_id", "request_path", "request_method",
            )
```

**Project Reference**: `apps/backend/src/api/main.py:37-47` — middleware registration. TracingMiddleware should be added **first** (outermost) so all other middleware operates within trace context.

### Middleware Order

```python
# Correct order: Tracing → Rate Limit → Auth → Routes
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(TracingMiddleware)  # Added first = outermost = runs first
```

**Rule**: Tracing middleware must be outermost so that auth and rate-limit operations are captured within the trace.

---

## Pattern 2: Agent Span Hierarchy

### Orchestrator → Specialist → Tool

Agent execution creates a natural span tree:

```
[trace] POST /api/agents/execute
  └─ [span] orchestrator.route_task
      ├─ [span] specialist.frontend.execute
      │   ├─ [span] tool.file_read
      │   └─ [span] tool.file_write
      └─ [span] specialist.backend.execute
          ├─ [span] tool.database_query
          └─ [span] tool.mcp_call
```

### Instrumenting Agent Execution

```python
from contextvars import ContextVar

current_span: ContextVar[SpanContext | None] = ContextVar("current_span", default=None)


class TracedAgent(BaseAgent):
    """Agent base class with automatic span creation."""

    async def execute(
        self,
        task_description: str,
        context: dict[str, Any] | None = None,
    ) -> Any:
        parent = current_span.get()
        span = parent.child(
            name=f"agent.{self.name}.execute",
            kind=SpanKind.INTERNAL,
        ) if parent else SpanContext(
            span_name=f"agent.{self.name}.execute",
        )

        span.attributes["agent.name"] = self.name
        span.attributes["agent.id"] = self.agent_id
        span.attributes["task.description"] = task_description[:200]

        token = current_span.set(span)
        structlog.contextvars.bind_contextvars(
            span_id=span.span_id,
            agent_name=self.name,
        )

        try:
            result = await self._execute_impl(task_description, context)
            span.status = "ok"
            return result
        except Exception as exc:
            span.status = "error"
            span.attributes["error.type"] = type(exc).__name__
            raise
        finally:
            span.ended_at = datetime.now().isoformat()
            current_span.reset(token)

    async def _execute_impl(
        self,
        task_description: str,
        context: dict[str, Any] | None,
    ) -> Any:
        """Subclasses override this instead of execute()."""
        raise NotImplementedError
```

**Project Reference**: `apps/backend/src/agents/base_agent.py:87-131` — current `BaseAgent.execute()` has no span instrumentation. `apps/backend/src/agents/orchestrator.py:1-63` — orchestrator dispatches to specialists.

### Subagent Parallel Spans

```python
async def execute_parallel_traced(
    self,
    configs: list[SubagentConfig],
) -> list[SubagentResult]:
    """Execute subagents in parallel with child spans."""
    parent = current_span.get()

    async def execute_with_span(config: SubagentConfig) -> SubagentResult:
        span = parent.child(
            name=f"subagent.{config.agent_type}",
            kind=SpanKind.INTERNAL,
        ) if parent else SpanContext(
            span_name=f"subagent.{config.agent_type}",
        )
        span.attributes["subtask.id"] = config.task.subtask_id

        token = current_span.set(span)
        try:
            return await self._execute_subagent(config)
        finally:
            span.ended_at = datetime.now().isoformat()
            current_span.reset(token)

    tasks = [execute_with_span(c) for c in configs]
    return await asyncio.gather(*tasks, return_exceptions=True)
```

**Project Reference**: `apps/backend/src/agents/subagent_manager.py:155-220` — `execute_parallel()` creates parallel tasks but has no span tracking.

---

## Pattern 3: Frontend Propagation

### Next.js → FastAPI

Forward trace context from the frontend API client:

```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

function generateTraceId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function generateSpanId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

async function fetchWithTracing<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  const traceparent = `00-${traceId}-${spanId}-01`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    traceparent,
    ...(options.headers as Record<string, string>),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  // Log trace for debugging
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[trace] ${traceId.slice(0, 8)} ${options.method || 'GET'} ${endpoint}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
```

**Project Reference**: `apps/web/lib/api/server.ts:39-74` — `fetchApi()` does not propagate trace headers. Add `traceparent` to outgoing requests.

---

## Pattern 4: Database Query Spans

### SQLAlchemy Event Hooks

Trace database queries without modifying application code:

```python
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    parent = current_span.get()
    if parent:
        span = parent.child(name="db.query", kind=SpanKind.CLIENT)
        span.attributes["db.system"] = "postgresql"
        span.attributes["db.statement"] = statement[:500]
        conn.info["trace_span"] = span
        conn.info["trace_token"] = current_span.set(span)


@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    span = conn.info.pop("trace_span", None)
    token = conn.info.pop("trace_token", None)
    if span:
        span.ended_at = datetime.now().isoformat()
    if token:
        current_span.reset(token)
```

**Project Reference**: `apps/backend/src/config/database.py:60-66` — `async_engine` creation. Event hooks attach to the engine for automatic query tracing.

---

## Pattern 5: Structured Log Integration

### Automatic Trace Context in Logs

The structlog `contextvars.merge_contextvars` processor (already configured at `apps/backend/src/utils/logging.py:16`) automatically merges bound context variables into every log entry. The TracingMiddleware binds `trace_id` and `span_id`, so all logs within a traced request include trace context with zero application code changes:

```python
# Within a traced request, any log call automatically includes trace context:
logger.info("Document created", document_id="doc_123")
# Output: {"event": "Document created", "document_id": "doc_123",
#          "trace_id": "abc123...", "span_id": "def456...",
#          "level": "info", "timestamp": "2026-02-13T..."}
```

---

## Pattern 6: Metrics Integration

### Trace-to-Metrics (RED Method)

Derive Rate, Errors, and Duration metrics from completed spans:

```python
async def record_span_metrics(span: SpanContext) -> None:
    """Derive RED metrics from completed spans."""
    duration_ms = _compute_duration_ms(span.started_at, span.ended_at)
    tags = {"endpoint": span.span_name, "status": span.status}

    await metrics.increment("request_total", tags=tags)
    if span.status == "error":
        await metrics.increment("request_errors_total", tags=tags)
    await metrics.record_histogram("request_duration_ms", value=duration_ms, tags=tags)
```

**Complements**: `metrics-collector` skill — spans provide raw data for RED metrics.

---

## Span Attribute Conventions

Follow OpenTelemetry semantic conventions:

| Attribute | Type | Example | When |
|-----------|------|---------|------|
| `http.method` | string | `"POST"` | HTTP spans |
| `http.status_code` | int | `200` | HTTP spans |
| `http.url` | string | `"/api/agents/execute"` | HTTP spans |
| `db.system` | string | `"postgresql"` | Database spans |
| `db.statement` | string | `"SELECT ..."` | Database spans (truncated) |
| `agent.name` | string | `"orchestrator"` | Agent spans |
| `agent.id` | string | `"agent_orch_abc123"` | Agent spans |
| `task.description` | string | `"Implement ..."` | Agent spans (truncated) |
| `subtask.id` | string | `"subtask_1"` | Subagent spans |
| `mcp.server` | string | `"file-system"` | MCP tool spans |
| `mcp.tool` | string | `"read_file"` | MCP tool spans |
| `error.type` | string | `"TimeoutError"` | Error spans |
| `error.message` | string | `"Timed out"` | Error spans |

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------|
| No trace context on incoming requests | Cannot correlate frontend and backend | Always generate or extract `traceparent` |
| Manual `trace_id` passing in function args | Fragile, easily forgotten | Use `ContextVar` for automatic propagation |
| Tracing health probes | Noise in trace data, performance overhead | Skip `/health` and `/ready` in tracing middleware |
| Unbounded `db.statement` attribute | Large queries bloat trace storage | Truncate to 500 characters |
| Missing `span.ended_at` | Duration cannot be computed | Always set in `finally` block |
| Spans that outlive their parent | Broken span hierarchy | Use `ContextVar` token reset in `finally` |
| Tracing every log call as a span | Excessive span cardinality | Spans are for operations, logs are for events |

---

## Checklist

Before merging code that adds tracing:

- [ ] TracingMiddleware is outermost (added first to FastAPI)
- [ ] `traceparent` header extracted from incoming requests
- [ ] `traceparent` header set in outgoing responses
- [ ] `trace_id` and `span_id` bound to structlog contextvars
- [ ] Health endpoints excluded from tracing
- [ ] Agent execution creates child spans with `agent.name` attribute
- [ ] Database queries traced via SQLAlchemy event hooks
- [ ] Frontend API client forwards `traceparent` header
- [ ] Span `ended_at` always set in `finally` block
- [ ] RED metrics derived from span data

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Tracing Implementation

**Entry Point**: [middleware / agent / manual]
**Span Hierarchy**: [parent → child tree]
**Propagation**: [traceparent header / ContextVar / both]
**Attributes**: [list of semantic attributes]
**Log Integration**: [structlog contextvars bound]
**Metrics Integration**: [RED method / none]
```
