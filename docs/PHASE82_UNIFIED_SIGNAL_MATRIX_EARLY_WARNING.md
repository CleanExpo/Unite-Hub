# Phase 82: Unified Signal Matrix & Early Warning Engine

**Status**: Complete
**Date**: 2025-01-24

## Overview

Phase 82 implements a Unified Signal Matrix (USM) that combines signals from all major engines (creative, performance, reality, ORM, alignment, scaling, campaign, VIF, story, external) and an Early Warning Engine (EWE) that detects risks, blindspots, and opportunities using Balanced Mode sensitivity.

## Core Concepts

### Unified Signal Matrix (USM)
A normalized structure that collects daily signals from all connected engines:
- **Creative**: Quality scores, brand consistency
- **Performance**: Open rates, click rates
- **Reality**: True vs perceived scores
- **ORM**: Task completion, operational capacity
- **Alignment**: Contact scores, relationship health
- **Scaling**: Campaign volume, contact growth
- **Campaign**: Completion rates, send cadence
- **VIF**: Visual intelligence activity
- **Story**: Narrative momentum
- **External**: Holidays, industry events

### Early Warning Engine (EWE)
Evaluates the signal matrix for 10 warning types:

| Warning Type | Threshold | Description |
|--------------|-----------|-------------|
| trend_shift | 0.65 | Meaningful trend movements |
| collapse_risk | 0.75 | Performance collapse risk |
| fatigue | 0.60 | Creative/audience fatigue |
| operational_stress | 0.70 | Capacity issues |
| story_stall | 0.55 | Stalled narrative |
| creative_drift | 0.60 | Brand deviation |
| scaling_pressure | 0.70 | Scaling constraints |
| performance_conflict | 0.65 | Perceived vs reality gap |
| data_gap | 0.50 | Missing data |
| blindspot | 0.60 | Unmonitored areas |

### Balanced Mode
Thresholds are calibrated for:
- High-value alerts with low noise
- Avoiding overreactive warnings
- Not minimizing genuine risks

## Architecture

### Database Schema (Migration 125)

Three tables:

1. **`unified_signal_matrix`**
   - Normalized signals from all engines
   - Completeness, confidence, anomaly scores
   - Trend shift and fatigue indicators

2. **`early_warning_events`**
   - Generated warnings with severity
   - Source signals and confidence
   - Status tracking (open/acknowledged/resolved)

3. **`early_warning_factors`**
   - Configurable thresholds per warning type
   - Influence weights for risk scoring

### Backend Services

Located in `src/lib/signalMatrix/`:

1. **`signalMatrixCollectorService.ts`**
   - Collects raw signals from each engine
   - Normalizes to 0-1 scale
   - Computes matrix scores (completeness, confidence, anomaly, trend, fatigue)

2. **`earlyWarningEngineService.ts`**
   - Evaluates matrix for each warning type
   - Uses configurable Balanced Mode thresholds
   - Generates warning detections with severity

3. **`earlyWarningSnapshotService.ts`**
   - CRUD for warning events
   - Status management
   - Summary statistics

4. **`earlyWarningTruthAdapter.ts`**
   - Validates warning integrity
   - Generates disclaimers based on confidence
   - Ensures truth-layer compliance

5. **`earlyWarningFounderBridge.ts`**
   - Injects warnings into Founder Intel
   - Generates summary and signals
   - Creates briefing content

6. **`earlyWarningScheduler.ts`**
   - Daily autonomous evaluation
   - Client-specific evaluations
   - Overdue detection

### API Routes

- `GET /api/early-warning/events` - List warnings with filters
- `GET /api/early-warning/events/[id]` - Get single warning
- `PATCH /api/early-warning/events/[id]` - Update status

### UI Components

Located in `src/components/earlyWarning/`:

1. **`EarlyWarningList.tsx`** - Warnings with severity badges and actions
2. **`EarlyWarningRadar.tsx`** - Bar chart of signal intensities by category
3. **`EarlyWarningHeatmap.tsx`** - Grid heatmap of signal scores
4. **`SignalMatrixCompletenessBar.tsx`** - Five-metric progress bars

### Pages

- `/founder/early-warnings` - Main Early Warning Console

## Detection Logic

### Trend Shift Detection
```typescript
score = matrix.trend_shift_score;
// Triggered when >65% of categories show non-stable trends
```

