# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Unite-Hub is an **AI-first marketing CRM and automation platform** with two products:
- **Unite-Hub**: Core CRM for agencies (email, contacts, campaigns, AI agents)
- **Synthex.social**: White-label AI marketing platform for small businesses

**Tech Stack**: Next.js 16 (App Router), React 19, Supabase PostgreSQL, Anthropic Claude API, TypeScript 5.x

**Port**: 3008 (not 3000) — `npm run dev`

---

## Communication Style (CRITICAL)

- **Extremely concise** — Sacrifice grammar for concision in all interactions and commit messages
- **End plans with unresolved questions** — List open questions concisely (sacrifice grammar for brevity)

---

## 📚 Specialist Guide Routing (Load On-Demand)

**Context Budget**: Target 3-5k tokens total for CLAUDE.md guidance per session

**This file auto-loads (~3.8k tokens).** Load specialist guides only when needed:

| Task Type | Primary Guide | Tokens | When to Load |
|-----------|---------------|--------|--------------|
| **API Routes** | `src/app/api/API-GUIDE.md` | ~400 | Building/fixing REST endpoints |
| **Core Libraries** | `src/lib/LIB-GUIDE.md` | ~400 | Business logic, utilities |
| **Agent Development** | `src/lib/agents/AGENT-GUIDE.md` | ~400 | AI agent work |
| **UI Components** | `src/components/UI-GUIDE.md` | ~450 | Component development |
| **DB Migrations** | `supabase/DATABASE-GUIDE.md` | ~450 | Schema changes, RLS |
| **Troubleshooting** | `docs/guides/quick-fix-guide.md` | ~550 | 90% of common issues |
| **Schema Reference** | `docs/guides/schema-reference.md` | ~280 | Before ANY migration |
| **Founder OS** | `docs/guides/agent-reference.md` | ~460 | 8-agent system lookup |
| **Design System** | `/DESIGN-SYSTEM.md` | ~500 | Before ANY UI work |

**Rule**: Load ONLY the guide(s) needed for your current task. Don't load all guides preemptively.

**Verification**: Run `/context` to confirm Memory files ≤ 5k tokens for CLAUDE.md guidance.

---

## Critical Architecture Patterns

### 1. Multi-Tenant Isolation (MANDATORY)

**EVERY database query MUST filter by tenant/workspace:**

```typescript
// API Routes - Get from query params
const workspaceId = req.nextUrl.searchParams.get("workspaceId");
if (!workspaceId) throw new ValidationError("workspaceId required");
await validateUserAndWorkspace(req, workspaceId);

// Queries - ALWAYS add workspace filter
const { data } = await supabase
  .from("contacts")
  .select("*")
  .eq("workspace_id", workspaceId);  // ← MANDATORY
```

**Table Prefixes**:
- Unite-Hub core: No prefix (`contacts`, `campaigns`, `emails`)
- Synthex: `synthex_*` (`synthex_fin_accounts`, `synthex_exp_experiments`)
- Founder tools: `founder_*` or specific (`ai_phill_journal`, `cognitive_twin_domains`)

**RLS Policies**: All tables have `tenant_id` or `workspace_id` with Row Level Security. Check `.claude/SCHEMA_REFERENCE.md` before migrations.

### 2. Supabase Client Selection (Context-Specific)

**NEVER mix contexts** — server clients fail in browser, browser clients lack auth in server components:

| Context | Import | Usage |
|---------|--------|-------|
| **Server Components** | `import { createClient } from "@/lib/supabase/server"` | RSC, layouts |
| **Client Components** | `import { createClient } from "@/lib/supabase/client"` | Hooks, useState |
| **API Routes** | `import { getSupabaseServer } from "@/lib/supabase"` | Route handlers |
| **Admin Ops** | `import { supabaseAdmin } from "@/lib/supabase"` | Bypass RLS |

**Pattern**: Server client uses PKCE cookies (dynamic imports to avoid build-time `cookies()` calls), client uses singleton browser client.

### 3. Next.js 15+ Route Context (Async Params)

**All dynamic routes receive `params` as a Promise:**

```typescript
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;  // ← MUST await
  // ...
}
```

**Why**: Next.js 15+ made params async for performance. Forgetting `await` causes runtime errors.

### 4. Lazy Anthropic Client (AI Services)

**Pattern for services** (60-second TTL singleton to avoid repeated init):

```typescript
let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}
```

**Model Selection**:
- `claude-opus-4-5-20251101` — Extended Thinking (complex reasoning, budget: 5000-10000 tokens)
- `claude-sonnet-4-5-20250929` — Standard operations (default)
- `claude-haiku-4-5-20251001` — Quick tasks

**In API routes**: Use rate limiter — `import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter'`

### 5. Database Migrations (Idempotent SQL)

**Location**: `supabase/migrations/NNN_description.sql`

**Idempotent ENUMs** (avoid "already exists" errors):

