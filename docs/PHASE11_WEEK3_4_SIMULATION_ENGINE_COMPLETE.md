# Phase 11 Week 3-4: Strategy Simulation & Evaluation Engine - COMPLETE

**Completed**: 2025-11-20
**Branch**: `feature/phase11-week3-4-strategy-simulation`

---

## Overview

Implemented the Strategy Simulation & Evaluation Engine including multi-path forecasting, expected-value scoring, confidence intervals, and scenario comparison.

---

## Files Created

### Database Migration

1. **`supabase/migrations/064_strategy_simulations.sql`** (~320 lines)
   - 5 tables: simulation_runs, simulation_steps, simulation_metrics, benchmark_snapshots, simulation_comparisons
   - Simulation types: SINGLE_PATH, MULTI_PATH, MONTE_CARLO, SCENARIO_ANALYSIS, SENSITIVITY_ANALYSIS
   - Comprehensive indexes and RLS policies

### Services

2. **`src/lib/strategy/strategySimulationService.ts`** (~500 lines)
   - Multi-path simulation execution
   - Monte Carlo forecasting
   - Statistical calculations (mean, median, std dev, percentiles)
   - Key methods:
     - `createSimulation()` - Configure simulation runs
     - `runSimulation()` - Execute simulation with path generation
     - `getSimulationResults()` - Retrieve completed results
     - `createBenchmark()` - Create performance snapshots

3. **`src/lib/strategy/strategyEvaluationService.ts`** (~450 lines)
   - Path evaluation and scoring
   - TOPSIS multi-criteria ranking
   - Sensitivity analysis
   - Key methods:
     - `evaluatePaths()` - Score and rank paths
     - `comparePaths()` - Generate comparison with recommendation
     - `performSensitivityAnalysis()` - Analyze parameter impacts
     - `calculateExpectedValueWithCI()` - Confidence intervals
     - `rankPathsTOPSIS()` - Multi-criteria decision analysis

4. **`src/lib/strategy/strategyPlannerIntegration.ts`** (~380 lines)
   - Integration with StrategyPlannerService
   - Proposal sequence optimization
   - Execution plan generation
   - Key methods:
     - `optimizeProposalSequence()` - Reorder actions for better outcomes
     - `analyzeProposalWithSimulation()` - Get improvement suggestions
     - `createExecutionPlan()` - Build phased execution plan

### API Endpoints

5. **`src/app/api/strategy/simulate/route.ts`** (~200 lines)
   - POST: create, run, get_results, list, create_benchmark
   - GET: List simulations with filters

6. **`src/app/api/strategy/evaluate/route.ts`** (~180 lines)
   - POST: evaluate_paths, compare_paths, sensitivity_analysis, get_metrics, rank_topsis
   - GET: Get metrics for simulation

### Components

7. **`src/components/strategy/SimulationTab.tsx`** (~350 lines)
   - Simulation list with status badges
   - Create simulation dialog
   - Run simulation button
   - Path evaluation cards with scores
   - Strengths/weaknesses badges

### Tests

8. **`src/lib/__tests__/strategySimulation.test.ts`** (25 tests)
   - Simulation creation (3 tests)
   - Simulation execution (1 test)
   - Simulation results (3 tests)
   - Benchmark creation (2 tests)
   - Path evaluation (8 tests)
   - Expected value calculation (1 test)
   - TOPSIS ranking (2 tests)
   - Sensitivity analysis (2 tests)
   - Evaluation configuration (3 tests)

---

## Architecture

### Simulation Flow

```
Create Simulation
       ↓
    PENDING
       ↓
  Run Simulation
       ↓
    RUNNING
       ↓
┌──────────────────┐
│ Generate Paths   │
│ (MULTI_PATH: 5)  │
│ (MONTE_CARLO:10) │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ For each path:   │
│ - Simulate steps │
│ - Calculate EV   │
│ - Calculate risk │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Calculate:       │
│ - Best path      │
│ - Expected value │
│ - Confidence Int │
│ - Metrics        │
└────────┬─────────┘
         ↓
   COMPLETED
```