### Collapse Risk Detection
```typescript
score = anomaly * 0.4 + fatigue * 0.3 + (1 - confidence) * 0.3;
// Combines multiple risk indicators
```

### Fatigue Detection
```typescript
// Count categories with 'down' trend
fatigueIndicators = [creative, performance, campaign].filter(c => c.trend === 'down').length;
score = fatigueIndicators / 3;
```

### Performance Conflict Detection
```typescript
conflict = Math.abs(performance.score - reality.score);
// Large gaps indicate perceived vs reality mismatch
```

### Data Gap Detection
```typescript
score = 1 - completeness;
// Triggered when completeness below 50%
```

## Truth Layer Compliance

All warnings include:

1. **Confidence disclosure** - Low confidence triggers explicit disclaimers
2. **Signal counts** - Shows number of supporting signals
3. **Balanced Mode note** - Explains threshold calibration
4. **Completeness context** - Shows data coverage

Example disclaimer:
> "Low confidence (45%): This warning is based on limited or uncertain data."

## Integration Points

### Founder Intel Console
- "Early Warnings" button in header
- Link from Performance Reality to Early Warnings
- Alerts can be injected into Founder Intel snapshots

### Daily Scheduler
```typescript
const results = await runDailyEvaluation();
// Creates matrix rows and warning events
// Injects summary into Founder Intel
```

## Files Created

### Database
- `supabase/migrations/125_signal_matrix_early_warning.sql`

### Backend (7 files)
- `src/lib/signalMatrix/signalMatrixTypes.ts`
- `src/lib/signalMatrix/signalMatrixCollectorService.ts`
- `src/lib/signalMatrix/earlyWarningEngineService.ts`
- `src/lib/signalMatrix/earlyWarningSnapshotService.ts`
- `src/lib/signalMatrix/earlyWarningTruthAdapter.ts`
- `src/lib/signalMatrix/earlyWarningFounderBridge.ts`
- `src/lib/signalMatrix/earlyWarningScheduler.ts`
- `src/lib/signalMatrix/index.ts`

### API Routes (2 files)
- `src/app/api/early-warning/events/route.ts`
- `src/app/api/early-warning/events/[id]/route.ts`

### UI Components (4 files)
- `src/components/earlyWarning/EarlyWarningList.tsx`
- `src/components/earlyWarning/EarlyWarningRadar.tsx`
- `src/components/earlyWarning/EarlyWarningHeatmap.tsx`
- `src/components/earlyWarning/SignalMatrixCompletenessBar.tsx`

### Pages (1 file)
- `src/app/founder/early-warnings/page.tsx`

### Modified
- `src/app/founder/intel/page.tsx` - Added Early Warnings button

## Usage

### Run Daily Evaluation
```typescript
import { runDailyEvaluation } from '@/lib/signalMatrix';

const results = await runDailyEvaluation();
// Returns: { matricesCreated, warningsGenerated, errors }
```

### Get Early Warning Summary
```typescript
import { getEarlyWarningSummary } from '@/lib/signalMatrix';

const summary = await getEarlyWarningSummary();
// Returns: { total_open, by_severity, risk_level, primary_concern, completeness }
```

### List Warnings
```typescript
import { listWarningEvents } from '@/lib/signalMatrix';

const { events, total } = await listWarningEvents({
  status: ['open', 'acknowledged'],
  severity: 'high',
  limit: 10,
});
```

### Update Warning Status
```typescript
import { updateWarningStatus } from '@/lib/signalMatrix';

await updateWarningStatus(warningId, 'resolved', userId);
```

## Balanced Mode Thresholds

The system uses carefully calibrated thresholds:

- **Conservative** for high-impact warnings (collapse_risk: 0.75)
- **Moderate** for common issues (fatigue: 0.60)
- **Sensitive** for early detection (story_stall: 0.55, data_gap: 0.50)

These can be adjusted in the `early_warning_factors` table.

## Next Steps

Potential enhancements:
- Add /api/signal-matrix/latest endpoint for production matrix retrieval
- Implement scheduled cron job for daily evaluation
- Add email/Slack notifications for high-severity warnings
- Historical trend analysis across matrix rows
- Predictive modeling for upcoming risks
- Client-specific warning thresholds
