# Phase 81: Performance Reality Engine

**Status**: Complete
**Date**: 2025-01-24

## Overview

The Performance Reality Engine bridges the gap between perceived and true performance metrics. It provides reality-adjusted scores by accounting for attribution factors, external signals, and data completeness, while disclosing uncertainty through confidence bands and false signal risks.

## Core Concept

**Perceived Performance** = What metrics show (e.g., 75% open rate)
**True Performance** = Reality-adjusted score accounting for:
- Attribution factors (creative quality, audience match, timing, etc.)
- External signals (holidays, industry events, platform issues)
- Data completeness and noise

## Architecture

### Database Schema (Migration 124)

Three tables:

1. **`performance_reality_snapshots`**
   - Stores computed reality analysis
   - Perceived vs true scores
   - Confidence bands (low/high)
   - False positive/negative risks
   - Attribution breakdown (JSONB)
   - External context (JSONB)

2. **`performance_attribution_factors`**
   - Factor definitions with default weights
   - 9 default factors seeded

3. **`performance_external_signals`**
   - Holiday, weather, industry events
   - Impact hints with expected effects

### Backend Services

Located in `src/lib/performanceReality/`:

1. **`performanceRealityModelService.ts`** - Core computation
   - `computeTruePerformanceScore()` - Main algorithm
   - Attribution adjustment calculation
   - External signal adjustment
   - Noise correction (regression to mean)
   - Confidence band calculation
   - False positive/negative risk estimation

2. **`performanceAttributionService.ts`** - Factor analysis
   - Queries VIF, archive, campaign data
   - Computes 9 attribution factors:
     - creative_quality (20%)
     - audience_match (15%)
     - channel_performance (15%)
     - timing_relevance (10%)
     - message_resonance (10%)
     - competitive_context (10%)
     - frequency_saturation (8%)
     - brand_equity (7%)
     - technical_delivery (5%)

3. **`performanceExternalSignalService.ts`** - External context
   - Holiday seeding for AU/US
   - Signal impact calculation
   - Date-based signal lookup

4. **`performanceRealitySnapshotService.ts`** - CRUD operations
   - Snapshot creation with full computation
   - Data completeness calculation
   - Demo snapshot generation

5. **`performanceRealityTruthAdapter.ts`** - Truth layer compliance
   - Builds disclaimers based on data quality
   - Identifies missing data types
   - Generates truth summaries
   - Validates minimum truth standards

6. **`performanceRealityFounderBridge.ts`** - Founder Intel integration
   - Reality Strip data formatting
   - Alert generation from reality analysis
   - Signal export for aggregation
   - Briefing content generation

### API Routes

- `GET/POST /api/performance-reality/snapshots` - List/create snapshots
- `GET/DELETE /api/performance-reality/snapshots/[id]` - Single snapshot
- `GET/POST /api/performance-reality/external-signals` - Manage signals
- `GET /api/performance-reality/strip` - Reality Strip data

### UI Components

Located in `src/components/performanceReality/`:

1. **`PerformanceRealityStrip.tsx`** - Compact display
   - Perceived → True score with delta
   - Confidence band indicator
   - Primary driver badge
   - Warning indicator
   - Data quality badge

2. **`AttributionBreakdownCard.tsx`** - Factor visualization
   - Sorted by absolute impact
   - Direction indicators (positive/negative/neutral)
   - Confidence percentages
   - Progress bars for magnitude

3. **`FalseSignalWarning.tsx`** - Risk disclosure
   - False positive risk bar
   - False negative risk bar
   - Explanatory text

4. **`ExternalContextCard.tsx`** - External signals display
   - Signal type icons
   - Impact badges (Boost/Reduce/Mixed)
   - Overall impact summary

5. **`PerformanceRealitySnapshotList.tsx`** - History view
   - Recent snapshots
   - Score deltas with direction icons

### Pages

- `/founder/performance-reality` - Main console
- `/founder/performance-reality/[id]` - Snapshot detail

