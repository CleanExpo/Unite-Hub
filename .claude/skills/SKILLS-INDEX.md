# Skills Index — Priority Classification

> **Purpose**: Priority map for all 76 skills in `.skills/custom/`.
> **Usage**: Load P1 skills automatically. Load P2+ on-demand based on task domain.
> **Implementation location**: `.skills/custom/{id}/SKILL.md`
> **Cross-reference**: `[[data/toolsheds]]` for domain-specific skill subsets (max 5–6 per agent).

---

## P1 — Critical (Auto-Loaded)

These skills load on every response via `pre-response.hook`. They are always active.

| Skill ID | Purpose |
|----------|---------|
| `scientific-luxury-design` | Scientific Luxury design system — full token set, component patterns, typography, spacing. See `.claude/skills/custom/scientific-luxury-design/` |
| `execution-guardian` | Blocks destructive operation defaults — confirms before rm/DROP/git push --force/db reset. Retry ceiling. Requirement validation gate. See `.claude/skills/custom/execution-guardian/` |
| `council-of-logic` | Multi-perspective reasoning — 4 advisors (Turing/correctness, Shannon/information, Von Neumann/systems, Gödel/completeness). Overrides first-answer bias. See `.claude/skills/custom/council-of-logic/` |
| `system-supervisor` | Architecture drift detection — pre-creation check, duplicate detection, complexity budget, pattern consistency. See `.claude/skills/custom/system-supervisor/` |
| `context-partitioning` | **NEW** Manifest-first dispatch — orchestrator produces typed manifest before any Agent tool call |
| `verification-first` | **NEW** Hard verification gate — no task complete without proof (Tier A–D) |

> **Custom skill location**: `.claude/skills/custom/{id}/SKILL.md`
> **P1 cap**: Do not add more than 8 P1 skills — each one costs tokens on every response.

---

## P2 — High (On-Demand)

Load when the task domain matches. Orchestrator loads based on task classification.

### Backend / API

| Skill ID | Trigger |
|----------|---------|
| `api-contract` | API endpoint design or modification |
| `api-client` | Implementing API client calls |
| `api-versioning` | Versioning strategy decisions |
| `error-taxonomy` | Error classification and handling design |
| `retry-strategy` | Retry logic, backoff, circuit breakers |
| `structured-logging` | Logging patterns, log levels, correlation IDs |
| `resilience-patterns` | Timeouts, fallbacks, degraded mode |

### Security

| Skill ID | Trigger |
|----------|---------|
| `oauth-flow` | OAuth implementation (Google, Xero, LinkedIn) |
| `rbac-patterns` | Role-based access control |
| `input-sanitisation` | User input validation and sanitisation |
| `csrf-protection` | CSRF token handling |
| `secret-management` | Env var handling, Vercel secrets |

### Testing

| Skill ID | Trigger |
|----------|---------|
| `playwright-browser` | E2E test implementation |

### Workflow

| Skill ID | Trigger |
|----------|---------|
| `ralph-wiggum` | **NEW** Autonomous task loop — `/ralph`, overnight runs, PRD-driven multi-iteration work |

### Agent Orchestration

| Skill ID | Trigger |
|----------|---------|
| `dispatching-parallel-agents` | Multi-agent decomposition and parallel dispatch |
| `delegation-planner` | Task planning and work package assignment |
| `evidence-verifier` | Verification pipeline, 4-tier source hierarchy |
| `model-currency-checker` | Validating current Claude model IDs |

---

## P3 — Standard (Domain-Specific)

Load when working within the specific domain.

### Data & Storage

| Skill ID | Domain |
|----------|--------|
| `audit-trail` | Audit logging, 7-year retention |
| `data-transform` | ETL, data mapping |
| `data-validation` | Schema validation, Zod patterns |
| `vector-search` | Supabase pgvector search |

### Infrastructure

| Skill ID | Domain |
|----------|--------|
| `blueprint-engine` | Blueprint DAG authoring |
| `cache-strategy` | Next.js caching, ISR, `unstable_cache` |
| `ci-cd-patterns` | GitHub Actions workflows |
| `docker-patterns` | Docker (dev only — not production) |
| `graceful-shutdown` | Server shutdown handling |
| `health-check` | Health endpoint patterns |
| `infrastructure-as-code` | IaC patterns |

### Frontend

