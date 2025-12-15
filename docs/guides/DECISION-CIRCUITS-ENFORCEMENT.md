# Decision Circuits v1.1.0 - Enforcement & Production Observability

**Version**: 1.1.0
**Release Date**: 2025-12-15
**Status**: Production-ready enforcement layer

---

## Overview

Decision Circuits v1.1.0 adds mandatory enforcement governance and production health monitoring to ensure all AI calls flow through decision circuits, prevent direct model invocation, and provide real-time observability of system health.

**Key Changes**:
- ✅ Block all direct model invocations (hard fail)
- ✅ Mandatory circuit execution for all AI operations
- ✅ Production health monitoring with 3 critical checks
- ✅ Autonomous operation with escalation-only override
- ✅ Real-time enforcement violation tracking
- ✅ Deployment pre-flight verification

---

## Enforcement Architecture

```
┌─────────────────────────────────┐
│   AI Call Request              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Enforce: Validate Entrypoint    │
│ • Check call stack              │
│ • Block if not DecisionCircuit   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Execute Decision Circuit        │
│ • Route through circuit executor │
│ • Log all decisions             │
│ • Track confidence              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Monitor Production Health       │
│ • Collect metrics               │
│ • Run health checks             │
│ • Trigger actions if needed     │
└─────────────────────────────────┘
```

---

## Enforcement Rules

### Rule 1: Mandatory Circuit Execution
```typescript
// ❌ BLOCKED
const response = await openai.chat.completions.create({...});
const response = await anthropic.messages.create({...});

// ✅ ALLOWED
const result = await executeCircuit('CX06_GENERATION_EXECUTION', {...});
const result = await chainCircuits([...], context);
```

### Rule 2: Block Direct Model Calls
```typescript
// Disallowed patterns (checked at deployment):
// - openai.chat.completions.create
// - anthropic.messages.create
// - direct_prompt_execution

// All code must route through DecisionCircuitExecutor
```

### Rule 3: Generation Calls Must Reference Circuit
```typescript
// ❌ INVALID
const generated = await generateContent(prompt);

// ✅ VALID
const generated = await generateContent({
  circuit_id: 'CX06_GENERATION_EXECUTION',
  prompt: '...',
  strategy_id: '...',
});
```

---

## Production Health Checks

### DC_HEALTH_01: Circuit Success Rate
```
Metric:     Circuit execution success rate (24h window)
Threshold:  ≥ 92% success rate
Failure:    Trigger autocorrection review
Action:     Escalate to admin dashboard
```

**Why**: Ensures circuits execute reliably. Below 92% indicates systemic issues.

### DC_HEALTH_02: Self-Correction Recovery
```
Metric:     Maximum recovery cycles per strategy
Threshold:  ≤ 2 consecutive decline cycles
Failure:    Freeze strategy rotation
Action:     Escalate and prevent auto-correction
```

**Why**: Limits thrashing. 3+ cycles means strategy is broken.

### DC_HEALTH_03: Brand Guard Compliance
```
Metric:     Brand guard violation rate (7d window)
Threshold:  ≤ 1% violation rate
Failure:    Tighten guard constraints
Action:     Escalate and increase strictness
```

**Why**: Ensures brand safety. >1% violates compliance.

---

## API Endpoints

### Health Status
```bash
GET /api/circuits/health?workspaceId=<id>
```

Returns current health metrics (circuits, autonomy, compliance).

### Circuit Snapshot
```bash
GET /api/circuits/health?workspaceId=<id>&action=circuit_snapshot&circuitId=CX01&days=30
```

Get specific circuit health for 30-day window.

### Production Health Check
```bash
GET /api/circuits/health?workspaceId=<id>&action=production_health
```

Run all health checks and show status.

### Full Health Report
```bash
GET /api/circuits/health?workspaceId=<id>&action=report
```

Generate comprehensive report with recommendations.

### Run Monitoring
```bash
POST /api/circuits/health?workspaceId=<id>&action=run_monitoring
```

Execute full monitoring cycle (checks + actions).

