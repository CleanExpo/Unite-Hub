# CLAUDE.md - Unite-Hub Core Guide

**Version**: 2.0.0 (Modular)
**Last Updated**: 2026-01-15
**System**: Modular documentation with on-demand loading (78% context reduction)

> **For detailed documentation**, see `.claude/` subdirectories
> **Navigation Guide**: `.claude/README.md`

---

## Quick Overview

Unite-Hub is an **AI-first CRM and marketing automation platform** built with:
- **Frontend**: Next.js 16 (App Router, Turbopack) + React 19 + shadcn/ui + Tailwind CSS
- **Backend**: Next.js API Routes (104 endpoints) + Supabase PostgreSQL
- **AI Layer**: Anthropic Claude API (Opus 4.5, Sonnet 4.5, Haiku 4.5) with Extended Thinking
- **Auth**: Supabase Auth (PKCE flow - server-side session validation)
- **Email**: Multi-provider system (SendGrid → Resend → Gmail SMTP with automatic failover)
- **Real-Time**: WebSocket streaming, Redis caching, Bull job queues, node-cron scheduling

### Phase 5 Status: ✅ COMPLETE - PRODUCTION READY
- **Total LOC**: 16,116 lines of production code (Weeks 1-4)
- **Database**: 13 tables with full RLS enforcement
- **Tests**: 235+ integration tests (100% pass rate)
- **Performance**: <100ms alert latency, 80%+ cache hit rate, 99.5%+ job success
- **Production Readiness**: 65% (see `.claude/status/production-readiness.md`)

### Core Features
1. **AI Agents** - Email processing, content generation, contact intelligence
2. **Email Integration** - Gmail OAuth, multi-provider, tracking (opens/clicks)
3. **Drip Campaigns** - Visual builder, conditional branching, A/B testing
4. **Lead Scoring** - AI-powered (0-100), composite scoring
5. **Dashboard** - Real-time contact management, campaign analytics
6. **Multimedia System** - File upload, Whisper transcription, Claude analysis
7. **Real-Time Alerts** - WebSocket streaming, deduplication, multi-channel notifications
8. **Advanced Analytics** - Pattern detection, predictive insights, trend analysis
9. **SEO Enhancement Suite** - Technical audits, content optimization, schema generation

---

## Essential Commands

### Development
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3008)
npm run build            # Production build
npm test                 # Run all tests
```

### AI Agents
```bash
npm run email-agent      # Process emails
npm run content-agent    # Generate content (Extended Thinking)
npm run orchestrator     # Coordinate workflows
npm run analyze-contacts # Contact scoring
```

### SEO & Marketing Intelligence
```bash
npm run seo:research "topic"        # Latest SEO trends with citations
npm run seo:comprehensive "topic"   # Full SEO report (6 areas)
npm run seo:usage                   # View usage stats and costs
```

### Database
```bash
npm run check:db         # Verify schema
# Migrations: Supabase Dashboard → SQL Editor
```

**Complete command reference**: `.claude/commands/` (organized by category)

---

## Architecture Summary

### Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript 5.x, Tailwind CSS, shadcn/ui
- **Backend**: 104 Next.js API Routes, Supabase PostgreSQL (15 tables)
- **AI**: Claude Opus 4.5 (Extended Thinking), Sonnet 4.5, Haiku 4.5
- **Real-Time**: WebSocket, Redis, Bull queues (Phase 5 Week 4)
- **Marketing**: Perplexity Sonar (SEO), OpenRouter (multi-model AI)

**Detailed specs**: `.claude/architecture/tech-stack.md`

### Authentication (PKCE Flow)
- Server-side session validation with JWT
- Sessions stored in cookies (accessible in middleware)
- Use `createClient()` from `@/lib/supabase/server` for API routes
- Never expose tokens in client code

**Implementation guide**: `.claude/architecture/authentication.md`

### Database (Workspace Isolation)
**CRITICAL**: ALL queries must filter by `workspace_id`

```typescript
// ❌ WRONG - Returns data from all workspaces
const { data } = await supabase.from("contacts").select("*");

// ✅ CORRECT - Scoped to user's workspace
const { data } = await supabase
  .from("contacts")
  .select("*")
  .eq("workspace_id", workspaceId);
```

**Database reference**: `.claude/architecture/database.md`, `.claude/data/database-schema.yaml`

### AI Agent Architecture

```
User Request → Orchestrator
    ├─→ Email Agent (email processing)
    ├─→ Content Agent (content with Extended Thinking)
    ├─→ Frontend Specialist (UI/component work)
    ├─→ Backend Specialist (API/database work)
    ├─→ SEO Intelligence (SEO research, optimization)
    └─→ Founder OS (founder intelligence system)
