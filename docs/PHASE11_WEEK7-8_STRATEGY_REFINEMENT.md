# Phase 11 Week 7-8: Adaptive Strategy Refinement

## Overview

This phase implements the adaptive strategy refinement layer with drift detection, historical learning, reinforcement adjustments, and cross-domain coordination.

## Features Implemented

### 1. Database Schema (Migration 066)

**Tables Created:**
- `refinement_cycles` - Track refinement iterations and results
- `drift_signals` - Detected performance deviations
- `domain_balances` - Cross-domain resource allocation
- `performance_history` - Historical data for learning
- `reinforcement_adjustments` - Strategy adjustment records

**Key Features:**
- Multiple cycle types (SCHEDULED, DRIFT_TRIGGERED, MANUAL, PERFORMANCE)
- Severity-based drift classification (LOW, MEDIUM, HIGH, CRITICAL)
- Operator approval workflow for adjustments
- Entropy and Gini coefficient tracking for balance analysis

### 2. StrategyRefinementService

**Location:** `src/lib/strategy/strategyRefinementService.ts`

**Capabilities:**
- Start and manage refinement cycles
- Analyze KPIs for drift detection
- Calculate severity and generate recommended actions
- Record performance history for learning
- Identify performance patterns and trends

**Key Methods:**
```typescript
startRefinementCycle(orgId, cycleType, planId?) → RefinementCycle
analyzeForDrift(orgId, cycleId, config?) → DriftAnalysisResult
completeRefinementCycle(cycleId, adjustments, summary) → RefinementCycle
recordPerformanceHistory(orgId, record) → void
getPerformancePatterns(orgId, domain?) → patterns
```

### 3. CrossDomainCoordinatorService

**Location:** `src/lib/strategy/crossDomainCoordinatorService.ts`

**Capabilities:**
- Analyze domain balance and identify imbalances
- Calculate entropy and Gini coefficient for distribution analysis
- Identify over-optimized and under-invested domains
- Recommend allocation shifts based on performance
- Track cross-domain dependencies

**Built-in Dependencies:**
- CONTENT → SEO (0.8 strength, 14 day lag)
- GEO → SEO (0.4 strength)
- CRO → ADS (0.6 strength)
- ADS → CRO (-0.2 inverse relationship)

**Key Methods:**
```typescript
analyzeBalance(orgId, cycleId?) → BalanceAnalysis
applyBalanceShifts(orgId, shifts, config?) → newAllocations
calculateOptimalAllocation(orgId, config?) → optimalAllocations
needsRebalancing(orgId, config?) → { needed, reason, imbalance }
```

### 4. ReinforcementAdjustmentEngine

**Location:** `src/lib/strategy/reinforcementAdjustmentEngine.ts`

**Capabilities:**
- Generate adjustments from reinforcement signals
- Support multiple signal sources (EXECUTION, FEEDBACK, SIMULATION, HISTORICAL)
- Calculate adjustment type and magnitude
- Track operator approval workflow
- Record outcomes for learning

**Adjustment Types:**
- STRENGTHEN - Increase investment/priority
- WEAKEN - Decrease investment/priority
- MAINTAIN - Keep current
- REDIRECT - Shift to different approach
- PAUSE - Temporary halt
- ACCELERATE - Speed up execution

**Key Methods:**
```typescript
generateAdjustment(request, signals) → ReinforcementAdjustment
applyAdjustment(adjustmentId) → void
recordOutcome(outcome) → void
provideFeedback(adjustmentId, feedback, approved, userId) → void
generateExecutionSignals(achievement, onTime, used, allocated) → signals
generateSimulationSignals(confidence, rank, total) → signals
generateHistoricalSignals(orgId, domain, metric) → signals
```

### 5. Continuous Refinement Loop

**Location:** `src/lib/strategy/continuousRefinementLoop.ts`

**Functions:**
- `runRefinementLoop()` - Complete refinement cycle orchestration
- `checkRefinementNeeded()` - Determine if refinement is required
- `scheduleRefinementCheck()` - Schedule automatic checks

### 6. API Endpoints

**Refinement API:**
```
POST /api/strategy/refine
{
  "organization_id": "uuid",
  "action": "start" | "analyze" | "complete" | "balance",
  "cycle_type": "SCHEDULED" | "DRIFT_TRIGGERED" | "MANUAL" | "PERFORMANCE",
  "horizon_plan_id": "uuid",
  "cycle_id": "uuid"
}
```

**Drift API:**
```
GET /api/strategy/drift?organization_id=uuid&resolved=false&severity=HIGH
POST /api/strategy/drift
{
  "action": "resolve" | "adjust" | "approve",
  ...
}
```

### 7. DriftPanel Component

**Location:** `src/components/strategy/DriftPanel.tsx`

**Features:**
- Summary cards (active signals, critical, pending approvals)
- Domain balance visualization with allocation vs performance
- Drift signals list with severity badges
- Pending adjustments with approval workflow
- Resolve and approve dialogs

