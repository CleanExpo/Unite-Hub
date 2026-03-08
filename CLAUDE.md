# Unite-Group Nexus

## Identity
Private founder CRM for Phill McGurk. NOT a public SaaS. One user.
Stack: Next.js 16, React 19, Supabase, Vercel, Tailwind CSS, pnpm monorepo.
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
See `.claude/agents/` for: frontend-specialist, backend-specialist,
database-specialist, security-auditor, test-engineer, verification,
spec-builder, deploy-guardian, orchestrator, and 14 others.

## Critical Rules
- DB queries: always `.eq('workspace_id', workspaceId)` (current codebase)
- Auth: Supabase PKCE server-side | FastAPI JWT middleware
- Full context: `.claude/docs/CLAUDE-LEGACY.md` | `.claude/memory/CONSTITUTION.md`