```

**Model selection**:
- **Opus 4.5** - Content generation (Extended Thinking, 5000-10000 token budget)
- **Sonnet 4.5** - Standard operations
- **Haiku 4.5** - Quick tasks, documentation

**Agent definitions**: `.claude/agents/<agent-name>/agent.md`

---

## Agent Routing Guide

**When to use each agent:**

| Task Type | Agent | Documentation |
|-----------|-------|---------------|
| Email processing, Gmail sync | Email Agent | `.claude/agents/email-agent/agent.md` |
| Content generation, personalization | Content Agent | `.claude/agents/content-agent/agent.md` |
| UI components, pages, styling | Frontend Specialist | `.claude/agents/frontend-specialist/agent.md` |
| API routes, database, migrations | Backend Specialist | `.claude/agents/backend-specialist/agent.md` |
| SEO research, keyword analysis | SEO Intelligence | `.claude/agents/seo-intelligence/agent.md` |
| Founder operations, intelligence | Founder OS | `.claude/agents/founder-os/agent.md` |
| Multi-agent coordination | Orchestrator | `.claude/agents/orchestrator/agent.md` |

**Orchestrator pattern**: `.claude/agents/orchestrator/agent.md`

---

## Critical Reminders

### 1. Workspace Isolation (MANDATORY)
✅ **ALWAYS** filter queries by `workspace_id`
✅ Validate `workspaceId` is UUID, not string
✅ RLS policies enforce isolation in database

**Pattern**: `.claude/architecture/database.md`

### 2. Authentication (PKCE Flow)
✅ Use `createClient()` from `@/lib/supabase/server` for server-side
✅ Use `createClient()` from `@/lib/supabase/client` for client-side
✅ Validate with `getUser()` not just cookies
✅ Never expose service role key in client

**Implementation**: `.claude/architecture/authentication.md`

### 3. Database Migrations
✅ **BEFORE ANY RLS WORK**: Run diagnostics (`.claude/rules/database/rls-workflow.md`)
✅ Check `.claude/SCHEMA_REFERENCE.md` before writing SQL
✅ Use idempotent patterns (DO $$ IF NOT EXISTS)
✅ Supabase caches schema - wait 1-5 min or force refresh

**Workflow**: `.claude/rules/database/migrations.md`, `.claude/rules/database/rls-workflow.md`

### 4. Anthropic API Best Practices
✅ Use retry logic with exponential backoff (`.claude/rules/ai/anthropic.md`)
✅ Apply prompt caching for 90% cost savings (`.claude/rules/ai/prompt-caching.md`)
✅ Extended Thinking only for complex tasks (costs 27x more)
✅ Rate limit: Handle 429 errors gracefully

**Patterns**: `.claude/rules/ai/anthropic.md`

### 5. Email Service
✅ Multi-provider fallback: SendGrid → Resend → Gmail SMTP
✅ At least one provider required
✅ Test with: `node scripts/test-email-config.mjs`

**Architecture**: `.claude/architecture/email-service.md`

---

## Quick Reference

### Documentation by Topic

| Topic | Documentation |
|-------|---------------|
| **System Status** | `.claude/status/system-status.md` |
| **Known Issues** | `.claude/status/known-issues.md` |
| **Production Readiness** | `.claude/status/production-readiness.md` |
| **Tech Stack** | `.claude/architecture/tech-stack.md` |
| **Authentication** | `.claude/architecture/authentication.md` |
| **Database** | `.claude/architecture/database.md` |
| **Real-Time Monitoring** | `.claude/architecture/real-time-monitoring.md` |
| **Email Service** | `.claude/architecture/email-service.md` |
| **SEO Enhancement** | `.claude/architecture/seo-enhancement.md` |
| **Marketing Intelligence** | `.claude/architecture/marketing-intelligence.md` |
| **Production Enhancements** | `.claude/architecture/production-enhancements.md` |
| **Data Flow** | `.claude/architecture/data-flow.md` |
| **Development Workflow** | `.claude/rules/development/workflow.md` |
| **Database Migrations** | `.claude/rules/database/migrations.md` |
| **RLS Workflow** | `.claude/rules/database/rls-workflow.md` |
| **Anthropic API** | `.claude/rules/ai/anthropic.md` |
| **Environment Variables** | `.claude/data/environment-vars.yaml` |
| **API Endpoints** | `.claude/data/api-endpoints.yaml` |
| **Database Schema** | `.claude/data/database-schema.yaml` |

### Commands by Category

| Category | Documentation |
|----------|---------------|
| Development | `.claude/commands/development.md` |
| AI Agents | `.claude/commands/agents.md` |
| SEO & Marketing | `.claude/commands/seo.md` |
| Database | `.claude/commands/database.md` |
| Docker | `.claude/commands/docker.md` |

### Agents by Specialty

| Agent | Documentation |
|-------|---------------|
| Orchestrator | `.claude/agents/orchestrator/agent.md` |
| Email Agent | `.claude/agents/email-agent/agent.md` |
| Content Agent | `.claude/agents/content-agent/agent.md` |
| Frontend Specialist | `.claude/agents/frontend-specialist/agent.md` |
| Backend Specialist | `.claude/agents/backend-specialist/agent.md` |
| SEO Intelligence | `.claude/agents/seo-intelligence/agent.md` |
| Founder OS | `.claude/agents/founder-os/agent.md` |

---

## Environment Configuration

**Required (minimum)**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `ANTHROPIC_API_KEY` - Claude API key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET` - NextAuth

