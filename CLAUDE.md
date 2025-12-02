# CLAUDE.md - Unite-Hub Development Guide

**AI-first CRM & marketing automation** with Next.js 16, React 19, Supabase, Claude API

- **Phase 5**: 16,116 LOC, 235+ tests (100% pass), <100ms latency, 99.5%+ reliability
- **Core**: AI agents, email sync, drip campaigns, lead scoring, real-time alerts, SEO suite

## Quick Commands

**Dev**: `npm run dev` (port 3008) | `npm run build` | `npm start`

**Test**: `npm test` | `npm run test:unit` | `npm run test:e2e` | `npm run test:coverage`

**Agents**: `npm run email-agent` | `npm run content-agent` | `npm run orchestrator` | `npm run workflow`

**SEO**: `npm run seo:research "topic"` | `npm run seo:eeat` | `npm run seo:comprehensive "topic"` | `npm run seo:usage`

**DB**: `npm run check:db` (then Supabase Dashboard → SQL Editor for migrations)

**Docker**: `npm run docker:start` | `npm run docker:stop` | `npm run docker:health`

**Quality**: `npm run quality:assess` | `npm run integrity:check`

**Cost**: Perplexity Sonar ($0.005-0.01/search, 99% cheaper than Semrush) | OpenRouter (70-80% savings)

## Key Architecture Components

### Real-Time & Monitoring (Phase 5 Week 4)

- **WebSocket** (`src/lib/websocket/websocket-server.ts`): <100ms latency, 1000+ connections — `broadcastAlert()` | `getMetrics()`
- **Redis Cache** (`src/lib/cache/redis-client.ts`): 80%+ hit rate, <5ms ops — `get<T>()` | `set<T>()` | `invalidatePattern()`
- **Bull Queue** (`src/lib/queue/bull-queue.ts`): 99.5%+ success, 100-500 jobs/sec
- **Alert Processor** (`src/lib/processing/alert-processor.ts`): 5-min dedup, multi-channel
- **Scheduled Jobs** (`src/lib/jobs/scheduled-jobs.ts`): Daily aggregation, 6h patterns, hourly checks
- **Metrics** (`src/lib/monitoring/alert-metrics.ts`): Health score 0-100, Prometheus export
- **Hook** (`src/hooks/useAlertWebSocket.ts`): Auto-reconnect with backoff

### SEO Suite (`src/lib/seoEnhancement/`)

- **Services**: auditService | contentOptimization | richResults | ctrOptimization | competitorGap
- **API**: `/audit` | `/content` | `/schema` | `/ctr` | `/competitors`
- **Agents**: `seo-audit` | `seo-content` | `seo-schema` | `seo-ctr` | `seo-competitor`

## Critical Patterns

### 1. Auth (PKCE Flow)

Sessions in cookies, JWT validation via `getUser()`, no localStorage tokens

- Server: `import { createClient } from "@/lib/supabase/server"`
- Client: `import { createClient } from "@/lib/supabase/client"`
- Middleware: `import { createMiddlewareClient } from "@/lib/supabase/middleware"`
- Admin: `import { supabaseAdmin } from "@/lib/supabase"`
- Files: `src/middleware.ts`, `src/app/auth/callback/route.ts`

### 2. Workspace Isolation

✅ ALWAYS `.eq("workspace_id", workspaceId)` on queries

- API: `req.nextUrl.searchParams.get("workspaceId")`
- React: `const { currentOrganization } = useAuth(); const workspaceId = currentOrganization?.org_id;`

### 3. Email Service

Priority: SendGrid → Resend → Gmail SMTP

- Config: `SENDGRID_API_KEY` | `RESEND_API_KEY` | `EMAIL_SERVER_HOST` (smtp.gmail.com) | `EMAIL_SERVER_PORT` (587) | `EMAIL_SERVER_USER` | `EMAIL_SERVER_PASSWORD` | `EMAIL_FROM`
- Test: `node scripts/test-email-config.mjs`

### 4. Anthropic API

See `docs/ANTHROPIC_PRODUCTION_PATTERNS.md`

- Retry: `import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter'`
- Caching: Add `cache_control: { type: 'ephemeral' }` to system (90% savings)
- Thinking: Use only for complex reasoning (budget_tokens: 5000-10000, $7.50/MTok = 27x cost)

### 5. Database Migrations

