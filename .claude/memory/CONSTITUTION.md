# CONSTITUTION — Unite-Group Nexus 2.0
> Immutable rules. Survives compaction. Re-read if context feels wrong.
> Human-only file — agents must NOT modify this.

## Project Identity
- **Name**: Unite-Group Nexus 2.0 — private founder CRM for Phill McGurk. NOT a public SaaS. One user.
- **Stack**: Next.js 16 App Router (`src/` root) + Supabase PostgreSQL + Vercel
- **NO FastAPI** — that was pre-rebuild architecture. It is gone.
- **Package Manager**: pnpm@9.15.0 | **Build**: Turbo monorepo
- **Auth**: Supabase PKCE server-side only. Single-tenant.
- **Locale**: en-AU | Dates: DD/MM/YYYY | Currency: AUD | Timezone: AEST/AEDT
- **Design**: Scientific Luxury — OLED Black `#050505` | Cyan `#00F5FF` | `rounded-sm` only | Framer Motion only

## Architecture Routing
| Domain | Location | Agent |
|--------|----------|-------|
| Next.js app | `src/` (root) | senior-fullstack |
| API routes | `src/app/api/` | senior-fullstack |
| Supabase client (browser) | `src/lib/supabase/client.ts` | senior-fullstack |
| Supabase client (server) | `src/lib/supabase/server.ts` | senior-fullstack |
| Database schema + migrations | `supabase/migrations/` | database-architect |
| UI components | `src/components/` | frontend-designer |
| Business config | `src/lib/businesses.ts` | senior-fullstack |
| Zustand store | `src/lib/store.ts` | senior-fullstack |
| AI / advisory layer | `src/lib/advisory/` | senior-fullstack |
| Tests | `src/` vitest | qa-tester |

## 5 Critical Rules

1. **Retrieval-First** — Context7 → Skills → `.claude/` docs → Grep BEFORE loading files inline.
2. **founder_id isolation** — ALL Supabase queries MUST filter by `founder_id = auth.uid()`. NEVER workspace_id. No exceptions.
3. **Subagent isolation** — Heavy implementation dispatched to subagents. Orchestrator stays lean (80k token cap).
4. **State on disk** — Decisions written to `.claude/memory/architectural-decisions.md` (append only).
5. **Design system** — Scientific Luxury enforced. No `rounded-lg`. No linear easing. No generic Tailwind defaults. No Framer Motion on dnd-kit sortable items (transform conflict).

## Database Rules (CRITICAL)
```typescript
// WRONG — workspace_id does not exist in Nexus 2.0:
const { data } = await supabase.from('contacts').select('*').eq('workspace_id', workspaceId);

// CORRECT — single-tenant, RLS handles it but always be explicit:
const { data } = await supabase.from('contacts').select('*').eq('founder_id', founderId);
// Or rely on RLS: supabase.from('contacts').select('*')
// Service client (advisory debate engine): write founder_id explicitly — it bypasses RLS
```

## Database Tables
**Core 9**: businesses, contacts, nexus_pages, nexus_databases, nexus_rows, credentials_vault, approval_queue, social_channels, connected_projects
**Phase 5 MACAS**: advisory_cases, advisory_firms, advisory_debates, advisory_verdicts
**Phase 4 Integrations**: bookkeeper_runs, bookkeeper_transactions, xero_connections

## 7 Businesses (src/lib/businesses.ts)
disaster-recovery (#FF6B35), nrpg (#4ECDC4), carsi (#45B7D1), restore-assist (#96CEB4), synthex (#00F5FF), ato (#FFEAA7), ccw (#DDA0DD)
Access: `BUSINESSES.find(b => b.key === key)` — NOT `BUSINESSES[key]`

## Rebuild Status (12/03/2026)
Phase 1 Audit ✅ | Phase 2 Foundation ✅ | Phase 3 UI Shell ✅ | Phase 4 Integrations ✅ | Phase 5 AI Layer 🔄 | Phase 6 Production ⏳

## Orchestrator Token Budget
- **Orchestrator**: 80,000 token hard cap. Delegate file reads.
- **Subagents**: Fresh context per invocation.
- **Compass**: ~100 tokens injected before every message.

## Drift Recovery
If context feels wrong, read in this order:
```bash
cat C:/Unite-Group/.claude/memory/CONSTITUTION.md
cat C:/Unite-Group/.claude/memory/current-state.md
cat C:/Unite-Group/.claude/memory/architectural-decisions.md
cat C:/Unite-Group/.claude/memory/KANBAN.md
```
