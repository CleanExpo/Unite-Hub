# Decision Circuits v1.7.0 - CX09 A/B Testing (Phase 1)

## Overview

**CX09_A_B_TESTING** is a Decision Circuit (not an execution agent) that performs statistical variant evaluation and winner selection. It's a pure evaluation and analysis circuit with **no content generation, traffic allocation mutations, or AI model calls**.

**Phase 1 Scope**: Core deterministic evaluation logic, winner selection, and optimization signal emission to CX08_SELF_CORRECTION.

**Phase 2 Scope** (future): Dashboard UI, live traffic reallocation, automated content regeneration.

---

## Core Concepts

### Two-Proportion Z-Test

CX09 uses a statistical z-test to determine if engagement rate differences between variants are statistically significant:

**Formula**:
```
z = (p₁ - p₂) / SE
where:
  p₁, p₂ = engagement rates for variant 1 and 2
  SE = pooled standard error
```

**Confidence Score**: 1 - p_value (ranges 0-1)

**Decision Logic**:
- **Promote**: confidence_score >= 0.95 AND performance_delta > 0
- **Terminate**: performance_delta < 0 (negative variant)
- **Continue Test**: confidence_score < 0.95 (insufficient evidence)

### RLS Enforcement

All database queries are filtered by `workspace_id` at the database layer using Row Level Security (RLS). CX09 cannot access cross-workspace data.

### Metrics Snapshot Pattern

Metrics are stored as snapshots at evaluation time:
```typescript
interface MetricsSnapshot {
  variant_id: string;
  engagement_rate: number;           // 0-100
  click_through_rate: number;        // 0-100
  sample_size: number;               // execution count
  collected_at: string;              // ISO timestamp
}
```

### Optimization Signal

When a variant is promoted, CX09 emits an optimization signal to CX08_SELF_CORRECTION:

```typescript
interface OptimizationSignal {
  type: 'variant_promoted' | 'variant_terminated' | 'continue_test';
  test_id: string;
  winning_variant_id: string | null;
  confidence_score: number;
  performance_delta: number;
  recommendation: string;
  emitted_at: string;
}
```

---

## Database Schema

### circuit_ab_tests

Stores A/B test metadata and variant definitions:

```sql
CREATE TABLE circuit_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  test_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  circuit_execution_id TEXT NOT NULL,
  channel TEXT CHECK (channel IN ('email', 'social', 'multichannel')),
  variants JSONB NOT NULL,  -- Array of ABTestVariant
  evaluation_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, test_id)
);
```

**RLS**: `workspace_id = get_current_workspace_id()`

### circuit_ab_test_results

Stores metrics snapshots for each variant at evaluation time:

```sql
CREATE TABLE circuit_ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  ab_test_id UUID NOT NULL REFERENCES circuit_ab_tests(id),
  variant_id TEXT NOT NULL,
  engagement_rate NUMERIC(5, 2),
  click_through_rate NUMERIC(5, 2),
  sample_size INTEGER,
  collected_at TIMESTAMPTZ,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (ab_test_id) REFERENCES circuit_ab_tests(id)
);
```

**RLS**: `workspace_id = get_current_workspace_id()`

### circuit_ab_test_winners

Audit trail of winner selections and optimization signals:

```sql
CREATE TABLE circuit_ab_test_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  ab_test_id UUID NOT NULL REFERENCES circuit_ab_tests(id),
  winning_variant_id TEXT,
  decision TEXT CHECK (decision IN ('promote', 'continue_test', 'terminate')),
  confidence_score NUMERIC(3, 2),
  performance_delta NUMERIC(5, 2),
  optimization_signal JSONB,
  promoted_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (ab_test_id) REFERENCES circuit_ab_tests(id)
);
```

**RLS**: `workspace_id = get_current_workspace_id()`

### circuit_ab_test_summary (View)

Aggregated test status across variants:

```sql
CREATE VIEW circuit_ab_test_summary AS
SELECT
  t.workspace_id,
  t.test_id,
  t.test_name,
  t.channel,
  COUNT(DISTINCT r.variant_id) as variant_count,
  MAX(r.evaluated_at) as last_evaluated_at,
  w.decision as latest_decision,
  w.confidence_score as latest_confidence
FROM circuit_ab_tests t
LEFT JOIN circuit_ab_test_results r ON t.id = r.ab_test_id
LEFT JOIN circuit_ab_test_winners w ON t.id = w.ab_test_id
GROUP BY t.workspace_id, t.test_id, t.test_name, t.channel, w.decision, w.confidence_score;
```

---

## API Endpoint

### POST /api/circuits/cx09/evaluate

Triggers A/B test evaluation for a set of variants.

