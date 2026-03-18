# Unite-Group Nexus

## Identity
Private founder CRM for Phill McGurk. NOT a public SaaS. One user.
Stack: Next.js 16 App Router (src/ root), React 19, Supabase, Vercel, Tailwind CSS, pnpm monorepo. No FastAPI, no Python backend.
Design: Scientific Luxury — OLED Black `#050505`, Cyan `#00F5FF`, `rounded-sm` only.
Locale: en-AU | DD/MM/YYYY | AUD | AEST/AEDT

## Agent Routing Rules
ALWAYS delegate to subagents. Never do the work yourself.

### Parallel dispatch (ALL conditions met):
- 3+ unrelated tasks across different domains
- No shared state between tasks
- Clear file boundaries with no overlap

### Sequential dispatch (ANY condition triggers):
- Tasks have dependencies (B needs output from A)
- Shared files or state (merge conflict risk)
- Unclear scope (need to understand before proceeding)

## Subagent Invocation Protocol
Every dispatch MUST include:
1. Exact scope (which files, which routes)
2. Success criteria (what done looks like)
3. Relevant file references
4. Constraints (what NOT to touch)

## Available Agents — Nexus Rebuild Team
- `project-manager`    — planning, specs, Linear issues, roadmap
- `senior-fullstack`   — Next.js/React/Supabase implementation
- `database-architect` — schema, migrations, RLS, type generation
- `frontend-designer`  — UI components, Notion sidebar, layouts
- `api-integrations`   — Xero, Gmail, Calendar, Stripe, Linear, social
- `code-auditor`       — forensic audit, dead code, security scan (READ ONLY)
- `devops-engineer`    — Vercel, CI/CD, env config, monitoring
- `qa-tester`          — E2E tests, smoke tests, verification gate

## Existing Specialist Agents (pre-rebuild)
See `.claude/agents/` for: frontend-specialist, database-specialist,
security-auditor, test-engineer, verification, spec-builder,
deploy-guardian, orchestrator, and 23 others (31 total).

## Critical Rules
- DB queries: always `.eq('founder_id', founderId)` — NEVER workspace_id
- Auth: Supabase PKCE server-side only. Single-tenant.
- Source of truth: `.claude/memory/CONSTITUTION.md`

## Environment Variables (Vercel)
NEVER delete or modify these without understanding the impact:
- `ANTHROPIC_API_KEY` — Claude API. Powers Bron, Advisory, Strategy, Experiments. CRITICAL.
- `VAULT_ENCRYPTION_KEY` — AES-256-GCM encryption for credentials vault. CRITICAL.
- `SUPABASE_SERVICE_ROLE_KEY` — Bypasses RLS for server-side operations. CRITICAL.
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL. PUBLIC.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key. PUBLIC.
- `CRON_SECRET` — Validates scheduled jobs (bookkeeper). CRITICAL.
- `FOUNDER_USER_ID` — Founder's Supabase auth UUID. Used by CRON jobs.

Integration keys (optional — features degrade gracefully):
- `XERO_CLIENT_ID/SECRET` — Xero accounting OAuth
- `GOOGLE_CLIENT_ID/SECRET` — Gmail + Calendar OAuth
- `LINEAR_API_KEY` — Linear issue tracking sync
- `FACEBOOK_APP_ID/SECRET`, `LINKEDIN_CLIENT_ID/SECRET`, `TIKTOK_CLIENT_KEY/SECRET` — Social OAuth
