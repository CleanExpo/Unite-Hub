# Guardian Z01: Capability Manifest & Tenant Readiness Scoring

**Status**: ✅ Complete
**Phase**: Z-Series (Meta & Productization)
**Completion**: 100% (7 tasks completed)
**Last Updated**: 2025-12-12

---

## Overview

Guardian Z01 is a **meta-level observation system** that catalogs all Guardian capabilities and computes per-tenant readiness scores. It provides operators with insight into their Guardian maturity without affecting runtime alerting, incidents, or enforcement logic.

**Key Principle**: Z01 is **advisory-only**. Readiness scores are informational guidance; they never gate or auto-toggle any Guardian behavior.

---

## Architecture

```
Guardian Configuration & Metrics (G, H, I, X phases)
        ↓
Readiness Evaluators (pure functions)
        ↓
Capability Readiness Scores (0-100)
        ↓
Persisted in guardian_tenant_readiness_scores
        ↓
Readiness Dashboard & APIs (read-only, tenant-scoped)
```

### Purpose of Z-Series

Z-series focuses on **meta-governance, operator experience, and productization**:

1. **Capability Catalog**: Define what Guardian can do (Z01)
2. **Readiness Scoring**: Assess tenant adoption and maturity (Z01)
3. **Packaging & Onboarding**: Guided workflows and feature bundles (future Z1x phases)
4. **Operator Analytics**: Usage trends and impact tracking (future Z2x phases)

---

## Guardian Capability Model

Guardian capabilities are organized into **5 categories**:

### 1. Core (G-Series)
- **guardian.core.rules**: Rule definition, editing, versioning
- **guardian.core.alerts**: Alert generation and routing
- **guardian.core.incidents**: Incident lifecycle and escalation
- **guardian.core.risk**: Risk scoring and assessment

**Weight**: 1.5–2.0 (foundational)

### 2. AI Intelligence (H-Series)
- **guardian.ai.h_series_foundation**: AI-powered rule suggestions and anomaly analysis

**Weight**: 1.2 (enhancement, experimental)

### 3. QA & Chaos (I-Series)
- **guardian.qa.i_series.simulation**: Alert simulation and regression testing
- **guardian.qa.i_series.playbook_rehearsal**: Incident response automation

**Weight**: 1.3–1.5 (validation & testing)

### 4. Network Intelligence (X-Series)
- **guardian.network.x01_telemetry**: Metrics ingestion and cohort aggregation
- **guardian.network.x02_anomalies**: Anomaly detection vs. peers
- **guardian.network.x03_early_warnings**: Pattern-based early signals
- **guardian.network.x04_console_governance**: Intelligence dashboard
- **guardian.network.x05_lifecycle**: Data retention and compliance
- **guardian.network.x06_recommendations**: Advisory recommendations

**Weight**: 0.8–1.2 (peer intelligence)

### 5. Governance & Meta
- **guardian.governance.audit_logging**: Immutable audit trails
- **guardian.meta.readiness_dashboard**: Readiness scoring and dashboard

**Weight**: 0.5–1.5 (compliance & ops)

---

## Readiness Scoring Model

### Score Scale: 0–100

| Score | Status | Meaning |
|-------|--------|---------|
| 0–25 | `not_configured` | Capability not enabled or no data |
| 26–50 | `partial` | Enabled; limited usage or early adoption |
| 51–75 | `ready` | Actively used; core functionality operational |
| 76–100 | `advanced` | Extensive usage; deeply integrated |

### Examples

**Core Rules Readiness**:
- 0: No rules defined
- 40: 1–2 active rules
- 70: 5–20 active rules
- 90: 20+ active rules with templates and tags

**Network Telemetry Readiness**:
- 0: Feature disabled
- 40: Enabled but no telemetry ingested yet
- 85: Telemetry flowing, cohorts computed

**QA Simulation Readiness**:
- 0: No simulation runs
- 50: 1–5 simulation runs
- 80: 5+ runs, regression packs configured

