# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Application Overview

Unite-Hub is an **AI-first CRM and marketing automation platform** built with:
- **Frontend**: Next.js 16 (App Router, Turbopack) + React 19 + shadcn/ui + Tailwind CSS
- **Backend**: Next.js API Routes (104 endpoints) + Supabase PostgreSQL
- **AI Layer**: Anthropic Claude API (Opus 4, Sonnet 4.5, Haiku 4.5)
- **Auth**: Supabase Auth with Google OAuth 2.0 (implicit flow)

### Core Features
1. **AI Agents** - Email processing, content generation, contact intelligence, orchestrator coordination
2. **Email Integration** - Gmail OAuth, sync, tracking (opens/clicks)
3. **Drip Campaigns** - Visual builder, conditional branching, A/B testing
4. **Lead Scoring** - AI-powered (0-100), composite scoring algorithm
5. **Dashboard** - Real-time contact management, campaign analytics

---

## Development Commands

### Local Development
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3008)
npm run build            # Production build
npm run start            # Start production server
```

### Database
```bash
npm run check:db         # Verify schema
# Run migrations: Go to Supabase Dashboard → SQL Editor
```

### AI Agents
```bash
npm run email-agent      # Process emails
npm run content-agent    # Generate content
npm run orchestrator     # Coordinate workflows
npm run workflow         # Full pipeline
npm run audit-system     # System health check
npm run analyze-contacts # Contact scoring
npm run generate-content # Content generation
```

### Testing
```bash
npm test                 # Run API flow tests
npm run test:api         # Same as above
```

### Docker (if configured)
```bash
npm run docker:start     # Start containers
npm run docker:stop      # Stop containers
npm run docker:logs      # View logs
npm run docker:rebuild   # Clean rebuild
```

---

## Critical Architecture Patterns

### 1. Authentication Pattern (Implicit OAuth)

**Problem**: Supabase implicit OAuth stores tokens in localStorage (client-side only). Server-side API routes can't access these tokens directly.

**Solution Pattern** (apply to all authenticated API routes):

**Client Side** (`src/app/dashboard/*/page.tsx`):
```typescript
const handleApiCall = async () => {
  // Get session token from Supabase
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Handle no session
    return;
  }

  const response = await fetch("/api/your-endpoint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`, // ← CRITICAL
    },
    body: JSON.stringify(data),
  });
};
```

**Server Side** (`src/app/api/*/route.ts`):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      // Use browser client for implicit OAuth tokens
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      // Fallback to server-side cookies (PKCE flow)
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get Supabase instance for database operations
    const supabase = await getSupabaseServer();

    // Your API logic here using userId and supabase
    // ...

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Files Using This Pattern**:
- ✅ `src/app/api/profile/update/route.ts` (reference implementation)
- ⚠️ `src/app/api/agents/contact-intelligence/route.ts` (needs fix)
- ⚠️ Other API routes returning 401 errors

---

### 2. Supabase Client Usage

**Three Client Types** (use the right one for each context):

1. **`supabaseBrowser`** (`src/lib/supabase.ts`)
   - **When**: Client-side React components
   - **Why**: Accesses localStorage tokens
   - **Import**: `import { supabase } from "@/lib/supabase";`

2. **`getSupabaseServer()`** (async function)
   - **When**: Server-side API routes, RSC
   - **Why**: Accesses cookies, SSR-compatible
   - **Import**: `import { getSupabaseServer } from "@/lib/supabase";`
   - **Usage**: `const supabase = await getSupabaseServer();`

3. **`supabaseAdmin`** (service role)
   - **When**: Admin operations bypassing RLS
   - **Why**: Uses service role key
   - **Import**: `import { supabaseAdmin } from "@/lib/supabase";`

**CRITICAL**: Never use `supabaseServer` Proxy (removed due to async issues). Always call `await getSupabaseServer()`.

---

### 3. Workspace Isolation Pattern

**All database queries MUST be scoped to workspace**:

```typescript
// ❌ WRONG - Returns data from all workspaces
const { data } = await supabase
  .from("contacts")
  .select("*");

// ✅ CORRECT - Scoped to user's workspace
const { data } = await supabase
  .from("contacts")
  .select("*")
  .eq("workspace_id", workspaceId);
```

**Getting workspaceId**:
```typescript
// In API routes
const workspaceId = req.nextUrl.searchParams.get("workspaceId");

// In React components
const { currentOrganization } = useAuth();
const workspaceId = currentOrganization?.org_id;
```

**Known Issue**: Demo mode uses `"default-org"` string instead of UUID, causing `invalid input syntax for type uuid` errors.

---

### 4. Database Schema Migrations

**Location**: `supabase/migrations/`

**How to Apply**:
1. Create migration file: `00X_description.sql`
2. Go to Supabase Dashboard → SQL Editor
3. Copy/paste SQL and run
4. **Important**: Supabase caches schema. After migration, either:
   - Wait 1-5 minutes for auto-refresh
   - Run: `SELECT * FROM table_name LIMIT 1;` to force cache refresh

**Recent Migration**:
- `004_add_profile_fields.sql` - Adds username, bio, phone, etc. to `user_profiles`

**Pattern for Idempotent Constraints**:
```sql
-- Use DO $$ blocks for constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'constraint_name') THEN
    ALTER TABLE table_name ADD CONSTRAINT constraint_name CHECK (condition);
  END IF;
