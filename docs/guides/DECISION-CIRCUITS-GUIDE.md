# Decision Circuits System

## Overview

**Decision Circuits** is an autonomous decision governance framework that enables zero-frontline-staff marketing operations. All AI actions flow through registered circuits with full traceability, self-correction, and audit compliance.

**Core Principles**:
- ✅ No black-box decisions — All actions are explainable
- ✅ Decisions are first-class objects — Logged, auditable, recoverable
- ✅ Self-correction over human intervention — Autonomy by default
- ✅ Full traceability — Every decision path is recorded

---

## Architecture

```
User Input → Circuit Registry → Circuit Executor → Decision Path → Database Audit Trail
                                      ↓
                            Self-Correction Engine
```

### 8 Core Decision Circuits

| Circuit | Category | Purpose | Inputs | Failure Mode |
|---------|----------|---------|--------|--------------|
| **CX01** | Detection | Detect marketing intent | business_profile, campaign_goal | Fallback to last successful |
| **CX02** | Classification | Select audience segment | detected_intent, location, industry | Default to primary segment |
| **CX03** | State Memory | Retrieve prior strategies | client_id, audience_segment | Proceed without state |
| **CX04** | Decision | Choose content strategy | intent, segment, prior_strategy | Rotate to alternate |
| **CX05** | Constraint | Brand/compliance guard | draft_content, brand_rules | Auto-rewrite with penalty |
| **CX06** | Generation | Generate marketing asset | strategy_id, approved_content | Regenerate, lower creativity |
| **CX07** | Feedback | Measure performance | final_asset, platform_metrics | Mark as neutral |
| **CX08** | Autonomy | Self-correct if declining | engagement_score, baseline | Escalate to admin |

---

## API Reference

### Execute Single Circuit

```bash
POST /api/circuits/execute?workspaceId=<id>
```

**Request**:
```json
{
  "circuitId": "CX01_INTENT_DETECTION",
  "clientId": "client-123",
  "inputs": {
    "business_profile": "SaaS B2B",
    "campaign_goal": "Lead generation",
    "historical_context": {...}
  }
}
```

**Response**:
```json
{
  "circuit_id": "CX01_INTENT_DETECTION",
  "execution_id": "1702569600000_abc123",
  "success": true,
  "data": {
    "detected_intent": "lead_generation"
  },
  "decision_trace": ["ENTER:CX01_INTENT_DETECTION", "SUCCESS:CX01_INTENT_DETECTION"]
}
```

### Chain Multiple Circuits

```bash
PUT /api/circuits/execute?workspaceId=<id>
```

**Request**:
```json
{
  "clientId": "client-123",
  "circuits": [
    {
      "circuitId": "CX01_INTENT_DETECTION",
      "inputs": { "business_profile": "SaaS B2B" }
    },
    {
      "circuitId": "CX02_AUDIENCE_CLASSIFICATION",
      "inputs": { "location": "US", "industry": "Tech" }
    },
    {
      "circuitId": "CX04_CONTENT_STRATEGY_SELECTION",
      "inputs": {}
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "execution_id": "1702569600000_abc123",
  "results": [
    {
      "circuit_id": "CX01_INTENT_DETECTION",
      "success": true,
      "decision_trace": [...]
    },
    ...
  ],
  "final_output": {
    "detected_intent": "lead_generation",
    "audience_segment": "enterprise",
    "content_strategy_id": "strategy-456"
  },
  "total_decision_path": [...]
}
```

### Get Execution History

```bash
GET /api/circuits/audit?workspaceId=<id>&clientId=<id>&circuitId=<id>&limit=100&days=30
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "client_id": "client-123",
  "circuit_id": "CX01_INTENT_DETECTION",
  "execution_history": [
    {
      "circuit_id": "CX01_INTENT_DETECTION",
      "execution_id": "1702569600000_abc123",
      "timestamp": "2025-12-15T10:30:00Z",
      "success": true,
      "latency_ms": 245,
      "confidence_score": 0.95,
      "decision_path": ["ENTER:CX01", "SUCCESS:CX01"]
    }
  ],
  "metrics": {
    "total_executions": 150,
    "success_rate": 0.98,
    "avg_latency_ms": 212,
    "error_count": 3
  }
}
```

### Evaluate Strategy Health

```bash
POST /api/circuits/autonomy?workspaceId=<id>
```

**Request**:
```json
{
  "clientId": "client-123",
  "audienceSegment": "enterprise"
}
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "client_id": "client-123",
  "audience_segment": "enterprise",
  "needs_correction": true,
  "health_status": {
    "needs_correction": true,
    "reason": "Engagement declined for 3 cycles (current: 0.42, baseline: 0.68)",
    "confidence": 0.95,
    "action_type": "rotate_strategy"
  },
  "current_metrics": {
    "engagement_score": 0.42,
    "conversion_score": 0.18,
    "cycle_count": 42,
    "decline_cycles": 3
  },
  "correction_result": {
    "success": true,
    "new_strategy_id": "strategy-789",
    "log_id": "correction_1702569600000_abc123"
  }
}
```

