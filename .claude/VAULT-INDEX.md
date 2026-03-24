# Unite-Group Vault Index

> **Purpose**: O(1) asset discovery for all `.claude/` and `.skills/` resources.
> **Regenerate**: Run `/vault-init` to rebuild from filesystem scan.
> **Last updated**: 24/03/2026 (v3 — upstream integration: 17 new skills, 5 commands, .pi/ workspace)

---

## Wiki-Link Resolution Rules

```
[[id]]           → .claude/agents/{id}/agent.md      (agent lookup first)
[[agents/id]]    → .claude/agents/{id}/agent.md
[[rules/id]]     → .claude/rules/{id}.md
[[commands/id]]  → .claude/commands/{id}.md
[[skills/id]]    → .skills/custom/{id}/SKILL.md
[[blueprints/id]]→ .claude/blueprints/{id}.blueprint.md
[[primers/id]]   → .claude/primers/{id}
[[id#section]]   → Asset file, specific heading anchor
```

**Fuzzy threshold**: 0.8 — handles plurals, case, hyphens (e.g., `[[orchestrators]]` → `[[orchestrator]]`)

---

## Agents (34)

> Path prefix: `.claude/agents/{id}/agent.md`

### Priority 1 — Critical (Always Active)

| Wiki-Link | Agent Name | Role |
|-----------|-----------|------|
| `[[orchestrator]]` | Orchestrator | Master coordinator, multi-agent routing |
| `[[standards]]` | Standards | Australian context + design enforcement (auto-loads) |
| `[[verification]]` | Verification | Independent quality gatekeeper (blocking) |

### Priority 2 — High

| Wiki-Link | Agent Name | Role |
|-----------|-----------|------|
| `[[truth-finder]]` | Truth Finder | Fact verification, 4-tier source hierarchy |
| `[[seo-intelligence]]` | SEO Intelligence | Search dominance, GEO optimisation |
| `[[technical-architect]]` | Technical Architect | Architecture decisions, ADR authoring ⭐ NEW |

### Priority 3 — Standard

| Wiki-Link | Agent Name | Role |
|-----------|-----------|------|
| `[[senior-fullstack]]` | Senior Fullstack | Next.js/React/Supabase implementation |
| `[[frontend-designer]]` | Frontend Designer | UI components, Scientific Luxury design |
| `[[database-architect]]` | Database Architect | Schema, migrations, RLS, type generation |
| `[[project-manager]]` | Project Manager | Planning, specs, Linear issues, roadmap |
| `[[api-integrations]]` | API Integrations | Xero, Gmail, Calendar, Stripe, Linear, social |
| `[[code-auditor]]` | Code Auditor | Forensic audit, dead code, security (READ ONLY) |
| `[[devops-engineer]]` | DevOps Engineer | Vercel, CI/CD, env config, monitoring |
| `[[qa-tester]]` | QA Tester | E2E tests, smoke tests, verification gate |
| `[[spec-builder]]` | Spec Builder | 6-phase requirements interview |
| `[[env-wizard]]` | Env Wizard | Environment setup, API configuration |
| `[[rank-tracker]]` | Rank Tracker | 24/7 ranking monitoring, AU SERPs |
| `[[skill-manager]]` | Skill Manager | Skill ecosystem management |
| `[[product-strategist]]` | Product Strategist | Feature prioritisation, competitive positioning ⭐ NEW |
| `[[design-reviewer]]` | Design Reviewer | UI/UX review vs Scientific Luxury standards ⭐ NEW |
| `[[delivery-manager]]` | Delivery Manager | Sprint coordination, KANBAN, milestones ⭐ NEW |

### Priority 4 — Specialist

