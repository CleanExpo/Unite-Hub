# Architectural Decisions — Unite-Group Nexus 2.0
> Append-only log. Agents append; humans approve.
> Format: ## ADR-XXX: Title (DD/MM/YYYY) | Decision | Reason | Alternatives Rejected

---

## PRE-REBUILD HISTORY (Unite Hub v1 — archived for reference)

### ADR-001: Monorepo Structure (04/03/2026)
**Decision**: Turbo monorepo with pnpm workspaces — `src/` (main app), `apps/backend/` (FastAPI), `apps/web/` (reference), `packages/shared/` (types), `packages/config/` (shared configs)
**Reason**: Shared tooling, unified CI, code sharing between frontend and backend
**Alternatives rejected**: Single Next.js app (no Python backend separation)

### ADR-002: NodeJS-Starter-V1 Architecture Applied (04/03/2026)
**Decision**: Apply CleanExpo/NodeJS-Starter-V1 patterns — 23-agent system, hooks, memory, `.skills/` library (59 skills), FastAPI backend, Turbo, context-drift prevention
**Reason**: Battle-tested patterns for large-scale Claude Code development
**Alternatives rejected**: Custom agent structure from scratch

### ADR-003: AI Provider Strategy (04/03/2026)
**Decision**: Dual-provider — TypeScript/Next.js uses Anthropic SDK (Opus 4.5, Sonnet 4.5, Haiku 4.5); Python/FastAPI uses pluggable provider (Ollama local default, Claude optional)
**Reason**: Flexibility for local development without API costs
**Alternatives rejected**: Single provider lock-in

### ADR-004: Authentication Split (04/03/2026)
**Decision**: PKCE for Next.js (Supabase), JWT for FastAPI — sessions in cookies, validated server-side
**Reason**: Each runtime uses its native auth pattern; no token exposure in client code
**Alternatives rejected**: Unified JWT for both (complexity, Supabase PKCE is more secure)

### ADR-005: Database Isolation (04/03/2026)
**Decision**: All queries scoped by `workspace_id` — RLS at database level AND application layer
**Reason**: Multi-tenant data isolation, defence in depth
**Alternatives rejected**: Application-layer-only isolation (single point of failure)

### ADR-006: Founder Credential Vault (04/03/2026)
**Decision**: pgsodium `vault.secrets` for encrypted credential storage
**Reason**: Native Supabase encryption, zero plaintext exposure in metadata table, SECURITY DEFINER RPCs enforce server-side access control
**Alternatives rejected**: Client-side AES encryption (key management problem), plain Supabase columns (no encryption at rest at row level)

---

## NEXUS 2.0 REBUILD DECISIONS (from 09/03/2026)

### ADR-R01: Full Rebuild (Option A) (09/03/2026)
**Decision**: Full rebuild on new branch (`rebuild/nexus-2.0`, later merged to `main`) rather than surgical fixes to the existing codebase
**Reason**: 822 API routes with 0% workspace_id coverage, 455 migrations with 93 duplicate sequence numbers, 529 root .md AI artefacts — the codebase was unfixable incrementally
**Alternatives rejected**: Option B (surgical fixes) — too many cross-cutting concerns; Option C (vendor tool) — not founder-specific

### ADR-R02: Single-Tenant Design (09/03/2026)
**Decision**: `founder_id = auth.uid()` throughout. NOT multi-tenant `workspace_id`. One user: Phill McGurk.
**Reason**: The system is a private CRM, not a SaaS. Multi-tenant overhead is pure waste. Simpler RLS policies, simpler queries, no workspace selection UI needed.
**Alternatives rejected**: Retaining workspace_id (legacy complexity, wrong mental model)

### ADR-R03: 9-Table Clean Schema (09/03/2026)
**Decision**: Replace 455 legacy migrations with a clean 9-table schema: businesses, contacts, nexus_pages, nexus_databases, nexus_rows, credentials_vault, approval_queue, social_channels, connected_projects
**Reason**: Legacy schema had 93 duplicate sequence numbers and was untraceable. Clean slate with intentional design.
**Alternatives rejected**: Migrating/fixing existing migrations (too many conflicts)

### ADR-R04: dnd-kit for Kanban Drag-and-Drop (09/03/2026)
**Decision**: Use dnd-kit exclusively for Kanban board. Do NOT use Framer Motion for drag interactions.
**Reason**: dnd-kit and Framer Motion `whileHover` on the same sortable item causes transform conflicts — the CSS transform is applied twice, breaking position calculations.
**Alternatives rejected**: Framer Motion drag (transform conflict), react-beautiful-dnd (deprecated)

### ADR-R05: Novel 1.0.2 Block Editor API (09/03/2026)
**Decision**: Use `EditorRoot + EditorContent` API from Novel 1.0.2. Do NOT import `{ Editor }`.
**Reason**: Novel 1.0.2 changed its public API. The old `{ Editor }` export no longer exists.
**Alternatives rejected**: Downgrading Novel (misses upstream fixes), TipTap directly (more complexity)

### ADR-R06: Zustand for UI Store (09/03/2026)
**Decision**: Zustand manages UI state — sidebar collapse, business selection, active theme
**Reason**: Lightweight, no boilerplate, no context provider wrapping needed, persists across route navigations
**Alternatives rejected**: React Context (re-render overhead), Redux (overkill for 3 state values), URL params (not suitable for UI-only state)