---

## Overall Tenant Readiness

### Overall Score Calculation

Weighted average of all capability scores using defined weights:

```
overall_score = Σ(capability_score × capability_weight) / Σ(capability_weight)
```

### Overall Status Buckets

| Range | Status | Interpretation |
|-------|--------|-----------------|
| 0–39 | `baseline` | Core rules engine only |
| 40–59 | `operational` | Core + Risk engine enabled |
| 60–79 | `mature` | Operational + QA chaos testing |
| 80–100 | `network_intelligent` | Mature + X-series network intelligence |

### Status Progression Path

```
baseline (rules only)
    ↓
operational (add risk scoring)
    ↓
mature (add QA simulation)
    ↓
network_intelligent (add X-series peer intelligence)
```

---

## Database Schema

### guardian_capability_manifest

Global catalog of capabilities (read-only for tenants):

```sql
CREATE TABLE guardian_capability_manifest (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE,
  label TEXT,
  description TEXT,
  category TEXT, -- 'core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance'
  phase_codes TEXT[],
  weight NUMERIC,
  is_tenant_scoped BOOLEAN,
  is_experimental BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  metadata JSONB
);
```

### guardian_tenant_readiness_scores

Per-tenant readiness snapshots (tenant-scoped via RLS):

```sql
CREATE TABLE guardian_tenant_readiness_scores (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  computed_at TIMESTAMPTZ,
  capability_key TEXT REFERENCES guardian_capability_manifest(key),
  score NUMERIC, -- 0-100
  status TEXT, -- 'not_configured', 'partial', 'ready', 'advanced'
  details JSONB, -- { totalRules, activeRules, ... }
  overall_guardian_score NUMERIC, -- Weighted average
  overall_status TEXT, -- 'baseline', 'operational', 'mature', 'network_intelligent'
  metadata JSONB,
  created_at TIMESTAMPTZ
);
```

### RLS Policies

- **guardian_capability_manifest**: Read-only for all tenants (non-sensitive global config)
- **guardian_tenant_readiness_scores**: Tenant-scoped via `workspace_id` context

---

## Readiness Computation

### Per-Capability Evaluators

Each capability has a pure function evaluator that queries relevant Guardian tables:

**evaluateCoreRulesReadiness(tenantId)**:
- Count total rules
- Count active (enabled) rules
- Score: 0 (none), 40 (1–5), 70 (5–20), 90 (20+)

**evaluateCoreAlertsReadiness(tenantId)**:
- Count enabled alert channels
- Score: 0 (none), 50 (1 channel), 85 (2+ channels)

**evaluateNetworkTelemetryReadiness(tenantId)**:
- Check feature flag `enableNetworkTelemetry`
- Check for telemetry records in X01 tables
- Score: 0 (disabled), 40 (enabled, no data), 85 (enabled, data flowing)

### Computation Workflow

1. **Load configurations**: Feature flags, rule counts, incident history
2. **Evaluate each capability**: Invoke evaluator, get score + status
3. **Calculate overall score**: Weighted average using capability weights
4. **Persist snapshot**: Insert rows into `guardian_tenant_readiness_scores`

### Readiness Details

Details JSON is **non-PII only**:

```json
{
  "totalRules": 12,
  "activeRules": 10,
  "rulesRatio": "83.3",
  "channelsConfigured": 2,
  "incidentsLast30d": 5,
  "riskEngineEnabled": true,
  "telemetryEnabled": true,
  "hasTelemetryData": true,
  "anomaliesDetected": true,
  "warningsEnabled": true,
  "recommendationsGenerated": 25
}
```

**No PII**: No user names, no IP addresses, no raw logs, no individual metric values.

---

## API Reference

### GET /api/guardian/meta/readiness/overview

**Get latest readiness snapshot**

```bash
curl "http://localhost:3008/api/guardian/meta/readiness/overview?workspaceId=WORKSPACE_ID"
```