| Wiki-Link | Agent Name | Role |
|-----------|-----------|------|
| `[[frontend-specialist]]` | Frontend Specialist | React/Next.js/Tailwind development |
| `[[database-specialist]]` | Database Specialist | Supabase, migrations, RLS |
| `[[test-engineer]]` | Test Engineer | E2E, unit, integration testing |
| `[[deploy-guardian]]` | Deploy Guardian | Deployment safety and rollback |
| `[[docs-writer]]` | Docs Writer | Documentation generation |
| `[[code-reviewer]]` | Code Reviewer | Code quality and standards |
| `[[refactor-specialist]]` | Refactor Specialist | Code improvement and optimisation |
| `[[bug-hunter]]` | Bug Hunter | Issue investigation and resolution |
| `[[performance-optimizer]]` | Performance Optimizer | Speed and efficiency improvements |
| `[[security-auditor]]` | Security Auditor | Security scanning and hardening |
| `[[browser-qa]]` | Browser QA | Browser-based testing |
| `[[playwright-browser]]` | Playwright Browser | Playwright automation |
| `[[ralph-wiggum]]` | Ralph Wiggum | Chaos/edge case testing |

---

## Rules (13)

> Path prefix: `.claude/rules/`

| Wiki-Link | File | Purpose |
|-----------|------|---------|
| `[[rules/core]]` | `core.md` | Constitutional governance layer ⭐ NEW |
| `[[rules/slop-prevention]]` | `slop-prevention.md` | Output quality enforcement ⭐ NEW |
| `[[rules/audit-mode-classifier]]` | `audit-mode-classifier.md` | Response templates per mode ⭐ NEW |
| `[[rules/cli-control-plane]]` | `cli-control-plane.md` | 8-mode detection + execution safety |
| `[[rules/retrieval-first]]` | `retrieval-first.md` | Knowledge retrieval hierarchy |
| `[[rules/context-drift]]` | `context-drift.md` | Context drift prevention |
| `[[rules/council-of-logic]]` | `council-of-logic.md` | Logic council governance |
| `[[rules/genesis-hive-mind]]` | `genesis-hive-mind.md` | Hive mind patterns |
| `[[rules/database/supabase]]` | `database/supabase.md` | Supabase + RLS patterns |
| `[[rules/development/workflow]]` | `development/workflow.md` | Development commands + conventions |
| `[[rules/frontend/nextjs]]` | `frontend/nextjs.md` | Next.js 16 patterns + anti-patterns |
| `[[rules/skills/minions-protocol]]` | `skills/minions-protocol.md` | Minion iteration protocol |
| `[[rules/skills/orchestration]]` | `skills/orchestration.md` | Orchestration patterns |

---

## Commands (19)

> Path prefix: `.claude/commands/`

| Wiki-Link | Command | Purpose |
|-----------|---------|---------|
| `[[commands/minion]]` | `/minion` | One-shot task → PR execution |
| `[[commands/audit]]` | `/audit` | Codebase audit |
| `[[commands/verify]]` | `/verify` | Verification gate |
| `[[commands/new-feature]]` | `/new-feature` | Feature development workflow |
| `[[commands/fix-types]]` | `/fix-types` | TypeScript type fixing |
| `[[commands/bootstrap]]` | `/bootstrap` | Project bootstrapping |
| `[[commands/ui-review]]` | `/ui-review` | UI review against design system |
| `[[commands/automate-browser]]` | `/automate-browser` | Browser automation |
| `[[commands/notebooklm-bootstrap]]` | `/notebooklm-bootstrap` | NotebookLM setup |
| `[[commands/ralph]]` | `/ralph` | Ralph loop execution |
| `[[commands/skill-manager]]` | `/skill-manager` | Skill management |
| `[[commands/vault-init]]` | `/vault-init` | Regenerate Vault Index ⭐ NEW |
| `[[commands/done]]` | `/done` | Completion verification gate ⭐ NEW |
| `[[commands/discuss]]` | `/discuss` | Architecture discussion in PLAN mode ⭐ NEW |
| `[[commands/ceo-begin]]` | `/ceo-begin` | Launch CEO board deliberation from a `.pi/ceo-agents/briefs/` file |
| `[[commands/swarm-audit]]` | `/swarm-audit` | Audit swarm architecture health — agents, skills, toolsheds |
| `[[commands/build]]` | `/build` | Full-stack feature build — WHO/WHAT/HOW/WHERE/DONE checklist |
| `[[commands/hey-claude]]` | `/hey-claude` | Context load confirmation — lists all active Unite-Group context |
| `[[commands/generate-route-reference]]` | `/generate-route-reference` | Scan `src/app/api/**/*.ts` and generate typed route reference |

