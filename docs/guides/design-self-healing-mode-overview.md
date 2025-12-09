# Self-Healing Mode Design Overview

**Created**: 2025-11-29
**Status**: Implementation in progress
**Governance**: Human-Governed Mode (no auto-apply to MAIN)

---

## Existing Infrastructure Analysis

### Observability Layer (`src/lib/observability/`)

**mlDetector.ts** (501 lines):
- `MetricsBuffer` - In-memory buffer (10,000 entries, 1-min flush)
- `MLDetector` class with:
  - Real-time latency spike detection (3-sigma rule)
  - Error rate spike detection (5x baseline threshold)
  - Anomaly deduplication (5-minute window)
  - Health score calculation (0-100)
  - Route performance aggregation (p50, p95, p99)
- Persists to: `observability_logs`, `observability_anomalies`

**middleware.ts** (237 lines):
- `withObservability()` - Route wrapper with auth + metrics
- `withMetrics()` - Lightweight metrics-only wrapper
- Error response helpers (badRequest, unauthorized, etc.)

### Founder OS (`src/lib/founder/`)

**founderApprovalEngine.ts**:
- Risk levels: `low`, `medium`, `high`, `critical`
- Item types: `claim`, `campaign`, `email`, `automation`, `brand_change`, `override`
- Auto-approval for low risk only
- `ApprovalRequest` / `ApprovalDecision` types
- In-memory approval queue

**founderControlConfig.ts**:
- Manual override rules
- Risk thresholds

### Agents (`src/lib/agents/`)

**Key agents for integration**:
- `orchestrator-router.ts` - Main orchestrator (42K+ lines)
- `aiPhillAgent.ts` - Founder's AI assistant
- `cognitiveTwinAgent.ts` - Strategic memory/decisions

### Database Tables (existing)

From migration 315:
- `observability_logs` - API request metrics
- `observability_anomalies` - Detected anomalies
- `observability_health_snapshots` - Health scores
- `observability_route_baselines` - Route baselines

---

## Self-Healing Mode Integration Points

### 1. Error Classification Layer (NEW)

Create `src/lib/selfHealing/errorClassifier.ts`:
- Pattern-based error categorization
- Categories: `RLS_VIOLATION`, `AUTH_FAILURE`, `SSR_HYDRATION`, `API_SCHEMA`, `PERFORMANCE`, `UI_BUG`, `REDIRECT_LOOP`, `DB_ERROR`
- Severity assignment based on error patterns

**Consumes from**:
- `observability_logs.error_message`
- `observability_logs.error_stack`
- `observability_anomalies.type`

### 2. Self-Healing Service (NEW)

Create `src/lib/selfHealing/selfHealingService.ts`:
- `recordErrorAndCreateJob()` - Classify and persist jobs
- `attachPatch()` - Link AI-generated patches to jobs
- `markStatus()` - Update job lifecycle
- `listOpenJobs()` - Dashboard query

**Writes to** (migration 316):
- `self_healing_jobs` - Incident tracking
- `self_healing_patches` - Proposed fixes

### 3. Founder Dashboard Integration

Create `/founder/system-health` page:
- View open self-healing jobs
- Review AI-proposed patches
- Approve/Reject/Apply actions
- Wire to existing Founder OS approval patterns

### 4. AI Phill Integration

Extend orchestrator with new intents:
- `diagnose_system_issue` - Trigger error analysis
- `list_self_healing_jobs` - Query pending issues

AI Phill can:
- Discuss issues naturally ("What's broken?")
- Explain proposed patches
- Guide founder through approval process

---

## Data Flow

```
[API Error]
    → observability_logs
    → mlDetector.recordRequest()
    → SelfHealingService.recordErrorAndCreateJob()
        → errorClassifier.classifyError()
        → INSERT self_healing_jobs
    → (AI Analysis - optional)
        → INSERT self_healing_patches
    → Founder Dashboard / AI Phill
        → Founder reviews
        → Approve → sandbox testing → Apply to MAIN (manual)
        → Reject → Close job
```

---

## Governance Rules

1. **No auto-apply to MAIN** - All patches require explicit founder approval
2. **Sandbox first** - Option to apply to sandbox branch before MAIN
3. **Audit trail** - All decisions logged with timestamps
4. **Risk escalation** - Critical issues surface immediately
5. **AI-assisted, not AI-controlled** - Founder retains full control

---

## Migration 316 Schema

```sql
self_healing_jobs:
  - id, route, error_signature, error_category
  - severity, status, occurrences
  - related_observability_log_ids, related_anomaly_ids
  - ai_summary, ai_recommended_actions

self_healing_patches:
  - id, job_id, patch_type, description
  - files_changed, sql_migration_path
  - ai_diff_proposal, ai_patch_payload
  - confidence_score, status

RLS: FOUNDER/ADMIN + service_role only
```

---

## Implementation Order

1. **T2**: Migration 316 (schema)
2. **T3**: errorClassifier.ts
3. **T4**: selfHealingService.ts
4. **T5**: API routes + dashboard
5. **T6**: Orchestrator intents
6. **T7**: Tests + docs
7. **T8**: Apply migration
8. **T9**: Final verification

---

## Compatibility Notes

- Uses existing `profiles.role` with `user_role` ENUM ('FOUNDER', 'ADMIN')
- Uses existing `observability_*` tables as input
- Extends (does not replace) founderApprovalEngine patterns
- Server-side Supabase client only (no browser calls)