- **Location**: `supabase/migrations/00X_description.sql`
- **Apply**: Supabase Dashboard → SQL Editor → Copy/paste → Run
- **Cache**: Wait 1-5 min or run `SELECT * FROM table_name LIMIT 1;`
- **⚠️ BEFORE ANY MIGRATION**: Check `.claude/SCHEMA_REFERENCE.md`
- **⚠️ BEFORE RLS**: Run `\i scripts/rls-diagnostics.sql` in Supabase SQL Editor
- **Common schema**: `organizations`, `user_profiles`, `user_organizations`, `contacts`, `workspaces`

### 6. OpenRouter Multi-Model Routing

`src/lib/ai/openrouter-intelligence.ts`: Claude 3.5 Sonnet | GPT-4 Turbo | Gemini Pro 1.5 | Llama 3 70B

- **Social**: `generateSocialContent({platform, contentType, topic, brandVoice})` | `analyzeKeywords()` | `analyzeCompetitor()`

### 7. Perplexity Sonar SEO

`src/lib/ai/perplexity-sonar.ts`: `getLatestSEOTrends()` | `search(query, {domains})`

See `docs/MULTI_PLATFORM_MARKETING_INTELLIGENCE.md`

### 8. Founder Intelligence OS

`npm run integrity:check` — 8 agents, 15 DB tables, 23 API routes

- **Agents**: Founder OS | AI Phill | Cognitive Twin | SEO Leak | Social Inbox | Search Suite | Boost Bump | Pre-Client Identity
- **Tables**: founder_businesses | founder_business_vault_secrets | ai_phill_* | cognitive_twin_* | seo_leak_signal_profiles | social_inbox_* | search_keywords | boost_jobs | pre_clients
- **Files**: `scripts/run-integrity-check.mjs` | `scripts/INTEGRITY_CHECK_README.md` | Migrations 300-305
- **Troubleshoot**: Missing tables → migrations 300-305 | Missing routes → `src/app/api/founder/` | Missing services → `src/lib/founder/` or `src/lib/founderOps/`

## Environment & Config

**Port**: 3008 (not 3000)

