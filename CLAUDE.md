# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Application Overview

Unite-Hub is an **AI-first CRM and marketing automation platform** built with:
- **Frontend**: Next.js 16 (App Router, Turbopack) + React 19 + shadcn/ui + Tailwind CSS
- **Backend**: Next.js API Routes (104 endpoints) + Supabase PostgreSQL
- **AI Layer**: Anthropic Claude API (Opus 4, Sonnet 4.5, Haiku 4.5)
- **Auth**: Supabase Auth with Google OAuth 2.0 (implicit flow)
- **Email**: Multi-provider system (SendGrid → Resend → Gmail SMTP with automatic failover)

### Core Features
1. **AI Agents** - Email processing, content generation, contact intelligence, orchestrator coordination
2. **Email Integration** - Gmail OAuth, multi-provider email service, tracking (opens/clicks)
3. **Drip Campaigns** - Visual builder, conditional branching, A/B testing
4. **Lead Scoring** - AI-powered (0-100), composite scoring algorithm
5. **Dashboard** - Real-time contact management, campaign analytics
6. **Multimedia System** ✅ - File upload, OpenAI Whisper transcription, Claude AI analysis, full-text search

---

## Development Commands

### Local Development
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3008)
npm run build            # Production build
npm run start            # Production server
```

### Testing
```bash
npm test                 # Run all Vitest tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # Playwright end-to-end tests
npm run test:coverage    # Generate coverage report
npm run test:api         # Legacy API flow tests
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
npm run test:caching     # Verify prompt caching
```

### Docker
```bash
npm run docker:start     # Start core services
npm run docker:stop      # Stop all services
npm run docker:logs      # View logs
npm run docker:rebuild   # Clean rebuild
npm run docker:health    # Check service health

# With observability stack
docker-compose --profile observability up -d

