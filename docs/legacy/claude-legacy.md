# ⚠️ DEPRECATED: Use D:\Unite-Hub\CLAUDE.md instead

**This file has been archived as of 2025-12-08.**

**Primary guide is now**: `D:\Unite-Hub\CLAUDE.md` (root-level, v2.0.0)

**Why deprecated**: Consolidating to reduce context window bloat (this file was using 5.6k tokens).

**What was migrated**: Communication Style section → moved to root CLAUDE.md

---

# Unite-Hub - System Reference (LEGACY)

**AI-first CRM + marketing automation** | Next.js 16 + React 19 + Supabase + Claude API

---

## CRITICAL RULES (MUST FOLLOW)

### Communication Style
- **Extremely concise** - sacrifice grammar for concision in all interactions/commits
- **End plans w/ unresolved questions** - concise, sacrifice grammar

### Workspace Isolation
**ALWAYS filter by workspaceId** - never query without workspace filter
```typescript
// API: workspaceId from searchParams
const workspaceId = req.nextUrl.searchParams.get("workspaceId");
.eq("workspace_id", workspaceId)

// Components: from useAuth
const { currentOrganization } = useAuth();
const workspaceId = currentOrganization?.org_id;
```

### Supabase Client Selection
| Context | Import |
|---------|--------|
| Server Components | `import { createClient } from "@/lib/supabase/server"` |
| Client Components | `import { createClient } from "@/lib/supabase/client"` |
| API Routes | `import { getSupabaseServer } from "@/lib/supabase"` |
| Admin (bypass RLS) | `import { supabaseAdmin } from "@/lib/supabase"` |

### AI Model Selection
- **Complex reasoning**: `claude-opus-4-5-20251101` (Extended Thinking)
- **Standard ops**: `claude-sonnet-4-5-20250929` (default)
- **Quick tasks**: `claude-haiku-4-5-20251001`
- Trigger thinking: use "think", "think hard", "think harder", "ultrathink"

### Before DB Migrations
1. Check `.claude/SCHEMA_REFERENCE.md`
2. Run `\i scripts/rls-diagnostics.sql` in Supabase SQL Editor
3. Use idempotent patterns (IF NOT EXISTS, DO blocks)

---

## Tech Stack

**Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui
**Backend**: Next.js API Routes + Supabase PostgreSQL + RLS
**Auth**: NextAuth.js + Google OAuth (implicit flow)
**AI**: Claude Opus/Sonnet/Haiku + Extended Thinking
**Port**: 3008

---

## Core Features

- **AI agents**: Email processor, content generator, contact intelligence, orchestrator
- **Email integration**: Gmail OAuth, sync, open/click tracking
- **Drip campaigns**: Visual builder, conditional branching, A/B testing
- **Lead scoring**: 0-100 AI-powered (60-79 warm, 80-100 hot)
- **Dashboard**: Real-time contact mgmt, analytics, dark theme

---

## Agent Architecture

```
User Request → Orchestrator (.claude/agent.md)
  ├─→ Email Agent (email processing)
  ├─→ Content Agent (content generation)
  ├─→ Frontend Agent (UI/routes)
  ├─→ Backend Agent (API/DB)
  └─→ Docs Agent (documentation)
```

