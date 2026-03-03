# Skill Catalogue - Built-In Templates

> Reference data for MODE 3: Skill Catalogue Browse.
> 40+ skill templates across 8 categories for gap analysis and generation.

---

## How to Use This Catalogue

1. **Browse** by category to find relevant skill templates
2. **Check** if a skill already exists in `.skills/custom/` or `.skills/vercel-labs-agent-skills/`
3. **Generate** new skills via MODE 2 using a catalogue entry as the seed
4. **Score** gaps using `references/gap-analysis.md` scoring formula

---

## Category 1: Error Handling & Resilience

| # | Skill Name | Description | Complexity | Key Complements |
|---|-----------|-------------|------------|-----------------|
| 1.1 | `error-boundary` | React error boundary patterns with graceful degradation | Low | `scientific-luxury` |
| 1.2 | `retry-strategy` | Exponential backoff, circuit breaker, and retry policies | Medium | `api-client` |
| 1.3 | `graceful-shutdown` | Process signal handling and connection draining | Medium | `deploy-guardian` |
| 1.4 | `error-taxonomy` | Structured error codes, categories, and user-facing messages | Low | `api-contract` |
| 1.5 | `resilience-patterns` | Bulkhead, timeout, fallback, and hedging patterns | High | `retry-strategy`, `circuit-breaker` |

**Trigger Phrases**: "error handling", "retry", "resilience", "fault tolerance", "graceful degradation"

---

## Category 2: API & Integration

| # | Skill Name | Description | Complexity | Key Complements |
|---|-----------|-------------|------------|-----------------|
| 2.1 | `api-contract` | OpenAPI spec generation, request/response validation | Medium | `error-taxonomy` |
| 2.2 | `api-versioning` | URL/header-based versioning with deprecation policies | Medium | `api-contract` |
| 2.3 | `webhook-handler` | Idempotent webhook processing with signature verification | Medium | `retry-strategy` |
| 2.4 | `rate-limiter` | Token bucket and sliding window rate limiting | Medium | `api-contract` |
| 2.5 | `api-client` | Type-safe fetch wrapper with interceptors and caching | Medium | `retry-strategy`, `error-taxonomy` |
| 2.6 | `graphql-patterns` | Schema design, resolver patterns, dataloader optimisation | High | `api-contract` |

**Trigger Phrases**: "API", "endpoint", "integration", "webhook", "rate limit", "GraphQL"

---

## Category 3: Data Processing

| # | Skill Name | Description | Complexity | Key Complements |
|---|-----------|-------------|------------|-----------------|
| 3.1 | `data-validation` | Zod/Yup schema patterns for input sanitisation | Low | `api-contract` |
| 3.2 | `data-transform` | ETL pipelines, data mapping, and normalisation | Medium | `data-validation` |
| 3.3 | `csv-processor` | Streaming CSV parse/generate with large file support | Medium | `data-transform` |
| 3.4 | `vector-search` | pgvector embedding queries and similarity search | High | `council-of-logic` |
| 3.5 | `cache-strategy` | Redis caching patterns (aside, through, ahead) | Medium | `rate-limiter` |
| 3.6 | `queue-worker` | Background job processing with Redis/BullMQ | High | `retry-strategy`, `graceful-shutdown` |

**Trigger Phrases**: "data", "transform", "CSV", "cache", "vector", "queue", "background job"

---

## Category 4: Document & Content

| # | Skill Name | Description | Complexity | Key Complements |
|---|-----------|-------------|------------|-----------------|
| 4.1 | `markdown-processor` | Parse, transform, and render Markdown with plugins | Low | `data-transform` |
| 4.2 | `pdf-generator` | Server-side PDF generation from templates | Medium | `data-transform` |
| 4.3 | `email-template` | Responsive email templates with React Email | Medium | `scientific-luxury` |
| 4.4 | `search-indexer` | Full-text search indexing and query optimisation | High | `vector-search` |
| 4.5 | `content-moderation` | Automated content filtering and safety checks | Medium | `error-taxonomy` |
| 4.6 | `i18n-patterns` | Internationalisation with en-AU as default locale | Medium | `data-validation` |

**Trigger Phrases**: "document", "PDF", "email", "search", "content", "i18n", "localisation"

---

## Category 5: Authentication & Security