### Update Strategy Metrics

```bash
PATCH /api/circuits/autonomy?workspaceId=<id>
```

**Request**:
```json
{
  "clientId": "client-123",
  "audienceSegment": "enterprise",
  "engagementScore": 0.65,
  "conversionScore": 0.32
}
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "client_id": "client-123",
  "audience_segment": "enterprise",
  "message": "Metrics updated",
  "updated_metrics": {
    "engagement_score": 0.65,
    "conversion_score": 0.32
  },
  "health_status": {
    "needs_correction": false,
    "reason": "Strategy performing within baseline"
  }
}
```

### Autonomy Dashboard

```bash
GET /api/circuits/autonomy?workspaceId=<id>&action=dashboard&days=30
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "days": 30,
  "summary": {
    "total_corrections": 12,
    "successful_rotations": 10,
    "escalations": 2,
    "avg_correction_confidence": 0.89
  },
  "strategy_states": [
    {
      "client_id": "client-123",
      "audience_segment": "enterprise",
      "strategy_id": "strategy-456",
      "engagement_score": 0.65,
      "conversion_score": 0.32,
      "cycle_count": 42,
      "decline_cycles": 0,
      "updated_at": "2025-12-15T10:30:00Z"
    }
  ]
}
```

---

## Database Schema

### circuit_execution_logs
Full audit trail of all circuit executions with decision paths.

```sql
SELECT
  circuit_id,
  execution_id,
  timestamp,
  success,
  latency_ms,
  confidence_score,
  decision_path,
  inputs,
  outputs
FROM circuit_execution_logs
WHERE workspace_id = 'workspace-123'
ORDER BY timestamp DESC;
```

### circuit_strategy_states
Current state of strategies with performance metrics.

```sql
SELECT
  client_id,
  audience_segment,
  strategy_id,
  engagement_score,
  conversion_score,
  cycle_count,
  decline_cycles,
  last_rotated_at
FROM circuit_strategy_states
WHERE workspace_id = 'workspace-123';
```

### circuit_autocorrection_logs
Log of all autonomous corrections with action details.

```sql
SELECT
  log_id,
  action_type,
  previous_strategy_id,
  new_strategy_id,
  reason,
  confidence,
  timestamp
FROM circuit_autocorrection_logs
WHERE workspace_id = 'workspace-123'
ORDER BY timestamp DESC;
```

---

## Implementing Custom Circuits

### 1. Define Circuit in Registry

```typescript
// src/lib/decision-circuits/registry.ts
export const DECISION_CIRCUITS: Record<string, DecisionCircuit> = {
  CX09_CUSTOM_CIRCUIT: {
    circuit_id: 'CX09_CUSTOM_CIRCUIT',
    category: 'decision',
    purpose: 'Your circuit purpose',
    inputs: ['input1', 'input2'],
    outputs: ['output1'],
    model_usage: 'decision_only',
    failure_mode: 'rotate_to_alternate',
    success_metric: 'your_metric',
  },
};
```

### 2. Create Circuit Executor

```typescript
// src/lib/circuits/custom-circuit.ts
import { executeCircuit, type CircuitExecutionContext } from '@/lib/decision-circuits';

export async function executeCustomCircuit(
  inputs: CircuitInput,
  context: CircuitExecutionContext
) {
  return executeCircuit(
    'CX09_CUSTOM_CIRCUIT',
    inputs,
    context,
    async (circuitInputs) => {
      // Your logic here
      const result = {
        output1: 'value',
      };
      return result;
    }
  );
}
```

### 3. Use in API Route or Agent

```typescript
// src/app/api/my-endpoint/route.ts
import { executeCustomCircuit } from '@/lib/circuits/custom-circuit';

export const POST = async (req: NextRequest) => {
  const context: CircuitExecutionContext = {
    workspace_id: workspaceId,
    client_id: clientId,
    request_id: generateId(),
    user_id: userId,
  };

  const result = await executeCustomCircuit(
    { input1: 'value1', input2: 'value2' },
    context
  );

  return successResponse(result);
};
```

---

## Self-Correction Rules

### Strategy Rotation Trigger

Rotate strategy automatically when:
- Engagement declines for **3 consecutive cycles**
- Decline = current score < 80% of historical baseline
- Automatic selection of next best-performing strategy
- Logged with confidence score and reason

### Escalation Trigger

Escalate to admin when:
- No alternative strategies available
- Circuit execution fails repeatedly
- Confidence score falls below 50%
- Creates notification in admin dashboard

### Confidence Thresholds

| Scenario | Threshold | Action |
|----------|-----------|--------|
| High confidence | > 0.85 | Auto-correct immediately |
| Medium confidence | 0.5-0.85 | Log and monitor |
| Low confidence | < 0.5 | Escalate to admin |

---

## Audit & Compliance

### What's Logged