**Response**:
```json
{
  "computedAt": "2025-12-12T10:30:00Z",
  "overall": {
    "score": 68,
    "status": "mature"
  },
  "capabilities": [
    {
      "key": "guardian.core.rules",
      "label": "Rule Engine & Editor",
      "category": "core",
      "description": "...",
      "score": 85,
      "status": "ready",
      "details": { "totalRules": 15, "activeRules": 12, ... }
    },
    ...
  ]
}
```

### GET /api/guardian/meta/readiness/history

**Get historical readiness snapshots**

```bash
curl "http://localhost:3008/api/guardian/meta/readiness/history?workspaceId=WORKSPACE_ID&since=2025-12-01&limit=50"
```

**Query Parameters**:
- `workspaceId`: Required
- `since`: ISO8601 date (optional)
- `capability_key`: Filter by single capability (optional)
- `limit`: Max 500 (default 100)

**Response**:
```json
{
  "history": [
    {
      "computedAt": "2025-12-12T10:30:00Z",
      "overallScore": 68,
      "overallStatus": "mature",
      "capabilities": [
        { "key": "guardian.core.rules", "score": 85, "status": "ready" },
        ...
      ]
    },
    ...
  ],
  "count": 10
}
```

---

## Readiness Dashboard

Located at `/guardian/admin/readiness/page.tsx`

### Features

- **Overall Score Card**: Large, prominent display of weighted average and status
- **Category Breakdown**: Average score per category (core, AI, QA, network, governance)
- **Capability Tiles**: One tile per capability showing:
  - Name and category
  - Score (0–100) and status badge
  - Key details (e.g., "3 rules active", "X-series enabled")
  - Navigation link to relevant Guardian module (rules editor, network console, etc.)
- **Status Description**: English interpretation of overall status
- **Navigation**: "Go to module" links for each capability

### Advisory Banner

Displayed prominently:

> **Advisory-Only:** Readiness scores help identify gaps and opportunities for Guardian adoption. They do not affect alerting, incidents, or enforcement logic. Configuration and activation remain completely under your control.

---

## Privacy & Security

### No Cross-Tenant Leakage

- RLS on `guardian_tenant_readiness_scores` ensures tenants see only their own scores
- RLS on `guardian_capability_manifest` allows read-only public catalog access
- No tenant names, no cross-references to other tenants

### No PII in Details

Evaluators only gather:
- Counts (rules, channels, incidents, recommendations)
- Boolean flags (enabled/disabled, feature flags)
- Timestamps (recent activity)

**Never included**:
- User names, emails, phone numbers
- IP addresses, API keys
- Raw alert/incident contents
- Rule expressions or logic
- Customer data

### Immutable Snapshots

Each readiness snapshot is appended; never modified or deleted (except via retention policy, managed separately in future Z05 phase).

---

## Service APIs

### capabilityManifestService.ts

```typescript
// Bootstrap capability manifest to database
export async function upsertCapabilityManifestEntries(): Promise<void>

// Query capabilities
export async function getAllCapabilities(): Promise<GuardianCapabilityDefinition[]>
export async function getCapabilityByKey(key: string): Promise<GuardianCapabilityDefinition | null>
export async function getCapabilitiesByCategory(category: string): Promise<GuardianCapabilityDefinition[]>
```

### readinessComputationService.ts

```typescript
// Compute readiness for all capabilities for a tenant
export async function computeReadinessForTenant(
  tenantId: string,
  now?: Date
): Promise<GuardianCapabilityReadinessResult[]>

// Persist scores to database
export async function persistReadinessScores(
  tenantId: string,
  results: GuardianCapabilityReadinessResult[],
  now?: Date
): Promise<void>

// Full workflow: compute + persist
export async function computeAndPersistReadinessForTenant(
  tenantId: string
): Promise<GuardianTenantReadinessSummary>
```

---

## Operational Usage

### Manual Computation

Compute readiness for a single tenant:

