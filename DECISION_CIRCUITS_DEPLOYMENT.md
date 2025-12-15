# Decision Circuits - Deployment & Integration Checklist

**Branch**: `Decision_Circuits`
**Status**: ✅ Ready for testing & integration
**Latest Commit**: `7bbb3cf1`
**Date**: 2025-12-15

---

## Pre-Deployment Verification

- [x] Core circuit library implemented (src/lib/decision-circuits/)
- [x] API endpoints created (src/app/api/circuits/)
- [x] Database migration written (supabase/migrations/)
- [x] Documentation complete (docs/guides/ + docs/circuits/)
- [x] TypeScript compilation passes
- [x] Code formatted with ESLint

---

## Step 1: Apply Database Migration

### Supabase Cloud Console
```
1. Log in to https://app.supabase.com
2. Select project
3. Go to SQL Editor
4. Create new query
5. Paste contents of: supabase/migrations/20251215_decision_circuits_init.sql
6. Click "Run"
7. Verify: 4 new tables created with RLS policies
```

### Verify Tables Created
```sql
-- In Supabase SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('circuit_execution_logs', 'circuit_strategy_states', 'circuit_autocorrection_logs', 'content_strategies')
ORDER BY table_name;

-- Should return 4 rows
```

---

## Step 2: Test Core Functionality

### Unit Tests
```bash
npm run test -- src/lib/decision-circuits

# Expected: All tests pass
# Coverage: Registry, Executor, Autonomy modules
```

### Type Checking
```bash
npm run typecheck

# Expected: No TypeScript errors in decision-circuits code
```

### Lint Validation
```bash
npm run lint -- src/lib/decision-circuits

# Expected: No linting issues
```

---

## Step 3: Test API Endpoints

### Local Testing (Port 3008)
```bash
npm run dev

# In another terminal, test endpoints:
```

### Test Execute Circuit
```bash
curl -X POST "http://localhost:3008/api/circuits/execute?workspaceId=test-workspace" \
  -H "Content-Type: application/json" \
  -d '{
    "circuitId": "CX01_INTENT_DETECTION",
    "clientId": "test-client",
    "inputs": {
      "business_profile": "SaaS B2B",
      "campaign_goal": "Lead generation",
      "historical_context": {}
    }
  }'

# Expected Response: 200 OK with execution_id and decision_trace
```

### Test Audit Endpoint
```bash
curl -X GET "http://localhost:3008/api/circuits/audit?workspaceId=test-workspace&clientId=test-client&limit=10"

# Expected Response: 200 OK with execution_history array
```

### Test Autonomy Endpoint
```bash
curl -X GET "http://localhost:3008/api/circuits/autonomy?workspaceId=test-workspace&days=30"

# Expected Response: 200 OK with autonomy dashboard data
```

---

## Step 4: Verify Multi-Tenant Isolation

```sql
-- As workspace 1
SELECT COUNT(*) FROM circuit_execution_logs;  -- Should see only workspace 1 data

-- As workspace 2
SELECT COUNT(*) FROM circuit_execution_logs;  -- Should see only workspace 2 data
```

Expected: RLS policies enforce workspace isolation automatically

---

## Step 5: Integration with Email Agent

### File: `src/lib/agents/email-agent.ts`

```typescript
import { chainCircuits } from '@/lib/decision-circuits';

export async function processEmailWithCircuits(email: Email, context) {
  return chainCircuits([
    {
      circuitId: 'CX01_INTENT_DETECTION',
      inputs: {
        business_profile: email.sender_domain,
        campaign_goal: extractGoal(email.subject),
        historical_context: email.history,
      },
      execute: detectIntentLogic,
    },
    {
      circuitId: 'CX02_AUDIENCE_CLASSIFICATION',
      inputs: {
        location: email.sender_location,
        industry: email.sender_industry,
      },
      execute: classifyAudienceLogic,
    },
    {
      circuitId: 'CX03_STATE_MEMORY_RETRIEVAL',
      inputs: {}, // Uses outputs from previous circuits
      execute: retrieveStateLogic,
    },
  ], context);
}
```

