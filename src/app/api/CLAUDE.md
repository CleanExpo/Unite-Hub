# API Routes Guide

## IMPORTANT: All routes MUST have
1. Workspace validation (line ~33-40 in exemplars)
2. Error boundary wrapper (withErrorBoundary)
3. Proper status codes and error handling

## Exemplar Files
- `src/app/api/contacts/route.ts` - Contact CRUD with pagination, filtering, sorting
- `src/app/api/campaigns/route.ts` - Campaign management

## DO: Pattern to follow

```typescript
import type { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import { successResponse, parsePagination } from "@/lib/api-helpers";
import { withErrorBoundary, ValidationError } from "@/lib/errors/boundaries";

export const GET = withErrorBoundary(async (req: NextRequest) => {
  // 1. Get workspace ID from query params
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    throw new ValidationError("workspaceId parameter is required");
  }

  // 2. Validate user authentication and workspace access
  await validateUserAndWorkspace(req, workspaceId);

  // 3. Get authenticated supabase client
  const supabase = await getSupabaseServer();

  // 4. Query with workspace filter
  const { data, error } = await supabase
    .from("your_table")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  // 5. Return with successResponse helper
  return successResponse(data);
});
```

## DON'T: Anti-patterns

- Missing workspace filter: `.select("*")` without `.eq("workspace_id", workspaceId)`
- Direct client: Using `createClient()` instead of `getSupabaseServer()`
- No validation: Skipping `validateUserAndWorkspace()`
- Wrong response: Using `Response.json()` instead of `NextResponse.json()` or helpers

## Key Imports

```typescript
// Supabase
import { getSupabaseServer } from "@/lib/supabase";

// Validation
import { validateUserAndWorkspace } from "@/lib/workspace-validation";

// API Helpers
import {
  parsePagination,
  createPaginationMeta,
  successResponse,
  parseQueryFilters,
  applyQueryFilters,
  parseSorting,
} from "@/lib/api-helpers";

// Error Handling
import {
  withErrorBoundary,
  ValidationError,
  ConflictError,
  DatabaseError,
} from "@/lib/errors/boundaries";
```

## Search Commands

```bash
rg "getSupabaseServer" src/app/api/ -l              # Files using correct client
rg "workspace_id" src/app/api/ --type ts            # Workspace filtering
rg "withErrorBoundary" src/app/api/ -l              # Error handling
rg "validateUserAndWorkspace" src/app/api/ -l       # Auth validation
```

## Pre-PR Checklist

```bash
npm run lint && npm run build && npm run test:api
```

## Common Gotchas

1. **workspaceId from searchParams, not body** - For GET requests
2. **Use `withErrorBoundary` wrapper** - Don't manually try/catch
3. **Use helper functions** - `successResponse`, `parsePagination`, etc.
4. **Selective field loading** - Don't `select("*")` in production
