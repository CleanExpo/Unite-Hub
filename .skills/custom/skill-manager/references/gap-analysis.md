# Gap Analysis Engine - Scoring & Relationships

> Reference data for MODE 1: Full Analysis.
> Contains the scoring formula, relationship graph, and priority classification rules.

---

## Scoring Formula

Each identified gap receives a score calculated as:

```
final_score = base_priority × confidence × context_multiplier
```

### Base Priority

| Level | Value | Criteria |
|-------|-------|----------|
| Critical | 100 | Required dependency of an installed skill is missing |
| High | 75 | Strong complementary pair where one side is installed |
| Medium | 50 | Foundational category has zero coverage |
| Low | 25 | Nice-to-have complement or low-frequency use case |

### Confidence

A float from `0.0` to `1.0` representing how certain the gap is:

| Confidence | Meaning |
|-----------|---------|
| 1.0 | Declared dependency is missing (deterministic) |
| 0.9 | Strong pattern match (e.g., API routes exist but no `api-contract` skill) |
| 0.7 | Moderate signal (e.g., Docker Compose present but no `docker-patterns`) |
| 0.5 | Weak signal (complementary pair, neither side strongly indicated) |

### Context Multipliers

Applied additively, then clamped to `[0.5, 2.0]`:

| Condition | Modifier | Detection Method |
|-----------|----------|-----------------|
| CI/CD pipeline detected | +0.3 | `.github/workflows/` directory exists |
| Docker Compose present | +0.2 | `docker-compose.yml` or `compose.yml` exists |
| Backend API routes exist | +0.2 | `apps/backend/src/api/` has route files |
| Frontend components exist | +0.1 | `apps/web/components/` has TSX files |
| Database models exist | +0.2 | `apps/backend/src/db/` has model files |
| AI/LLM integration present | +0.2 | `apps/backend/src/models/` or `src/agents/` exists |
| Multiple environments | +0.1 | `.env.example` and `.env.production` both exist |
| Monorepo structure | +0.1 | `turbo.json` or workspace config detected |
| Domain matches skill category | +0.3 | Skill category aligns with detected project domain |
| Unmet dependency (critical) | +0.5 | Installed skill declares dependency not satisfied |

---

## Priority Thresholds

After scoring, gaps are classified:

| Classification | Score Range | Action |
|---------------|-------------|--------|
| **Critical** | ≥ 75 | Must address before next phase. Block execution. |
| **Recommended** | 40–74 | Should address in current milestone. Flag in report. |
| **Nice to Have** | < 40 | Log for future consideration. No blocking. |

---

## Dependency Rules (Critical Priority)

These rules fire when an installed skill declares a dependency that is not satisfied.

| Installed Skill | Required Dependency | Confidence |
|----------------|-------------------|------------|
| `resilience-patterns` | `retry-strategy` | 1.0 |
| `saga-pattern` | `retry-strategy` | 1.0 |
| `saga-pattern` | `queue-worker` | 1.0 |
| `dashboard-patterns` | `metrics-collector` | 1.0 |
| `tracing-patterns` | `metrics-collector` | 1.0 |
| `notification-system` | `queue-worker` | 1.0 |
| `report-generator` | `pdf-generator` | 0.9 |
| `infrastructure-as-code` | `secret-management` | 1.0 |
| `workflow-engine` | `state-machine` | 1.0 |

---

## Complementary-Pair Rules (High Priority)

These rules fire when one skill in a known pair is installed but the other is not.

| If Installed | Then Recommend | Confidence | Rationale |
|-------------|---------------|------------|-----------|
| `api-contract` | `error-taxonomy` | 0.85 | Consistent error responses require structured codes |
| `api-contract` | `data-validation` | 0.90 | Contract enforcement needs input validation |
| `api-client` | `retry-strategy` | 0.80 | Client-side calls need retry logic |
| `retry-strategy` | `graceful-shutdown` | 0.70 | Retries need clean shutdown to avoid orphan requests |
| `queue-worker` | `graceful-shutdown` | 0.85 | Workers must drain before shutdown |
| `scientific-luxury` | `email-template` | 0.50 | Design system should extend to email |
| `scientific-luxury` | `dashboard-patterns` | 0.55 | Design system should extend to dashboards |
| `structured-logging` | `error-taxonomy` | 0.75 | Logs need structured error categorisation |
| `health-check` | `graceful-shutdown` | 0.80 | Health probes need shutdown awareness |
| `vector-search` | `cache-strategy` | 0.70 | Embedding queries benefit from caching |
| `csv-processor` | `data-validation` | 0.65 | CSV imports need validation |
| `search-indexer` | `vector-search` | 0.75 | Full-text and vector search are complementary |
| `ci-cd-patterns` | `docker-patterns` | 0.80 | CI/CD pipelines typically build Docker images |
| `state-machine` | `council-of-logic` | 0.60 | State machines need algorithmic validation |
| `cron-scheduler` | `structured-logging` | 0.70 | Scheduled tasks need audit logs |

---

## Category-Coverage Rules (Medium Priority)

These rules fire when an entire foundational category has zero installed skills.

| Category | Foundational? | Minimum Coverage | Recommended Starter |
|----------|:------------:|-----------------|-------------------|
| Error Handling & Resilience | Yes | 1 skill | `error-taxonomy` |
| API & Integration | Yes | 1 skill | `api-contract` |
| Data Processing | Yes | 1 skill | `data-validation` |
| Authentication & Security | Yes | 1 skill | `input-sanitisation` |
| Observability & DevOps | Yes | 1 skill | `structured-logging` |
| Document & Content | No | 0 | — |
| Orchestration & Workflow | No | 0 | — |
| Communication & Reporting | No | 0 | — |

---

## Skill Relationship Graph

### Requires (hard dependency)

```
resilience-patterns  --> retry-strategy
saga-pattern         --> retry-strategy
saga-pattern         --> queue-worker
dashboard-patterns   --> metrics-collector
tracing-patterns     --> metrics-collector
notification-system  --> queue-worker
workflow-engine      --> state-machine
infrastructure-as-code --> secret-management
report-generator     --> pdf-generator (soft)
```

### Complements (recommended pairing)

```
api-contract     <--> error-taxonomy
api-contract     <--> data-validation
api-client       <--> retry-strategy
retry-strategy   <--> graceful-shutdown
queue-worker     <--> graceful-shutdown
health-check     <--> graceful-shutdown
structured-logging <--> error-taxonomy
vector-search    <--> cache-strategy
search-indexer   <--> vector-search
ci-cd-patterns   <--> docker-patterns
state-machine    <--> council-of-logic
csv-processor    <--> data-validation
cron-scheduler   <--> structured-logging
scientific-luxury <--> email-template
scientific-luxury <--> dashboard-patterns
```

---

## Analysis Output Format

Gap analysis results should be formatted as:

```markdown
## Skill Gap Analysis Report

**Project**: {project_name}
**Date**: {DD/MM/YYYY}
**Installed Skills**: {count}
**Gaps Identified**: {count}

### Critical Gaps (Score ≥ 75)

| Rank | Skill | Score | Reason | Action |
|------|-------|-------|--------|--------|
| 1 | `{name}` | {score} | {reason} | Generate via MODE 2 |

### Recommended Gaps (Score 40–74)

| Rank | Skill | Score | Reason | Action |
|------|-------|-------|--------|--------|
| 1 | `{name}` | {score} | {reason} | Schedule for next milestone |

### Nice to Have (Score < 40)

| Rank | Skill | Score | Reason |
|------|-------|-------|--------|
| 1 | `{name}` | {score} | {reason} |
```
