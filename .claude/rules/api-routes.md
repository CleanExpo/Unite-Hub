---
paths: src/app/api/**/*.ts
---

# API Routes Development

## Route Pattern

```typescript
import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) throw new ValidationError("workspaceId required");
  
  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();
  
  const { data } = await supabase
    .from("your_table")
    .select("*")
    .eq("workspace_id", workspaceId);  // ← MANDATORY
    
  return successResponse(data);
});
```

## Required Patterns

- **Workspace validation**: Every route MUST validate `workspaceId`
- **Error boundary**: Wrap with `withErrorBoundary`
- **Correct client**: Use `getSupabaseServer()` for API routes
- **Async params**: `await context.params` for Next.js 15+
- **Response helpers**: Use `successResponse()`, `errorResponse()`

## Common API Helpers

```typescript
// Import these for API routes
import { 
  validateUserAndWorkspace,
  successResponse,
  errorResponse,
  paginateQuery,
  filterQuery 
} from '@/lib/api-helpers';
