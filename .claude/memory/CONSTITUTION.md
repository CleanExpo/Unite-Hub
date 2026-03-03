# CONSTITUTION — Unite Hub
> Immutable rules. Survives compaction. Re-read if context feels wrong.

## Project Identity
- **Stack**: Next.js 16 (`src/` root) + FastAPI/LangGraph (`apps/backend/`) + Supabase PostgreSQL
- **Locale**: en-AU | Dates: DD/MM/YYYY | Currency: AUD
- **Design**: OLED Black `#050505` | Scientific Luxury | Framer Motion only | `rounded-sm`
- **Package Manager**: pnpm@9.15.0 | **Build**: Turbo monorepo
- **Auth**: Supabase PKCE (Next.js) + JWT (FastAPI)

## Architecture Routing
| Domain | Location | Agent |
|--------|----------|-------|
| Next.js app (main) | `src/` (root) | frontend-specialist |
| FastAPI backend | `apps/backend/src/` | backend-specialist |
| AI agents (TypeScript) | `src/agents/` | backend-specialist |
| AGI layer | `src/agi/` | backend-specialist |
| Next.js API routes | `src/app/api/` | backend-specialist |
| Python agents (LangGraph) | `apps/backend/src/agents/` | backend-specialist |
| Supabase client (server) | `@/lib/supabase/server` | backend-specialist |
| Database | Supabase PostgreSQL (13 tables) | database-specialist |
| Tests | `src/` vitest + Playwright | test-engineer |
| Shared types | `packages/shared/src/` | frontend-specialist |

## 5 Critical Rules

1. **Retrieval-First** — Query Context7 → Skills → `.claude/` docs → Grep BEFORE loading files inline.
2. **Workspace isolation** — ALL Supabase queries MUST filter by `workspace_id`. No exceptions.
3. **Subagent isolation** — Heavy implementation dispatched to subagents. Orchestrator stays lean (80k cap).
4. **State on disk** — Decisions written to `.claude/memory/architectural-decisions.md`.
5. **Design system** — Scientific Luxury enforced. No `rounded-lg`. No linear easing. No generic Tailwind defaults.

## Database Rules (CRITICAL)
```typescript
// WRONG — leaks cross-workspace data:
const { data } = await supabase.from('contacts').select('*');

// CORRECT — always scope:
const { data } = await supabase.from('contacts').select('*').eq('workspace_id', workspaceId);
```

## Orchestrator Token Budget
- **Orchestrator**: 80,000 token hard cap. Delegate file reads.
- **Subagents**: Fresh context per invocation.
- **Compass**: 100 tokens injected before every message.

## Drift Recovery
If context feels wrong:
```bash
cat .claude/memory/CONSTITUTION.md
cat .claude/memory/current-state.md
cat .claude/memory/architectural-decisions.md
```