---

## Blueprints (4)

> Path prefix: `.claude/blueprints/`

| Wiki-Link | File | Purpose |
|-----------|------|---------|
| `[[blueprints/feature]]` | `feature.blueprint.md` | Feature development DAG |
| `[[blueprints/bugfix]]` | `bugfix.blueprint.md` | Bug fix DAG |
| `[[blueprints/migration]]` | `migration.blueprint.md` | Database migration DAG |
| `[[blueprints/refactor]]` | `refactor.blueprint.md` | Refactor DAG |

---

## Hook Scripts (11)

> Path prefix: `.claude/hooks/scripts/`

| Script | Type | Purpose |
|--------|------|---------|
| `iteration-counter.py` | Python | Track minion iteration counters |
| `notebooklm-sync.ps1` | PowerShell | Sync to NotebookLM |
| `notebooklm-sync.sh` | Bash | Sync to NotebookLM (Unix) |
| `notification-alert.ps1` | PowerShell | Desktop notification alerts |
| `post-edit-format.ps1` | PowerShell | Format after file edits |
| `pre-bash-validate.py` | Python | Validate bash commands before exec |
| `pre-compact-save.py` | Python | Save state before context compact |
| `pre-hydration.ps1` | PowerShell | Build context manifest for /minion |
| `session-start-context.ps1` | PowerShell | Load session context |
| `stop-verify-todos.py` | Python | Verify no TODOs on stop |
| `user-prompt-compass.ps1` | PowerShell | Compass check on user prompts |

**Protected**: Do NOT modify. All hooks use absolute paths — safe from renames.

---

## Skills (79)

> Path prefix: `.skills/custom/{id}/SKILL.md`
> Priority classification: See `.claude/skills/SKILLS-INDEX.md`

### P1 — Critical (Auto-Loaded)

`[[skills/scientific-luxury]]` `[[skills/execution-guardian]]` `[[skills/council-of-logic]]` `[[skills/system-supervisor]]` `[[skills/context-partitioning]]` `[[skills/verification-first]]`

> Custom P1 skills: `.claude/skills/custom/{id}/SKILL.md`

### P2 — High (On-Demand)

`[[skills/api-contract]]` `[[skills/api-client]]` `[[skills/error-taxonomy]]` `[[skills/retry-strategy]]` `[[skills/structured-logging]]` `[[skills/resilience-patterns]]` `[[skills/oauth-flow]]` `[[skills/rbac-patterns]]` `[[skills/input-sanitisation]]` `[[skills/playwright-browser]]` `[[skills/ralph-wiggum]]` `[[skills/dispatching-parallel-agents]]` `[[skills/delegation-planner]]` `[[skills/evidence-verifier]]` `[[skills/model-currency-checker]]`

### P3 — Standard

