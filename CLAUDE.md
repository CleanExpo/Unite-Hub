# Unite-Hub Development Guide

**AI-first marketing CRM and automation platform** with two products:
- **Unite-Hub**: Core CRM for agencies (email, contacts, campaigns, AI agents)
- **Synthex.social**: White-label AI marketing platform for small businesses

**Tech Stack**: Next.js 16 (App Router), React 19, Supabase PostgreSQL, Anthropic Claude API, TypeScript 5.x
**Package Manager**: pnpm 9.15+ with Turborepo
**Port**: 3008 (not 3000) — `pnpm dev`

---

## Communication Style (CRITICAL)
- **Extremely concise** — Sacrifice grammar for concision in all interactions
- **End plans with unresolved questions** — List open questions concisely

---

## Context-Specific Rules (Auto-Loaded)

Core architectural patterns and development workflows are organized into focused rule files that load automatically based on the files you're working with:

- **Core Architecture** @.claude/rules/core-architecture.md — Multi-tenant isolation, Supabase clients, async params
- **API Routes** @.claude/rules/api-routes.md — When working on `src/app/api/**/*.ts`
- **Database Migrations** @.claude/rules/database-migrations.md — When working on `supabase/migrations/**/*.sql`  
- **UI Components** @.claude/rules/ui-components.md — When working on components and React files
- **AI Agents** @.claude/rules/ai-agents.md — When working on `src/lib/agents/**/*.ts`
- **Testing** @.claude/rules/testing.md — When working on test files
- **Environment** @.claude/rules/environment-config.md — Commands, env vars, file locations

---

## Design System (CRITICAL)
**BEFORE any UI work**: Read `@DESIGN-SYSTEM.md`  
**Quality gate**: 9/10 minimum on visual distinctiveness, brand alignment, accessibility

---

## Specialist Guides (Load On-Demand Only)

**Target**: ≤5k tokens total for CLAUDE.md guidance per session. Load specialist guides only when needed:

| Task Type | Guide Path | When to Load |
|-----------|------------|--------------|
| **API Routes** | `@src/app/api/API-GUIDE.md` | Building/fixing REST endpoints |
| **Core Libraries** | `@src/lib/LIB-GUIDE.md` | Business logic, utilities |
| **Agent Development** | `@src/lib/agents/AGENT-GUIDE.md` | AI agent work |
| **UI Components** | `@src/components/UI-GUIDE.md` | Component development |
| **DB Migrations** | `@supabase/DATABASE-GUIDE.md` | Schema changes, RLS |
| **Troubleshooting** | `@docs/guides/quick-fix-guide.md` | 90% of common issues |
| **Schema Reference** | `@docs/guides/schema-reference.md` | Before ANY migration |

---

## Three-Layer Architecture

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
│  • 8 Founder OS Agents — Business intelligence   │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│ Supabase PostgreSQL (Multi-tenant + RLS)        │
│  • 100+ tables with tenant_id isolation          │
│  • Row Level Security on ALL tables              │
│  • Table prefixes: none, synthex_*, founder_*    │
└──────────────────────────────────────────────────┘
```

---

## Development Status

**Current**: Phase 5 complete (real-time monitoring, WebSocket alerts, Redis caching)  
**Synthex**: Phase D45 (market radar)  
**Tests**: 235+ tests (100% pass)  
**Production**: 65% production-ready (P0 gaps documented)

---

## Quick Start

```bash
pnpm install             # Install dependencies (pnpm required)
pnpm dev                 # Start dev server (port 3008)
pnpm typecheck           # Validate TypeScript
pnpm test                # Run all tests
pnpm integrity:check     # Founder OS health check
```

### Advanced Testing

```bash
pnpm test:contract       # Pact contract tests
pnpm test:percy          # Percy visual regression (requires PERCY_TOKEN)
pnpm test:load:contacts  # k6 load tests for contacts API
pnpm test:load:auth      # k6 auth spike tests
```

---

*Context Optimization: Modular rules system (2025-12-11) — Core guide ~1.2k tokens, rules load conditionally*
