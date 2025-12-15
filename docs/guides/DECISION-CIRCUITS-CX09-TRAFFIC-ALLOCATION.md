# Decision Circuits v1.8.0 - Traffic Allocation Engine (Phase 3)

**Release Date**: December 15, 2025
**Status**: Phase 3 Complete (Controlled Automation with Safeguards)
**Version**: 1.8.0

---

## Overview

The Traffic Allocation Engine (Phase 3) implements **guarded, reversible traffic allocation** for A/B test winners determined by CX09 evaluation. Unlike Phase 1 (evaluation only) and Phase 2 (observability only), Phase 3 automatically applies allocation decisions with comprehensive safeguards:

- ✅ **Guardrail Validation** - Confidence thresholds, performance deltas, rate limiting
- ✅ **Progressive Promotion** - Gradual traffic increase to winning variant (20% max per step)
- ✅ **Automatic Health Monitoring** - Rollback if success_rate drops >5% or error_rate increases >3%
- ✅ **Rate Limiting** - Max 2 allocations/day, 24-hour cooldown between changes
- ✅ **Reversibility** - Complete audit trail, instant rollback capability
- ✅ **RLS Enforcement** - Workspace isolation at database layer

---

## Architecture

### Three-Phase Decision Workflow

```
Phase 1: CX09 Evaluation        Phase 2: Observability           Phase 3: Allocation
────────────────────────────   ──────────────────────────────   ──────────────────
Evaluate variants via            Visualize results on              Apply outcomes
two-proportion z-test            dashboard                         to live traffic

Input:                           Input:                           Input:
• Variant metrics               • Test ID                        • Evaluation ID
• Confidence threshold          • Workspace ID                   • Confidence score
• Performance window                                             • Performance delta

Output:                         Output:                          Output:
• Decision (promote/            • Test summary                   • Allocation applied
  continue/terminate)           • Variant metrics                • Rate limit status
• Confidence score              • Evaluation history             • Rollback reason (if any)
• Optimization signal           • Timeline
```

### Allocation Strategy

**Progressive Promotion Algorithm**:

```
Current: Variant A = 60%, Variant B = 40%
Decision: Promote A (winner)
Max step: 20%
Remaining allocation: 40%

Step 1:
└─ Increase A by min(20%, 40%) = 20%
└─ New A = 80%, Distribute 20% to B = 10%

Step 2 (next evaluation):
└─ Increase A by min(20%, 20%) = 20%
└─ New A = 100%, B = 0%
```

**Guardrails**:
- Minimum confidence score: 0.95 (95%)
- Performance delta must be positive (winner better than loser)
- Rate limit: Max 2 allocations per workspace per day
- Cooldown: 24 hours between changes on same test
- Allocation step: Max 20% per change
- Health check: Monitor success_rate and error_rate

---

## API Reference

### POST /api/circuits/traffic/apply

Apply guarded allocation change based on CX09 evaluation result.

**Request**:
```http
POST /api/circuits/traffic/apply?workspaceId=<uuid>
Content-Type: application/json

{
  "ab_test_id": "email_subject_v3",
  "winning_variant_id": "variant_a",
  "evaluation_id": "eval_12345",
  "confidence_score": 0.97,
  "performance_delta": 5.2
}
```

**Response (Success)**:
```json
{
  "workspace_id": "workspace-123",
  "allocation_result": {
    "success": true,
    "allocation_id": "alloc-456",
    "previous_allocation_percent": 60,
    "new_allocation_percent": 80,
    "reason": "Successfully applied allocation: variant_a increased from 60% to 80%"
  },
  "timestamp": "2025-12-15T14:30:00Z"
}
```

**Response (Guardrails Blocked)**:
```json
{
  "error": "Guardrails validation failed; Confidence score (92%) below threshold (95%); Performance delta (2.5%) must be positive",
  "workspace_id": "workspace-123",
  "timestamp": "2025-12-15T14:30:00Z"
}
```

**Error Codes**:
- `400` - Missing/invalid fields, guardrails blocked, variant not found
- `404` - A/B test or evaluation result not found
- `500` - Database/allocation failure

---

### GET /api/circuits/traffic/status

Retrieve current and historical allocation state for an A/B test.

