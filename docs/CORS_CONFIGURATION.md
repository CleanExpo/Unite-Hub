# CORS Configuration Guide

**Status**: 📘 Documentation
**Priority**: P3-4 (LOW)
**Created**: 2025-12-03
**Last Updated**: 2025-12-03

---

## Executive Summary

Unite-Hub **does NOT currently implement CORS headers** in its API routes. This is acceptable for the current deployment model but may require changes if:
- Frontend and backend are deployed on separate domains
- Third-party clients need to consume the API
- Webhooks need to be called from external services

---

## Current CORS Status

### ✅ What's Configured

**1. Security Headers (Not CORS)**

Located in `next.config.mjs` and `src/middleware.ts`:

```typescript
// next.config.mjs - Static assets fallback
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      // CSP, Permissions Policy, etc.
    ]
  }
]
```

```typescript
// src/middleware.ts - Per-request security headers
function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // Content Security Policy with nonce
  const cspHeader = getEnvironmentCSP(nonce);
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}
```

**2. Public Routes (No Auth Required)**

```typescript
// src/middleware.ts - Public paths that bypass authentication
const publicPaths = [
  "/",
  "/pricing",
  "/landing",
  "/privacy",
  "/terms",
  "/security",
  "/support",
  "/api/auth",
  "/api/cron",
  "/api/webhooks",
  "/api/public"
];
```

### ❌ What's NOT Configured

**No CORS headers found in:**
- ❌ `next.config.mjs`
- ❌ `src/middleware.ts`
- ❌ Any API route handlers (`src/app/api/**/*.ts`)
- ❌ API middleware wrappers (`src/app/api/_middleware/*.ts`)

**No CORS-related code:**
- ❌ No `Access-Control-Allow-Origin` headers
- ❌ No `Access-Control-Allow-Methods` headers
- ❌ No `Access-Control-Allow-Headers` headers
- ❌ No `Access-Control-Allow-Credentials` headers
- ❌ No `OPTIONS` method handlers for preflight requests

---

## When CORS Headers Are Needed

### Scenario 1: Same-Origin Deployment (Current)

**Setup**: Next.js app deployed to single domain (e.g., `unite-hub.com`)
- Frontend: `unite-hub.com` (React pages)
- Backend: `unite-hub.com/api/*` (Next.js API routes)

**CORS Required?**: ❌ **NO**

**Reason**: Browser same-origin policy allows requests from `unite-hub.com` to `unite-hub.com/api/*` without CORS.

---

### Scenario 2: Separate Subdomain API

**Setup**: Frontend and API on different subdomains
- Frontend: `app.unite-hub.com`
- Backend: `api.unite-hub.com`

**CORS Required?**: ✅ **YES**

**Reason**: Different subdomains = different origins. Browser blocks cross-origin requests without CORS headers.

---

### Scenario 3: Third-Party API Access

**Setup**: External clients calling Unite-Hub API
- Client: `client-app.com`
- API: `unite-hub.com/api/*`

**CORS Required?**: ✅ **YES**

**Reason**: Cross-origin requests from browser-based clients require CORS. Server-to-server calls (cURL, Postman, backend services) do NOT require CORS.

---

### Scenario 4: Webhook Endpoints

**Setup**: External services (Stripe, Gmail, etc.) calling webhooks
- External: `stripe.com` → `unite-hub.com/api/webhooks/stripe`

**CORS Required?**: ❌ **NO**

**Reason**: Webhooks are server-to-server calls. CORS is only enforced by browsers, not backend services.

---

## How to Add CORS to Routes

### Method 1: Global CORS (All API Routes)

**File**: `next.config.mjs`

```typescript
// Add CORS headers to all /api/* routes
headers: async () => [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: '*' }, // Or specific domain
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      { key: 'Access-Control-Max-Age', value: '86400' }, // 24 hours
    ]
  }
]
```

**Pros**:
- Simple, one-time configuration
- Applies to all API routes automatically
- Easy to maintain

**Cons**:
- Less flexible (all routes get same CORS policy)
- Can't customize per-route

---

### Method 2: Route-Specific CORS

**File**: `src/app/api/your-route/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Handle preflight OPTIONS request
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Or specific domain
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Add CORS headers to actual request handler
export async function GET(req: NextRequest) {
  const data = { message: 'Hello World' };

  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

**Pros**:
- Fine-grained control per route
- Can customize CORS policy per endpoint
- Explicit and clear

**Cons**:
- Requires manual implementation on each route
- More code duplication
- Easy to forget on new routes

---

### Method 3: Middleware CORS Wrapper

**File**: `src/app/api/_middleware/with-cors.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export interface CorsOptions {
  origin: string | string[];
  methods?: string[];
  allowHeaders?: string[];
  credentials?: boolean;
}

export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CorsOptions = { origin: '*' }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: getCorsHeaders(req, options),
      });
    }

    // Call actual handler
    const response = await handler(req);

    // Add CORS headers to response
    const corsHeaders = getCorsHeaders(req, options);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