| # | Skill Name | Description | Complexity | Key Complements |
|---|-----------|-------------|------------|-----------------|
| 5.1 | `rbac-patterns` | Role-based access control with permission hierarchies | High | `api-contract` |
| 5.2 | `oauth-flow` | OAuth 2.0 / OIDC integration patterns | High | `api-client` |
| 5.3 | `csrf-protection` | Cross-site request forgery prevention patterns | Low | `api-contract` |
| 5.4 | `input-sanitisation` | XSS, SQL injection, and command injection prevention | Medium | `data-validation` |
| 5.5 | `audit-trail` | Structured event logging for compliance and forensics | Medium | `error-taxonomy` |
| 5.6 | `secret-management` | Environment variable patterns and secret rotation | Low | `deploy-guardian` |

**Trigger Phrases**: "auth", "security", "RBAC", "OAuth", "CSRF", "audit", "secrets"

---

## Category 6: Orchestration & Workflow

| # | Skill Name | Description | Complexity | Key Complements |
|---|-----------|-------------|------------|-----------------|
| 6.1 | `state-machine` | XState/custom finite state machines for complex flows | High | `council-of-logic` |
| 6.2 | `saga-pattern` | Distributed transaction orchestration with compensation | High | `retry-strategy`, `queue-worker` |
| 6.3 | `pipeline-builder` | Composable data/task pipeline construction | Medium | `data-transform` |
| 6.4 | `cron-scheduler` | Scheduled task management with overlap protection | Medium | `queue-worker` |
| 6.5 | `feature-flag` | Feature toggle patterns with gradual rollout | Medium | `api-contract` |
| 6.6 | `workflow-engine` | Multi-step approval and business process automation | High | `state-machine`, `saga-pattern` |

**Trigger Phrases**: "workflow", "state machine", "saga", "pipeline", "scheduler", "feature flag"

---

## Category 7: Observability & DevOps

| # | Skill Name | Description | Complexity | Key Complements |
|---|-----------|-------------|------------|-----------------|
| 7.1 | `structured-logging` | JSON logging with correlation IDs and log levels | Low | `error-taxonomy` |
| 7.2 | `health-check` | Liveness, readiness, and dependency health endpoints | Low | `graceful-shutdown` |
| 7.3 | `metrics-collector` | Prometheus/OpenTelemetry metrics instrumentation | Medium | `structured-logging` |
| 7.4 | `tracing-patterns` | Distributed tracing with span context propagation | High | `metrics-collector` |
| 7.5 | `docker-patterns` | Multi-stage builds, layer caching, security hardening | Medium | `deploy-guardian` |
| 7.6 | `ci-cd-patterns` | GitHub Actions workflow optimisation and caching | Medium | `docker-patterns` |
| 7.7 | `infrastructure-as-code` | Terraform/Pulumi patterns for cloud provisioning | High | `secret-management` |

**Trigger Phrases**: "logging", "monitoring", "metrics", "tracing", "Docker", "CI/CD", "infrastructure"

---

## Category 8: Communication & Reporting

| # | Skill Name | Description | Complexity | Key Complements |
|---|-----------|-------------|------------|-----------------|
| 8.1 | `notification-system` | Multi-channel notifications (email, push, in-app) | Medium | `queue-worker`, `email-template` |
| 8.2 | `report-generator` | Data aggregation and formatted report output | Medium | `pdf-generator`, `csv-processor` |
| 8.3 | `changelog-generator` | Automated changelog from conventional commits | Low | `ci-cd-patterns` |
| 8.4 | `dashboard-patterns` | Real-time dashboard with WebSocket/SSE updates | High | `metrics-collector`, `scientific-luxury` |
| 8.5 | `slack-integration` | Slack bot/webhook patterns for team notifications | Medium | `webhook-handler` |
| 8.6 | `status-page` | Public status page with incident management | Medium | `health-check`, `notification-system` |

**Trigger Phrases**: "notification", "report", "changelog", "dashboard", "Slack", "status page"

---

## Complexity Guide

| Level | Estimated Effort | Typical SKILL.md Size |
|-------|-----------------|----------------------|
| **Low** | 1-2 hours | 80-150 lines |
| **Medium** | 3-6 hours | 150-300 lines |
| **High** | 8-16 hours | 300-500 lines |

---

## Cross-Category Relationships

Skills frequently work together across categories. Key relationship clusters:

- **API Stack**: `api-contract` + `api-client` + `data-validation` + `error-taxonomy`
- **Resilience Stack**: `retry-strategy` + `graceful-shutdown` + `resilience-patterns` + `health-check`
- **Observability Stack**: `structured-logging` + `metrics-collector` + `tracing-patterns` + `health-check`
- **Content Stack**: `markdown-processor` + `search-indexer` + `vector-search` + `content-moderation`
- **Workflow Stack**: `state-machine` + `saga-pattern` + `queue-worker` + `pipeline-builder`

See `references/gap-analysis.md` for the full relationship graph and scoring formula.