## Usage Examples

### Run Refinement Loop

```typescript
import { runRefinementLoop } from '@/lib/strategy/continuousRefinementLoop';

const result = await runRefinementLoop('org-123', 'plan-456', {
  auto_apply_low_severity: true,
  balance_check_interval_days: 7,
});

console.log(`Generated ${result.adjustments_generated} adjustments`);
console.log(`Auto-applied ${result.auto_applied}`);
console.log('Recommendations:', result.recommendations);
```

### Check Domain Balance

```typescript
import { crossDomainCoordinatorService } from '@/lib/strategy/crossDomainCoordinatorService';

const analysis = await crossDomainCoordinatorService.analyzeBalance('org-123');

console.log(`Balance score: ${analysis.balance_score}/100`);
console.log('Over-optimized:', analysis.over_optimized);
console.log('Under-invested:', analysis.under_invested);
console.log('Recommended shifts:', analysis.recommended_shifts);
```

### Generate Adjustment from Execution

```typescript
import { reinforcementAdjustmentEngine } from '@/lib/strategy/reinforcementAdjustmentEngine';

// Generate signals from execution results
const signals = reinforcementAdjustmentEngine.generateExecutionSignals(
  75,    // 75% achievement
  false, // missed deadline
  12,    // 12 hours used
  10     // 10 hours allocated
);

// Create adjustment
const adjustment = await reinforcementAdjustmentEngine.generateAdjustment(
  {
    organization_id: 'org-123',
    target: 'KPI_TARGET',
    domain: 'SEO',
    trigger_reason: 'Underperforming SEO metrics',
  },
  signals
);

// Approve and apply
await reinforcementAdjustmentEngine.provideFeedback(
  adjustment.id,
  'Approved - adjusting targets',
  true,
  'user-123'
);
```

## Database Migration

Run migration 066 in Supabase SQL Editor:

```sql
-- Located at: supabase/migrations/066_strategy_refinement.sql
```

This creates:
- 5 tables with proper constraints
- 20+ indexes for query performance
- RLS policies for organization isolation

## Testing

Run the unit tests:

```bash
npm test src/lib/__tests__/strategyRefinement.test.ts
```

**Test Coverage:**
- StrategyRefinementService: 8 tests
- CrossDomainCoordinatorService: 6 tests
- ReinforcementAdjustmentEngine: 6 tests
- Type definitions: 7 tests

Total: 27 tests

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DriftPanel UI                             │
│  (Signals, Balance chart, Pending approvals, Resolve dialog) │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Endpoints                              │
│  /api/strategy/refine                                        │
│  /api/strategy/drift                                         │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────────┐
│Strategy          │ │CrossDomain   │ │Reinforcement         │
│RefinementService │ │Coordinator   │ │AdjustmentEngine      │
│- startCycle      │ │- analyzeBalce│ │- generateAdjust      │
│- analyzeForDrift │ │- identifyImb │ │- applyAdjust         │
│- recordHistory   │ │- calcOptimal │ │- recordOutcome       │
│- getPatterns     │ │- getDependcys│ │- genSignals          │
└────────┬─────────┘ └──────┬───────┘ └──────────┬───────────┘
         │                  │                    │
         └──────────────────┼────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              continuousRefinementLoop                        │
│  Orchestrates complete refinement cycles                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL                        │
│  refinement_cycles | drift_signals | domain_balances         │
│  performance_history | reinforcement_adjustments             │
└─────────────────────────────────────────────────────────────┘
```

## Integration with Horizon Planning

The refinement layer integrates with Phase 11 Week 5-6 horizon planning:

1. **Drift Detection** - Monitors horizon step KPIs for deviations
2. **Performance History** - Records step outcomes for learning
3. **Reinforcement Signals** - Uses simulation confidence from Week 3-4
4. **Domain Balance** - Ensures horizon plans don't over-optimize domains

## Next Steps (Phase 12+)

1. **ML-based Pattern Recognition** - Use historical data to predict drift
2. **Automated Scheduling** - Cron jobs for refinement cycles
3. **Real-time Alerts** - Push notifications for critical drift
4. **Competitive Intelligence** - Factor in competitor movements
5. **A/B Testing Integration** - Test adjustments before full rollout

## Files Created

- `supabase/migrations/066_strategy_refinement.sql`
- `src/lib/strategy/strategyRefinementService.ts`
- `src/lib/strategy/crossDomainCoordinatorService.ts`
- `src/lib/strategy/reinforcementAdjustmentEngine.ts`
- `src/lib/strategy/continuousRefinementLoop.ts`
- `src/app/api/strategy/refine/route.ts`
- `src/app/api/strategy/drift/route.ts`
- `src/components/strategy/DriftPanel.tsx`
- `src/lib/__tests__/strategyRefinement.test.ts`
- `docs/PHASE11_WEEK7-8_STRATEGY_REFINEMENT.md`