| Skill ID | Domain |
|----------|--------|
| `claude-browser` | Claude browser automation |
| `dashboard-patterns` | Dashboard layout, Bento grids |
| `email-template` | Email component patterns |
| `error-boundary` | React error boundary patterns |
| `i18n-patterns` | Internationalisation (en-AU primary) |
| `xaem-theme-ui` | Theme UI component system |

### Integrations

| Skill ID | Domain |
|----------|--------|
| `slack-integration` | Slack API patterns |
| `webhook-handler` | Webhook receipt and processing |
| `notification-system` | In-app notification patterns |

### Workflow

| Skill ID | Domain |
|----------|--------|
| `changelog-generator` | Changelog and release notes |
| `cron-scheduler` | Cron job patterns (Vercel cron) |
| `feature-flag` | Feature flag patterns |
| `genesis-orchestrator` | Genesis orchestration patterns |
| `pipeline-builder` | Data pipeline construction |
| `queue-worker` | Background job patterns |
| `saga-pattern` | Distributed transaction sagas |
| `state-machine` | State machine patterns (XState) |
| `workflow-engine` | Multi-step workflow orchestration |

### Observability

| Skill ID | Domain |
|----------|--------|
| `metrics-collector` | Metrics collection and export |
| `tracing-patterns` | Distributed tracing |

### Content Processing

| Skill ID | Domain |
|----------|--------|
| `content-moderation` | Content filtering and moderation |
| `csv-processor` | CSV parsing and generation |
| `markdown-processor` | Markdown processing |
| `pdf-generator` | PDF generation patterns |
| `report-generator` | Report generation and formatting |
| `search-indexer` | Search index patterns |

### Quality Gates

| Skill ID | Domain |
|----------|--------|
| `systematic-debugging` | Root cause analysis and structured debugging |
| `tdd` | Test-driven development patterns |
| `finishing-branch` | Branch completion and PR readiness |
| `finished-audit` | Done-ness gate verification |
| `definition-of-done-builder` | Acceptance criteria and completion standards |

---

## P4 — Optional (Utility)

Load only when explicitly needed for a specific task.

| Skill ID | Purpose |
|----------|---------|
| `notebooklm-second-brain` | NotebookLM integration patterns |
| `graphql-patterns` | GraphQL (not currently in use — reference only) |
| `skill-manager` | Skill ecosystem management meta-skill |
| `status-page` | Status page patterns |
| `visual-excellence-enforcer` | Scientific Luxury design quality gate |
| `brand-ambassador` | Brand voice and social content for Synthex AI pipeline |
| `agent-orchestrator` | Swarm routing patterns (hub-and-spoke, chain, fan-out) |
| `ceo-board` | 9-persona CEO board deliberation and strategic decisions |
| `idea-to-production` | Idea pipeline across Unite-Group's 7 businesses |
| `outcome-translator` | Business value translation in AUD |
| `senior-saas-pm` | SaaS product lifecycle management |
| `git-worktrees` | Parallel feature branch isolation |

---

## Loading Rules

1. **P1 auto-loads** via `pre-response.hook` — always active, never disable
2. **P2 loads** when orchestrator classifies task into matching domain
3. **P3 loads** when agent dispatched to specific domain (via toolshed)
4. **P4 loads** only on explicit request or skill-manager recommendation
5. **Max 5–6 skills per agent** — use toolsheds to enforce this limit
6. **Load only relevant sections** — never dump full SKILL.md into context

---

## Toolshed Mapping

Domain toolsheds in `.claude/data/toolsheds.json` implement this priority system:

| Toolshed | P1 (always) | P2 domain | P3 specialist |
|----------|------------|-----------|--------------|
| `frontend` | scientific-luxury | — | dashboard-patterns, error-boundary, i18n-patterns |
| `backend` | execution-guardian | api-contract, api-client, error-taxonomy, retry-strategy, structured-logging | resilience-patterns |
| `database` | system-supervisor | — | vector-search, data-validation, data-transform, audit-trail |
| `security` | execution-guardian | input-sanitisation, oauth-flow, rbac-patterns, csrf-protection, secret-management | — |
| `debug` | council-of-logic | error-taxonomy, structured-logging, tracing-patterns | metrics-collector, resilience-patterns |
| `test` | execution-guardian | playwright-browser | — |
| `general` | council-of-logic, execution-guardian, system-supervisor | — | — |