function getCorsHeaders(req: NextRequest, options: CorsOptions): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = getAllowedOrigin(origin, options.origin);

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': (options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']).join(', '),
    'Access-Control-Allow-Headers': (options.allowHeaders || ['Content-Type', 'Authorization']).join(', '),
    'Access-Control-Allow-Credentials': options.credentials ? 'true' : 'false',
    'Access-Control-Max-Age': '86400',
  };
}

function getAllowedOrigin(requestOrigin: string, allowedOrigins: string | string[]): string {
  if (allowedOrigins === '*') return '*';

  const origins = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];
  return origins.includes(requestOrigin) ? requestOrigin : origins[0];
}
```

**Usage**:

```typescript
// src/app/api/contacts/route.ts
import { withCors } from '@/app/api/_middleware/with-cors';

const handler = async (req: NextRequest) => {
  // Your handler logic
  return NextResponse.json({ data: [] });
};

export const GET = withCors(handler, {
  origin: ['https://app.unite-hub.com', 'https://unite-hub.com'],
  methods: ['GET', 'POST'],
  credentials: true,
});
```

**Pros**:
- Reusable across routes
- Consistent CORS implementation
- Handles preflight automatically
- Composable with existing middleware (`withApiHandler`)

**Cons**:
- Requires initial wrapper setup
- All routes must be updated to use wrapper

---

## CORS Security Best Practices

### 🔒 1. Never Use Wildcard with Credentials

```typescript
// ❌ INSECURE - Allows any origin to send credentials
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true'
}

// ✅ SECURE - Only specific origins can send credentials
{
  'Access-Control-Allow-Origin': 'https://app.unite-hub.com',
  'Access-Control-Allow-Credentials': 'true'
}
```

---

### 🔒 2. Whitelist Specific Origins

```typescript
// ❌ BAD - Allows all origins
'Access-Control-Allow-Origin': '*'

// ✅ GOOD - Allows only trusted origins
const allowedOrigins = [
  'https://unite-hub.com',
  'https://app.unite-hub.com',
  'https://staging.unite-hub.com',
];

const origin = req.headers.get('origin') || '';
const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
```

---

### 🔒 3. Limit HTTP Methods

```typescript
// ❌ TOO PERMISSIVE
'Access-Control-Allow-Methods': '*'

// ✅ EXPLICIT
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
```

---

### 🔒 4. Limit Headers

```typescript
// ❌ TOO PERMISSIVE
'Access-Control-Allow-Headers': '*'

// ✅ EXPLICIT
'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID'
```

---

### 🔒 5. Use Max-Age for Preflight Caching

```typescript
// Reduce preflight requests by caching for 24 hours
'Access-Control-Max-Age': '86400'
```

---

## CORS Preflight Requests

### What is Preflight?

Before certain cross-origin requests, browsers send an `OPTIONS` request to check if the server allows the request.

**Triggers preflight when**:
- Request method is `PUT`, `DELETE`, `PATCH`
- Custom headers are used (e.g., `Authorization`)
- `Content-Type` is not `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`

**Does NOT trigger preflight**:
- Simple `GET` or `POST` requests
- Standard headers only (`Content-Type: application/x-www-form-urlencoded`)

---

### Example Preflight Flow

```
1. Browser sends OPTIONS request:
   OPTIONS /api/contacts HTTP/1.1
   Origin: https://app.unite-hub.com
   Access-Control-Request-Method: POST
   Access-Control-Request-Headers: Content-Type, Authorization

2. Server responds with CORS headers:
   HTTP/1.1 200 OK
   Access-Control-Allow-Origin: https://app.unite-hub.com
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   Access-Control-Max-Age: 86400

3. Browser caches preflight response for 24 hours (Max-Age)

4. Browser sends actual request:
   POST /api/contacts HTTP/1.1
   Origin: https://app.unite-hub.com
   Content-Type: application/json
   Authorization: Bearer <token>
