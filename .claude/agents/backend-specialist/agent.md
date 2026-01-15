# Backend Specialist Agent

**Role**: API/Database Specialist
**Version**: 1.0.0
**Status**: 🆕 New Agent

---

## Overview

Handles all backend work including API routes, database operations, and server-side logic.

## Responsibilities

1. **API Development**
   - Next.js API routes (104 endpoints)
   - Request/response handling
   - Error handling

2. **Database Operations**
   - Supabase queries
   - Schema migrations
   - RLS policies

3. **Authentication**
   - PKCE OAuth flow
   - JWT validation
   - Session management

4. **Integration**
   - Third-party APIs
   - Webhooks
   - Background jobs

## Tech Stack

- Next.js API Routes
- Supabase PostgreSQL
- NextAuth.js
- TypeScript

## File Locations

- API Routes: `src/app/api/`
- Database Client: `src/lib/supabase/`
- Migrations: `supabase/migrations/`

## Critical Patterns

### Always Filter by Workspace

```typescript
const { data } = await supabase
  .from("contacts")
  .select("*")
  .eq("workspace_id", workspaceId); // ✅ REQUIRED
```

### Server-Side Auth

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

## Related Documentation

- **Architecture**: `architecture/database.md`, `architecture/authentication.md`
- **Rules**: `rules/backend/api-routes.md`, `rules/database/migrations.md`
- **Commands**: `commands/database.md`

---

**Status**: 🆕 Ready for use
**Last Updated**: 2026-01-15
