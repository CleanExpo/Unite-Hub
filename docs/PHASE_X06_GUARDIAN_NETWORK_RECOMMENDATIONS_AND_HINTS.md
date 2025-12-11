# Guardian X06: Network-Driven Recommendations & Playbook Hints

**Status**: ✅ Complete (All 25 tests passing)
**Completion**: 100% (7 tasks completed)
**Last Updated**: 2025-12-12

---

## Overview

Guardian X06 consumes X01-X05 network intelligence to generate **advisory-only recommendations**. These are non-binding hints derived from:

- **X02**: Network anomalies with benchmark positions
- **X03**: Early-warning pattern signals
- **X04**: QA coverage gaps
- **X01**: Telemetry aggregates and benchmarks

**Key guarantee**: No automatic configuration changes. All recommendations require explicit operator approval.

---

## Architecture

### Data Flow

```
X01-X05 Intelligence
        ↓
Network Insight Contexts
        ↓
mapInsightToRecommendation() [deterministic]
        ↓
Recommendation Drafts
        ↓
generateRecommendationsForTenant()
        ↓
guardian_network_recommendations (RLS-protected)
        ↓
Operator UI → Status transitions (open → in_progress → implemented/dismissed)
```

### Key Components

1. **recommendationModel.ts**: Deterministic mapping functions (pure, no DB access)
2. **recommendationGeneratorService.ts**: Load contexts, generate drafts, persist
3. **recommendationAiHelper.ts**: Optional Claude Sonnet-powered summaries
4. **API endpoints**: GET (list/filter), GET (detail), PATCH (status), GET (links)
5. **UI**: Recommendations tab in Network Intelligence console

---

## Database Schema

### guardian_network_recommendations

```sql
CREATE TABLE guardian_network_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  tenant_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,

  -- Source & context
  source TEXT NOT NULL, -- 'network_anomaly', 'early_warning', 'coverage'
  metric_family TEXT NOT NULL,
  metric_key TEXT NOT NULL,

  -- Recommendation content
  recommendation_type TEXT, -- rule_tuning, playbook_drill, qa_focus, performance_tuning, coverage_gap
  suggestion_theme TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  rationale JSONB, -- Aggregated stats, no PII

  -- Status & tracking
  status TEXT DEFAULT 'open', -- open, in_progress, implemented, dismissed
  severity TEXT, -- low, medium, high, critical

  -- Metadata
  related_entities JSONB, -- IDs and labels only
  metadata JSONB,

  -- Indexes
  CONSTRAINT recommendation_status_valid
    CHECK (status IN ('open', 'in_progress', 'implemented', 'dismissed')),
  CONSTRAINT recommendation_severity_valid
    CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_recommendations_workspace_status
  ON guardian_network_recommendations(workspace_id, status, created_at);
CREATE INDEX idx_recommendations_workspace_type
  ON guardian_network_recommendations(workspace_id, recommendation_type, status);
CREATE INDEX idx_recommendations_workspace_severity
  ON guardian_network_recommendations(workspace_id, severity, created_at);
```

### guardian_network_recommendation_links

```sql
CREATE TABLE guardian_network_recommendation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  recommendation_id UUID NOT NULL
    REFERENCES guardian_network_recommendations(id) ON DELETE CASCADE,

  source_table TEXT NOT NULL, -- 'anomalies', 'early_warnings', 'coverage_items'
  source_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT link_source_valid
    CHECK (source_table IN ('anomalies', 'early_warnings', 'coverage_items'))
);

CREATE INDEX idx_recommendation_links_rec
  ON guardian_network_recommendation_links(workspace_id, recommendation_id);
CREATE INDEX idx_recommendation_links_source
  ON guardian_network_recommendation_links(workspace_id, source_table, source_id);
```

### RLS Policies

All tables enforce `workspace_id` context isolation:

```sql
CREATE POLICY "workspace_isolation" ON guardian_network_recommendations
FOR ALL USING (workspace_id = get_current_workspace_id());

CREATE POLICY "workspace_isolation" ON guardian_network_recommendation_links
FOR ALL USING (workspace_id = get_current_workspace_id());
```

---

## Recommendation Mapping

### Sources & Types

