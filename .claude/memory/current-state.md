# Current State
> Updated by session 53370f8d — 24/03/2026 AEST

## Active Task
None. NodeJS-Starter-V1 upstream integration complete (Phases 1–5).

## Recent Architectural Choices
- Bron/OpenClaw fully removed (commit e9d6e7b8) — replaced by Claude connection
- chat capability deleted; capabilities/index.ts now registers 5 capabilities (analyze, ideas, debate, content-generate, email-triage)
- Context-partitioning, verification-first, ralph-wiggum skills ported from NodeJS-Starter-V1
- Consolidated Supabase migration applied (email_triage_results, Xero encryption, RLS fixes, performance indexes)
- **24/03/2026**: NodeJS-Starter-V1 upstream integration (ADR-R12) — 17 new skills (ceo-board, agent-orchestrator, brand-ambassador, senior-saas-pm, dispatching-parallel-agents, delegation-planner, model-currency-checker, evidence-verifier, systematic-debugging, tdd, finishing-branch, finished-audit, visual-excellence-enforcer, definition-of-done-builder, idea-to-production, outcome-translator, git-worktrees), 5 new commands (/ceo-begin, /swarm-audit, /build, /hey-claude, /generate-route-reference), .pi/ CEO Board workspace (13 files, 9 expertise personas, custom-oracle seeded for Unite-Group/7-businesses/MACAS/Synthex/AUS context)

## Framework Upgrade — Completed 24/03/2026

**Phase A — Critical Conflicts Fixed:**
- Lucide icon conflict resolved: `frontend-designer/agent.md` now matches `standards/agent.md` (AI-generated custom icons only)
- `rules/database/supabase.md` created — covers client setup, founder_id isolation, RLS templates, pgsodium vault, audit logging
- YAML frontmatter added to 3 skills: `api-client`, `oauth-flow`, `audit-trail`
- Python/FastAPI stale refs removed from `verification/agent.md`, `genesis-hive-mind.md`, `api-contract/SKILL.md`

**Phase B — Agents Completed:**
- `senior-fullstack`: API error handling, test coverage table, bundle size budget
- `database-architect`: RLS templates, migration consolidation strategy, pgsodium vault
- `project-manager`: spec interview questions, Linear CLI integration, ROADMAP.md template
- `truth-finder`, `seo-intelligence`, `env-wizard`, `devops-engineer`: cross-references added

**Phase C — Rules/Commands/Primers Strengthened (~11 files):**
- All npm → pnpm throughout
- Supabase tier added to `/verify` and `/bootstrap`
- TanStack Query + RLS templates added to `/new-feature`
- Council of Logic pre-code checklist; context-drift Vault recovery; frontend icon/bundle rules
- Primers: en-AU defaults + Agent Harness patterns (BASE); Truth Finder gate + escalation threshold (VERIFIER)

**Phase F — Templates & Memory:**
- `spec-feature.md`: Skill dependencies table + Agent capability mapping added
- `spec-project-phase.md`: "Spec Interview Phase X of 6" clarification; Hook Integration section added

## Upstream Integration — Completed 24/03/2026 (ADR-R12)

**Phase 1 — New Skills (4):** `ceo-board`, `agent-orchestrator`, `brand-ambassador`, `senior-saas-pm`

**Phase 2 — New Commands (5):** `/ceo-begin`, `/swarm-audit`, `/build`, `/hey-claude`, `/generate-route-reference`

**Phase 3 — PI Workspace (13 files):**
- `.pi/README.md`, `_TEMPLATE.md`, `_EXAMPLE-macas-expansion.md`, 9 expertise persona files, 4 placeholder dirs
- `custom-oracle.md` pre-seeded: 7 businesses, MACAS, Synthex, Brisbane/QLD, Privacy Act 1988, ATO compliance

**Phase 4 — Missing Skills (13 net new):** `dispatching-parallel-agents`, `delegation-planner`, `model-currency-checker`, `evidence-verifier`, `systematic-debugging`, `tdd`, `finishing-branch`, `finished-audit`, `visual-excellence-enforcer`, `definition-of-done-builder`, `idea-to-production`, `outcome-translator`, `git-worktrees`

**Phase 5 — Index Updates:** AGENTS.md 59→76, SKILLS-INDEX.md 59→76, VAULT-INDEX.md v3 (commands 14→19, skills 62→79, .pi/ section), ADR-R12 appended

## In-Progress Work
None.

## Pending (not yet executed)
- Phase D: Linear integration via GitHub Composio MCP — pull open issues, triage
- Phase E: Supabase SQL updates (only if schema gaps found from Phase D)

## Next Steps
- Run `/ceo-begin` with a brief from `.pi/ceo-agents/briefs/` to exercise the CEO Board for the first time
- Run `/verify` to confirm foundation is still intact
- All tests passing as of 20/03/2026: 1,824/1,824 | type-check ✓ | lint ✓ (0 errors, 1 warning — pre-existing)

## Last Updated
24/03/2026 AEST (session end — upstream integration complete)