```sql
DO $$ BEGIN
  CREATE TYPE synthex_exp_status AS ENUM ('draft', 'running', 'paused', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

**Apply**: Supabase Dashboard → SQL Editor → Paste migration → Run

**Before ANY migration**: Check `.claude/SCHEMA_REFERENCE.md` for existing schema. Run `\i scripts/rls-diagnostics.sql` for RLS checks.

### 6. Design System Enforcement

**BEFORE generating UI**: Read `/DESIGN-SYSTEM.md`

**Forbidden**:
- `bg-white`, `text-gray-600`, `grid grid-cols-3 gap-4`
- Raw shadcn cards without customization
- Generic icon sets without brand colors

**Required**:
- Design tokens: `bg-bg-card`, `text-text-primary`, `accent-500` (#ff6b35 orange)
- Library priority: Project components → StyleUI/KokonutUI → shadcn base (never raw)
- Hover/focus states, loading states, responsive breakpoints

**Quality gates**: 9/10 minimum on visual distinctiveness, brand alignment, code quality, accessibility.

---

## Common Commands

**Development**:
```bash
npm run dev              # Start dev server (port 3008)
npm run build            # Production build
npm run typecheck        # TypeScript validation
npm run lint             # ESLint
npm run test             # Run Vitest tests
npm run test:e2e         # Playwright E2E tests
```

**Agents & Automation**:
```bash
npm run email-agent      # Process emails with AI
npm run content-agent    # Generate personalized content
npm run orchestrator     # Multi-agent workflows
npm run integrity:check  # Founder OS health check
```

**Database**:
```bash
npm run check:db         # Verify schema
# Apply migrations: Supabase Dashboard → SQL Editor
```

**Docker** (optional):
```bash
npm run docker:start     # Start containers
npm run docker:health    # Health check
npm run docker:logs      # View logs
```

**Quality**:
```bash
npm run quality:assess   # Assess code quality
npm run audit:navigation # Check for broken links
npm run audit:placeholders # Find TODO comments
```

---

## Key File Locations

**Configuration**:
- `CLAUDE.md` (this file) — Main guide
- `DESIGN-SYSTEM.md` — UI design rules
- `.claude/SCHEMA_REFERENCE.md` — Database schema reference

**Sub-guides** (domain-specific):
- `src/app/api/API-GUIDE.md` — API route patterns
- `src/lib/LIB-GUIDE.md` — Core library utilities
- `src/lib/agents/AGENT-GUIDE.md` — AI agent development
- `supabase/DATABASE-GUIDE.md` — Migration workflows

**Architecture**:
- `src/lib/supabase/server.ts` — Server client (PKCE cookies)
- `src/lib/supabase/client.ts` — Browser client (singleton)
- `src/lib/api-helpers.ts` — Pagination, filtering, responses
- `src/lib/anthropic/rate-limiter.ts` — AI retry logic
- `src/middleware.ts` — Auth middleware

**AI Agents**:
- `.claude/agent.md` — Agent definitions (CANONICAL)
- `src/lib/agents/` — Agent implementations
- `scripts/run-*.mjs` — Agent CLI runners

---

## Environment Variables

**Required**:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Admin operations (server-only)
- `ANTHROPIC_API_KEY` — Claude AI
- `NEXTAUTH_URL` — Auth callback URL (http://localhost:3008)
- `NEXTAUTH_SECRET` — Session encryption key

**Optional**:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Gmail OAuth
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` — Outlook OAuth
- `OPENROUTER_API_KEY` — Multi-model routing
- `PERPLEXITY_API_KEY` — SEO research
- `SENDGRID_API_KEY` or `RESEND_API_KEY` — Email sending

**Validate**: `npm run validate:env`

---

## Big-Picture Architecture

### Three-Layer Stack

```
┌─────────────────────────────────────────────────┐
│ Next.js App Router (React 19 Server Components) │
│  • /app/(client)   — Unite-Hub CRM dashboard     │
│  • /app/(synthex)  — Synthex product             │
│  • /app/founder    — Founder intelligence tools  │
│  • /app/api        — 100+ API routes             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│ AI Agent Layer (Claude Opus/Sonnet/Haiku)       │
│  • Email Agent        — Extract intents          │
│  • Content Agent      — Generate campaigns       │
│  • Orchestrator       — Coordinate workflows     │
│  • Contact Intelligence — Lead scoring           │
│  • SEO Suite          — Keyword research         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│ Supabase PostgreSQL (Multi-tenant + RLS)        │
│  • 100+ tables with tenant_id isolation          │
│  • Row Level Security on ALL tables              │
│  • Table prefixes: none, synthex_*, founder_*    │
└──────────────────────────────────────────────────┘
```

### Agent Orchestrator Pattern

```
User Request → Orchestrator → Specialist Agents
                    ↓
           ┌────────┼────────┐
           ▼        ▼        ▼
      Email    Content   Frontend
      Agent     Agent     Agent
```

