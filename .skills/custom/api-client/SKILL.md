# API Client

> Type-safe fetch wrapper with interceptors, request/response transforms, and automatic retry for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `api-client`                                             |
| **Category**   | API & Integration                                        |
| **Complexity** | Medium                                                   |
| **Complements**| `retry-strategy`, `error-taxonomy`, `rate-limiter`       |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies type-safe API client patterns for NodeJS-Starter-V1: typed fetch wrappers for browser and server components, request/response interceptors, automatic 429 retry with Retry-After, error normalisation with `ApiClientError`, httpx async client patterns for Python, and upgrade paths for the existing `apiClient` and `serverApiClient`.

---

## When to Apply

### Positive Triggers

- Adding interceptors (auth, logging, retry) to the existing API client
- Creating typed request/response wrappers for new API endpoints
- Implementing automatic retry on 429 or transient errors
- Building a Python httpx client with the same patterns as the TypeScript client
- Adding request/response transforms (camelCase ↔ snake_case)
- Centralising error handling across all API calls

### Negative Triggers

- Webhook signature verification (use `webhook-handler` skill)
- Rate limiting the server side (use `rate-limiter` skill)
- GraphQL client setup (future `graphql-patterns` skill)
- Direct database queries (use SQLAlchemy ORM directly)

---

## Core Principles

### The Three Laws of API Clients

1. **Type Everything**: Every request and response must have a TypeScript type or Pydantic model. No `any`, no untyped `dict`.
2. **Fail Consistently**: All errors normalised to `ApiClientError` with status code, error code, and human-readable message. Never throw raw `Error`.
3. **Intercept, Don't Duplicate**: Auth headers, logging, retries, and transforms belong in interceptors — not copy-pasted into every call site.

---

## Pattern 1: Typed Fetch Wrapper (TypeScript)

### Enhanced Browser Client

```typescript
import type { ApiError } from "./types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }

  get isRetryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

type Interceptor = (config: RequestInit & { url: string }) => RequestInit & { url: string };
type ResponseHandler = (response: Response) => Promise<Response>;

class TypedApiClient {
  private interceptors: Interceptor[] = [];
  private responseHandlers: ResponseHandler[] = [];

  constructor(private baseUrl: string) {}

  use(interceptor: Interceptor): this {
    this.interceptors.push(interceptor);
    return this;
  }

  useResponse(handler: ResponseHandler): this {
    this.responseHandlers.push(handler);
    return this;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let config = { ...options, url: `${this.baseUrl}${endpoint}` };
    for (const interceptor of this.interceptors) {
      config = interceptor(config);
    }

    const { url, ...fetchOptions } = config;
    let response = await fetch(url, fetchOptions);

    for (const handler of this.responseHandlers) {
      response = await handler(response);
    }

    if (!response.ok) {
      const body: ApiError = await response.json().catch(() => ({
        detail: `HTTP ${response.status}`,
      }));
      throw new ApiClientError(
        body.detail,
        response.status,
        body.error_code,
        parseRetryAfter(response),
      );
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }

  get = <T>(endpoint: string) => this.request<T>(endpoint, { method: "GET" });
  post = <T>(endpoint: string, data?: unknown) =>
    this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      headers: { "Content-Type": "application/json" },
    });
  put = <T>(endpoint: string, data?: unknown) =>
    this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      headers: { "Content-Type": "application/json" },
    });
  delete = <T>(endpoint: string) => this.request<T>(endpoint, { method: "DELETE" });
}

function parseRetryAfter(response: Response): number | undefined {
  const header = response.headers.get("retry-after");
  return header ? parseFloat(header) : undefined;
}
```

**Project Reference**: `apps/web/lib/api/client.ts:1-132` — the existing `apiClient` is a plain object with `get`/`post`/`put`/`patch`/`delete` methods but no interceptors, no retry, and no typed error with `retryAfter`. Replace the inner `fetchApi` function with `TypedApiClient.request()`.

---

## Pattern 2: Built-In Interceptors

### Auth Interceptor

```typescript
function authInterceptor(config: RequestInit & { url: string }) {
  const token = getAuthToken(); // from existing client.ts
  if (token) {
    const headers = new Headers(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = Object.fromEntries(headers.entries());
  }
  return config;
}
```

### Logging Interceptor

```typescript
function loggingInterceptor(config: RequestInit & { url: string }) {
  const start = performance.now();
  const originalUrl = config.url;
  console.debug(`[API] ${config.method ?? "GET"} ${originalUrl}`);
  return config;
}
```

### Snake-Case Transform Interceptor

```typescript
function snakeCaseInterceptor(config: RequestInit & { url: string }) {
  if (config.body && typeof config.body === "string") {
    const parsed = JSON.parse(config.body);
    config.body = JSON.stringify(toSnakeCase(parsed));
  }
  return config;
}
```

**Composition**: `client.use(authInterceptor).use(loggingInterceptor).use(snakeCaseInterceptor)`

---

## Pattern 3: Automatic Retry on 429

### Retry Response Handler

