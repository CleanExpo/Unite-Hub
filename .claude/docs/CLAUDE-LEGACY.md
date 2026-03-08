# CLAUDE.md — Unite Hub

> AI-Powered CRM & Marketing Automation Platform.
> **Stack**: Next.js 16 (root) + FastAPI/LangGraph (`apps/backend/`) + Supabase PostgreSQL + Redis
> **Monorepo**: Turbo + pnpm workspaces | **Design**: Scientific Luxury

---

## Quick Commands

```bash
# Setup
pnpm run setup              # Unix/macOS
pnpm run setup:windows      # Windows PowerShell

# Development
pnpm dev                    # Start ALL services via Turbo
pnpm run docker:up          # PostgreSQL + Redis (required)
pnpm run verify             # System health check

# Quality
pnpm turbo run test         # All tests (frontend + backend)
pnpm turbo run lint         # All linting
pnpm turbo run type-check   # TypeScript strict check

# Unite Hub Agents
pnpm run email-agent        # Process emails
pnpm run content-agent      # Generate content (Extended Thinking)
pnpm run orchestrator       # Coordinate multi-agent workflows
pnpm run analyze-contacts   # AI contact scoring

# SEO
pnpm run seo:research       # Perplexity SEO research
pnpm run seo:full           # Comprehensive SEO report

# Docker
pnpm run docker:up          # Start services
pnpm run docker:reset       # Reset + restart

# Skill Manager
/skill-manager analyse      # Analyse skill gaps
/skill-manager generate X   # Generate new skill
```

---

## Architecture Routing

| Domain | Location |
|--------|---------|
| **Unite Hub Next.js app** | `src/` (root) |
| **FastAPI AI backend** | `apps/backend/src/` |
| **Starter web template** | `apps/web/` |
| **Shared types** | `packages/shared/src/` |
| **Shared ESLint/TS config** | `packages/config/` |
| **AI Agents (Python)** | `apps/backend/src/agents/` |
| **FastAPI routes** | `apps/backend/src/api/routes/` |
| **AI provider selector** | `apps/backend/src/models/selector.py` |
| **LangGraph state** | `apps/backend/src/state/` |
| **Next.js agents (TS)** | `src/agents/` |
| **Next.js AGI layer** | `src/agi/` |
| **Next.js API routes** | `src/app/api/` (~104 routes) |
| **Database** | Supabase PostgreSQL (13 tables, full RLS) |
| **Design tokens** | `apps/web/lib/design-tokens.ts` |

---

## Knowledge Retrieval (Retrieval-First Rule)

Query before loading docs. See `.claude/rules/retrieval-first.md`.

| Source | Use For |
|--------|---------|
| **Context7 MCP** | Next.js, FastAPI, Playwright, Supabase docs |
| **59 Skills** | Pattern libraries (`.skills/custom/*/SKILL.md`) |
| **`.claude/` docs** | Architecture, RLS, auth, agent patterns |
| **Jina Reader** | Web content → `https://r.jina.ai/{url}` |

---

## Authentication (PKCE + JWT)

**Next.js (Supabase)**: PKCE flow, server-side sessions, JWT in cookies
- Server: `createClient()` from `@/lib/supabase/server`
- Never expose tokens in client code
- ALL queries must include `.eq('workspace_id', workspaceId)`

**FastAPI**: JWT auth middleware
- Login: `POST /api/auth/login` → bcrypt → JWT → cookie
- `apps/backend/src/auth/jwt.py`

---

## AI Provider System

```bash
# Default: Ollama (local, free, FastAPI backend)
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b

# Production: Claude (Next.js + FastAPI)
ANTHROPIC_API_KEY=sk-ant-xxx
```

**Claude Models**: Opus 4.5 (Extended Thinking), Sonnet 4.5, Haiku 4.5
**Provider selector**: `apps/backend/src/models/selector.py`

---

## Database (Workspace Isolation — CRITICAL)

ALL Supabase queries MUST filter by `workspace_id`:
```typescript
// ALWAYS do this:
const { data } = await supabase.from('contacts').select('*').eq('workspace_id', workspaceId);
```

Tables: contacts, emails, campaigns, campaign_steps, content_drafts, email_accounts,
        workspaces, users, lead_scores, email_events, multimedia_uploads, alerts, agent_runs

---

## Design System — Scientific Luxury

| Element | Spec |
|---------|------|
| Background | OLED Black `#050505` |
| Primary | Cyan `#00F5FF` |
| Success | Emerald `#00FF88` |
| Warning | Amber `#FFB800` |
| Error | Red `#FF4444` |
| Escalation | Magenta `#FF00FF` |
| Corners | Sharp only (`rounded-sm`) |
| Animation | Framer Motion only (no CSS transitions) |
| Typography | JetBrains Mono (data), Editorial (labels) |

Full system: `docs/DESIGN_SYSTEM.md` | Skill: `.skills/custom/scientific-luxury/SKILL.md`

---

## Context Drift Prevention (4-Pillar Defence)

| Pillar | Mechanism | File |
|--------|-----------|------|
| Immutable rules | CONSTITUTION.md | `.claude/memory/CONSTITUTION.md` |
| Session injection | SessionStart hook | `.claude/hooks/` |
| Per-message compass | UserPromptSubmit hook | `.claude/memory/compass.md` |
| Pre-compaction save | PreCompact hook | `.claude/hooks/` |

If drift detected: `cat .claude/memory/CONSTITUTION.md`

---

## Agents & Skills

- **23 subagents**: `.claude/agents/*/agent.md`
- **59 skills**: `.skills/AGENTS.md`
- **10 commands**: `.claude/commands/*.md`
- **10 hooks**: `.claude/hooks/*.md`
- **Orchestrator**: `.claude/agents/orchestrator/agent.md`

---

## Key Documentation

| Doc | Purpose |
|-----|---------|
| `.claude/README.md` | Full architecture guide (857 lines) |
| `.claude/memory/CONSTITUTION.md` | Immutable rules |
| `docs/DESIGN_SYSTEM.md` | Scientific Luxury system |
| `docs/LOCAL_SETUP.md` | Dev environment setup |
| `docs/AI_PROVIDERS.md` | Ollama vs Claude comparison |
| `docs/MULTI_AGENT_ARCHITECTURE.md` | Agent coordination |
| `.claude/architecture/` | Unite-Hub specific architecture |