END $$;
```

---

### 5. React Component Patterns

**Controlled Components** (avoid uncontrolled-to-controlled warnings):
```typescript
// ❌ WRONG - Can switch from undefined to string
<Select value={value || undefined} />

// ✅ CORRECT - Always controlled
<Select value={value || ""} />
```

**AuthContext Usage**:
```typescript
import { useAuth } from "@/contexts/AuthContext";

const { user, profile, currentOrganization, loading } = useAuth();

// Always check loading state first
if (loading) return <div>Loading...</div>;
if (!user) return <div>Please log in</div>;

// user and profile are now guaranteed to exist
```

---

## Database Schema (18 Tables)

### Core Tables
- `organizations` - Top-level org entities
- `user_profiles` - Extended user data (recently updated with username, bio, phone, etc.)
- `user_organizations` - User-org relationships with roles
- `workspaces` - Team workspaces

### Contact & Email
- `contacts` - CRM contacts with `ai_score` (0-100)
- `emails`, `email_opens`, `email_clicks` - Email tracking
- `integrations` - OAuth tokens (Gmail, etc.)

### Campaigns
- `campaigns` - Email campaigns
- `drip_campaigns`, `campaign_steps`, `campaign_enrollments`, `campaign_execution_logs`

### AI
- `generatedContent` - AI-generated content drafts
- `aiMemory` - Agent memory storage
- `auditLogs` - System audit trail

---

## AI Agent Architecture

### Orchestrator → Specialist Pattern

```
User Request → Orchestrator Agent (.claude/agent.md)
    ├─→ Email Agent (email processing)
    ├─→ Content Agent (content generation with Extended Thinking)
    ├─→ Frontend Agent (UI/route fixes)
    ├─→ Backend Agent (API/database work)
    └─→ Docs Agent (documentation updates)
```

### Agent Communication Rules
1. Orchestrator is single coordinator (no peer-to-peer)
2. All agents are stateless (state in DB or aiMemory)
3. Workspace isolation mandatory
4. Audit everything to auditLogs
5. Fail gracefully

### AI Model Selection
- **Opus 4** (`claude-opus-4-1-20250805`) - Content generation with Extended Thinking (5000-10000 token budget)
- **Sonnet 4.5** (`claude-sonnet-4-5-20250929`) - Standard operations
- **Haiku 4.5** (`claude-haiku-4-5-20251001`) - Quick tasks, documentation

---

## Known Issues & Fixes

### Recently Fixed (2025-11-15)
✅ Profile update 401 errors - Auth pattern implemented
✅ Select uncontrolled warning - Fixed in ClientSelector
✅ Schema mismatch - Migration created and applied

### Outstanding Issues
⚠️ **HIGH**: "default-org" UUID error affecting 10+ API calls
⚠️ **MEDIUM**: Contact Intelligence API 401 errors (apply auth pattern)
⚠️ **LOW**: Missing `user_onboarding` table (gracefully handled)

**See**: `BROKEN_FUNCTIONALITY_AUDIT.md` for complete list

---

## Authentication Flow (OAuth → Dashboard)

```
1. User clicks "Continue with Google"
2. Supabase OAuth (implicit flow)
3. Redirect to /auth/implicit-callback (client-side)
4. Client reads tokens from URL hash → localStorage
5. Redirect to /dashboard/overview
6. AuthContext detects SIGNED_IN event
7. Calls /api/auth/initialize-user (creates profile, org, workspace)
8. Fetches profile + organizations
9. Dashboard renders with workspace-scoped data
```

**Critical Points**:
- Tokens stored in localStorage (not httpOnly cookies)
- API routes need Authorization header with Bearer token
- First login triggers user initialization

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=your-secret-key

# OAuth Callback
GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback
```

---

## Testing Strategy

### Current Tests
- `test-api-flows.mjs` - API integration tests
- Agent scripts can be run individually for testing

### Needed (Post-V1)
- Unit tests for AI agents (`tests/agents/`)
- Integration tests (`tests/integration/`)
- E2E tests (`tests/e2e/`)

---

## Important Files

**Agent Definitions**: `.claude/agent.md` (CANONICAL)
**System Audit**: `COMPLETE_SYSTEM_AUDIT.md`, `BROKEN_FUNCTIONALITY_AUDIT.md`
**Recent Fixes**: `FIXES_COMPLETED_SUMMARY.md`
**Database**: `COMPLETE_DATABASE_SCHEMA.sql`, `supabase/migrations/`
**OAuth Setup**: `OAUTH_SUCCESS.md`

---

## Design Decisions

1. **Supabase over Convex** - Better Next.js integration, PostgreSQL familiarity, RLS policies (migration 90% complete)

2. **Implicit OAuth Flow** - Simpler for MVP, fewer redirects. Tokens in localStorage. Consider PKCE in V2 for enhanced security.

3. **Extended Thinking for Content** - Higher quality justifies cost (~$0.10-0.20 per generation)

---

## Port Configuration

Default: **3008** (not 3000)

Change in `package.json`: `"dev": "next dev -p 3008"`

---

**This file should be updated after significant architecture changes or when new critical patterns are established.**