**Verification**:
```bash
# Run email agent tests
npm run test -- src/lib/agents/email-agent.test.ts

# Expected: Circuits integrate without errors
```

---

## Step 6: Integration with Content Agent

### File: `src/lib/agents/content-agent.ts`

```typescript
import { executeCircuit, chainCircuits } from '@/lib/decision-circuits';

export async function generateWithCircuits(strategy, context) {
  // CX05 - Brand Guard
  const validation = await executeCircuit(
    'CX05_BRAND_GUARD',
    {
      draft_content: strategy.template,
      brand_rules: context.brand_rules,
    },
    context,
    validateBrandLogic
  );

  if (!validation.success) {
    throw new Error(`Brand validation failed`);
  }

  // CX06 - Generate Asset
  return chainCircuits([
    {
      circuitId: 'CX04_CONTENT_STRATEGY_SELECTION',
      inputs: { audience_segment: context.segment },
      execute: selectStrategyLogic,
    },
    {
      circuitId: 'CX06_GENERATION_EXECUTION',
      inputs: { approved_content: validation.data },
      execute: generateAssetLogic,
    },
  ], context);
}
```

**Verification**:
```bash
# Run content agent tests
npm run test -- src/lib/agents/content-agent.test.ts

# Expected: Brand guard validates, generation succeeds
```

---

## Step 7: Integration with Orchestrator

### File: `src/lib/agents/orchestrator.ts`

```typescript
import { chainCircuits } from '@/lib/decision-circuits';

export async function orchestrateMarketingWorkflow(campaign, context) {
  const result = await chainCircuits([
    { circuitId: 'CX01_INTENT_DETECTION', ... },
    { circuitId: 'CX02_AUDIENCE_CLASSIFICATION', ... },
    { circuitId: 'CX03_STATE_MEMORY_RETRIEVAL', ... },
    { circuitId: 'CX04_CONTENT_STRATEGY_SELECTION', ... },
    { circuitId: 'CX05_BRAND_GUARD', ... },
    { circuitId: 'CX06_GENERATION_EXECUTION', ... },
    { circuitId: 'CX07_ENGAGEMENT_EVALUATION', ... },
    { circuitId: 'CX08_SELF_CORRECTION', ... },
  ], context);

  return result;
}
```

**Verification**:
```bash
# Run orchestrator tests
npm run test -- src/lib/agents/orchestrator.test.ts

# Expected: Full workflow executes without errors
```

---

## Step 8: Load Testing

### Performance Benchmarks
```bash
# Single circuit execution (target: < 500ms)
npm run test -- --bench src/lib/decision-circuits/executor.bench.ts

# Chain 5 circuits (target: < 2.5s)
# Chain 8 circuits (target: < 4s)
```

Expected latency:
- Single circuit: 100-300ms
- Chain of 5: 500-1500ms
- Chain of 8: 800-2400ms

---

## Step 9: Staging Deployment

### Push Branch
```bash
git push origin Decision_Circuits
```

### Create Pull Request
```
Title: "feat: Introduce Decision Circuits - Autonomous Decision Governance"
Target: main
Description: Use content from DECISION_CIRCUITS_SUMMARY.md
```

### Code Review Checklist
- [ ] Circuit registry complete with all 8 circuits
- [ ] Executor properly logs all decisions
- [ ] Autonomy system implements 3-cycle rotation rule
- [ ] RLS policies enforce multi-tenant isolation
- [ ] API endpoints properly validate inputs
- [ ] Database migration is idempotent
- [ ] Documentation is comprehensive
- [ ] Tests pass (npm run test)
- [ ] Type checking passes (npm run typecheck)
- [ ] Linting passes (npm run lint)

### Deploy to Staging
```bash
# Using your deployment system
deploy --env staging --branch Decision_Circuits

# Verify in staging:
curl https://staging.example.com/api/circuits/autonomy?workspaceId=test
```