| Source | Metric Family | Type | Theme | Example |
|--------|---------------|------|-------|---------|
| X02 Anomaly | error_rate | rule_tuning | tighten_thresholds | HTTP 500s up 2.5x vs. peers → tighten error threshold |
| X02 Anomaly | alerts.total | rule_tuning | relax_thresholds | Alert volume down 50% vs. peers → relax thresholds |
| X03 Warning | alerts | playbook_drill | exercise_playbooks | Spike pattern detected → run incident playbook |
| X03 Warning | incidents | playbook_drill | prioritize_critical | Cascade pattern detected → prioritize response |
| X04 Coverage | qa | qa_focus | expand_qa_regressions | Coverage <60% for rule → expand QA tests |
| X04 Coverage | qa | coverage_gap | increase_critical_rules | Coverage <80% for critical → improve coverage |

### Status Transitions

```
open
  ├→ in_progress (operator starts work)
  └→ dismissed (operator decides not to act)

in_progress
  ├→ implemented (operator completed action)
  ├→ dismissed (operator changed mind)
  └→ open (operator reverts)

implemented
  └─ [terminal state]

dismissed
  └─ [terminal state]
```

---

## API Reference

### GET /api/guardian/network/recommendations

**List recommendations with filters**

```typescript
Query Parameters:
  - status: 'open' | 'in_progress' | 'all' (default: 'open')
  - recommendationType: string (optional)
  - severity: 'low' | 'medium' | 'high' | 'critical' (optional)
  - since: ISO8601 (optional)
  - limit: number (default: 50, max: 100)
  - offset: number (default: 0)
  - workspaceId: UUID (required)

Response: {
  recommendations: [
    {
      id: string,
      status: string,
      severity: string,
      recommendationType: string,
      suggestionTheme: string,
      title: string,
      summary: string,
      createdAt: ISO8601,
      updatedAt: ISO8601
    }
  ],
  count: number
}
```

### GET /api/guardian/network/recommendations/[id]

**Get detailed recommendation**

```typescript
Query Parameters:
  - workspaceId: UUID (required)

Response: {
  id: string,
  status: string,
  severity: string,
  recommendationType: string,
  suggestionTheme: string,
  title: string,
  summary: string,
  rationale: object, // Aggregated stats, no PII
  related_entities: object,
  metadata: object,
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

### PATCH /api/guardian/network/recommendations

**Update recommendation status**

```typescript
Body: {
  id: string,
  status: 'in_progress' | 'implemented' | 'dismissed' | 'open',
  metadataPatch?: object
}

Response: {
  id: string,
  status: string,
  [updated fields]
}
```

### GET /api/guardian/network/recommendations/links/[id]

**Get recommendation sources**

```typescript
Query Parameters:
  - workspaceId: UUID (required)

Response: {
  links: [
    {
      sourceTable: string, // 'anomalies', 'early_warnings', 'coverage_items'
      sourceId: UUID,
      metadata: object
    }
  ]
}
```

---

## Service Usage

### Generate Recommendations for Single Tenant

```typescript
import { generateRecommendationsForTenant } from '@/lib/guardian/network/recommendationGeneratorService';

await generateRecommendationsForTenant('tenant-xyz', {
  bucketDate: new Date(),
  minSeverity: 'medium',
  limit: 50
});
```

**Flow**:
1. Load X02/X03/X04 insights (last 7 days)
2. Map to recommendation drafts
3. Deduplicate by `type:theme:metric_key`
4. Filter by severity
5. Insert new or update existing (open/in_progress only)
6. Link to source entities

### Batch Generate for All Tenants

```typescript
import { generateRecommendationsForAllTenants } from '@/lib/guardian/network/recommendationGeneratorService';

await generateRecommendationsForAllTenants(new Date());
```

**Intended for scheduled jobs** (e.g., daily via cron or Cloud Tasks)

### AI-Powered Summaries (Optional)

```typescript
import { generateRecommendationSummary } from '@/lib/guardian/network/recommendationAiHelper';

const summary = await generateRecommendationSummary(recommendation, {
  enableAiHints: flags.enableAiHints,
  tenantId: workspace.id
});

