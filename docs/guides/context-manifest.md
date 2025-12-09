# Context Manifest - Smart Knowledge Routing

**Purpose**: Route agents to specific docs instead of loading everything. Saves 50-65% context window on each session.

**Updated**: 2025-12-08 — Added .claudeignore to prevent auto-loading of secondary files.

## Context Budget & Loading Strategy

**Target**: 3-5k tokens for all CLAUDE.md guidance per session

### Auto-Loaded (Always)
- `D:\Unite-Hub\CLAUDE.md` - Primary guide + routing table (~3.8k tokens)

### Lazy-Loaded (On-Demand Only)
- Load 0-2 specialist guides based on task type
- Estimated: 400-700 tokens per guide
- **Total session**: 3.8k (primary) + 0-1.4k (specialists) = **3.8-5.2k tokens** ✅

### Never Auto-Load (.claudeignore enforced)
- Sub-domain CLAUDE.md files (api/, lib/, agents/, components/, supabase/)
- Legacy `.claude/CLAUDE.md.legacy` (archived as of 2025-12-08)
- Specialized references (load only when explicitly needed via routing table)

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

## Context Savings Estimate (Updated 2025-12-08)

**Before Optimization** (Both CLAUDE.md files auto-loading):
- Root CLAUDE.md: 4.8k tokens
- .claude/CLAUDE.md (legacy): 5.6k tokens
- **Total auto-load**: 10.4k tokens

**After Optimization** (.claudeignore + consolidation):
- Root CLAUDE.md only: ~3.8k tokens
- Specialist guide (on-demand): 0-1.4k tokens
- **Total per session**: 3.8-5.2k tokens

| Scenario | Before (tokens) | After (tokens) | Saved |
|----------|-----------------|----------------|-------|
| **Auto-load** | 10.4k | 3.8k | **63%** |
| Email feature | 10.4k + 500 | 3.8k + 400 = 4.2k | **61%** |
| API route work | 10.4k + 400 | 3.8k + 400 = 4.2k | **61%** |
| DB migration | 10.4k + 280 | 3.8k + 280 = 4.1k | **62%** |
| Agent development | 10.4k + 600 | 3.8k + 600 = 4.4k | **60%** |
| **Average session** | **10.4-11k tokens** | **4.0-5.2k tokens** | **52-63%** |

## How to Use This File

1. **At session start**: Agent reads CLAUDE.md + this manifest
2. **When task arrives**: Agent checks Quick Lookup Table or routing table in CLAUDE.md
3. **Load on-demand**: Agent loads only the 1-2 docs it needs via explicit reference
4. **Result**: 52-63% context savings, 100% knowledge access

## Verification

**Run `/context` command to verify optimization:**

Expected result:
```
Memory files: ~3.8-5.2k tokens (1.9-2.6%)
└ Project (D:\Unite-Hub\CLAUDE.md): ~3.8k tokens
└ (Optional specialist guides): 0-1.4k tokens
```

**If you see**:
- ❌ `D:\Unite-Hub\.claude\CLAUDE.md`: 5.6k tokens → Check .claudeignore is working
- ❌ Multiple sub-domain CLAUDE.md files → Verify .claudeignore includes them
- ✅ Only root CLAUDE.md (~3.8-5.2k total) → Optimization working correctly

---

**Last updated**: 2025-12-08 | **Effectiveness**: 52-63% savings, .claudeignore enforced