### Evaluation Scoring

```
Path Score =
  valueWeight × normalizedValue +
  probabilityWeight × successProbability +
  timePreference × (1 - normalizedDuration) +
  remainingWeight × (1 - riskScore)

Default Weights:
- valueWeight: 0.5
- probabilityWeight: 0.3
- timePreference: 0.3
```

### TOPSIS Method

1. **Normalize** decision matrix
2. **Weight** normalized values
3. **Find** ideal and anti-ideal solutions
4. **Calculate** distances from ideal/anti-ideal
5. **Score** = distAntiIdeal / (distIdeal + distAntiIdeal)

---

## Data Types

### Simulation Types
- **SINGLE_PATH** - One path simulation
- **MULTI_PATH** - 5 alternative paths
- **MONTE_CARLO** - 10+ probabilistic iterations
- **SCENARIO_ANALYSIS** - Compare specific scenarios
- **SENSITIVITY_ANALYSIS** - Parameter impact analysis

### Distribution Types
- **NORMAL** - Gaussian distribution
- **UNIFORM** - Equal probability
- **BETA** - Bounded outcomes
- **TRIANGULAR** - Min/mode/max
- **CUSTOM** - User-defined

### Metric Types
- **TRAFFIC** - Website traffic
- **CONVERSION** - Conversion rates
- **REVENUE** - Revenue impact
- **COST** - Implementation cost
- **TIME** - Duration metrics
- **QUALITY** - Quality scores
- **RISK** - Risk levels
- **CUSTOM** - Custom metrics

---

## API Usage Examples

### Create and Run Simulation

```typescript
// Create simulation
POST /api/strategy/simulate
{
  "action": "create",
  "simulation": {
    "organization_id": "uuid",
    "name": "Q1 Strategy Forecast",
    "simulation_type": "MULTI_PATH",
    "config": {
      "numIterations": 100,
      "confidenceLevel": 0.95,
      "timeHorizonDays": 90
    }
  }
}

// Run simulation
POST /api/strategy/simulate
{
  "action": "run",
  "simulation_id": "uuid"
}

// Get results
POST /api/strategy/simulate
{
  "action": "get_results",
  "simulation_id": "uuid"
}
```

### Evaluate Paths

```typescript
POST /api/strategy/evaluate
{
  "action": "evaluate_paths",
  "simulation_run_id": "uuid",
  "config": {
    "riskTolerance": 0.6,
    "timePreference": 0.4,
    "valueWeight": 0.5
  }
}

// Response
{
  "success": true,
  "evaluations": [
    {
      "pathId": "path-uuid",
      "expectedValue": 5000,
      "riskAdjustedValue": 4500,
      "confidenceInterval": [4000, 6000],
      "successProbability": 0.85,
      "duration": 80,
      "score": 78.5,
      "rank": 1,
      "strengths": ["High success probability", "Fast execution"],
      "weaknesses": []
    }
  ]
}
```

### Compare Paths

```typescript
POST /api/strategy/evaluate
{
  "action": "compare_paths",
  "path_ids": ["path-1", "path-2", "path-3"],
  "organization_id": "uuid"
}

// Response
{
  "success": true,
  "comparison": {
    "id": "comparison-uuid",
    "recommendedPathId": "path-1",
    "recommendationConfidence": 0.78,
    "rationale": "Path path-1 is recommended with a score of 78.5/100...",
    "tradeoffs": [
      {
        "metric": "Expected Value",
        "pathA": { "id": "path-1", "value": 5000 },
        "pathB": { "id": "path-2", "value": 4500 },
        "winner": "path-1",
        "difference": 500,
        "differencePercent": 11.1
      }
    ]
  }
}
```

### Sensitivity Analysis