```

---

## Common CORS Patterns

### Pattern 1: Public API (No Auth)

```typescript
// Allow all origins, no credentials
export const GET = withCors(handler, {
  origin: '*',
  methods: ['GET'],
  credentials: false,
});
```

---

### Pattern 2: Authenticated API (Cookie-Based)

```typescript
// Allow specific origins, send cookies
export const GET = withCors(handler, {
  origin: ['https://app.unite-hub.com', 'https://unite-hub.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow cookies/auth headers
});
```

---

### Pattern 3: Token-Based API (No Cookies)

```typescript
// Allow multiple origins, bearer token auth
export const GET = withCors(handler, {
  origin: ['https://app.unite-hub.com', 'https://partner.com'],
  methods: ['GET', 'POST'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // No cookies, just bearer token
});
```

---

### Pattern 4: Webhook (No CORS Needed)

```typescript
// Webhooks are server-to-server, CORS not needed
export async function POST(req: NextRequest) {
  // Verify webhook signature
  const signature = req.headers.get('stripe-signature');
  // ... handle webhook

  return NextResponse.json({ received: true });
}
// No CORS headers needed
```

---

## Testing CORS Configuration

### Test with cURL

```bash
# Test preflight OPTIONS request
curl -X OPTIONS https://unite-hub.com/api/contacts \
  -H "Origin: https://app.unite-hub.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v

# Expected response headers:
# Access-Control-Allow-Origin: https://app.unite-hub.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization
# Access-Control-Max-Age: 86400
```

```bash
# Test actual request
curl -X POST https://unite-hub.com/api/contacts \
  -H "Origin: https://app.unite-hub.com" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Test"}' \
  -v

# Expected response headers:
# Access-Control-Allow-Origin: https://app.unite-hub.com
```

---

### Test with Browser DevTools

```javascript
// Open browser console on https://app.unite-hub.com
fetch('https://api.unite-hub.com/contacts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>',
  },
  body: JSON.stringify({ name: 'Test' }),
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('CORS error:', err));

// If CORS is NOT configured:
// ❌ Error: CORS policy: No 'Access-Control-Allow-Origin' header is present

// If CORS is configured correctly:
// ✅ Response data logged to console
```

---

## Environment-Specific CORS

```typescript
// src/app/api/_middleware/with-cors.ts

function getAllowedOrigins(): string[] {
  if (process.env.NODE_ENV === 'development') {
    return [
      'http://localhost:3008',
      'http://localhost:3000',
      'http://127.0.0.1:3008',
    ];
  }

  if (process.env.NODE_ENV === 'production') {
    return [
      'https://unite-hub.com',
      'https://app.unite-hub.com',
      'https://www.unite-hub.com',
    ];
  }

  // Staging
  return [
    'https://staging.unite-hub.com',
    'https://staging-app.unite-hub.com',
  ];
}

export function withCors(handler: ApiHandler) {
  return withCorsMiddleware(handler, {
    origin: getAllowedOrigins(),
    credentials: true,
  });
}
```

---

## When to Add CORS

### ✅ Add CORS When:

1. **Deploying API on separate subdomain**
   - Frontend: `app.unite-hub.com`
   - Backend: `api.unite-hub.com`

2. **Building public API for third-party clients**
   - External apps need to call Unite-Hub API from browser

3. **Enabling mobile app (WebView)**
   - React Native WebView making requests to API

4. **Setting up microservices architecture**
   - Multiple frontend services calling shared API

---

### ❌ Do NOT Add CORS When:

1. **Same-origin deployment (current)**
   - Frontend and API on same domain

2. **Server-to-server webhooks**
   - Stripe, Gmail, etc. calling your webhooks

3. **CLI tools or backend services**
   - cURL, Postman, Node.js scripts

4. **Internal API routes (not exposed to frontend)**
   - Background jobs, cron tasks, admin-only routes

---

## Checklist: Adding CORS to Unite-Hub

If you decide to implement CORS:

- [ ] **Determine deployment model**
  - Same-origin (no CORS needed)
  - Separate subdomain (CORS required)
  - Public API (CORS required)

- [ ] **Choose CORS implementation method**
  - [ ] Global CORS in `next.config.mjs`
  - [ ] Route-specific CORS in each handler
  - [ ] Middleware wrapper (`withCors`)

- [ ] **Define allowed origins**
  - [ ] Production domains
  - [ ] Staging domains
  - [ ] Development domains (localhost)

- [ ] **Configure CORS security**
  - [ ] Whitelist specific origins (avoid `*` if using credentials)
  - [ ] Limit HTTP methods to required set
  - [ ] Limit headers to required set
  - [ ] Set `Access-Control-Allow-Credentials` correctly

- [ ] **Implement preflight handling**
  - [ ] Add `OPTIONS` handler to routes
  - [ ] Set `Access-Control-Max-Age` for caching

- [ ] **Test CORS configuration**
  - [ ] Test preflight OPTIONS request
  - [ ] Test actual request with CORS headers
  - [ ] Test from browser DevTools
  - [ ] Test with different origins

- [ ] **Document CORS policy**
  - [ ] Update API documentation
  - [ ] Document allowed origins
  - [ ] Document required headers

---

## Related Documentation

- **Security Headers**: `next.config.mjs`, `src/middleware.ts`
- **Authentication**: `docs/API_AUTH_QUICK_REFERENCE.md`
- **API Routes**: `docs/API_ROUTE_SECURITY_AUDIT.md`
- **Public Routes**: `src/middleware.ts` (publicPaths array)

---

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Next.js: Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Next.js: Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [OWASP: CORS](https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny)

---

**Last Reviewed**: 2025-12-03
**Status**: ✅ Current configuration documented, no CORS currently implemented
**Action Required**: None (unless deployment model changes)