- ✅ All circuit executions with timestamps
- ✅ Input/output data
- ✅ Decision path (sequence of circuits)
- ✅ Execution latency
- ✅ Success/failure status
- ✅ Error messages
- ✅ Confidence scores

### Retention Policy

- **All logs**: Retained for 365 days
- **Sensitive data**: Encrypted at rest
- **Access**: Restricted to workspace users (RLS)

### Traceability Example

```json
{
  "execution_id": "1702569600000_abc123",
  "decision_path": [
    "ENTER:CX01_INTENT_DETECTION",
    "SUCCESS:CX01_INTENT_DETECTION",
    "ENTER:CX02_AUDIENCE_CLASSIFICATION",
    "SUCCESS:CX02_AUDIENCE_CLASSIFICATION",
    "ENTER:CX04_CONTENT_STRATEGY_SELECTION",
    "SUCCESS:CX04_CONTENT_STRATEGY_SELECTION",
    "ENTER:CX05_BRAND_GUARD",
    "SUCCESS:CX05_BRAND_GUARD",
    "ENTER:CX06_GENERATION_EXECUTION",
    "SUCCESS:CX06_GENERATION_EXECUTION"
  ],
  "timestamp": "2025-12-15T10:30:00Z",
  "latency_ms": 1245,
  "success": true
}
```

---

## Best Practices

### ✅ Do

- Always provide complete inputs to circuits
- Chain circuits for complex workflows
- Monitor autonomy dashboard regularly
- Set appropriate confidence thresholds
- Review escalated decisions in admin panel

### ❌ Don't

- Call circuits with missing required inputs
- Bypass circuit execution for "speed"
- Ignore low-confidence decisions
- Disable RLS on audit tables
- Manually modify execution logs

---

## Troubleshooting

### Circuit Always Failing

```bash
# Check execution history
GET /api/circuits/audit?workspaceId=<id>&clientId=<id>&circuitId=<id>

# Look for:
# - Missing inputs
# - Invalid input format
# - Downstream dependency failures
```

### Strategy Not Rotating

```bash
# Check strategy state
SELECT * FROM circuit_strategy_states
WHERE client_id = 'client-123'
AND audience_segment = 'enterprise'
ORDER BY updated_at DESC;

# Verify:
# - Engagement scores are being updated
# - decline_cycles is incrementing
# - Historical baseline exists
```

### Escalation Loop

```bash
# Check autocorrection logs
SELECT * FROM circuit_autocorrection_logs
WHERE client_id = 'client-123'
AND action_type = 'escalate_to_admin'
ORDER BY timestamp DESC
LIMIT 10;

# Resolve:
# - Add more content strategies
# - Review escalation rule conditions
# - Increase confidence thresholds
```

---

## Integration Examples

### With Email Agent

```typescript
// src/lib/agents/email-agent.ts
import { chainCircuits } from '@/lib/decision-circuits';

export async function processEmailWithCircuits(
  email: Email,
  context: CircuitExecutionContext
) {
  return chainCircuits([
    {
      circuitId: 'CX01_INTENT_DETECTION',
      inputs: { business_profile: email.sender, campaign_goal: email.subject },
      execute: detectIntent,
    },
    {
      circuitId: 'CX02_AUDIENCE_CLASSIFICATION',
      inputs: { location: email.location, industry: email.industry },
      execute: classifyAudience,
    },
    {
      circuitId: 'CX04_CONTENT_STRATEGY_SELECTION',
      inputs: {},
      execute: selectStrategy,
    },
  ], context);
}
```

### With Content Generation

```typescript
// src/lib/agents/content-agent.ts
import { executeCircuit } from '@/lib/decision-circuits';

export async function generateWithCircuits(
  strategy: Strategy,
  context: CircuitExecutionContext
) {
  const validation = await executeCircuit(
    'CX05_BRAND_GUARD',
    { draft_content: strategy.template, brand_rules: context.brand_rules },
    context,
    validateBrand
  );

  if (!validation.success) {
    throw new Error(`Brand validation failed: ${validation.error}`);
  }

  return executeCircuit(
    'CX06_GENERATION_EXECUTION',
    { content_strategy_id: strategy.id, approved_content: validation.data },
    context,
    generateAsset
  );
}
```

---

## Metrics & KPIs

Monitor these circuit-level metrics:

```sql
SELECT
  circuit_id,
  COUNT(*) as total_executions,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate,
  AVG(latency_ms) as avg_latency,
  AVG(confidence_score) as avg_confidence,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as error_count
FROM circuit_execution_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY circuit_id
ORDER BY success_rate DESC;
```

Expected targets:
- **Success Rate**: > 95%
- **Avg Latency**: < 500ms
- **Avg Confidence**: > 0.85
- **Error Count**: < 5% of executions

---

## Support & Feedback

For issues or feature requests:
1. Check execution logs: `/api/circuits/audit`
2. Review autonomy dashboard: `/api/circuits/autonomy`
3. File issue on GitHub with decision path trace
