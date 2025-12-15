# Decision Circuits - Quick Reference Card

## Branch Info
- **Branch Name**: `Decision_Circuits`
- **Latest Commit**: `da932f5c` (2025-12-15)
- **Status**: ✅ Ready for testing & integration

---

## 8 Decision Circuits

| ID | Name | Category | Purpose |
|----|------|----------|---------|
| CX01 | Intent Detection | Detection | Extract marketing intent |
| CX02 | Audience Classification | Classification | Select target segment |
| CX03 | State Memory Retrieval | State Memory | Access prior strategies |
| CX04 | Strategy Selection | Decision | Choose content strategy |
| CX05 | Brand Guard | Constraint | Enforce brand/compliance |
| CX06 | Generation Execution | Generation | Generate marketing asset |
| CX07 | Engagement Evaluation | Feedback | Measure performance |
| CX08 | Self-Correction | Autonomy | Auto-rotate strategies |

---

## API Quick Reference

### Execute Single Circuit
```bash
POST /api/circuits/execute?workspaceId=<id>
Body: { "circuitId": "CX01", "clientId": "c123", "inputs": {...} }
```

### Chain Circuits
```bash
PUT /api/circuits/execute?workspaceId=<id>
Body: { "clientId": "c123", "circuits": [...] }
```

### Get Audit History
```bash
GET /api/circuits/audit?workspaceId=<id>&clientId=<id>&limit=100
```

### Check Strategy Health
```bash
POST /api/circuits/autonomy?workspaceId=<id>
Body: { "clientId": "c123", "audienceSegment": "enterprise" }
```

### Autonomy Dashboard
```bash
GET /api/circuits/autonomy?workspaceId=<id>&days=30
```

### Update Metrics
```bash
PATCH /api/circuits/autonomy?workspaceId=<id>
Body: { "clientId": "c123", "audienceSegment": "e", "engagementScore": 0.65, "conversionScore": 0.32 }
```

---

## Core Imports

```typescript
// Registry & Definitions
import {
  DECISION_CIRCUITS,
  getCircuit,
  getCircuitsByCategory,
  validateCircuitInputs,
} from '@/lib/decision-circuits';

// Executor
import {
  executeCircuit,
  chainCircuits,
  getCircuitExecutionHistory,
  getCircuitMetrics,
} from '@/lib/decision-circuits';

// Autonomy
import {
  evaluateStrategyHealth,
  executeAutoCorrection,
  updateStrategyMetrics,
  getAutonomyDashboard,
} from '@/lib/decision-circuits/autonomy';
```

---

## Autonomy Rules (Self-Correction)

### Strategy Rotation
- **Trigger**: Engagement < 80% baseline for 3 consecutive cycles
- **Action**: Auto-select next best strategy
- **Logged**: With confidence score and reason

### Escalation
- **Trigger**: No strategies available OR confidence < 50%
- **Action**: Create admin notification
- **Logged**: In autocorrection_logs

### Confidence Thresholds
- **High** (>0.85) → Execute immediately
- **Medium** (0.5-0.85) → Log and monitor
- **Low** (<0.5) → Escalate to admin

---

## Database Tables

```sql
-- Execution audit trail
SELECT * FROM circuit_execution_logs
WHERE workspace_id = '...'
ORDER BY timestamp DESC;

-- Current strategy state
SELECT * FROM circuit_strategy_states
WHERE client_id = '...' AND audience_segment = '...';

-- Auto-corrections made
SELECT * FROM circuit_autocorrection_logs
WHERE workspace_id = '...'
ORDER BY timestamp DESC;

-- Available strategies
SELECT * FROM content_strategies
WHERE audience_segment = '...';
```

---

## File Locations

```
src/lib/decision-circuits/
├── registry.ts          ← Circuit definitions
├── executor.ts          ← Execution engine
├── autonomy.ts          ← Self-correction
└── index.ts             ← Exports

src/app/api/circuits/
├── execute/route.ts     ← Execution endpoints
├── audit/route.ts       ← Audit endpoints
└── autonomy/route.ts    ← Health endpoints

supabase/migrations/
└── 20251215_decision_circuits_init.sql ← Schema

docs/
├── guides/DECISION-CIRCUITS-GUIDE.md
├── circuits/DECISION-CIRCUITS-SPEC.json
└── (root) DECISION_CIRCUITS_SUMMARY.md
```

---

## Integration Checklist

- [ ] Apply database migration (Supabase Dashboard)
- [ ] Run tests: `npm run test`
- [ ] Integrate Email Agent (CX01-CX03)
- [ ] Integrate Content Agent (CX04-CX06)
- [ ] Integrate Orchestrator (all circuits)
- [ ] Create dashboard UI components
- [ ] Load test (target < 500ms)
- [ ] Deploy to staging
- [ ] Create PR to main

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Success Rate | > 95% |
| Avg Latency | < 500ms |
| Avg Confidence | > 0.85 |
| Engagement Lift | > 20% |

---

## Troubleshooting

**Circuit failing?**
```bash
GET /api/circuits/audit?workspaceId=<id>&clientId=<id>&circuitId=CX01
# Check: inputs, error message, decision path
```

**Strategy not rotating?**
```bash
SELECT * FROM circuit_strategy_states
WHERE client_id = '...' ORDER BY updated_at DESC;
# Verify: engagement scores updating, decline_cycles incrementing
```

**Escalation loop?**
```bash
SELECT * FROM circuit_autocorrection_logs
WHERE action_type = 'escalate_to_admin' ORDER BY timestamp DESC;
# Solutions: Add more strategies, raise confidence thresholds
```

---

## Key Features Summary

✅ **No Black-Box** — All decisions explainable
✅ **Traceable** — Complete audit trail (365 days)
✅ **Autonomous** — Self-heals without human review
✅ **Secure** — Row-level security + encryption
✅ **Performant** — < 500ms latency target
✅ **Scalable** — Multi-tenant ready

---

## Questions?

See full documentation:
- **Implementation Guide**: `docs/guides/DECISION-CIRCUITS-GUIDE.md`
- **Formal Spec**: `docs/circuits/DECISION-CIRCUITS-SPEC.json`
- **Implementation Overview**: `DECISION_CIRCUITS_SUMMARY.md`

Or check audit trail: `GET /api/circuits/audit`