# With MCP servers
docker-compose --profile mcp up -d
```

### Quality & Monitoring
```bash
npm run quality:assess   # Run quality assessment
npm run quality:report   # Generate quality report file
```

---

## Critical Architecture Patterns

### 1. Authentication Pattern (Implicit OAuth)

**Problem**: Supabase implicit OAuth stores tokens in localStorage (client-side only). Server-side API routes can't access these tokens directly.

**Solution Pattern** (apply to all authenticated API routes):

**Client Side** (`src/app/dashboard/*/page.tsx`):
```typescript
const handleApiCall = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return;

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
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();
    // Your API logic here using userId and supabase

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Reference**: `src/app/api/profile/update/route.ts`

---

### 2. Supabase Client Usage

**Three Client Types** (use the right one for each context):

1. **`supabaseBrowser`** - Client-side React components (accesses localStorage tokens)
   ```typescript
   import { supabase } from "@/lib/supabase";
   ```

2. **`getSupabaseServer()`** - Server-side API routes, RSC (accesses cookies, SSR-compatible)
   ```typescript
   import { getSupabaseServer } from "@/lib/supabase";
   const supabase = await getSupabaseServer();
   ```

3. **`supabaseAdmin`** - Admin operations bypassing RLS (uses service role key)
   ```typescript
   import { supabaseAdmin } from "@/lib/supabase";
   ```

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

---

### 4. Email Service Architecture

**Multi-Provider Fallback** (`src/lib/email/email-service.ts`):

```typescript
// Priority order: SendGrid → Resend → Gmail SMTP
import { sendEmail } from '@/lib/email/email-service';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome!</h1>',
  text: 'Welcome!',
  provider: 'auto', // Automatic failover
});

if (result.success) {
  console.log('Sent via:', result.provider);
  console.log('Message ID:', result.messageId);
}
```

**Configuration**:
```env
# SendGrid (priority 1)
SENDGRID_API_KEY=your-key

# Resend (priority 2)
RESEND_API_KEY=your-key

# Gmail SMTP (priority 3, always available)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=contact@unite-group.in
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=contact@unite-group.in
```

**Testing**:
```bash
node scripts/test-email-config.mjs
```

---

### 5. Anthropic API Patterns

**See `docs/ANTHROPIC_PRODUCTION_PATTERNS.md` for complete implementation guides.**

#### Rate Limiting with Exponential Backoff

```typescript
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

const result = await callAnthropicWithRetry(async () => {
  return await anthropic.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 2048,
    messages: [{ role: 'user', content: 'Analyze contact...' }],
  });
});
```

#### Prompt Caching (90% Cost Savings)

```typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2048,
  system: [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' }, // Cache for 5 minutes
    },
  ],
  messages: [{ role: 'user', content: dynamicContent }],
});

// Monitor cache performance
console.log('Cache hit:', (message.usage.cache_read_input_tokens || 0) > 0);
```

#### Extended Thinking (Complex Tasks Only)

```typescript
const message = await anthropic.messages.create({
  model: 'claude-opus-4-1-20250805',
  thinking: {
    type: 'enabled',
    budget_tokens: 10000, // Use for complex analysis only
  },
  messages: [{ role: 'user', content: 'Strategic analysis...' }],
});
```

**Cost**: Thinking tokens = $7.50/MTok (27x more expensive than non-thinking)
**Use When**: Complex reasoning, strategic planning, code debugging
**Avoid**: Simple lookups, intent extraction, quick queries

---

### 6. Database Schema Migrations

**Location**: `supabase/migrations/`

**How to Apply**:
1. Create migration file: `00X_description.sql`
2. Go to Supabase Dashboard → SQL Editor
3. Copy/paste SQL and run
4. **Important**: Supabase caches schema. After migration:
   - Wait 1-5 minutes for auto-refresh, OR
   - Run: `SELECT * FROM table_name LIMIT 1;` to force cache refresh

**Pattern for Idempotent Constraints**:
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'constraint_name') THEN
    ALTER TABLE table_name ADD CONSTRAINT constraint_name CHECK (condition);
  END IF;
END $$;
```

### ⚠️ CRITICAL: RLS Migration Workflow (MANDATORY)

**Before ANY RLS-related work**:

**Step 1: Run Diagnostics** (30 seconds, saves 2 hours):
```bash
# In Supabase SQL Editor
\i scripts/rls-diagnostics.sql
```

**Step 2: Follow 3-Step Process**:
- See `.claude/RLS_WORKFLOW.md` for complete workflow
- Create helper functions FIRST (migration 023)
- Test on ONE table (migration 024)
- Apply to all tables (migration 025)

**Common Error**:
```
Error: "operator does not exist: uuid = text"
Root Cause: Helper functions don't exist in database
Solution: Run diagnostics, create functions (023), THEN policies
```

**DO NOT skip diagnostics. DO NOT create policies before functions exist.**

---

## Production-Grade Enhancements

**See `PRODUCTION_GRADE_ASSESSMENT.md` for complete analysis.**

### Current Status: 65% Production-Ready

**Strengths** ✅:
- Winston logging with daily rotation
- Prometheus metrics collection
- Redis caching framework
- Performance monitoring utilities
- Type-safe TypeScript

**P0 Critical Gaps** ❌:
1. **No database connection pooling** → Enable Supabase Pooler (2-4 hours, 60-80% latency reduction)
2. **No Anthropic retry logic** → Add exponential backoff (2 hours, prevents outages)
3. **No zero-downtime deployments** → Docker multi-stage + blue-green (8-12 hours)

**Implementation Priority**:
```bash
# Week 1 (P0)
1. Database connection pooling
2. Anthropic retry logic
3. Zero-downtime deployment

# Weeks 2-4 (P1)
4. Datadog APM integration
5. Tiered rate limiting
6. Distributed tracing
7. Multi-layer caching
```

**ROI**: 42-62 hours investment → 3-5x capacity, 99.9% uptime, $5k-50k saved per prevented outage

---

## AI Agent Architecture

### Orchestrator → Specialist Pattern

```
User Request → Orchestrator (.claude/agent.md)
    ├─→ Email Agent (email processing)
    ├─→ Content Agent (content with Extended Thinking)
    ├─→ Frontend Agent (UI/route fixes)
    ├─→ Backend Agent (API/database work)
    └─→ Docs Agent (documentation updates)
```

### AI Model Selection
- **Opus 4** (`claude-opus-4-1-20250805`) - Content generation with Extended Thinking (5000-10000 token budget)
- **Sonnet 4.5** (`claude-sonnet-4-5-20250929`) - Standard operations
- **Haiku 4.5** (`claude-haiku-4-5-20251001`) - Quick tasks, documentation

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

# Email Service (at least one required)
SENDGRID_API_KEY=your-key                  # Priority 1
RESEND_API_KEY=your-key                    # Priority 2
EMAIL_SERVER_HOST=smtp.gmail.com           # Priority 3
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=contact@unite-group.in
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=contact@unite-group.in
```

---

## Important Files

### Production Enhancements
- **`PRODUCTION_GRADE_ASSESSMENT.md`** - Complete production audit (65% ready → 95% roadmap)
- **`docs/ANTHROPIC_PRODUCTION_PATTERNS.md`** - Official Anthropic API patterns from docs.claude.com

### Email Service
- **`src/lib/email/email-service.ts`** - Multi-provider email service (535 lines)
- **`EMAIL_SERVICE_COMPLETE.md`** - Email implementation summary
- **`GMAIL_APP_PASSWORD_SETUP.md`** - Gmail SMTP setup guide
- **`scripts/test-email-config.mjs`** - Email configuration test

### RLS & Database Security
- **`.claude/RLS_WORKFLOW.md`** - MANDATORY 3-step RLS migration process
- **`scripts/rls-diagnostics.sql`** - Pre-flight diagnostic script
- **`docs/RLS_MIGRATION_POSTMORTEM.md`** - Common RLS errors and prevention

### Core Documentation
- **`.claude/agent.md`** - Agent definitions (CANONICAL)
- **`README.md`** - Project README with setup instructions
- **`COMPLETE_DATABASE_SCHEMA.sql`** - Full database schema (19 tables)

---

## Port Configuration

Default: **3008** (not 3000)

Change in `package.json`: `"dev": "next dev -p 3008"`

---

## Testing Strategy

### Test Structure
```
tests/
├── unit/           # Isolated function tests
├── integration/    # API + database tests
├── components/     # React component tests
└── e2e/           # Playwright end-to-end tests
```

### Commands
```bash
npm test                 # All Vitest tests
npm run test:unit        # Unit tests only
npm run test:e2e         # Playwright E2E tests
npm run test:coverage    # Coverage report
```

---

## Known Issues

### Recently Fixed (2025-01-18)
✅ Email service implementation (multi-provider failover)
✅ Production assessment complete (65% ready)
✅ Anthropic API patterns documented

### P0 Outstanding (Block Production)
❌ Database connection pooling (60-80% latency improvement available)
❌ Anthropic retry logic (production outages inevitable without)
❌ Zero-downtime deployments (brief outages during updates)

**See**: `PRODUCTION_GRADE_ASSESSMENT.md` for complete P0/P1/P2 prioritization

---

## Quick Reference

### Most Common Tasks

**1. Add New API Route** (authenticated):
```typescript
// src/app/api/your-route/route.ts
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    const { supabaseBrowser } = await import("@/lib/supabase");
    const { data, error } = await supabaseBrowser.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  // ALWAYS filter by workspaceId
}
```

**2. Send Email** (with automatic failover):
```typescript
import { sendEmail } from '@/lib/email/email-service';

await sendEmail({
  to: 'user@example.com',
  subject: 'Your subject',
  html: '<h1>Content</h1>',
  text: 'Plain text version',
});
```

**3. Call Anthropic API** (with caching + retry):
```typescript
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

const result = await callAnthropicWithRetry(async () => {
  return await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    system: [{
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' },
    }],
    messages: [{ role: 'user', content: userInput }],
  });
});
```

**4. Run Database Migration**:
```bash
# 1. Create file: supabase/migrations/00X_description.sql
# 2. Go to Supabase Dashboard → SQL Editor
# 3. Copy/paste SQL and run
# 4. Wait 1-5 min OR run: SELECT * FROM table_name LIMIT 1;
```

---

**Last Update**: 2025-01-18 - Added email service, production assessment, Anthropic patterns
