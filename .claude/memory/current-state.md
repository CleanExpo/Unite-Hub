# Current State — Unite-Group Nexus 2.0
> Last updated: 12/03/2026 (manual rebuild of memory files)
> Agent-editable sections: Active Task, In-Progress Work, Next Steps

## Active Phase
**Phase 5 — AI Layer** (in progress)

Phase 5 goal: wire up Anthropic AI capabilities (adaptive thinking, MCP, Files API, memory, web search, batch, citations, structured outputs, code sandbox) and build the orchestration layer (router, pipeline, macro coaches).

## Shipped in Phase 5 (as of 12/03/2026)

### MACAS — Multi-Agent Competitive Accounting System
- Commit: `65d90c25`
- 4 AI accounting firms debate 5 rounds → Judge (Opus) scores → Accountant gate → Execute
- Schema: `supabase/migrations/20260311000000_advisory_schema.sql` (4 tables + RLS)
- Types: `src/lib/advisory/types.ts`
- Agents + prompts: `src/lib/advisory/agents.ts`, `src/lib/advisory/prompts/*.ts`
- Debate engine: `src/lib/advisory/debate-engine.ts` — `async function* runDebate()`
- API: `src/app/api/advisory/cases/` (8 routes)
- UI: `src/components/founder/advisory/` (AdvisoryWorkbench + 5 tabs + 4 shared)
- Page: `src/app/(founder)/founder/advisory/page.tsx`

### Command Bar (⌘K / Ctrl+K)
- Full navigation + action command palette
- File: `src/components/layout/CommandBar.tsx`
- Wired into `Topbar` and `FounderShell` (`src/app/(founder)/layout.tsx`)

### Unified Search
- Real-time search across contacts, pages, approvals
- API: `src/app/api/search/route.ts` (3 parallel ILIKE queries, AbortController)
- UI: Extended `src/components/ui/command.tsx` with `shouldFilter` prop
- Commits: `a2cccd2a` through `8c651fd0`
- Key fixes: AbortController for race conditions, guard non-ok responses, PostgREST injection sanitisation

## Phase 5 Remaining — Integration Backlog
| Linear Issue | Feature | Status |
|-------------|---------|--------|
| UNI-1499 | Enable Adaptive Thinking on Claude Opus 4.6 | Todo |
| UNI-1500 | Implement MCP Connector Layer | Todo |
| UNI-1501 | Implement Files API for Persistent Document Storage | Todo |
| UNI-1502 | Implement Memory Tool for Cross-Session Persistence | Todo |
| UNI-1503 | Enable Web Search and Web Fetch Server-Side Tools | Todo |
| UNI-1504 | Enable Batch API for Cost Optimisation | Todo |
| UNI-1505 | Enable Citations for Verifiable Agent Outputs | Todo |
| UNI-1506 | Enable Structured Outputs for Type-Safe Agent Communication | Todo |
| UNI-1507 | Enable Code Execution Sandbox | Todo |
| UNI-1508 | Build AI Orchestration Router | Todo |
| UNI-1509 | Build AI Pipeline Coordinator | Todo |
| UNI-1510 | Build Macro Coaches | Todo |

## Recent Key Commits
```
86d18b8c chore: regenerate pnpm lockfile for veritas-kanban-mcp dependency sync
8c651fd0 fix(test): exclude .claude/worktrees from Vitest glob to prevent cross-worktree test pollution
fbe3bed3 fix(api): sanitise query input to prevent PostgREST or() filter metacharacter injection
f90b997d fix(search): move setLoading(false) out of finally to preserve loading state on AbortError
a8fbbdca fix(search): add AbortController for race condition, guard non-ok responses, use vi.spyOn for fetch mock
```

## Recent Key Files Changed
- `src/app/api/search/route.ts` — new, unified search
- `src/components/layout/CommandBar.tsx` — new, command palette
- `src/components/ui/command.tsx` — extended with shouldFilter prop
- `supabase/migrations/20260311000000_advisory_schema.sql` — MACAS schema
- `src/lib/advisory/` — full MACAS implementation

## Next Steps
1. Pick next Phase 5 item from backlog above (UNI-1499 through UNI-1510)
2. After Phase 5 complete → Phase 6 Production Hardening

## Active Task
[Agent updates this field when picking up work]
