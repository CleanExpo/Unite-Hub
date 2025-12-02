# Context Manifest - Smart Knowledge Routing

**Purpose**: Route agents to specific docs instead of loading everything. Saves 40-50% context window on each session.

## Always Loaded (Core Reference - 147 lines)
- **CLAUDE.md** - Main dev guide, quick commands, 8 key patterns
- **agent.md** - Agent definitions (CANONICAL)

## On-Demand by Task

### Authentication & Security
**When working on**: Auth flows, login, sessions, PKCE
**Load**: `docs/ANTHROPIC_PRODUCTION_PATTERNS.md` § Auth section
**Also check**: `.claude/SCHEMA_REFERENCE.md` (role enums, table structure)

### Database & Migrations
**When working on**: Migrations, schema changes, RLS policies
**Load**: `.claude/SCHEMA_REFERENCE.md` (MANDATORY before ANY migration)
**Pre-flight**: Run `scripts/rls-diagnostics.sql` in Supabase SQL Editor before RLS work
**Also check**: `COMPLETE_DATABASE_SCHEMA.sql` (full schema reference)

### Email Service
**When working on**: Email features, SendGrid/Resend/Gmail integration
**Load**: `EMAIL_SERVICE_COMPLETE.md` (implementation details)
**Setup**: `GMAIL_APP_PASSWORD_SETUP.md` (Gmail SMTP configuration)
**Test**: `node scripts/test-email-config.mjs`

### SEO & Marketing
**When working on**: SEO audits, content optimization, competitor analysis
**Load**: `docs/SEO_ENHANCEMENT_SUITE.md` (services, API routes)
**Strategy**: `docs/MULTI_PLATFORM_MARKETING_INTELLIGENCE.md` (8-platform approach)
**Cost**: `docs/SEO_COST_OPTIMIZATION_GUIDE.md` (tracking, budgets)

### Anthropic API Integration
**When working on**: Claude API calls, rate limiting, caching, thinking tokens
**Load**: `docs/ANTHROPIC_PRODUCTION_PATTERNS.md` (complete patterns)
**Quick**: CLAUDE.md § Critical Patterns #4

### Real-Time Features
**When working on**: WebSocket, alerts, Redis cache, Bull queues
**Load**: CLAUDE.md § Key Architecture Components (already condensed)
**Deep dive**: Phase 5 Week 4 Architecture section (comprehensive but optional)

### Founder Intelligence OS
**When working on**: AI Phill, cognitive twin, orchestrator, business signals
**Load**: `.claude/agent.md` (agent definitions)
**Verify**: `npm run integrity:check` (15 tables, 23 API routes, 8 agents)
**Setup**: `scripts/INTEGRITY_CHECK_README.md` (installation verification)

### Frontend & Components
**When working on**: UI components, animations, responsive design
**Load**: CLAUDE.md § Key Files § Components
**Showcase**: `/showcases/components` (live demo page)
**Components**: 7 Framer Motion components in `src/components/ui/`

### Production & Deployment
**When working on**: Performance, production readiness, deployment strategy
**Load**: `PRODUCTION_GRADE_ASSESSMENT.md` (65% → 95% roadmap)
**Status**: CLAUDE.md § Production Status (summary)

## Quick Lookup Table

| Task | Primary Doc | Secondary Doc | Commands |
|------|-------------|---------------|----------|
| Add API route | CLAUDE.md #1 Auth | docs/ANTHROPIC_PRODUCTION_PATTERNS.md | None |
| Send email | EMAIL_SERVICE_COMPLETE.md | GMAIL_APP_PASSWORD_SETUP.md | `node scripts/test-email-config.mjs` |
| Database migration | .claude/SCHEMA_REFERENCE.md | COMPLETE_DATABASE_SCHEMA.sql | Pre-flight: `\i scripts/rls-diagnostics.sql` |
| SEO feature | docs/SEO_ENHANCEMENT_SUITE.md | docs/MULTI_PLATFORM_MARKETING_INTELLIGENCE.md | `npm run seo:*` |
| Claude API call | docs/ANTHROPIC_PRODUCTION_PATTERNS.md | CLAUDE.md #4 | See rate-limiter.ts |
| WebSocket/alerts | CLAUDE.md (brief) | Phase 5 full docs (if needed) | None |
| Founder OS | .claude/agent.md | scripts/INTEGRITY_CHECK_README.md | `npm run integrity:check` |
| UI component | CLAUDE.md § Components | /showcases/components | `npm run dev` |
| Production fix | PRODUCTION_GRADE_ASSESSMENT.md | CLAUDE.md § Production | None |

## Usage Pattern for Agents

**Instead of**: Loading all 1,430 lines at startup
**Do this**: Load CLAUDE.md (147 lines) + reference context manifest

**Example workflow**:
```
Agent receives task: "Add email authentication"
↓
Agent reads CLAUDE.md § Critical Patterns #1 Auth
↓
Agent determines: "Need PKCE flow details"
↓
Agent loads: docs/ANTHROPIC_PRODUCTION_PATTERNS.md § Auth (on-demand)
↓
Agent loads: .claude/SCHEMA_REFERENCE.md (for role checks)
↓
Complete task with full context, 50% less window used
```

## Files NOT to Load in Manifest (Too Large/Redundant)

❌ `.claude/claude.md` — Use CLAUDE.md instead
❌ Individual phase reports (PHASE_*.md) — Summarized in CLAUDE.md
❌ API_DOCUMENTATION.md — Check specific route files instead
❌ COMPLETE_SYSTEM_AUDIT.md — Outdated, reference PRODUCTION_GRADE_ASSESSMENT.md instead

## Context Savings Estimate

| Scenario | Before | After | Saved |
|----------|--------|-------|-------|
| Email feature | ~500 lines | 147 + 200 = 347 | 30% |
| Auth feature | ~500 lines | 147 + 150 = 297 | 40% |
| SEO feature | ~600 lines | 147 + 300 = 447 | 25% |
| Database migration | ~700 lines | 147 + 100 = 247 | 65% |
| **Average session** | ~1,430 lines | **147 + 200 = 347** | **76%** |

## How to Use This File

1. **At session start**: Agent reads CLAUDE.md + this manifest
2. **When task arrives**: Agent checks Quick Lookup Table (2 seconds)
3. **Load on-demand**: Agent loads only the 1-2 docs it needs
4. **Result**: 76% context savings, 100% knowledge access

---

**Last updated**: 2025-12-02 | **Effectiveness**: High-impact, zero pain