`[[skills/audit-trail]]` `[[skills/api-versioning]]` `[[skills/blueprint-engine]]` `[[skills/cache-strategy]]` `[[skills/changelog-generator]]` `[[skills/ci-cd-patterns]]` `[[skills/claude-browser]]` `[[skills/content-moderation]]` `[[skills/cron-scheduler]]` `[[skills/csrf-protection]]` `[[skills/csv-processor]]` `[[skills/dashboard-patterns]]` `[[skills/data-transform]]` `[[skills/data-validation]]` `[[skills/docker-patterns]]` `[[skills/email-template]]` `[[skills/error-boundary]]` `[[skills/feature-flag]]` `[[skills/genesis-orchestrator]]` `[[skills/graceful-shutdown]]` `[[skills/graphql-patterns]]` `[[skills/health-check]]` `[[skills/i18n-patterns]]` `[[skills/infrastructure-as-code]]` `[[skills/markdown-processor]]` `[[skills/metrics-collector]]` `[[skills/notification-system]]` `[[skills/pdf-generator]]` `[[skills/pipeline-builder]]` `[[skills/queue-worker]]` `[[skills/rate-limiter]]` `[[skills/report-generator]]` `[[skills/saga-pattern]]` `[[skills/search-indexer]]` `[[skills/secret-management]]` `[[skills/skill-manager]]` `[[skills/slack-integration]]` `[[skills/state-machine]]` `[[skills/status-page]]` `[[skills/tracing-patterns]]` `[[skills/vector-search]]` `[[skills/webhook-handler]]` `[[skills/workflow-engine]]` `[[skills/systematic-debugging]]` `[[skills/tdd]]` `[[skills/finishing-branch]]` `[[skills/finished-audit]]` `[[skills/definition-of-done-builder]]`

### P4 — Optional

`[[skills/notebooklm-second-brain]]` `[[skills/xaem-theme-ui]]` `[[skills/react-best-practices]]` `[[skills/genesis-orchestrator]]` `[[skills/visual-excellence-enforcer]]` `[[skills/brand-ambassador]]` `[[skills/agent-orchestrator]]` `[[skills/ceo-board]]` `[[skills/idea-to-production]]` `[[skills/outcome-translator]]` `[[skills/senior-saas-pm]]` `[[skills/git-worktrees]]`

---

## Memory (6)

> Path prefix: `.claude/memory/`

| Wiki-Link | File | Access |
|-----------|------|--------|
| `[[memory/CONSTITUTION]]` | `CONSTITUTION.md` | **Human-only. Never modify.** |
| `[[memory/compass]]` | `compass.md` | **Human-only. Never modify.** |
| `[[memory/architectural-decisions]]` | `architectural-decisions.md` | Append by agents, never delete |
| `[[memory/current-state]]` | `current-state.md` | Session state, updated by hooks |
| `[[memory/KANBAN]]` | `KANBAN.md` | Task board |
| `[[memory/TOOLS]]` | `TOOLS.md` | Tool inventory |

---

## Primers (5)

> Path prefix: `.claude/primers/`

| Wiki-Link | File | Purpose |
|-----------|------|---------|
| `[[primers/BASE_PRIMER]]` | `BASE_PRIMER.md` | Base agent foundation |
| `[[primers/ORCHESTRATOR_PRIMER]]` | `ORCHESTRATOR_PRIMER.md` | 605-line orchestration logic |
| `[[primers/DATABASE_AGENT_PRIMER]]` | `DATABASE_AGENT_PRIMER.md` | Database agent foundation |
| `[[primers/FRONTEND_AGENT_PRIMER]]` | `FRONTEND_AGENT_PRIMER.md` | Frontend agent foundation |
| `[[primers/VERIFIER_PRIMER]]` | `VERIFIER_PRIMER.md` | Verification agent foundation |

---

## Data (4)

> Path prefix: `.claude/data/`

| Wiki-Link | File | Purpose |
|-----------|------|---------|
| `[[data/toolsheds]]` | `toolsheds.json` | Skill subsets per domain (max 5-6 skills) |
| `[[data/design-tokens]]` | `design-tokens.json` | **Locked.** Scientific Luxury design system |
| `[[data/trusted-sources]]` | `trusted-sources.yaml` | 4-tier source hierarchy for Truth Finder |
| `[[data/verified-claims]]` | `verified-claims.json` | Verified claim cache |

---

## Knowledge (4+)

> Path prefix: `.claude/knowledge/`

| Path | Purpose |
|------|---------|
| `knowledge/index.json` | Knowledge base index |
| `knowledge/domains/competitive-intelligence/` | Competitor research |
| `knowledge/domains/market-research/` | Market data |

---

## Templates (3)