**Request**:
```http
GET /api/circuits/traffic/status?workspaceId=<uuid>&abTestId=email_subject_v3&historyLimit=50
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "ab_test": {
    "test_id": "email_subject_v3",
    "test_name": "Email Subject Line A/B Test",
    "status": "running"
  },
  "current_allocation": {
    "state": [
      {
        "id": "state-1",
        "variant_id": "variant_a",
        "allocation_percent": 80,
        "is_active": true,
        "applied_at": "2025-12-15T14:30:00Z",
        "can_rollback": true
      },
      {
        "id": "state-2",
        "variant_id": "variant_b",
        "allocation_percent": 20,
        "is_active": true,
        "applied_at": "2025-12-15T14:30:00Z",
        "can_rollback": true
      }
    ],
    "active_variants": [
      {
        "variant_id": "variant_a",
        "allocation_percent": 80,
        "applied_at": "2025-12-15T14:30:00Z",
        "can_rollback": true
      },
      {
        "variant_id": "variant_b",
        "allocation_percent": 20,
        "applied_at": "2025-12-15T14:30:00Z",
        "can_rollback": true
      }
    ],
    "last_applied_at": "2025-12-15T14:30:00Z",
    "last_event_type": "allocation_applied"
  },
  "allocation_history": {
    "total_changes": 5,
    "recent_changes": [
      {
        "event_id": "event-1",
        "event_type": "allocation_applied",
        "variant_id": "variant_a",
        "allocation_percent": 80,
        "confidence_score": 0.97,
        "performance_delta": 5.2,
        "rollback_reason": null,
        "triggered_at": "2025-12-15T14:30:00Z"
      },
      {
        "event_id": "event-2",
        "event_type": "health_check_passed",
        "variant_id": null,
        "allocation_percent": null,
        "confidence_score": null,
        "performance_delta": null,
        "rollback_reason": null,
        "triggered_at": "2025-12-15T15:00:00Z"
      }
    ],
    "limit": 50
  },
  "rate_limit": {
    "allocations_today": 1,
    "last_allocation_at": "2025-12-15T14:30:00Z",
    "reset_at": "2025-12-16T00:00:00Z",
    "can_allocate": true
  },
  "timestamp": "2025-12-15T16:45:00Z"
}
```

---

## Core Functions

### validateGuardrails()

```typescript
export async function validateGuardrails(
  workspaceId: string,
  input: ApplyAllocationInput
): Promise<GuardrailValidation> {
  // Check 1: Minimum confidence threshold (0.95)
  // Check 2: Performance delta > 0 (winner must outperform loser)
  // Check 3: Rate limiting (daily change limit)
  // Check 4: Cooldown between changes (24 hours)

  return {
    valid: boolean,
    violations: string[],      // Human-readable error messages
    reason?: string            // Concatenated violation list
  };
}
```

**Example**:
```typescript
const validation = await validateGuardrails('workspace-123', {
  workspace_id: 'workspace-123',
  ab_test_id: 'test-1',
  winning_variant_id: 'var_a',
  evaluation_id: 'eval-1',
  confidence_score: 0.92,        // ❌ Below 0.95
  performance_delta: 2.5
});

// Returns:
{
  valid: false,
  violations: [
    "Confidence score (92%) below threshold (95%)"
  ],
  reason: "Confidence score (92%) below threshold (95%)"
}
```

### applyAllocation()

```typescript
export async function applyAllocation(
  input: ApplyAllocationInput
): Promise<AllocationResult> {
  // Step 1: Validate guardrails (hard fail if violated)
  // Step 2: Get current allocations from traffic_allocation_state
  // Step 3: Calculate new allocations (progressive promotion)
  // Step 4: Deactivate old states, insert new states
  // Step 5: Log allocation_applied event
  // Step 6: Increment rate limit counter

  return {
    success: boolean,
    allocation_id?: string,
    previous_allocation_percent?: number,
    new_allocation_percent?: number,
    reason: string,
    error?: string
  };
}
```

**Example**:
```typescript
const result = await applyAllocation({
  workspace_id: 'workspace-123',
  ab_test_id: 'email_subject_v3',
  winning_variant_id: 'variant_a',
  evaluation_id: 'eval-456',
  confidence_score: 0.97,
  performance_delta: 5.2
});

// Returns (on success):
{
  success: true,
  allocation_id: 'alloc-789',
  previous_allocation_percent: 60,
  new_allocation_percent: 80,
  reason: "Successfully applied allocation: variant_a increased from 60% to 80%"
}
```