```typescript
function retryHandler(maxRetries = 3): ResponseHandler {
  let attempt = 0;
  return async (response: Response): Promise<Response> => {
    if (response.status !== 429 || attempt >= maxRetries) return response;
    attempt++;

    const retryAfter = response.headers.get("retry-after");
    const waitMs = retryAfter
      ? parseFloat(retryAfter) * 1000
      : Math.min(1000 * 2 ** attempt, 30_000);

    await new Promise((r) => setTimeout(r, waitMs));
    return fetch(response.url, { method: response.type });
  };
}
```

**Complements**: `rate-limiter` skill — the server returns `Retry-After` headers; this handler respects them. `retry-strategy` skill — for non-429 transient errors, use the full exponential backoff from that skill.

---

## Pattern 4: Server Component Client

### Next.js Server-Side with Cache Control

```typescript
import { cookies } from "next/headers";

function createServerClient(options?: { revalidate?: number }) {
  const client = new TypedApiClient(
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000",
  );

  client.use((config) => {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      const headers = new Headers(config.headers);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = Object.fromEntries(headers.entries());
    }
    // Default to no-store unless revalidation specified
    if (options?.revalidate !== undefined) {
      (config as any).next = { revalidate: options.revalidate };
    }
    return config;
  });

  return client;
}
```

**Project Reference**: `apps/web/lib/api/server.ts:1-129` — the existing `serverApiClient` duplicates the entire browser client with `cookies()` import. Replace with `createServerClient()` that reuses `TypedApiClient`.

---

## Pattern 5: Python httpx Client

### Async HTTP Client with Interceptors

```python
from typing import Any, TypeVar
from pydantic import BaseModel
import httpx
from src.config import get_settings
from src.utils import get_logger

T = TypeVar("T", bound=BaseModel)
logger = get_logger(__name__)


class BackendClient:
    """Typed httpx client for internal service calls."""

    def __init__(self, base_url: str | None = None, timeout: float = 30.0) -> None:
        settings = get_settings()
        self.base_url = base_url or settings.backend_url
        self.timeout = timeout

    async def request(
        self, method: str, path: str, response_model: type[T] | None = None, **kwargs: Any
    ) -> T | dict:
        async with httpx.AsyncClient(
            base_url=self.base_url, timeout=self.timeout
        ) as client:
            response = await client.request(method, path, **kwargs)
            response.raise_for_status()
            data = response.json()
            if response_model:
                return response_model(**data)
            return data

    async def get(self, path: str, response_model: type[T] | None = None) -> T | dict:
        return await self.request("GET", path, response_model)

    async def post(self, path: str, data: BaseModel | dict | None = None, response_model: type[T] | None = None) -> T | dict:
        json_data = data.model_dump() if isinstance(data, BaseModel) else data
        return await self.request("POST", path, response_model, json=json_data)
```

**Project Reference**: `apps/backend/src/models/ollama_provider.py:1-50` — uses raw `httpx.AsyncClient` inline. The `BackendClient` pattern provides a reusable wrapper with Pydantic model deserialisation.

---

## Pattern 6: Case Conversion Utilities

### camelCase ↔ snake_case

```typescript
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = value && typeof value === "object" && !Array.isArray(value)
      ? toSnakeCase(value as Record<string, unknown>)
      : value;
  }
  return result;
}

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value && typeof value === "object" && !Array.isArray(value)
      ? toCamelCase(value as Record<string, unknown>)
      : value;
  }
  return result;
}
```

The FastAPI backend returns snake_case; the Next.js frontend uses camelCase. Apply `toCamelCase` as a response handler and `toSnakeCase` as a request interceptor to bridge the gap automatically.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Duplicating auth header in every call | Drift, inconsistency | Auth interceptor applied once |
| Raw `fetch` without error normalisation | Inconsistent error shapes | `ApiClientError` with status + code |
| Ignoring `Retry-After` on 429 | Client retries immediately, worsens load | Parse header, wait, then retry |
| Separate browser and server client codebases | Double maintenance | Shared `TypedApiClient` with env-specific interceptors |
| `any` return types on API calls | No type safety at call sites | Generic `request<T>` with type parameter |
| Inline `httpx.AsyncClient` everywhere | Connection pool churn | Shared `BackendClient` instance |

---

## Checklist

Before merging api-client changes:

- [ ] `TypedApiClient` class with interceptor chain replaces raw `fetchApi`
- [ ] `ApiClientError` includes `status`, `errorCode`, `retryAfter`, `isRetryable`
- [ ] Auth interceptor extracts JWT from cookie (browser) or `cookies()` (server)
- [ ] Retry handler respects `Retry-After` header on 429 responses
- [ ] Snake/camel case conversion applied via interceptors
- [ ] Server client reuses `TypedApiClient` with cache control
- [ ] Python `BackendClient` uses Pydantic model deserialisation
- [ ] No duplicate `fetchApi` implementations across client/server

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### API Client Implementation

**Environment**: [browser / server / Python / all]
**Interceptors**: [auth, logging, snake-case, retry]
**Error Class**: ApiClientError with [status, errorCode, retryAfter]
**Retry**: [429 with Retry-After / transient / disabled]
**Case Conversion**: [snake ↔ camel / disabled]
**Migration**: [upgrade existing apiClient / new client]
```