**Required Env**: `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | `ANTHROPIC_API_KEY` | `GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_SECRET` | `NEXTAUTH_URL` | `NEXTAUTH_SECRET`

**Email**: `SENDGRID_API_KEY` (priority 1) OR `RESEND_API_KEY` (priority 2) OR `EMAIL_SERVER_*` (Gmail SMTP)

**SEO**: `PERPLEXITY_API_KEY` | `OPENROUTER_API_KEY`

**AI Models**: Opus 4.5 (Extended Thinking, 5000-10000 budget) | Sonnet 4.5 (standard) | Haiku 4.5 (quick tasks)

## Production Status

**65% Production-Ready** (See `PRODUCTION_GRADE_ASSESSMENT.md`)

- **Strengths**: Winston logging, Prometheus metrics, Redis caching, type-safe TypeScript
- **P0 Gaps**: Database connection pooling (2-4h, 60-80% latency) | Anthropic retry logic (2h, prevents outages) | Zero-downtime deployment (8-12h)

## Key Files

**Auth**: `src/middleware.ts` | `src/app/auth/callback/route.ts` | `src/lib/supabase/server.ts` | `src/lib/supabase/client.ts`

**Email**: `src/lib/email/email-service.ts` (535 LOC) | `EMAIL_SERVICE_COMPLETE.md` | `GMAIL_APP_PASSWORD_SETUP.md`

**SEO**: `docs/SEO_ENHANCEMENT_SUITE.md` | `docs/MULTI_PLATFORM_MARKETING_INTELLIGENCE.md` | `docs/SEO_COST_OPTIMIZATION_GUIDE.md`

**Anthropic**: `docs/ANTHROPIC_PRODUCTION_PATTERNS.md` | `src/lib/anthropic/rate-limiter.ts`

**RLS**: `.claude/RLS_WORKFLOW.md` (MANDATORY) | `scripts/rls-diagnostics.sql` | `.claude/SCHEMA_REFERENCE.md`

**Database**: `COMPLETE_DATABASE_SCHEMA.sql` | `supabase/migrations/`

**Agents**: `.claude/agent.md` (CANONICAL) | `.claude/AGENT_REFERENCE.md` (quick lookup) | `src/lib/agents/`

**Components**: 7 Framer Motion components in `src/components/ui/` — Showcase: `/showcases/components`

---

**Status**: PKCE auth ✅ | Phase 5 ✅ | 235+ tests ✅ | SEO suite ✅ | Founder OS ✅ | Last: 2025-12-02

---

## 5 Whys Image Generation Methodology (MANDATORY)

**⚠️ CRITICAL**: ALL images for Unite-Hub/Synthex MUST follow this methodology. NO exceptions.

### The Story We're Selling

Businesses across Australia (and the world) struggling to get their brand message out to potential customers. **We help them be heard.**

### 5 Whys Framework (Apply to EVERY Image)

Before generating any image, answer these 5 questions:

1. **WHY this image?** - What business problem does it address?
2. **WHY this style?** - What visual approach best communicates the message?
3. **WHY this situation?** - What scenario resonates with the target audience?
4. **WHY this person?** - Who should the audience see themselves as?
5. **WHY this feeling?** - What emotion do we want to evoke?

### Required Elements

✅ **DO USE**:
- HUMAN-CENTERED imagery - real people, real emotions
- Variety of styles: Photorealistic, Warm illustration, Lifestyle, Landscape
- Coffee shop meetings, success celebrations, human connection
- Australian/global business context
- Natural, warm color palettes
- Genuine expressions and situations

❌ **DO NOT USE**:
- NO robots, NO cold tech imagery, NO sci-fi elements
- NO purple/cyan/teal AI default colors
- NO text, labels, words, or numbers in images
- NO generic stock photo poses
- NO vendor names exposed (Gemini, Google, OpenAI, etc.)

### Technical Implementation

**Model**: `gemini-3-pro-image-preview` (Nano Banana 2)

**Package**: `@google/genai`

**Environment**: `GEMINI_API_KEY`

**Script**: `scripts/generate-images-5whys-human.mjs`

**Prompt Structure**:
```javascript
{
  id: 'image-id',
  category: 'hero|carousel|feature|lifestyle|casestudy|integration|dashboard|pricing',
  fiveWhys: {
    why1_image: 'What business problem does it address?',
    why2_style: 'What visual approach best communicates?',
    why3_situation: 'What scenario resonates with audience?',
    why4_person: 'Who should audience see themselves as?',
    why5_feeling: 'What emotion do we want to evoke?',
  },
  prompt: `[Style] description with human focus...
CRITICAL REQUIREMENTS:
- NO TEXT, NO LABELS, NO WORDS, NO NUMBERS
- HUMAN-CENTERED imagery - real people, real emotions
- NO robots, NO cold tech imagery, NO sci-fi elements
- Warm, genuine, relatable imagery
- Australian/global business context`
}
```

### Style Guide by Category

| Category | Style | Example Feeling |
|----------|-------|-----------------|
| hero | Photorealistic | Relief, Control, Success |
| carousel | Soft illustration | Recognition, Possibility |
| feature | Warm watercolor | Hope, Clarity |
| lifestyle | Documentary | Connection, Joy |
| casestudy | Editorial | Trust, Results |
| integration | Clean minimalist | Simplicity, Ease |
| dashboard | Modern lifestyle | Empowerment |
| pricing | Professional | Confidence |

### Approval Workflow

States: `pending` → `revised` → `approved` / `rejected`

Migration: `079_image_approvals_multistep_workflow.sql`

### Reference Script

See `scripts/generate-images-5whys-human.mjs` for complete implementation with 53 image definitions following the 5 Whys methodology.

---

## Context Window Optimization

**📚 Current approach**: `.claude/context-manifest.md` saves 76% context window

- Load CLAUDE.md (147 lines) + 1-2 task-specific docs on-demand
- Smart routing table for 9 common task types
- Zero code changes needed, live now

**🚀 Future approach**: See `.claude/ADVANCED_TOOL_USE_STRATEGY.md`

- Anthropic Nov 2025 features: Tool Search Tool (85% savings) + Programmatic Tool Calling (75% savings on workflows) + Tool Use Examples (90% accuracy)
- Phased rollout plan, ROI analysis
- Migrate when features leave beta for 85-95% savings

**Quick tip**: Load CLAUDE.md + only the 1-2 docs your task needs. Don't load full 1,430 lines.

**Example**: Email task → CLAUDE.md + `EMAIL_SERVICE_COMPLETE.md` = 76% context saved

---

## Troubleshooting & Support

**Quick fixes** (90% of issues): See `.claude/QUICK_FIX_GUIDE.md`

- workspace_id undefined
- supabase is not defined
- Email agent low quality
- Content generation slow
- RLS policy errors
- API 401 Unauthorized
- And 10+ more common issues

**Agent lookup & workflows**: See `.claude/AGENT_REFERENCE.md`

- Quick agent lookup table
- Input/output schemas
- Common workflows
- Model selection guide

**For debugging**: Use `.claude/context-manifest.md` to find the right doc fast