```typescript
POST /api/strategy/evaluate
{
  "action": "sensitivity_analysis",
  "simulation_run_id": "uuid",
  "parameters": ["success_probability", "expected_value", "duration"]
}

// Response
{
  "success": true,
  "sensitivity": [
    {
      "parameter": "success_probability",
      "baselineValue": 0.8,
      "range": [
        { "value": 0.4, "outcome": 2000 },
        { "value": 0.8, "outcome": 4000 },
        { "value": 1.2, "outcome": 6000 }
      ],
      "sensitivity": 5000,
      "breakeven": 0.2
    }
  ]
}
```

---

## Statistical Methods

### Confidence Interval

```typescript
// 95% CI using z-score
const z = 1.96;
const stdDev = Math.sqrt(variance);
const ci = [mean - z * stdDev, mean + z * stdDev];
```

### Risk-Adjusted Value

```typescript
const riskPenalty = (1 - riskTolerance) * riskScore;
const riskAdjustedValue = expectedValue * (1 - riskPenalty);
```

### Expected Value with Probability

```typescript
const ev = paths.reduce((sum, p) =>
  sum + p.totalExpectedValue * p.successProbability, 0) / paths.length;
```

---

## Integration Points

### With StrategyPlannerService
- Optimize proposal action sequences
- Generate simulation-informed execution plans
- Identify parallelization opportunities

### With Strategy Graph
- Use graph nodes as simulation inputs
- Map simulation paths to graph edges
- Update graph based on simulation results

### With Operator Mode
- Factor operator reliability into simulations
- Use feedback to adjust success probabilities
- Track simulation accuracy over time

---

## Migration Instructions

Run in Supabase SQL Editor:

```sql
-- Apply migration 064
\i supabase/migrations/064_strategy_simulations.sql
```

---

## Testing

```bash
# Run simulation tests
npm test -- strategySimulation

# Expected: 25 passing tests
```

---

## UI Features

### Simulation List
- Status badges (PENDING, RUNNING, COMPLETED, FAILED)
- Quick run button for pending simulations
- Click to view details

### Simulation Details
- Duration and path count
- Expected value with confidence interval
- Confidence level display

### Path Evaluations
- Ranked path cards
- Score badges
- Success probability and duration
- Strengths/weaknesses tags

---

## Performance Considerations

### Simulation Complexity
- SINGLE_PATH: O(n) where n = steps
- MULTI_PATH: O(5n)
- MONTE_CARLO: O(100n) or configurable

### Database Indexes
- All foreign keys indexed
- Composite indexes for common queries
- Status and type indexed for filtering

### Caching
- Benchmark snapshots for comparison
- Simulation results persisted
- Metrics pre-calculated

---

## Next Steps (Phase 11 Week 5-6)

1. **Real-time Monitoring**
   - Live simulation progress
   - Streaming results

2. **Advanced Analysis**
   - Correlation analysis between paths
   - Scenario templates

3. **Visualization**
   - Interactive path comparison charts
   - Sensitivity spider diagrams
   - Confidence interval bands

4. **Machine Learning**
   - Outcome prediction models
   - Automated parameter tuning

---

## Files Summary

| File | Lines | Purpose |
|------|-------|---------|
| 064_strategy_simulations.sql | ~320 | Database schema |
| strategySimulationService.ts | ~500 | Simulation engine |
| strategyEvaluationService.ts | ~450 | Evaluation & scoring |
| strategyPlannerIntegration.ts | ~380 | Planner integration |
| /api/strategy/simulate/route.ts | ~200 | Simulation API |
| /api/strategy/evaluate/route.ts | ~180 | Evaluation API |
| SimulationTab.tsx | ~350 | UI component |
| strategySimulation.test.ts | ~450 | Unit tests |

**Total**: ~2,830 lines of code

---

## Phase 11 Week 3-4 Complete

The Strategy Simulation & Evaluation Engine is now operational with:
- Multi-path Monte Carlo simulation
- Expected-value scoring with confidence intervals
- TOPSIS multi-criteria ranking
- Sensitivity analysis
- Path comparison with recommendations
- Proposal sequence optimization
- Full CRUD API
- Interactive simulation UI
- 25 comprehensive tests