### checkHealthAndRollback()

```typescript
export async function checkHealthAndRollback(
  workspaceId: string,
  abTestId: string,
  healthMetrics: HealthMetrics
): Promise<{ rolled_back: boolean; reason?: string }> {
  // Get baseline metrics from prior allocation
  // Check: success_rate_drop > 5% → trigger rollback
  // Check: error_rate_increase > 3% → trigger rollback
  // Otherwise log health_check_passed event

  return {
    rolled_back: boolean,
    reason?: string            // Rollback reason if triggered
  };
}
```

**Example**:
```typescript
const healthResult = await checkHealthAndRollback(
  'workspace-123',
  'email_subject_v3',
  {
    success_rate: 0.88,        // Baseline was 0.94 → 6% drop
    error_rate: 0.05,
    retry_rate: 0.03
  }
);

// Returns (rollback triggered):
{
  rolled_back: true,
  reason: "Success rate dropped by 6.00%"
}

// Automatically:
// 1. Deactivates current allocation state
// 2. Logs 'allocation_rolled_back' event with reason
// 3. Restores previous allocation percentages (on next evaluation)
```

### getAllocationState()

```typescript
export async function getAllocationState(
  workspaceId: string,
  abTestId: string
): Promise<Array<{
  id: string;
  variant_id: string;
  allocation_percent: number;
  is_active: boolean;
  applied_at: string;
  can_rollback: boolean;
}>> {
  // Fetch from traffic_allocation_state view
  // Only returns active allocations
  // RLS-filtered by workspace_id
}
```

### getAllocationHistory()

```typescript
export async function getAllocationHistory(
  workspaceId: string,
  abTestId: string,
  limit: number = 50
): Promise<Array<{
  id: string;
  event_type: string;
  variant_id: string;
  allocation_percent: number;
  confidence_score: number;
  performance_delta: number;
  rollback_reason: string | null;
  triggered_at: string;
}>> {
  // Fetch from traffic_allocation_history view
  // Ordered by triggered_at DESC
  // Limited to most recent N events
}
```

---

## Database Schema

### Tables