**Request**:
```typescript
{
  "workspace_id": "uuid",
  "circuit_execution_id": "string",     // Shared across CX01-CX08
  "test_id": "string",                  // Unique test identifier
  "test_name": "string",
  "channel": "email|social|multichannel",
  "variants": [
    {
      "variant_id": "string",
      "agent_execution_id": "string",
      "metrics_source": "email_agent_metrics|social_agent_metrics",
      "allocation_percentage": 50
    },
    {
      "variant_id": "string",
      "agent_execution_id": "string",
      "metrics_source": "email_agent_metrics|social_agent_metrics",
      "allocation_percentage": 50
    }
  ],
  "evaluation_window_hours": 72,        // Optional, default 72
  "minimum_sample_size": 100,          // Optional, default 100
  "confidence_threshold": 0.95,         // Optional, default 0.95
  "primary_metric": "engagement_rate"   // Optional
}
```

**Validation**:
- Minimum 2 variants required
- Each variant must have: variant_id, agent_execution_id, metrics_source
- Allocation percentages must sum to 100%
- circuit_execution_id must be provided

**Response** (200 OK):
```typescript
{
  "workspace_id": "uuid",
  "evaluation_result": {
    "test_id": "string",
    "winning_variant_id": "string|null",
    "runner_up_variant_id": "string|null",
    "confidence_score": 0.95,
    "performance_delta": 5.2,           // Percentage point difference
    "decision": "promote|continue_test|terminate",
    "recommendation": "string",
    "variants_evaluated": [
      {
        "variant_id": "string",
        "engagement_rate": 45.5,
        "click_through_rate": 12.3,
        "sample_size": 150
      },
      {
        "variant_id": "string",
        "engagement_rate": 42.1,
        "click_through_rate": 11.8,
        "sample_size": 145
      }
    ],
    "evaluated_at": "ISO timestamp"
  },
  "optimization_signal": {
    "type": "variant_promoted|variant_terminated|continue_test",
    "test_id": "string",
    "winning_variant_id": "string|null",
    "confidence_score": 0.95,
    "performance_delta": 5.2,
    "recommendation": "string",
    "emitted_at": "ISO timestamp"
  }
}
```

**Error Responses**:
- `400`: Missing required fields, allocation sum != 100%, < 2 variants
- `403`: Workspace validation failed, circuit binding failed
- `500`: Evaluation failed (missing metrics, z-test error, database error)

---

## Core Implementation

### Type Definitions

**ABTestVariant**:
```typescript
interface ABTestVariant {
  variant_id: string;
  channel: 'email' | 'social';
  agent_execution_id: string;           // Links to agent execution record
  metrics_source: 'email_agent_metrics' | 'social_agent_metrics';
  allocation_percentage: number;
}
```

**ABTestEvaluationInput**:
```typescript
interface ABTestEvaluationInput {
  workspace_id: string;
  circuit_execution_id: string;
  test_id: string;
  test_name: string;
  channel: 'email' | 'social' | 'multichannel';
  variants: ABTestVariant[];
  evaluation_window_hours?: number;     // Default: 72
  minimum_sample_size?: number;        // Default: 100
  confidence_threshold?: number;       // Default: 0.95
  primary_metric?: string;             // Default: 'engagement_rate'
  secondary_metric?: string;
  tie_breaker_metric?: string;
}
```

**ABTestEvaluationResult**:
```typescript
interface ABTestEvaluationResult {
  ab_test_id: string;
  winning_variant_id: string | null;
  confidence_score: number;             // 0-1
  performance_delta: number;            // Percentage points
  decision: 'promote' | 'continue_test' | 'terminate';
  recommendation: string;
  variants_evaluated: MetricsSnapshot[];
  optimization_signal: OptimizationSignal;
  evaluated_at: string;
}
```

### Core Functions

**evaluateABTest(input)**:
- Fetches metrics for all variants from respective agent metrics tables
- Performs two-proportion z-test for top 2 variants
- Determines decision based on confidence threshold and performance delta
- Logs results to database
- Returns evaluation result with optimization signal

**logABTestResults(workspaceId, input, result)**:
- Inserts test record to `circuit_ab_tests`
- Inserts metric snapshots to `circuit_ab_test_results`
- Inserts winner record to `circuit_ab_test_winners` (if promoted)
- Creates complete audit trail

**performZTest(variant1, variant2)**:
- Calculates z-score and p-value
- Returns statistical test result with significance flag

---

## Integration with CX08_SELF_CORRECTION

When a variant is promoted or terminated, CX09 emits an optimization signal that CX08 can consume:

```typescript
// CX08 receives this signal
const signal = evaluationResult.optimization_signal;

if (signal.type === 'variant_promoted') {
  // CX08 adjusts strategy with promoted variant
  await executeAutoCorrection({
    circuit_id: 'CX09_A_B_TESTING',
    action: 'adopt_winning_variant',
    winning_variant_id: signal.winning_variant_id,
    confidence_score: signal.confidence_score,
  });
} else if (signal.type === 'variant_terminated') {
  // CX08 removes underperforming variant
  await executeAutoCorrection({
    circuit_id: 'CX09_A_B_TESTING',
    action: 'eliminate_variant',
    terminated_variant_id: signal.winning_variant_id,
  });
}
```

---

## Usage Example

