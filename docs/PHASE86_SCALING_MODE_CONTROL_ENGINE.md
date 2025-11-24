# Phase 86: Scaling Mode Control & Capacity Engine

**Status**: Complete
**Date**: 2025-11-24

## Overview

Phase 86 implements the Scaling Mode Control & Capacity Engine, converting existing scaling components into an explicit, truth-governed system with clear capacity limits, risk bands, and investor-ready scaling health views.

## Key Features

### 1. Explicit Scaling Modes
- **Lab**: 0-5 clients, testing phase
- **Pilot**: 6-15 clients, early adoption
- **Growth**: 16-50 clients, expansion
- **Scale**: 51+ clients, full production

### 2. Health Score System
Continuous evaluation of:
- Infrastructure health (CPU, latency, errors)
- AI cost pressure (spend vs limits)
- Warning density (Early Warning events per client)
- Churn risk (at-risk client percentage)
- Overall scaling health (weighted composite)

### 3. Mode Recommendations
- **Hold**: Current mode appropriate
- **Increase Mode**: Safe to scale up
- **Decrease Mode**: Consider scaling down
- **Freeze**: Stop new onboarding

### 4. Truth Layer Constraints
- All metrics from real telemetry
- No AI estimation of numbers
- Conservative recommendations when data incomplete
- Block unsafe recommendations automatically

## Database Schema

### Tables Created (Migration 129)

1. **scaling_mode_config**
   - Per-environment mode settings
   - Mode limits (clients, posts, AI spend)
   - Guardrail thresholds
   - Auto-mode toggle

2. **scaling_health_snapshots**
   - Periodic health evaluations
   - Capacity metrics
   - Health scores
   - Recommendations with narrative

3. **scaling_history**
   - Append-only event log
   - Mode changes
   - Freeze/unfreeze events
   - Config updates

## Backend Services

Located in `src/lib/scalingMode/`:

| Service | Purpose |
|---------|---------|
| `scalingModeConfigService.ts` | CRUD for config, mode limits |
| `scalingHealthAggregationService.ts` | Collect inputs, compute scores |
| `scalingHealthSnapshotService.ts` | Generate/list snapshots |
| `scalingModeDecisionService.ts` | Determine recommendations |
| `scalingHistoryService.ts` | Log events, list history |
| `scalingModeTruthAdapter.ts` | Truth layer enforcement |
| `scalingModeSchedulerService.ts` | Daily evaluations |

## Mode Limits

### Lab Mode
- Max clients: 5
- Max posts/day: 50
- Max AI spend: $10/day

### Pilot Mode
- Max clients: 15
- Max posts/day: 200
- Max AI spend: $50/day

### Growth Mode
- Max clients: 50
- Max posts/day: 1,000
- Max AI spend: $200/day

### Scale Mode
- Max clients: 500
- Max posts/day: 10,000
- Max AI spend: $2,000/day

## Health Score Calculation

```
Overall Health =
  (Infra Health × 30%) +
  ((100 - AI Cost Pressure) × 25%) +
  ((100 - Warning Density) × 25%) +
  ((100 - Churn Risk) × 20%)
```

## Guardrail Thresholds

```json
{
  "min_health_for_increase": 80,
  "max_utilisation_for_increase": 0.7,
  "freeze_below_health": 40,
  "max_warning_density": 0.3,
  "max_churn_risk": 0.2,
  "max_ai_cost_pressure": 0.8,
  "min_confidence_for_change": 0.7
}
```

## API Routes

### `/api/scaling-mode/config`
- **GET**: Fetch current config
- **PUT**: Update config, set mode, toggle auto-mode

### `/api/scaling-mode/health`
- **GET**: List snapshots, get overview
- **POST**: Generate new snapshot

### `/api/scaling-mode/history`
- **GET**: List history events

## UI Components

Located in `src/components/scalingMode/`:

1. **ScalingModeOverview** - Current mode, capacity, utilisation
2. **ScalingHealthScoresPanel** - Health score breakdown
3. **ScalingModeTimeline** - Event history visualization

## Founder Dashboard

`src/app/founder/scaling-mode/page.tsx`

Features:
- Current mode and capacity overview
- Health score breakdown
- Auto-mode toggle
- Event timeline
- Snapshot history
- Generate snapshot on demand

## Files Created

### Migration
- `supabase/migrations/129_scaling_mode_control_engine.sql`

### Types
- `src/lib/scalingMode/scalingModeTypes.ts`

### Services (8)
- `src/lib/scalingMode/scalingModeConfigService.ts`
- `src/lib/scalingMode/scalingHealthAggregationService.ts`
- `src/lib/scalingMode/scalingHealthSnapshotService.ts`
- `src/lib/scalingMode/scalingModeDecisionService.ts`
- `src/lib/scalingMode/scalingHistoryService.ts`
- `src/lib/scalingMode/scalingModeTruthAdapter.ts`
- `src/lib/scalingMode/scalingModeSchedulerService.ts`
- `src/lib/scalingMode/index.ts`

### API Routes (3)
- `src/app/api/scaling-mode/config/route.ts`
- `src/app/api/scaling-mode/health/route.ts`
- `src/app/api/scaling-mode/history/route.ts`

### UI Components (3)
- `src/components/scalingMode/ScalingModeOverview.tsx`
- `src/components/scalingMode/ScalingHealthScoresPanel.tsx`
- `src/components/scalingMode/ScalingModeTimeline.tsx`

### Page (1)
- `src/app/founder/scaling-mode/page.tsx`

## Usage

### Generate Health Snapshot
```bash
curl -X POST http://localhost:3008/api/scaling-mode/health \
  -H "Content-Type: application/json" \
  -d '{"environment": "production"}'
```

### Get Overview
```bash
curl "http://localhost:3008/api/scaling-mode/health?environment=production&type=overview"
```

### Change Mode
```bash
curl -X PUT http://localhost:3008/api/scaling-mode/config \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "production",
    "action": "set_mode",
    "mode": "pilot",
    "old_mode": "lab"
  }'
```

### Toggle Auto Mode
```bash
curl -X PUT http://localhost:3008/api/scaling-mode/config \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "production",
    "action": "set_auto_mode",
    "enabled": true
  }'
```

## Acceptance Criteria

- [x] Founder can view current Scaling Mode and health metrics
- [x] Snapshots generate with utilisation, health scores, and recommendations
- [x] System recommends scaling up, holding, or freezing based on scores
- [x] Scaling history logs mode changes and decisions
- [x] Truth Layer prevents unsafe recommendations

## Safety Notes

- Phase 86 is read-only and advisory
- Does not block onboarding or posting flows
- Auto-mode only recommends, doesn't force changes
- All numbers from real telemetry, no AI estimation

## Next Steps (Phase 87+)

1. Wire recommendations into onboarding caps
2. Integrate with posting engine for rate limiting
3. Add alerting for threshold breaches
4. Investor dashboard export
5. Historical trend analysis