**Email Service** (at least one):
- `SENDGRID_API_KEY` or `RESEND_API_KEY` or Gmail SMTP credentials

**Marketing Intelligence** (optional):
- `PERPLEXITY_API_KEY` - SEO intelligence (99% cheaper than Semrush)
- `OPENROUTER_API_KEY` - Multi-model AI routing (70-80% cost savings)

**Complete reference**: `.claude/data/environment-vars.yaml`

---

## Important Files & Documentation

### Core Documentation
- **This file**: Core overview with quick links
- **`.claude/README.md`**: Complete navigation guide for modular docs
- **`README.md`**: Project README with setup instructions

### Architecture
- **`.claude/architecture/`**: 9 architecture modules (tech-stack, auth, database, etc.)
- **`.claude/data/`**: Configuration data (environment vars, API endpoints, database schema)

### Development Rules
- **`.claude/rules/development/`**: Git workflow, testing, conventions
- **`.claude/rules/database/`**: Migrations, RLS workflow, schema reference
- **`.claude/rules/ai/`**: Anthropic patterns, rate limiting, prompt caching

### Status & Health
- **`.claude/status/`**: System status, known issues, production readiness
- **`docs/PRODUCTION_GRADE_ASSESSMENT.md`**: Complete production audit

### Email System
- **`EMAIL_SERVICE_COMPLETE.md`**: Email implementation summary
- **`GMAIL_APP_PASSWORD_SETUP.md`**: Gmail SMTP setup guide
- **`scripts/test-email-config.mjs`**: Email configuration test

### Production Patterns
- **`docs/ANTHROPIC_PRODUCTION_PATTERNS.md`**: Official Anthropic API patterns

---

## Port Configuration

**Default**: Port 3008 (not 3000)

Configured in `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3008"
  }
}
```

---

## How to Use This Modular System

### For Agents

**Instead of loading all 1,890 lines upfront**, agents should:

1. **Always load**: This core file (400 lines)
2. **Load specific modules** based on task:
   - Email task → `.claude/agents/email-agent/` + `.claude/architecture/email-service.md`
   - Frontend task → `.claude/agents/frontend-specialist/` + `.claude/rules/frontend/nextjs.md`
   - Database task → `.claude/agents/backend-specialist/` + `.claude/rules/database/`
   - SEO task → `.claude/agents/seo-intelligence/` + `.claude/architecture/seo-enhancement.md`

**Typical load**: 400 (core) + 200 (agent) + 300 (architecture) = **900 lines vs 1,890 lines**

**Context reduction**: **52-78%** less context per interaction

### For Developers

1. Start with this file for quick overview
2. Navigate to `.claude/` for detailed documentation
3. Use `.claude/README.md` as navigation guide
4. Reference specific modules as needed

### For Maintenance

1. Update specific module files (not monolithic CLAUDE.md)
2. Keep changes focused and modular
3. Update last-modified date in module
4. Update this core file only for major system changes

---

## Key Principles

1. **Modular Loading** - Load only what you need, when you need it
2. **On-Demand Context** - Agents load specific modules for tasks
3. **Easy Maintenance** - Update single modules instead of monolithic file
4. **Clear Navigation** - Quick reference tables and organized structure
5. **Workspace Isolation** - ALWAYS filter by workspace_id
6. **Security First** - PKCE flow, server-side validation, RLS policies

---

## Version History

**v2.0.0** (2026-01-15):
- **Major**: Modularized documentation system
- **Change**: Split 1,255-line CLAUDE.md into 50+ modular files
- **Benefit**: 78% context reduction (1,890 → 400 lines core)
- **Migration**: Old CLAUDE.md archived as CLAUDE.md.backup-20260115

**v1.0.0** (2025-11-28):
- Phase 5 completion (16,116 LOC)
- PKCE auth migration complete
- Real-time monitoring system (Phase 5 Week 4)

---

## Getting Help

**For new features/issues**:
- Check `.claude/status/known-issues.md` for existing issues
- Review `.claude/architecture/` for implementation patterns
- Consult `.claude/agents/` for agent-specific guidance

**For setup/configuration**:
- See `README.md` for initial setup
- Check `.claude/data/environment-vars.yaml` for configuration
- Review `.claude/rules/development/workflow.md` for development workflow

**For migrations/database**:
- **MANDATORY**: Read `.claude/rules/database/rls-workflow.md` before RLS work
- Check `.claude/SCHEMA_REFERENCE.md` before writing SQL
- See `.claude/rules/database/migrations.md` for migration patterns

---

**Last Updated**: 2026-01-15
**Modular System**: `.claude/` subdirectories (50+ specialized modules)
**Context Reduction**: 78% (from 1,890 lines to ~400 lines core + on-demand modules)
**Navigation**: See `.claude/README.md` for complete guide

---

**This is the lean core. For detailed documentation, explore `.claude/` subdirectories.**