---

## Step 10: Production Rollout Plan

### Pre-Production
- [ ] Run full test suite in staging
- [ ] Perform 24-hour stability test
- [ ] Monitor error rates
- [ ] Verify all 6 API endpoints respond < 500ms
- [ ] Validate RLS policies with test tenants

### Canary Deployment (10% traffic)
```
Day 1: 10% of new circuit requests
Monitor: Error rates, latency, auto-correction triggers
Success Criteria: Error rate < 1%, Latency < 500ms
```

### Full Rollout (100% traffic)
```
Day 2-3: Gradual increase to 100%
Monitor: Dashboard data, autonomy metrics
Success Criteria: All circuits operating normally
```

### Monitoring Dashboard
Create dashboard tracking:
- Circuit success rates per circuit
- Auto-correction frequency
- Escalation count
- Average latency
- Confidence score distribution

---

## Step 11: Admin Dashboard Setup

### Dashboard Location
```
Path: /admin/circuits/autonomy
Components:
- Summary cards (total corrections, escalations, avg confidence)
- Strategy states table (client, segment, engagement, conversion)
- Execution history timeline
- Auto-correction logs with action details
```

### Create Dashboard Component
```typescript
// src/app/(client)/admin/circuits/page.tsx
import { AutonomyDashboard } from '@/components/circuits/autonomy-dashboard';

export default function CircuitsDashboard() {
  return <AutonomyDashboard />;
}
```

---

## Step 12: Monitoring & Alerting

### Key Metrics to Monitor
```sql
-- Daily circuit health
SELECT
  circuit_id,
  COUNT(*) as executions,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate,
  AVG(latency_ms) as avg_latency,
  AVG(confidence_score) as avg_confidence
FROM circuit_execution_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY circuit_id
ORDER BY success_rate DESC;
```

### Alerts to Set Up
- Success rate drops below 90% → P2 alert
- Average latency exceeds 800ms → P2 alert
- Any escalation event → P3 alert
- Database table size exceeds 1GB → P2 alert

---

## Rollback Plan

If issues occur:

### Immediate Rollback
```bash
git revert 7bbb3cf1  # Revert Decision_Circuits commits
git push origin main
# Re-deploy from main branch
```

### Restore from Backup
```bash
# Supabase: Use backup from pre-migration
# Restore tables: circuit_execution_logs, circuit_strategy_states, circuit_autocorrection_logs, content_strategies
```

### Data Preservation
- All execution logs preserved in backup
- No data loss
- Can re-run migrations after fixes

---

## Success Criteria

Deployment successful when:
- [x] All 8 circuits operational
- [ ] ≥ 95% circuit success rate
- [ ] < 500ms avg circuit latency
- [ ] Dashboard shows 10+ successful corrections
- [ ] Zero escalations due to logic errors
- [ ] Full audit trail queryable
- [ ] RLS policies verified
- [ ] Monitoring alerts configured

---

## Documentation Locations

For troubleshooting or questions, reference:

1. **Quick Start**: `DECISION_CIRCUITS_QUICK_REF.md`
2. **Full Guide**: `docs/guides/DECISION-CIRCUITS-GUIDE.md`
3. **Specification**: `docs/circuits/DECISION-CIRCUITS-SPEC.json`
4. **Implementation**: `DECISION_CIRCUITS_SUMMARY.md`

---

## Support & Escalation

**Issues?**
1. Check `docs/guides/DECISION-CIRCUITS-GUIDE.md` troubleshooting section
2. Review `circuit_execution_logs` for error details
3. File GitHub issue with decision path trace

**Questions?**
1. See `DECISION_CIRCUITS_QUICK_REF.md` for API reference
2. Check `DECISION_CIRCUITS_SPEC.json` for detailed specs
3. Review integration examples in guides

---

**Status**: ✅ Ready to deploy
**Last Updated**: 2025-12-15
**Branch**: Decision_Circuits (7bbb3cf1)