### Pre-flight Check
```bash
POST /api/circuits/health?workspaceId=<id>&action=preflight_check
```

Verify deployment readiness.

---

## Enforcement Violations

### Violation Types

| Violation | Severity | Action |
|-----------|----------|--------|
| Invalid Entrypoint | Critical | Hard fail + log |
| Direct Model Call | Critical | Block + audit |
| Missing Circuit Reference | High | Reject + log |
| Audit Logging Disabled | Critical | Prevent merge |

### Handling Violations

```typescript
import { EnforcementViolationError } from '@/lib/decision-circuits';

try {
  // AI operation
} catch (error) {
  if (error instanceof EnforcementViolationError) {
    // Log violation
    await logEnforcementEvent(workspaceId, 'violation', {
      type: error.violation_type,
      details: error.details,
    });

    // Escalate to admin
    // Prevent operation
  }
}
```

---

## Autonomy Lock (Production Behavior)

**Autonomy Mode**: ENABLED (fully autonomous)
- Self-correction authority: CX08_SELF_CORRECTION
- Manual override required: NO
- Escalation-only policy: YES

**Self-Correction Rules**:
1. Strategy rotates automatically after 3 cycles of decline
2. No human review needed for routine corrections
3. Escalate only if: Correction fails OR metrics regress
4. Escalation goes to admin dashboard only

**Disabled Behaviors**:
- ❌ Require manual approval for rotations
- ❌ Require human review for every correction
- ❌ Require override codes

---

## Production Observability

### Metrics Exported

```json
{
  "timestamp": "2025-12-15T10:30:00Z",
  "workspace_id": "workspace-123",
  "metrics": {
    "circuits.success_rate": 0.96,
    "circuits.avg_latency_ms": 245,
    "circuits.avg_confidence": 0.89,
    "autonomy.autocorrections_24h": 3,
    "autonomy.escalations_24h": 0,
    "autonomy.rotations_24h": 1,
    "compliance.brand_violation_rate_7d": 0.005,
    "system.healthy": 1
  }
}
```

### Health Dashboard

Dashboard located at `/admin/circuits/health` shows:
- System health status (healthy/unhealthy)
- Per-circuit success rates
- Autonomy activity (corrections, rotations, escalations)
- Compliance metrics (brand violations)
- Critical issues with recommendations
- Recent enforcement events

---

## Deployment Pre-flight Checklist

### Required Tables
- [x] circuit_execution_logs (audit trail)
- [x] circuit_strategy_states (strategy state)
- [x] circuit_autocorrection_logs (autonomy actions)
- [x] circuit_enforcement_logs (enforcement events)
- [x] circuit_health_checks (health snapshots)
- [x] circuit_performance_baseline (baselines)

### Enforcement Status
- [x] require_decision_circuit_for_ai_calls = true
- [x] block_direct_model_invocation = true
- [x] Allowed entrypoints configured
- [x] Violation behavior = hard_fail_with_audit_log

### Autonomy Configuration
- [x] manual_override_required = false
- [x] self_healing_authority = [CX08_SELF_CORRECTION]
- [x] Escalation policy configured

### Run Pre-flight Check
```bash
curl -X POST "http://localhost:3008/api/circuits/health?workspaceId=test&action=preflight_check"
```

---

## Integration Points

### Synthex Integration
All Synthex content generation must reference circuits:

```typescript
// In Synthex generation path
import { executeCircuit } from '@/lib/decision-circuits';

export async function generateContent(request) {
  // Must include circuit_id
  if (!request.circuit_id) {
    throw new EnforcementViolationError(
      'MISSING_CIRCUIT_REFERENCE',
      { request },
      'Synthex generation must specify circuit_id'
    );
  }

  return executeCircuit(
    request.circuit_id,
    request.inputs,
    context,
    execute
  );
}
```

### Email Agent Integration
```typescript
import {
  executeCircuit,
  validateEntrypoint,
} from '@/lib/decision-circuits';

export async function processEmail(email) {
  validateEntrypoint(new Error().stack || '');

  return chainCircuits([
    { circuitId: 'CX01', ... },
    { circuitId: 'CX02', ... },
  ], context);
}
```