// Result: { summary: "...", actionItems: [...], nextSteps: "..." }
```

---

## UI Integration

### Recommendations Tab

Located in **Network Intelligence Console** (`/guardian/admin/network`):

- **Filter by status**: Open, In Progress, All
- **Severity badges**: low, medium, high, critical
- **Status badges**: open (blue), in_progress (orange), implemented (green), dismissed (gray)
- **Detail panel**: Full rationale, action buttons, metadata

### Status Transitions

- **Open** → "Start Work" (→ in_progress), "Dismiss" (→ dismissed)
- **In Progress** → "Mark Implemented" (→ implemented), "Revert to Open", (optional) "Dismiss"

### Advisory Banner

Always displayed:

> **Advisory-Only**: Recommendations are non-binding guidance derived from network intelligence. You decide when and how to apply them. No automatic configuration changes occur.

---

## Privacy & Security

### No PII in Recommendations

- Summaries use aggregated metrics only (e.g., "above_p90", "below_median")
- Rationale includes `deltaRatio`, `zScore`, `cohortPosition` — no tenant identifiers
- Related entities reference IDs only; no raw logs or individual values
- RLS enforces workspace isolation at database layer

### Deduplication

By: `recommendation_type + suggestion_theme + metric_key`

This ensures:
- Same recommendation not created twice per tenant per period
- Updates to existing (open/in_progress) instead of duplicating
- Closed recommendations (implemented/dismissed) not re-opened

### Immutability of Source Data

X01-X05 data is cleaned per retention policy (X05), but recommendations remain independent:
- If a source anomaly is deleted after retention, recommendation persists
- Operators can manually dismiss irrelevant recommendations

---

## Feature Flags

Recommendations respect X-series flags:

```typescript
if (!flags.enableNetworkEarlyWarnings && !flags.enableNetworkAnomalies) {
  // No recommendations generated
}

if (flags.enableAiHints && flags.enableNetworkEarlyWarnings) {
  // AI summaries available
}
```

---

## Testing

### Test Coverage (25 tests)

- ✅ Anomaly mapping (with cohort positions)
- ✅ Early warning mapping (with patterns)
- ✅ Coverage gap mapping
- ✅ Deterministic hashing (same input → same recommendation)
- ✅ Privacy isolation (no cross-tenant leakage)
- ✅ Valid types & severity levels
- ✅ Status transitions
- ✅ Recommendation structure completeness
- ✅ Edge cases (missing fields, empty patterns, full coverage)

**Run tests**:
```bash
npm run test -- tests/guardian/x06_network_recommendations.test.ts
```

---

## Deployment Checklist

- [ ] Migration 595 applied (guardian_network_recommendations tables + RLS)
- [ ] recommendationModel.ts deployed
- [ ] recommendationGeneratorService.ts deployed
- [ ] recommendationAiHelper.ts deployed
- [ ] API endpoints created & tested
- [ ] Recommendations UI tab added to Network Intelligence console
- [ ] Feature flags (enableNetworkEarlyWarnings, enableAiHints) verified
- [ ] RLS policies verified in Supabase
- [ ] Scheduled job configured for batch generation (optional)
- [ ] Tests passing (npm run test)
- [ ] TypeScript strict mode passing (npm run typecheck)

---

## Performance Targets

- **Recommendation generation per tenant**: <500ms (7-day window, ~10-50 contexts)
- **List API (50 recs)**: <100ms
- **Detail API**: <50ms
- **Status update**: <100ms
- **Batch generation (100 tenants)**: <30s

---

## Future Enhancements

1. **ML-based scoring**: Replace heuristics with learned patterns
2. **Cross-recommendation aggregation**: Group related recommendations
3. **Operator feedback loop**: Track which recommendations were applied successfully
4. **Predictive hints**: "If you implement this now, X will improve by Y%"
5. **Integration with incident management**: Auto-create playbook tasks

---

## Troubleshooting

### No recommendations generated

1. Check feature flags: `enableNetworkEarlyWarnings` or `enableNetworkAnomalies` must be true
2. Check X02/X03/X04 data: No anomalies/warnings in past 7 days → no contexts
3. Check heuristics: Metric family/key combinations may not match defined mappers

### Recommendations not updating

1. Check retention policy: Source data deleted due to retention → no contexts
2. Check status: Only open/in_progress can be updated; implemented/dismissed are terminal
3. Check RLS: Verify workspace_id context in Supabase

### AI summaries not appearing

1. Check feature flag: `enableAiHints` must be true
2. Check API key: `ANTHROPIC_API_KEY` configured
3. Check model availability: Claude Sonnet 4.5 may have rate limits

---

## Related

- **X01**: Network Telemetry Foundation
- **X02**: Network Anomaly Detection
- **X03**: Network Early-Warning Signals
- **X04**: Network Intelligence Console & Governance
- **X05**: Network Lifecycle & Compliance

---

*Generated with [Claude Code](https://claude.com/claude-code) — 🤖 Part of Guardian X-Series*