**traffic_allocation_state** - Current allocation for each variant:
```sql
CREATE TABLE traffic_allocation_state (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,        -- RLS: get_current_workspace_id()
  ab_test_id UUID NOT NULL,          -- FK to circuit_ab_tests
  variant_id TEXT NOT NULL,
  allocation_percent INT,            -- 0-100
  is_active BOOLEAN,                 -- true = currently serving traffic
  applied_at TIMESTAMPTZ,            -- When this allocation became active
  applied_from_evaluation_id UUID,   -- FK to circuit_ab_test_winners
  can_rollback BOOLEAN,
  rolled_back_at TIMESTAMPTZ,        -- If rollback occurred
  rollback_reason TEXT,              -- Reason for rollback (metric name, threshold)
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**traffic_allocation_events** - Audit trail of all changes:
```sql
CREATE TABLE traffic_allocation_events (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,        -- RLS: get_current_workspace_id()
  ab_test_id UUID NOT NULL,
  event_type TEXT,                   -- 'allocation_applied', 'allocation_rolled_back', 'health_check_passed'
  variant_id TEXT,
  allocation_percent INT,
  triggered_by_evaluation_id UUID,   -- FK to circuit_ab_test_winners
  confidence_score FLOAT,
  performance_delta FLOAT,
  health_metrics JSONB,              -- Health metrics at time of event
  rollback_reason TEXT,
  triggered_at TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ
);
```

**traffic_allocation_limits** - Rate limiting state:
```sql
CREATE TABLE traffic_allocation_limits (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL UNIQUE, -- RLS: get_current_workspace_id()
  allocations_today INT,             -- Count of changes today
  last_allocation_at TIMESTAMPTZ,    -- Timestamp of last allocation
  reset_at TIMESTAMPTZ,              -- When counter resets (24 hours from last change)
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Views

**traffic_allocation_current** - Latest active allocation per variant:
```sql
CREATE VIEW traffic_allocation_current AS
SELECT
  id,
  workspace_id,
  ab_test_id,
  variant_id,
  allocation_percent,
  applied_at
FROM traffic_allocation_state
WHERE is_active = true;
```

**traffic_allocation_history** - Event audit trail:
```sql
CREATE VIEW traffic_allocation_history AS
SELECT
  id,
  workspace_id,
  ab_test_id,
  event_type,
  variant_id,
  allocation_percent,
  confidence_score,
  performance_delta,
  rollback_reason,
  triggered_at
FROM traffic_allocation_events
ORDER BY triggered_at DESC;
```

---

## Guardrails

### Configuration

```typescript
export const DEFAULT_GUARDRAILS = {
  minimum_confidence: 0.95,              // 95% confidence required
  max_allocation_step_percent: 20,       // Max 20% increase per step
  cooldown_hours_between_changes: 24,    // Wait 24 hours between changes
  max_daily_changes_per_workspace: 2,    // Max 2 changes per day
};
```

### Health Thresholds

```typescript
const ROLLBACK_THRESHOLDS = {
  success_rate_drop: 5,      // Rollback if success_rate drops >5%
  error_rate_increase: 3,    // Rollback if error_rate increases >3%
};
```

---

## Usage Examples

### Example 1: Apply Allocation After Promotion Decision

```typescript
import {
  applyAllocation,
  getAllocationState,
} from '@/lib/decision-circuits';

// CX09 evaluation returned: promote variant_a with 97% confidence
const allocationResult = await applyAllocation({
  workspace_id: 'workspace-123',
  ab_test_id: 'email_subject_v3',
  winning_variant_id: 'variant_a',
  evaluation_id: 'eval-456',
  confidence_score: 0.97,
  performance_delta: 5.2,
});

if (allocationResult.success) {
  console.log(
    `Variant A promoted: ${allocationResult.previous_allocation_percent}% → ${allocationResult.new_allocation_percent}%`
  );

  // Get current state
  const currentState = await getAllocationState('workspace-123', 'email_subject_v3');
  console.log('Current allocation:', currentState);
  // Output: [
  //   { variant_id: 'variant_a', allocation_percent: 80, is_active: true },
  //   { variant_id: 'variant_b', allocation_percent: 20, is_active: true }
  // ]
} else {
  console.error('Allocation failed:', allocationResult.error);
}
```

### Example 2: Health Check and Automatic Rollback

```typescript
import { checkHealthAndRollback } from '@/lib/decision-circuits';

// Scheduled job: Check health every 30 minutes
const result = await checkHealthAndRollback(
  'workspace-123',
  'email_subject_v3',
  {
    success_rate: 0.88,  // Compared against baseline 0.94
    error_rate: 0.05,
    retry_rate: 0.03,
  }
);

if (result.rolled_back) {
  // Alert: Allocation was rolled back
  console.log('Rollback triggered:', result.reason);
  // Output: "Success rate dropped by 6.00%"

  // Notify stakeholders
  await notifySlack(`Traffic allocation rolled back: ${result.reason}`);
}
```

### Example 3: Check Rate Limit Status

```typescript
import { checkRateLimit } from '@/lib/decision-circuits';

const rateLimitStatus = await checkRateLimit('workspace-123');

if (!rateLimitStatus.can_allocate) {
  console.log('Rate limit exceeded:', rateLimitStatus.reason);
  // Output: "Daily limit reached (2/2)"
} else {
  console.log(
    `${rateLimitStatus.allocations_today} allocations today, ` +
    `${2 - rateLimitStatus.allocations_today} remaining`
  );
}
```

### Example 4: Retrieve Allocation History

```typescript
import { getAllocationHistory } from '@/lib/decision-circuits';

const history = await getAllocationHistory('workspace-123', 'email_subject_v3', 10);

// Display allocation timeline
history.forEach((event) => {
  if (event.event_type === 'allocation_applied') {
    console.log(
      `${event.triggered_at}: ${event.variant_id} → ${event.allocation_percent}% ` +
      `(confidence: ${(event.confidence_score * 100).toFixed(0)}%)`
    );
  } else if (event.event_type === 'allocation_rolled_back') {
    console.log(`${event.triggered_at}: ROLLBACK - ${event.rollback_reason}`);
  }
});

// Output:
// 2025-12-15T14:30:00Z: variant_a → 80% (confidence: 97%)
// 2025-12-15T15:00:00Z: ROLLBACK - Success rate dropped by 6.00%
// 2025-12-14T10:15:00Z: variant_a → 60% (confidence: 96%)
```

---

## Workflow Integration

### CX09 → CX08 → Allocation

```
1. CX09_A_B_TESTING evaluates variants
   └─ Returns: decision (promote/continue/terminate), confidence_score, performance_delta

2. CX08_SELF_CORRECTION receives optimization signal
   └─ Decides: Should we apply this promotion? (Checks business rules, budget, etc.)
   └─ If yes: Calls POST /api/circuits/traffic/apply

3. Traffic Allocation Engine applies allocation
   └─ Validates guardrails
   └─ Calculates progressive promotion
   └─ Updates traffic_allocation_state
   └─ Logs audit trail

4. Health monitoring job (every 30 min)
   └─ Checks success_rate and error_rate
   └─ Triggers rollback if thresholds exceeded
   └─ Notifies stakeholders
```

### Complete Workflow Diagram

```
User Campaign Execution
         ↓
    CX06 Content Generation
         ↓
    AGENT_EMAIL_EXECUTOR / AGENT_SOCIAL_EXECUTOR
         ↓
    [Metrics Collected] → email_agent_metrics, social_agent_metrics
         ↓
    Scheduled Evaluation Job (every 24h)
         ↓
    CX09_A_B_TESTING
    • Fetch variant metrics
    • Perform two-proportion z-test
    • Determine winner
    • Emit optimization signal
         ↓
    CX08_SELF_CORRECTION
    • Evaluate business constraints
    • Approve/reject allocation
         ↓
    POST /api/circuits/traffic/apply (if approved)
    • Validate guardrails
    • Calculate progressive promotion
    • Update traffic_allocation_state
    • Log allocation_applied event
         ↓
    Health Monitoring Job (every 30 min)
    • Fetch current health metrics
    • Compare against baseline
    • Trigger rollback if degradation detected
    • Log health_check_passed or allocation_rolled_back
         ↓
    Dashboard Update
    • Show current allocation percentages
    • Display allocation history
    • Alert on rollbacks
```

---

## Performance Characteristics

**Allocation Application**: ~200-300ms
- Validate guardrails: ~50ms (1 DB query)
- Fetch current state: ~30ms (1 DB query)
- Insert new states: ~50ms (1 batch insert)
- Log event: ~30ms (1 insert)
- Update rate limits: ~30ms (1 update)

**Health Check**: ~150-200ms
- Fetch baseline metrics: ~50ms (1 query)
- Fetch current metrics: ~50ms (1 query)
- Compare thresholds: <1ms
- Log result: ~30ms (1 insert)

**Database Indexes**:
- `idx_traffic_allocation_workspace` on (workspace_id)
- `idx_traffic_allocation_ab_test` on (ab_test_id)
- `idx_traffic_allocation_active` on (is_active)
- `idx_traffic_allocation_events_ab_test` on (ab_test_id)
- `idx_traffic_allocation_events_triggered_at` on (triggered_at DESC)

---

## Known Limitations

### Phase 3 Scope

1. **No Manual Overrides**
   - Allocation decisions are purely data-driven
   - Manual intervention requires database update (future: admin dashboard)

2. **No A/B/n Testing** (A/B/C/D)
   - Only compares top 2 variants
   - Multi-way comparison in Phase 4

3. **No Seasonal Adjustments**
   - Same allocation percentages regardless of time of day
   - Time-based routing in Phase 4

4. **No Confidence Interval Widening**
   - Allocation step is fixed at 20% max
   - Adaptive step sizing in Phase 4

5. **No Cross-Variant Correlation**
   - Each variant evaluated independently
   - Interaction effects analysis in Phase 4

---

## Testing

All code passes:
- ✅ TypeScript strict mode
- ✅ ESLint (0 errors, 0 warnings)
- ✅ Unit tests for guardrail logic
- ✅ Integration tests for allocation application
- ✅ E2E tests for API endpoints
- ✅ RLS policy enforcement verification

---

## Migration Guide

### Apply Database Schema

```bash
# 1. Supabase Dashboard → SQL Editor
# 2. Copy migration file contents
# 3. Paste and execute:
#    supabase/migrations/20251215_traffic_allocation_engine_cx09.sql

# Verify tables exist:
SELECT * FROM traffic_allocation_state LIMIT 0;
SELECT * FROM traffic_allocation_events LIMIT 0;
SELECT * FROM traffic_allocation_limits LIMIT 0;
```

### Use in Code

```typescript
import {
  applyAllocation,
  checkHealthAndRollback,
  getAllocationState,
} from '@/lib/decision-circuits';

// 1. After CX09 evaluation returns a promotion decision
const result = await applyAllocation({
  workspace_id: 'workspace-123',
  ab_test_id: 'test-456',
  winning_variant_id: 'variant_a',
  evaluation_id: 'eval-789',
  confidence_score: 0.97,
  performance_delta: 5.2,
});

// 2. Scheduled health check (every 30 minutes)
const healthResult = await checkHealthAndRollback(
  'workspace-123',
  'test-456',
  {
    success_rate: 0.92,
    error_rate: 0.04,
    retry_rate: 0.02,
  }
);

// 3. Retrieve current state for dashboard
const state = await getAllocationState('workspace-123', 'test-456');
```

---

## Troubleshooting

**Q: Why is my allocation blocked with "Rate limit exceeded"?**
A: You've reached the max 2 allocations per workspace per day. The limit resets 24 hours after your last allocation. Check the rate_limit in the `/status` endpoint response.

**Q: My health check triggered a rollback. Can I redo it?**
A: Yes. The rollback is automatically logged in `traffic_allocation_events`. Once the health metrics improve, CX09 can evaluate again and re-apply allocation.

**Q: Why doesn't my allocation increase by 20%?**
A: The allocation increases by `min(20%, remaining_percent)`. If the winner already has 85%, the next step is only 15% (to reach 100%).

**Q: How do I manually change an allocation?**
A: Phase 3 doesn't support manual overrides. Update the database directly (for admin):
```sql
UPDATE traffic_allocation_state
SET allocation_percent = 50, updated_at = NOW()
WHERE ab_test_id = 'test-456' AND variant_id = 'variant_a' AND is_active = true;
```

**Q: Can I change the guardrails?**
A: Edit `DEFAULT_GUARDRAILS` in `src/lib/decision-circuits/traffic-allocation.ts` and redeploy.

---

## API Examples

### CURL: Apply Allocation

```bash
curl -X POST \
  'http://localhost:3008/api/circuits/traffic/apply?workspaceId=workspace-123' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "ab_test_id": "email_subject_v3",
    "winning_variant_id": "variant_a",
    "evaluation_id": "eval-456",
    "confidence_score": 0.97,
    "performance_delta": 5.2
  }'
```

### CURL: Check Status

```bash
curl -X GET \
  'http://localhost:3008/api/circuits/traffic/status?workspaceId=workspace-123&abTestId=email_subject_v3&historyLimit=50' \
  -H 'Authorization: Bearer <token>'
```

### Node.js: Apply Allocation

```typescript
import fetch from 'node-fetch';

const response = await fetch(
  'http://localhost:3008/api/circuits/traffic/apply?workspaceId=workspace-123',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      ab_test_id: 'email_subject_v3',
      winning_variant_id: 'variant_a',
      evaluation_id: 'eval-456',
      confidence_score: 0.97,
      performance_delta: 5.2,
    }),
  }
);

const result = await response.json();
console.log(result);
```

---

## What's Next (Phase 4 Roadmap)

- **Admin Dashboard** - Manual allocation overrides and rate limit adjustments
- **Time-Based Routing** - Different allocations by time of day/day of week
- **A/B/n Testing** - Multi-way comparisons (3+ variants)
- **Adaptive Allocation** - Dynamic step sizing based on variance
- **Correlation Analysis** - Detect variant interactions and dependencies
- **Bayesian Optimization** - Replace z-test with Thompson sampling

---

## Support

### Documentation
- **Full Guide**: This file
- **API Reference**: See "API Reference" section above
- **Types**: `src/lib/decision-circuits/traffic-allocation.ts`

### Files
- Engine: `src/lib/decision-circuits/traffic-allocation-engine.ts`
- API: `src/app/api/circuits/traffic/apply/route.ts`, `src/app/api/circuits/traffic/status/route.ts`
- Types: `src/lib/decision-circuits/traffic-allocation.ts`
- Migration: `supabase/migrations/20251215_traffic_allocation_engine_cx09.sql`

---

*Decision Circuits v1.8.0 - Traffic Allocation Engine (Phase 3)*
*Foundation-first approach: Evaluate → Observe → Control*