**Rules**:
1. Orchestrator = single coordinator (no peer-to-peer)
2. Stateless agents (state in DB or Memory tool)
3. Workspace isolation mandatory
4. Audit everything (auditLogs table)
5. Fail gracefully (return error, don't throw)

---

## Environment Variables

**Required**:
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=your-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback

# AI
ANTHROPIC_API_KEY=sk-ant-your-key
```

**Optional**:
- Email: `SENDGRID_API_KEY` OR `RESEND_API_KEY` OR `EMAIL_SERVER_*`
- SEO: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`

---

## Dev Commands

```bash
# Dev
npm run dev                # Start dev server (port 3008)
npm run build              # Build production
npm test                   # Run all tests

# Agents
npm run email-agent        # Run email agent
npm run content-agent      # Run content agent
npm run orchestrator       # Run orchestrator
npm run workflow           # Full pipeline

# Database
npm run check:db           # Verify schema
# Then: Supabase Dashboard → SQL Editor → paste migration

# Quality
npm run quality:assess     # Code quality check
npm run integrity:check    # System integrity (8 agents, 15 tables, 23 routes)
```

---

## Critical Patterns

### 1. Auth Flow
- PKCE cookies (not localStorage)
- Sessions via `getUser()`, no JWT validation client-side
- Files: `src/middleware.ts`, `src/app/auth/callback/route.ts`

### 2. DB Migrations
- **Location**: `supabase/migrations/XXX_description.sql`
- **Apply**: Supabase Dashboard → SQL Editor → paste → run
- **Cache**: Wait 1-5min or `SELECT * FROM table LIMIT 1`
- **Idempotent**: Use `IF NOT EXISTS`, `DO $$ BEGIN ... END $$` for ENUMs

### 3. Anthropic API
- **Retry**: `callAnthropicWithRetry()` from `@/lib/anthropic/rate-limiter`
- **Caching**: Add `cache_control: { type: 'ephemeral' }` to system (90% savings)
- **Thinking**: Only for complex reasoning (5K-10K tokens, 27x cost)
- **Docs**: `docs/ANTHROPIC_PRODUCTION_PATTERNS.md`

### 4. Email Service
- Priority: SendGrid → Resend → Gmail SMTP
- Test: `node scripts/test-email-config.mjs`
- Config: `src/lib/email/email-service.ts`

### 5. OpenRouter Multi-Model
- `src/lib/ai/openrouter-intelligence.ts`
- Models: Claude 3.5 Sonnet | GPT-4 Turbo | Gemini Pro 1.5 | Llama 3 70B

### 6. Perplexity Sonar SEO
- `src/lib/ai/perplexity-sonar.ts`
- Cost: $0.005-0.01/search (99% cheaper than Semrush)

---

## Key Files

**Auth**: `src/middleware.ts`, `src/app/auth/callback/route.ts`, `src/lib/supabase/server.ts`
**Email**: `src/lib/email/email-service.ts`, `EMAIL_SERVICE_COMPLETE.md`
**SEO**: `docs/SEO_ENHANCEMENT_SUITE.md`, `docs/MULTI_PLATFORM_MARKETING_INTELLIGENCE.md`
**Anthropic**: `docs/ANTHROPIC_PRODUCTION_PATTERNS.md`, `src/lib/anthropic/rate-limiter.ts`
**RLS**: `.claude/RLS_WORKFLOW.md` (MANDATORY), `scripts/rls-diagnostics.sql`
**Schema**: `.claude/SCHEMA_REFERENCE.md`, `COMPLETE_DATABASE_SCHEMA.sql`
**Agents**: `.claude/agent.md` (CANONICAL), `.claude/AGENT_REFERENCE.md`
**Design**: `/DESIGN-SYSTEM.md` (read before UI work), `/docs/UI-LIBRARY-INDEX.md`

---

## Sub-folder Guides

| Domain | Path | Use |
|--------|------|-----|
| API Routes | `src/app/api/CLAUDE.md` | REST endpoints |
| Agents | `src/lib/agents/CLAUDE.md` | AI agent dev |
| Database | `supabase/CLAUDE.md` | Migrations, RLS |
| Components | `src/components/CLAUDE.md` | UI components |
| Core Lib | `src/lib/CLAUDE.md` | Business logic |

---

## Troubleshooting

**Quick fixes**: `.claude/QUICK_FIX_GUIDE.md` (90% issues)
- workspace_id undefined
- supabase not defined
- Email agent low quality
- Content generation slow
- RLS policy errors
- API 401 Unauthorized

**Agent lookup**: `.claude/AGENT_REFERENCE.md`
**Context optimization**: `.claude/context-manifest.md` (76% savings)

---

## Production Status

**65% prod-ready** (see `PRODUCTION_GRADE_ASSESSMENT.md`)
- ✅ Winston logging, Prometheus metrics, Redis cache, type-safe TS
- ❌ P0 gaps: Connection pooling (2-4h), Anthropic retry (2h), zero-downtime deploy (8-12h)

**Phase 5**: 16,116 LOC, 235+ tests (100% pass), <100ms latency, 99.5%+ reliability

---

## Design System (MANDATORY)

**Before ANY UI work**: Read `/DESIGN-SYSTEM.md`

**Forbidden**: `bg-white`, `text-gray-600`, `grid grid-cols-3 gap-4`, unstyled shadcn
**Required**: Design tokens (`bg-bg-card`, `text-text-primary`, `accent-500`)
**Accent**: `#ff6b35` (orange)
**Priority**: Project components → StyleUI/KokonutUI → shadcn base

**Min quality**: 9/10 on visual distinctiveness, brand alignment, code quality, a11y

---

**Last updated**: 2025-12-08 | **Status**: Active dev | **Version**: Phase 5 (D75)
