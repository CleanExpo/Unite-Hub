# Core Library Guide

## IMPORTANT: Supabase Client Selection

| Context | Import | Usage |
|---------|--------|-------|
| Server Components | `import { createClient } from "@/lib/supabase/server"` | RSC, layouts |
| Client Components | `import { createClient } from "@/lib/supabase/client"` | Hooks, event handlers |
| API Routes | `import { getSupabaseServer } from "@/lib/supabase"` | Route handlers |
| Admin Operations | `import { supabaseAdmin } from "@/lib/supabase"` | Service role bypass RLS |

**NEVER mix contexts.** Server clients cannot be used in client components.

## Exemplar Files
- `src/lib/supabase/server.ts` - Server client with PKCE cookies
- `src/lib/api-helpers.ts` - API utilities (pagination, filtering, responses)
- `src/lib/anthropic/rate-limiter.ts` - AI retry logic
- `src/lib/errors/boundaries.ts` - Error handling

## DO: Error Handling Pattern

```typescript
import { withErrorBoundary, ValidationError, DatabaseError } from '@/lib/errors/boundaries';
import { successResponse } from '@/lib/api-helpers';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const param = req.nextUrl.searchParams.get("param");

  if (!param) {
    throw new ValidationError("param is required");
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.from("table").select("*");

  if (error) {
    throw new DatabaseError(error.message);
  }

  return successResponse(data);
});
```

## DO: API Helper Usage

```typescript
import {
  parsePagination,
  createPaginationMeta,
  successResponse,
  parseQueryFilters,
  applyQueryFilters,
  parseSorting,
} from "@/lib/api-helpers";

// Pagination
const { limit, offset, page, pageSize } = parsePagination(searchParams, {
  pageSize: 20,
  maxPageSize: 100,
});

// Sorting
const { sortBy, sortOrder } = parseSorting(searchParams, {
  allowedFields: ["name", "created_at"],
  defaultField: "created_at",
  defaultOrder: "desc",
});

// Response with meta
return successResponse(data, {
  pagination: createPaginationMeta(count, page, pageSize),
});
```

## DO: Anthropic with Retry

```typescript
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

const response = await callAnthropicWithRetry({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Your prompt' }
  ],
});
```

## DON'T: Anti-patterns

- **Direct env access**: Use validated config objects
- **Synchronous DB calls**: Always use async/await
- **Missing type safety**: Define interfaces for all data
- **No error handling**: Always use error boundaries
- **Direct Anthropic calls**: Use rate limiter wrapper

## Key Modules

```
src/lib/
├── supabase/           # Database clients
├── anthropic/          # AI rate limiting
├── api-helpers.ts      # Response helpers
├── errors/             # Error boundaries
├── auth/               # Authentication
├── cache/              # Redis caching
├── queue/              # Bull queue
├── monitoring/         # Metrics & alerts
└── agents/             # AI agents (see src/lib/agents/CLAUDE.md)
```

## Search Commands

```bash
rg "export function" src/lib/ --type ts | head -30    # Public functions
rg "getSupabaseServer" src/lib/                       # Server client usage
rg "supabaseAdmin" src/lib/                           # Admin client usage
rg "callAnthropicWithRetry" src/lib/                  # AI rate limiting
```

## Pre-PR Checklist

```bash
npm run typecheck && npm run test:unit && npm run lint
```