### ADR-R07: MACAS Parallel Firm Strategy (11/03/2026)
**Decision**: `Promise.allSettled` for 4 parallel firm calls. Minimum 2 firms required to proceed. Exponential backoff: 1s/2s/4s. Zod/JSON parse errors NOT retried (model won't improve on retry).
**Reason**: One failing firm should not block the entire debate. Partial results are better than total failure for a multi-agent competitive system.
**Alternatives rejected**: `Promise.all` (one failure kills all), sequential calls (4x slower)

### ADR-R08: Unified Search via ILIKE (12/03/2026)
**Decision**: Search API uses 3 parallel ILIKE queries (contacts, pages, approvals) rather than PostgreSQL full-text search or a dedicated search index.
**Reason**: Dataset is small (single-founder, hundreds not millions of records). ILIKE is adequate, zero config, no index maintenance.
**Alternatives rejected**: pg_trgm full-text index (over-engineering for dataset size), Algolia/Typesense (external dependency, cost)

### ADR-R09: cmdk shouldFilter=false in Search Mode (12/03/2026)
**Decision**: Extended `cmdk` Command component with `shouldFilter` prop; set to `false` when displaying API search results.
**Reason**: cmdk's built-in client-side filtering hides items that don't match the typed string. API results are already filtered — applying cmdk's filter on top causes correct results to disappear.
**Alternatives rejected**: Disabling cmdk filtering globally (breaks navigation mode), replacing cmdk (unnecessary)

### ADR-R10: AbortController on Search Debounce (12/03/2026)
**Decision**: Each search request creates an AbortController. Previous controller is aborted before issuing a new request. `AbortError` is caught and loading state preserved (not set to false on abort).
**Reason**: Rapid typing causes multiple in-flight requests. Without cancellation, a slow early response can overwrite a fast later response (race condition). `setLoading(false)` in `finally` block incorrectly cleared the spinner on abort.
**Alternatives rejected**: Debounce-only without abort (race condition persists for fast typists), request deduplication middleware (more complex)

### ADR-R11: NodeJS-Starter-V1 Framework Upgrade — `.claude/` Strengthening (24/03/2026)
**Decision**: Full sweep of all `.claude/` files to resolve conflicts, remove stale references, and add cross-references across agents, rules, commands, primers, and templates. ~30 file edits + 1 new file (`rules/database/supabase.md`).
**Reason**: Post-upgrade audit (Phases 1–5 of NodeJS-Starter-V1 template) revealed critical conflicts (Lucide deprecation mismatch, stale Python/FastAPI refs in a Next.js-only project), missing machine-readable YAML frontmatter on skills, and significant gaps in cross-agent documentation (no Supabase rules file, no TanStack Query patterns in `/new-feature`, no en-AU defaults in BASE_PRIMER).
**Key changes**:
- `frontend-designer/agent.md`: Lucide → AI-generated custom icons (matches `standards/agent.md`)
- `rules/database/supabase.md`: Created — covers `createServerClient` vs `createBrowserClient`, founder_id isolation, RLS templates, pgsodium vault (ADR-006), audit logging, connection pooling
- YAML frontmatter: Added to `api-client`, `oauth-flow`, `audit-trail` skills for auto-discovery
- `verification/agent.md`: Python verification commands removed; Next.js only
- Primers: `BASE_PRIMER.md` now has en-AU locale defaults table; `VERIFIER_PRIMER.md` now has Truth Finder delegation gate + 3-failure escalation threshold
- Commands: All `npm` → `pnpm`; Supabase tier added to `/verify`; TanStack Query + RLS policy template added to `/new-feature`
**Alternatives rejected**: Piecemeal fixes per session (compounds drift), automated migration script (too blunt — risks overwriting intentional content)

### ADR-R12: NodeJS-Starter-V1 Upstream Integration — CEO Board + PI Workspace (24/03/2026)
**Decision**: Integrate three major capability upgrades from NodeJS-Starter-V1 (commits eead87e + 64fdcd5, 23/03/2026): CEO Board Deliberation System, Agent Orchestrator Swarm, and PI Agent Workspace (`.pi/`). 17 new skills added, 5 new commands, 13 `.pi/` workspace files. Python/FastAPI-specific skills (docker-patterns, infrastructure-as-code, graphql-patterns, saga-pattern, cron-scheduler) skipped as Unite-Group runs on Next.js/Vercel exclusively.
**Reason**: CEO Board provides 9-persona strategic deliberation with persistent expertise memory — directly applicable to governing MACAS expansion decisions and 7-business strategy. PI Workspace creates a structured runtime home for multi-agent reasoning artefacts separate from the `.claude/` configuration layer. Agent Orchestrator formalises existing swarm patterns.
**Key adaptations**:
- `/generate-route-reference`: FastAPI route scanning → Next.js `src/app/api/**/*.ts` App Router
- `custom-oracle.md`: Pre-seeded with Unite-Group context (7 businesses, MACAS, Synthex, Brisbane/QLD, Privacy Act 1988, ATO 7-year rule)
- `_EXAMPLE-macas-expansion.md`: Created Unite-Group-specific golden example (MACAS tax filing expansion) using AUD, pgsodium vault, ATO compliance pathway
- `agent-orchestrator/SKILL.md`: Engineering domain restricted to TypeScript/Next.js (no Python backend references)
- Brief template: Added "Affects Businesses" field; constraints reference Privacy Act/ATO/ASIC
**Alternatives rejected**: Selective cherry-pick of CEO Board only (misses compounding value of swarm + PI memory), full upstream sync without adaptation (would introduce Python/FastAPI stale refs)
