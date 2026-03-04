# Architectural Decisions — Unite Hub

## ADR-001: Monorepo Structure (2026-03-04)
**Decision**: Turbo monorepo with pnpm workspaces
- `src/` (root) = main Unite Hub Next.js 16 app (3,000+ files)
- `apps/backend/` = FastAPI/LangGraph Python backend
- `apps/web/` = Next.js 15 starter template (reference)
- `packages/shared/` = shared TypeScript types
- `packages/config/` = shared ESLint + TypeScript configs

## ADR-002: NodeJS-Starter-V1 Architecture Applied (2026-03-04)
**Decision**: Apply CleanExpo/NodeJS-Starter-V1 architecture patterns
- Replaced `.claude/` with starter's 23-agent system + hooks + memory
- Added `.skills/` library (59 skills)
- Added FastAPI backend (`apps/backend/`)
- Added Turbo build orchestration
- Added context drift prevention (CONSTITUTION + hooks)
- Kept Unite-Hub architecture docs in `.claude/architecture/`

## ADR-003: AI Provider Strategy
**Decision**: Dual-provider approach
- TypeScript/Next.js: Anthropic SDK (Opus 4.5, Sonnet 4.5, Haiku 4.5)
- Python/FastAPI: Pluggable (Ollama local default, Claude optional)

## ADR-004: Authentication
**Decision**: PKCE for Next.js (Supabase), JWT for FastAPI
- Never expose tokens in client code
- Sessions in cookies, validated server-side

## ADR-005: Database Isolation
**Decision**: All queries must scope by workspace_id
- RLS enforced at database level
- Application layer must also filter

## ADR-006: Founder Credential Vault (04/03/2026)
**Decision**: pgsodium vault.secrets for encrypted credential storage | REASON: Native Supabase encryption, zero plaintext exposure in metadata table, SECURITY DEFINER RPCs enforce server-side access control | ALTERNATIVES REJECTED: Client-side AES encryption (key management problem), plain Supabase columns (no encryption at rest at row level)