## Algorithm Details

### True Score Computation

```typescript
trueScore = perceivedScore
  + attributionAdjustment  // -20 to +20 points
  + externalAdjustment     // -15 to +15 points
  + noiseCorrection        // regression to mean
```

### Confidence Band

Band width based on:
- Data completeness (inverse relationship)
- Average factor confidence
- Number of external signals

### False Signal Risk

```typescript
falsePositiveRisk = (scoreDelta / 30) * (1 - dataCompleteness + 0.2)
falseNegativeRisk = (|scoreDelta| / 30) * (1 - dataCompleteness + 0.2)
```

Multiplied by low-confidence factor penalty.

## Truth Layer Compliance

All metrics are derived from real data. Uncertainty is disclosed through:

1. **Confidence Bands** - Show score range
2. **Data Completeness** - Percentage of expected sources
3. **Disclaimers** - Context-specific warnings
4. **False Signal Risks** - Overstatement/understatement probability

No metrics are fabricated. Missing data results in wider confidence bands, not fake values.

## Integration Points

### Founder Intel Console

The Reality Strip appears at the top of `/founder/intel` showing:
- Current perceived vs true scores
- Reliability indicator
- Link to full analysis

### Alerts

Performance Reality generates alerts for:
- High false positive risk
- High false negative risk
- Low data completeness
- Multiple external factors
- Large score discrepancies

### Weekly Briefing

Briefing content includes:
- Score analysis
- Primary drivers
- Warnings
- Data quality assessment

## Files Created

### Database
- `supabase/migrations/124_performance_reality_engine.sql`

### Backend (6 files)
- `src/lib/performanceReality/performanceRealityTypes.ts`
- `src/lib/performanceReality/performanceRealityModelService.ts`
- `src/lib/performanceReality/performanceAttributionService.ts`
- `src/lib/performanceReality/performanceExternalSignalService.ts`
- `src/lib/performanceReality/performanceRealitySnapshotService.ts`
- `src/lib/performanceReality/performanceRealityTruthAdapter.ts`
- `src/lib/performanceReality/performanceRealityFounderBridge.ts`
- `src/lib/performanceReality/index.ts`

### API Routes (4 files)
- `src/app/api/performance-reality/snapshots/route.ts`
- `src/app/api/performance-reality/snapshots/[id]/route.ts`
- `src/app/api/performance-reality/external-signals/route.ts`
- `src/app/api/performance-reality/strip/route.ts`

### UI Components (5 files)
- `src/components/performanceReality/PerformanceRealityStrip.tsx`
- `src/components/performanceReality/AttributionBreakdownCard.tsx`
- `src/components/performanceReality/FalseSignalWarning.tsx`
- `src/components/performanceReality/ExternalContextCard.tsx`
- `src/components/performanceReality/PerformanceRealitySnapshotList.tsx`

### Pages (2 files)
- `src/app/founder/performance-reality/page.tsx`
- `src/app/founder/performance-reality/[id]/page.tsx`

### Modified
- `src/app/founder/intel/page.tsx` - Added Reality Strip integration

## Usage

### Generate Snapshot

```typescript
import { createPerformanceRealitySnapshot } from '@/lib/performanceReality';

const snapshot = await createPerformanceRealitySnapshot(
  'global',  // scope
  undefined, // clientId (optional)
  30         // timeframe days
);
```

### Get Reality Strip Data

```typescript
import { getRealityStripData } from '@/lib/performanceReality';

const strip = await getRealityStripData('global');
// Returns: perceived, true, delta, confidence, warnings, etc.
```

### Seed External Signals

```typescript
import { seedHolidaysForRegion } from '@/lib/performanceReality';

await seedHolidaysForRegion(2025, 'AU');
```

## Next Steps

Potential enhancements:
- Connect to real campaign metrics
- Integrate ORM competitive data
- Add weather API for external signals
- Historical trend analysis
- Predictive modeling for future performance