### Orchestrator Integration
```typescript
import {
  executeCircuit,
  runHealthMonitoring,
} from '@/lib/decision-circuits';

export async function orchestrateWorkflow(campaign) {
  // Run workflow through circuits
  const result = await chainCircuits([...], context);

  // Monitor health after workflow
  const monitoring = await runHealthMonitoring(workspaceId);
  if (!monitoring.metrics.system_healthy) {
    // Handle issues
  }

  return result;
}
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

```sql
-- Circuit health
SELECT
  circuit_id,
  COUNT(*) as executions,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate,
  AVG(latency_ms) as avg_latency,
  AVG(confidence_score) as avg_confidence
FROM circuit_execution_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY circuit_id;

-- Enforcement events
SELECT event_type, COUNT(*) FROM circuit_enforcement_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type;

-- Health status
SELECT * FROM circuit_recent_health
WHERE workspace_id = 'workspace-123'
LIMIT 1;
```

### Alert Conditions

| Condition | Action |
|-----------|--------|
| Success rate < 92% | Page on-call |
| Recovery cycles > 2 | Page on-call |
| Violations > 5/24h | Page on-call |
| System unhealthy | Email team |

---

## Troubleshooting

### "Enforcement violation: Invalid entrypoint"

**Cause**: AI call not coming from DecisionCircuitExecutor

**Fix**:
```typescript
// Wrong
const response = await model.generate(prompt);

// Correct
import { executeCircuit } from '@/lib/decision-circuits';
const response = await executeCircuit('CX06_GENERATION_EXECUTION', {...});
```

### "Health check failed: Success rate below threshold"

**Cause**: Circuit execution failing > 8% of the time

**Fix**:
1. Check `circuit_execution_logs` for errors
2. Review error messages and decision paths
3. Identify failing circuit
4. Fix circuit logic or inputs
5. Monitor recovery

### "Brand guard violations exceed 1%"

**Cause**: Constraint violations increasing

**Fix**:
1. Review brand rules in CX05 inputs
2. Check constraint definitions
3. Tighten guard parameters
4. Test with sample content
5. Monitor improvement

---

## v1.0 → v1.1.0 Migration

If upgrading from v1.0:

### Step 1: Apply New Migration
```bash
# Supabase → SQL Editor
# Run: supabase/migrations/20251215_decision_circuits_enforcement_v1_1.sql
```

### Step 2: Update Code Imports
```typescript
// Old (v1.0)
import { executeCircuit } from '@/lib/decision-circuits';

// New (v1.1.0)
import {
  executeCircuit,
  validateEntrypoint,
  checkProductionHealth,
  runHealthMonitoring,
} from '@/lib/decision-circuits';
```

### Step 3: Add Enforcement Checks
```typescript
export async function myAIFunction() {
  // Add validation
  validateEntrypoint(new Error().stack || '');

  // Continue with circuit execution
}
```

### Step 4: Run Pre-flight Check
```bash
POST /api/circuits/health?action=preflight_check
```

---

## FAQ

**Q: Can I still call models directly?**
A: No. All AI calls must go through Decision Circuits in v1.1.0. Enforcement is hard-fail.

**Q: What if strategy rotation is frozen?**
A: Strategy won't rotate until metrics improve. Admin dashboard shows reason. Monitor and fix root cause.

**Q: Can I disable health checks?**
A: No. Health checks run continuously. You can adjust thresholds but not disable.

**Q: What happens on deployment if requirements not met?**
A: Pre-flight check will fail. See issues and fix before deploying.

**Q: Can I override autonomy decisions?**
A: Only via admin dashboard. Manual overrides are logged as enforcement events.

---

## Support

See [DECISION-CIRCUITS-GUIDE.md](DECISION-CIRCUITS-GUIDE.md) for full API reference.

File issues at: GitHub Issues with tag `decision-circuits-enforcement`