```typescript
import { evaluateABTest } from '@/lib/decision-circuits';

const evaluation = await evaluateABTest({
  workspace_id: 'workspace-123',
  circuit_execution_id: 'exec-456',
  test_id: 'welcome_email_v2',
  test_name: 'Welcome Email Variants - Q4 2025',
  channel: 'email',
  variants: [
    {
      variant_id: 'welcome_v2a',
      agent_execution_id: 'agent-exec-001',
      metrics_source: 'email_agent_metrics',
      allocation_percentage: 50,
    },
    {
      variant_id: 'welcome_v2b',
      agent_execution_id: 'agent-exec-002',
      metrics_source: 'email_agent_metrics',
      allocation_percentage: 50,
    },
  ],
  evaluation_window_hours: 72,
  confidence_threshold: 0.95,
});

console.log(`Decision: ${evaluation.decision}`);
console.log(`Winner: ${evaluation.winning_variant_id}`);
console.log(`Confidence: ${evaluation.confidence_score}`);
```

---

## Design Decisions

### 1. No Content Generation

CX09 is **read-only** for metrics and variant definitions. It cannot:
- Modify content
- Call AI models
- Change strategy selection
- Regenerate assets

### 2. Two-Proportion Z-Test

Selected for simplicity and statistical soundness:
- ✅ Handles binary outcome comparisons (sent/not sent, clicked/not clicked)
- ✅ Provides p-value for significance testing
- ✅ Deterministic (same inputs always produce same result)

### 3. Hard Fail on Missing Metrics

If variant metrics cannot be found, evaluation returns null for that variant rather than substituting defaults. This ensures:
- Audit trail accuracy
- No false confidence scores
- Explicit failure modes

### 4. Allocation Percentages (Phase 1 Read-Only)

Allocation percentages are validated but not enforced in Phase 1. They document the intended traffic split. Phase 2 will implement actual traffic reallocation.

### 5. RLS Enforcement

All database queries enforce `workspace_id` filtering at the SQL layer (RLS), not in application code. This prevents accidental cross-workspace leakage.

---

## Phase 2 Roadmap (Future)

- **Dashboard**: Visual A/B test results, history, trend analysis
- **Live Traffic Reallocation**: Automatic shift traffic based on winner selection
- **Automated Regeneration**: Trigger content regeneration for underperforming variants
- **Sequential Testing**: Support A/B/n testing with automatic winner selection
- **Bayesian Alternative**: Optional Bayesian approach for early termination

---

## Testing

### Unit Tests
- `performZTest()` with known z-score values
- `normalCDF()` approximation accuracy
- `fetchVariantMetrics()` with mocked metrics tables
- Decision logic (promote/terminate/continue)

### Integration Tests
- Full evaluation flow with database fixtures
- RLS policy enforcement
- Audit trail logging
- Optimization signal emission

### E2E Tests
- API endpoint request/response validation
- Database persistence verification
- Cross-workspace isolation

---

## Audit & Compliance

All evaluation decisions are logged with:
- Test metadata
- Variant metrics at evaluation time
- Statistical test results
- Decision rationale
- Timestamp and workspace context

This audit trail enables:
- Historical analysis of variant performance
- Reproducibility of decisions
- Compliance verification
- Root cause analysis

---

## Constraints & Limitations (Phase 1)

❌ **No real-time evaluation**: Batch evaluation at scheduled intervals or explicit trigger
❌ **No live traffic reallocation**: Phase 2 feature
❌ **No automated content regeneration**: Phase 2 feature
❌ **No webhook ingestion**: Manual metrics snapshot
❌ **No dashboard UI**: Phase 2 feature

✅ **Deterministic evaluation**: Same inputs always produce same decision
✅ **Statistically sound**: Two-proportion z-test at p < 0.05 level
✅ **RLS enforced**: Workspace isolation at database layer
✅ **Full audit trail**: Complete decision history
✅ **CX08 integration**: Optimization signal emission

---

## File Structure

```
src/
├── lib/decision-circuits/
│   ├── circuits/
│   │   ├── cx09-ab-testing.ts       # Type definitions
│   │   └── cx09-evaluator.ts         # Core evaluation logic
│   ├── registry.ts                   # CX09 circuit registration
│   └── index.ts                      # Module exports
└── app/api/circuits/cx09/
    └── evaluate/
        └── route.ts                  # POST /api/circuits/cx09/evaluate

supabase/
└── migrations/
    └── 20251215_decision_circuits_ab_testing_cx09.sql  # Schema

docs/
└── guides/
    └── DECISION-CIRCUITS-CX09-AB-TESTING.md  # This file
```

---

## Support & Troubleshooting

**Q: Why is my variant not being promoted despite higher engagement?**
A: Check that confidence_score >= 0.95 AND performance_delta > 0. Low sample sizes may require longer evaluation windows.

**Q: How do I change the confidence threshold?**
A: Pass `confidence_threshold: 0.90` in evaluation input. Lower thresholds promote variants sooner but with less certainty.

**Q: What if metrics are missing for a variant?**
A: Evaluation returns null for that variant. Ensure agent_execution_id matches an actual execution record.

**Q: Can CX09 modify traffic allocation?**
A: No, Phase 1 is read-only. Phase 2 will add live reallocation.

---

*Documentation generated for CX09_A_B_TESTING Phase 1 (2025-12-15)*