> Path prefix: `.claude/templates/`

| Wiki-Link | File | Purpose |
|-----------|------|---------|
| `[[templates/spec-feature]]` | `spec-feature.md` | Feature specification template |
| `[[templates/spec-project-phase]]` | `spec-project-phase.md` | Project phase specification template |
| `[[templates/README]]` | `README.md` | Template directory guide |

---

## Schemas (3)

> Path prefix: `.claude/schemas/`

| Wiki-Link | File | Purpose |
|-----------|------|---------|
| `[[schemas/agent-frontmatter]]` | `agent-frontmatter.schema.md` | Required YAML fields for agent files ⭐ NEW |
| `[[schemas/skill-frontmatter]]` | `skill-frontmatter.schema.md` | Required YAML fields for skill files ⭐ NEW |
| `[[schemas/blueprint-frontmatter]]` | `blueprint-frontmatter.schema.md` | Required YAML fields for blueprint files ⭐ NEW |

---

## PI Agent Workspace (13)

> Path prefix: `.pi/`
> Purpose: Persistent Inference — living documentation, deliberation transcripts, agent expertise, decision memos, SVG artefacts
> **Not inside `.claude/`** — sibling directory at repo root

### CEO Board Workspace

| Path | Purpose |
|------|---------|
| `.pi/README.md` | PI workspace overview and usage guide |
| `.pi/ceo-agents/briefs/_TEMPLATE.md` | Brief template for strategic decisions (Affects Businesses field, AUD, Privacy Act/ATO/ASIC) |
| `.pi/ceo-agents/briefs/_EXAMPLE-macas-expansion.md` | **Golden example brief**: MACAS tax filing expansion — ATO compliance pathway, pgsodium, AUD |
| `.pi/ceo-agents/deliberations/` | Board deliberation transcripts (runtime output — `/ceo-begin`) |
| `.pi/ceo-agents/memos/` | Decision memos (runtime output — DD/MM/YYYY naming) |
| `.pi/ceo-agents/conversations/` | Agent conversation logs (runtime output) |
| `.pi/ceo-agents/artifacts/` | SVG diagrams and data artefacts (runtime output) |

### Board Member Expertise Files

> Path prefix: `.pi/ceo-agents/expertise/`

| File | Persona |
|------|---------|
| `ceo.md` | CEO — integrated thinking, execution-focused |
| `revenue.md` | Revenue — growth levers, unit economics |
| `product-strategist.md` | Product Strategist — user value, roadmap |
| `technical-architect.md` | Technical Architect — systems, constraints |
| `contrarian.md` | Contrarian — devil's advocate, risk identification |
| `compounder.md` | Compounder — long-term compounding, delayed gratification |
| `custom-oracle.md` | **Unite-Group Oracle** — 7 businesses, MACAS, Synthex, Brisbane/QLD, Privacy Act 1988 |
| `market-strategist.md` | Market Strategist — positioning, competition |
| `moonshot.md` | Moonshot — 10x thinking, exponential opportunity |

### Shared Context

| Path | Purpose |
|------|---------|
| `.pi/shared/context/_TEMPLATE.md` | Shared context template pre-filled with Unite-Group state (7 businesses table, AUS compliance) |

---

## Spot-Check Wiki-Links

Quick verification for common lookups:

```
[[orchestrator]]           → .claude/agents/orchestrator/agent.md        ✓
[[rules/core]]             → .claude/rules/core.md                        ✓
[[senior-fullstack]]       → .claude/agents/senior-fullstack/agent.md     ✓
[[rules/cli-control-plane]]→ .claude/rules/cli-control-plane.md          ✓
[[commands/minion]]        → .claude/commands/minion.md                   ✓
[[blueprints/feature]]     → .claude/blueprints/feature.blueprint.md      ✓
[[skills/scientific-luxury]]→ .skills/custom/scientific-luxury/SKILL.md  ✓
[[technical-architect]]    → .claude/agents/technical-architect/agent.md  ✓
```
