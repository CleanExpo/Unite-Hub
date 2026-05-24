# CSRF Protection

> Cross-site request forgery prevention with token validation, SameSite cookies, and origin checking for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `csrf-protection`                                        |
| **Category**   | Authentication & Security                                |
| **Complexity** | Low                                                      |
| **Complements**| `api-contract`, `input-sanitisation`, `oauth-flow`       |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies CSRF prevention patterns for NodeJS-Starter-V1: synchroniser token pattern for form submissions, double-submit cookie strategy, SameSite cookie attributes, Origin/Referer header validation, and Next.js API route protection.

---

## When to Apply

### Positive Triggers

- Protecting form submissions from cross-origin forgery
- Adding CSRF tokens to state-changing API endpoints
- Configuring SameSite cookie attributes for session cookies
- Validating Origin and Referer headers on mutations
- Securing Next.js API routes that accept form data

### Negative Triggers

- XSS prevention and output encoding (use `input-sanitisation` skill)
- OAuth redirect validation (use `oauth-flow` skill)
- Rate limiting form submissions (use `rate-limiter` skill)
- JWT token creation (use existing `auth/jwt.py`)

---

## Core Principles

### The Three Laws of CSRF Protection

1. **Protect State Changes, Not Reads**: Only POST, PUT, PATCH, DELETE need CSRF protection. GET requests must be idempotent and side-effect-free.
2. **Defence in Depth**: Combine SameSite cookies, Origin header checks, and CSRF tokens. No single mechanism is sufficient against all attack vectors.
3. **Token Per Session, Not Per Request**: Generate one CSRF token per session and validate it on every mutation. Per-request tokens break back/forward navigation and multi-tab usage.

---

## Pattern 1: Double-Submit Cookie (Next.js)

### Token Generation and Validation

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function csrfMiddleware(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

  if (safeMethods.has(method)) {
    // Set CSRF cookie on safe requests if missing
    const response = NextResponse.next();
    if (!request.cookies.get(CSRF_COOKIE)) {
      response.cookies.set(CSRF_COOKIE, generateCsrfToken(), {
        httpOnly: false,  // Must be readable by JavaScript
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
    return response;
  }

  // Validate CSRF token on mutations
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 },
    );
  }

  return null; // Pass through
}
```

---

## Pattern 2: Origin Header Validation

### Checking Request Origin

```typescript
const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
  "http://localhost:8000",
].filter(Boolean));

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Origin header takes precedence
  if (origin) {
    return ALLOWED_ORIGINS.has(origin);
  }

  // Fall back to Referer
  if (referer) {
    try {
      const url = new URL(referer);
      return ALLOWED_ORIGINS.has(url.origin);
    } catch {
      return false;
    }
  }

  // No Origin or Referer — likely same-origin, but treat with caution
  return false;
}
```

---

## Pattern 3: FastAPI CSRF Middleware

### Python-Side Protection

```python
import secrets
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "x-csrf-token"


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in SAFE_METHODS:
            response = await call_next(request)
            if CSRF_COOKIE not in request.cookies:
                token = secrets.token_hex(32)
                response.set_cookie(
                    CSRF_COOKIE, token,
                    httponly=False,
                    samesite="strict",
                    secure=request.url.scheme == "https",
                )
            return response

        cookie_token = request.cookies.get(CSRF_COOKIE)
        header_token = request.headers.get(CSRF_HEADER)

        if not cookie_token or not header_token:
            raise HTTPException(status_code=403, detail="Missing CSRF token")

        if not secrets.compare_digest(cookie_token, header_token):
            raise HTTPException(status_code=403, detail="CSRF validation failed")

        return await call_next(request)
```

**Rule**: Use `secrets.compare_digest()` for constant-time comparison to prevent timing attacks.

---

## Pattern 4: SameSite Cookie Configuration

### Cookie Attributes for CSRF Prevention

```python
# FastAPI session cookie configuration
SESSION_COOKIE_CONFIG = {
    "key": "session",
    "httponly": True,
    "samesite": "lax",      # Allows top-level navigation
    "secure": True,          # HTTPS only in production
    "max_age": 3600,
    "path": "/",
    "domain": None,          # Current domain only
}
```

| SameSite Value | Behaviour | Use Case |
|----------------|-----------|----------|
| `strict` | Never sent cross-origin | CSRF token cookie |
| `lax` | Sent on top-level GET only | Session cookie |
| `none` | Always sent (requires Secure) | Cross-origin API |

**Project Reference**: `apps/web/next.config.ts` — the existing Next.js config includes security headers. Add `Set-Cookie` defaults for SameSite attributes.

---

## Pattern 5: Client-Side Token Attachment

### Fetch Wrapper with CSRF Header

```typescript
function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

async function csrfFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getCsrfToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("X-CSRF-Token", token);
  }

  return fetch(url, { ...options, headers, credentials: "include" });
}
```

**Complements**: `api-client` skill — integrate CSRF token attachment as an interceptor in the `TypedApiClient` chain.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| CSRF token in URL parameters | Leaks in logs, Referer header | Use custom header (`X-CSRF-Token`) |
| Per-request tokens | Breaks multi-tab, back button | Per-session token |
| httpOnly CSRF cookie | JavaScript cannot read and echo it | `httpOnly: false` for CSRF cookie |
| No SameSite attribute | Browser defaults vary | Explicit `SameSite=Lax` or `Strict` |
| Skipping CSRF for JSON APIs | CORS misconfiguration allows forgery | Validate on all mutations |
| `==` comparison for tokens | Timing attack vulnerability | `secrets.compare_digest()` |

---

## Checklist

Before merging csrf-protection changes:

- [ ] Double-submit cookie pattern with `X-CSRF-Token` header
- [ ] Origin/Referer header validation on mutations
- [ ] SameSite cookie attributes on session and CSRF cookies
- [ ] FastAPI `CSRFMiddleware` with constant-time comparison
- [ ] Client-side CSRF token attachment in fetch wrapper
- [ ] Safe methods (GET, HEAD, OPTIONS) excluded from validation

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### CSRF Protection Implementation

**Strategy**: [double-submit cookie / synchroniser token / origin check]
**Cookie**: [SameSite=Strict for CSRF / Lax for session]
**Header**: [X-CSRF-Token / custom]
**Scope**: [all mutations / form submissions only]
**Client Integration**: [api-client interceptor / manual]
```