**Communication**: Stateless agents, state in database + `aiMemory` table. Orchestrator coordinates, no peer-to-peer calls.

### Founder Intelligence OS

8 specialized agents for founder analytics:
- **AI Phill** — Strategic advisor with journal entries
- **Cognitive Twin** — Business health monitoring (13 domains)
- **SEO Leak** — Competitive SEO intelligence
- **Social Inbox** — Multi-platform social monitoring
- **Search Suite** — Keyword tracking
- **Boost Bump** — Job queue for background tasks
- **Pre-Client** — Lead clustering and opportunity detection
- **Founder OS** — Business portfolio management

Tables: `founder_*`, `ai_phill_*`, `cognitive_twin_*`, `seo_leak_*`, etc.

Health check: `npm run integrity:check`

### Synthex Growth Stack

Phases A-E (50+ features):
- **Phase A**: Foundation (tenant profiles, onboarding, branding)
- **Phase B**: Core features (content, campaigns, social, SEO, analytics)
- **Phase C**: Advanced (automation, audience scoring, attribution, revenue tracking)
- **Phase D**: Intelligence (experiments, finance, market radar, multi-business registry)
- **Phase E**: Enterprise (white-label, agencies, compliance)

Tables: `synthex_*` prefix (100+ tables)

---

## Troubleshooting

**Quick fixes**: See `.claude/QUICK_FIX_GUIDE.md` for 90% of common issues:
- "workspace_id undefined" → Check query params in API route
- "supabase is not defined" → Verify correct client import for context
- "Type 'params' is missing 'await'" → Add `await context.params` (Next.js 15+)
- RLS policy errors → Check `.claude/SCHEMA_REFERENCE.md`, run `\i scripts/rls-diagnostics.sql`

**Build fails**:
- Memory issues → `npm run check:build-memory` (Node 22.x required, 6GB heap configured)
- Type errors → `npm run typecheck`

**Production gaps**: See `PRODUCTION_GRADE_ASSESSMENT.md` (65% production-ready, P0 gaps documented)

---

## Development Workflow

### Adding a New API Route

1. Read `src/app/api/CLAUDE.md`
2. Copy pattern from `src/app/api/contacts/route.ts`
3. Add workspace validation: `validateUserAndWorkspace(req, workspaceId)`
4. Filter queries: `.eq("workspace_id", workspaceId)`
5. Use error boundary: `withErrorBoundary(async (req) => { ... })`
6. Return with helper: `successResponse(data)`

### Adding a New Service (Synthex/Founder)

1. Create file in `src/lib/synthex/` or `src/lib/founder/`
2. Add lazy Anthropic client (60s TTL pattern)
3. Use `supabaseAdmin` for cross-tenant queries
4. Export typed functions with JSDoc
5. Write migration in `supabase/migrations/NNN_description.sql`
6. Use idempotent ENUM creation (DO blocks)
7. Test with `npm run typecheck && npm run test:unit`

### Adding a UI Component

1. **CRITICAL**: Read `/DESIGN-SYSTEM.md` first
2. Check `/src/components/ui/` for existing patterns
3. Reference `/docs/UI-LIBRARY-INDEX.md` (StyleUI, KokonutUI, Cult UI)
4. Use design tokens: `bg-bg-card`, `text-text-primary`, `accent-500`
5. Add states: hover, focus, loading, disabled
6. Ensure responsive: `md:`, `lg:` breakpoints
7. Test accessibility: aria-labels, focus rings
8. Self-verify: 9/10 on visual distinctiveness, brand alignment, code quality, a11y

---

## Important Notes

**Multi-tenant**: NEVER query without workspace filter. Data leakage = critical bug.

**Client context**: Server components cannot use browser APIs (`useState`, `useEffect`). Client components cannot use async RSC patterns. Mixing contexts causes build failures.

**Migrations**: Always idempotent (DO blocks for ENUMs, CREATE IF NOT EXISTS for tables). Run in Supabase Dashboard SQL Editor, not CLI (easier rollback).

**AI costs**: Extended Thinking (Opus 4) is 27x more expensive than standard. Use sparingly for complex reasoning only. Budget 5000-10000 tokens for thinking.

**Design compliance**: Generic LLM UI patterns (white cards, gray text, uniform grids) will be rejected. Follow DESIGN-SYSTEM.md strictly.

**Testing**: 235+ tests (100% pass). Add tests for new features: `npm run test:unit`, `npm run test:e2e`.

**Phase tracking**: Currently Phase 5 complete (real-time monitoring, WebSocket alerts, Redis caching). Synthex at Phase D45 (market radar). See project status in root CLAUDE.md.

---

*Last Updated: December 8, 2025 | Version: 2.0.2 | Status: Active Development*

**Context Optimization**: Sub-domain guides renamed (2025-12-08) — Only root CLAUDE.md auto-loads (~3.8k tokens)