```typescript
import { computeAndPersistReadinessForTenant } from '@/lib/guardian/meta/readinessComputationService';

const summary = await computeAndPersistReadinessForTenant('tenant-xyz');
console.log(`Overall: ${summary.overallScore} (${summary.overallStatus})`);
```

### Scheduled Batch Computation

(Intended for future Z02 phase with scheduled jobs)

```typescript
import { computeAndPersistReadinessForTenant } from '@/lib/guardian/meta/readinessComputationService';

// Called daily via cron or Cloud Tasks
for (const tenantId of allTenantIds) {
  await computeAndPersistReadinessForTenant(tenantId);
}
```

### Viewing Results

Navigate to `/guardian/admin/readiness` to see:
1. Overall Guardian score and status
2. Category-level averages
3. Individual capability scores and details
4. Links to configure each capability

---

## Testing

**Test file**: `tests/guardian/z01_capability_manifest_and_readiness.test.ts`

**Coverage**:
- ✅ Capability manifest structure and uniqueness
- ✅ Valid categories, phase codes, and weights
- ✅ Readiness status and score bucket mapping
- ✅ Overall status logic (baseline → network_intelligent progression)
- ✅ Non-PII details validation
- ✅ Experimental capability flagging

**Run tests**:
```bash
npm run test -- tests/guardian/z01_capability_manifest_and_readiness.test.ts
```

---

## Deployment Checklist

- [ ] Migration 596 applied (capability manifest + readiness tables + RLS)
- [ ] capabilityManifestService.ts deployed
- [ ] readinessComputationService.ts deployed
- [ ] Readiness APIs created (`/api/guardian/meta/readiness/*`)
- [ ] Readiness dashboard UI deployed
- [ ] Capability manifest bootstrapped via `upsertCapabilityManifestEntries()`
- [ ] Initial readiness computed for test tenants
- [ ] Tests passing (npm run test)
- [ ] TypeScript strict mode passing (npm run typecheck)
- [ ] Dashboard accessible at `/guardian/admin/readiness`

---

## Performance Targets

- **Readiness computation per tenant**: <1s (10–20 queries to Guard tables)
- **Overview API**: <100ms
- **History API (50 snapshots)**: <200ms
- **Dashboard load**: <500ms (overview + history)

---

## Future Z-Series Phases

**Z02** — Capability-Based Onboarding: Guided workflows to move from baseline → network_intelligent

**Z03** — Feature Bundles & Licensing: Package capabilities into tiers (e.g., "Essential", "Professional", "Enterprise")

**Z04** — Operator Analytics: Usage trends, impact metrics, feature adoption tracking

**Z05** — Readiness Lifecycle: Retention and cleanup of old readiness snapshots

---

## Troubleshooting

### No readiness data shown

1. Check migration 596 is applied: `SELECT COUNT(*) FROM guardian_capability_manifest;`
2. Bootstrap manifest: Call `upsertCapabilityManifestEntries()` (one-time admin action)
3. Compute readiness: Call `computeAndPersistReadinessForTenant(workspaceId)`

### Scores seem low

- Readiness reflects actual usage, not potential
- Scores increase as you enable Guardian features and build rules/tests
- This is by design: readiness is a journey, not a binary state

### RLS errors on API calls

1. Ensure `get_current_workspace_id()` function exists (created in G-series migrations)
2. Verify JWT claim includes workspace_id
3. Check Guardian session context is properly set

---

## Related Documentation

- **X01–X06**: Network Intelligence (Telemetry, Anomalies, Early Warnings, Console, Lifecycle, Recommendations)
- **I01–I08**: QA Simulation & Playbook Rehearsal (I-Series)
- **G01–G52**: Core Rule Engine, Alerts, Incidents, Risk (G-Series)
- **H01–H10**: AI Assistance for Rules & Anomalies (H-Series, future)

---

*Guardian Z01 — Meta-Layer Capability Observation. Advisory-only; never affects runtime behavior. 🤖*

*Generated with [Claude Code](https://claude.com/claude-code)*
