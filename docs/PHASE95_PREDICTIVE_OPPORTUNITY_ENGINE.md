# Phase 95: Predictive Opportunity Engine (POE)

**Date**: 2025-11-24
**Status**: Complete

## Overview

Phase 95 implements the Predictive Opportunity Engine - a truth-layer compliant forecasting system that detects opportunity windows, momentum patterns, and probable positive actions across regions, tenants, and clients.

## Key Principles

### Truth Layer Compliance

All predictions follow strict truth layer rules:

1. **Probabilities only** - No deterministic predictions
2. **Uncertainty notes required** - Every opportunity includes disclaimers
3. **Traceable signals** - All predictions link to real mesh nodes
4. **Safe degradation** - Low data completeness reduces confidence
5. **No fabrication** - Zero invented metrics or numbers

## Database Schema

### Tables Created (Migration 138)

```sql
-- Opportunity windows
opportunity_windows (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES agencies(id),
  region_id UUID REFERENCES regions(id),
  client_id UUID REFERENCES contacts(id),
  window_type TEXT NOT NULL, -- 7_day | 14_day | 30_day
  opportunity_category TEXT NOT NULL, -- creative | posting | campaign | brand | engagement | audience | timing
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence FLOAT NOT NULL, -- 0.0-1.0
  supporting_nodes JSONB NOT NULL,
  uncertainty_notes TEXT NOT NULL, -- Required
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active | expired | dismissed | acted_upon
  created_at, updated_at
)

-- Supporting signals
opportunity_signals (
  id UUID PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunity_windows(id),
  signal_type TEXT NOT NULL,
  signal_value FLOAT NOT NULL,
  signal_label TEXT,
  source_node_id UUID REFERENCES intelligence_nodes(id),
  weight FLOAT DEFAULT 1.0,
  created_at
)
```

### Database Functions

- `expire_old_opportunity_windows()` - Mark expired windows
- `get_opportunity_summary(tenant_id)` - Aggregate stats by type/category

## Architecture

### Signal Flow

```
Intelligence Mesh    →
Region Scaling      →  Signal Collector  →  Scoring Service  →  Window Generator  →  Save to DB
Performance Reality →
Compliance Engine   →
```

### Backend Services

**Location**: `src/lib/predictive/`

1. **opportunitySignalCollector.ts** - Collect signals from all engines
   - `collectForTenant(tenantId)` - Tenant-wide signals
   - `collectForRegion(regionId)` - Region signals
   - `collectForClient(clientId)` - Client-specific signals

2. **opportunityScoringService.ts** - Convert signals to scores
   - `computeScores(signals)` - Category-based scoring
   - `normalizeConfidence(rawScore, dataCompleteness)` - Apply penalties
   - `computeUncertaintyNotes(signals, completeness, category)` - Generate disclaimers

3. **opportunityWindowService.ts** - Window management
   - `generateWindow(context)` - Create opportunities
   - `saveWindow(window, context)` - Persist with signals
   - `listWindowsForTenant(tenantId, options)` - Query windows

4. **predictiveInsightService.ts** - Founder insights
   - `detectMomentumOpportunities()` - Pattern detection
   - `generateFounderOpportunityReport(tenantId)` - Comprehensive report

5. **predictiveSchedulerService.ts** - Automation
   - `runDailyPredictiveSweep()` - Process all tenants
   - `generateWindowsForRegion(regionId)` - Region-specific
   - `cleanupExpiredWindows(daysOld)` - Maintenance

## API Routes

### GET /api/opportunities/list

List opportunities with optional report.

**Query Parameters**:
- `tenantId` - Required (or regionId)
- `regionId` - Alternative to tenantId
- `windowType` - Filter: 7_day | 14_day | 30_day
- `category` - Filter by category
- `status` - Filter by status
- `includeReport` - Include founder report
- `limit`, `offset` - Pagination

**Response**:
```json
{
  "success": true,
  "windows": [...],
  "report": {
    "totalOpportunities": 15,
    "byWindow": { "7_day": 5, "14_day": 6, "30_day": 4 },
    "byCategory": { "creative": 3, "posting": 4, ... },
    "topOpportunities": [...],
    "momentumInsights": ["Creative opportunities showing momentum..."],
    "uncertaintyDisclaimer": "..."
  },
  "count": 15
}
```

### POST /api/opportunities/generate

Generate new opportunity windows.

**Request Body**:
```json
{
  "tenantId": "uuid",
  "windowType": "7_day",
  "runFullSweep": false
}
```

**Response**:
```json
{
  "success": true,
  "type": "tenant",
  "generated": 8,
  "saved": 5,
  "windows": [...]
}
```

## UI Components

### Location: `src/components/opportunities/`

1. **OpportunityRadar.tsx** - Main radar view with tabs for 7/14/30-day windows
2. **OpportunityCard.tsx** - Individual opportunity display with confidence bar
3. **OpportunitySignalBreakdown.tsx** - Detailed signal analysis with uncertainty notice

### Dashboard Page

**Location**: `src/app/founder/opportunities/page.tsx`

Features:
- Opportunity radar with timeframe tabs
- Generate new opportunities button
- Insights tab with momentum patterns
- Signal breakdown for selected opportunities
- Action buttons: Dismiss / Mark Done / View Details

## Opportunity Categories

| Category | Description | Key Signals |
|----------|-------------|-------------|
| creative | Creative content performance | mesh_creative, engagement, compliance |
| posting | Posting window optimization | scaling_pressure, budget_headroom |
| campaign | Campaign launch timing | growth_rate, client_score |
| brand | Brand positioning | compliance_risk, early_warning |
| engagement | Audience engagement | engagement_rate, recency |
| audience | Audience growth | growth_rate, client_score |
| timing | Optimal timing windows | scaling_mode, budget_headroom |

## Confidence Scoring

### Data Completeness Impact

```typescript
// Completeness multiplier: 0.5 + (completeness * 0.5)
// Examples:
// 100% complete → 1.0x multiplier
// 50% complete → 0.75x multiplier
// 0% complete → 0.5x multiplier
```

### Confidence Interpretation

- **≥70%** - High confidence (highlighted in UI)
- **50-69%** - Moderate confidence
- **30-49%** - Exploratory
- **<30%** - Not displayed

## Integration with Autopilot

POE provides suggestions to Autopilot but **never auto-executes**:

```typescript
// In Autopilot:
const opportunities = await listWindowsForTenant(tenantId, {
  status: 'active',
  limit: 5,
});

// Display as suggestions, require human approval
for (const opp of opportunities) {
  suggestAction({
    type: opp.opportunityCategory,
    confidence: opp.confidence,
    description: opp.description,
    requiresApproval: true, // Always
  });
}
```

## Files Created

### Backend (7 files)
- `supabase/migrations/138_predictive_opportunity_engine.sql`
- `src/lib/predictive/predictiveTypes.ts`
- `src/lib/predictive/opportunitySignalCollector.ts`
- `src/lib/predictive/opportunityScoringService.ts`
- `src/lib/predictive/opportunityWindowService.ts`
- `src/lib/predictive/predictiveInsightService.ts`
- `src/lib/predictive/predictiveSchedulerService.ts`
- `src/lib/predictive/index.ts`

### API Routes (2 files)
- `src/app/api/opportunities/list/route.ts`
- `src/app/api/opportunities/generate/route.ts`

### UI Components (4 files)
- `src/components/opportunities/OpportunityCard.tsx`
- `src/components/opportunities/OpportunityRadar.tsx`
- `src/components/opportunities/OpportunitySignalBreakdown.tsx`
- `src/components/opportunities/index.ts`

### Pages (1 file)
- `src/app/founder/opportunities/page.tsx`

### Documentation (1 file)
- `docs/PHASE95_PREDICTIVE_OPPORTUNITY_ENGINE.md`

## Total: 15 files, ~3,200 lines

## Usage

### Daily Sweep (Cron Job)

```typescript
import { runDailyPredictiveSweep } from '@/lib/predictive';

// Run daily at 2 AM
const result = await runDailyPredictiveSweep();
console.log(`Generated ${result.totalWindowsGenerated} windows for ${result.totalTenants} tenants`);
```

### Manual Generation

```typescript
import { generateWindow, saveWindow } from '@/lib/predictive';

const windows = await generateWindow({
  tenantId: 'uuid',
  windowType: '7_day',
});

for (const window of windows.slice(0, 3)) {
  await saveWindow(window, { tenantId: 'uuid', windowType: '7_day' });
}
```

### Access Dashboard

Navigate to `/founder/opportunities` to:
- View opportunity radar
- Generate new predictions
- Analyze supporting signals
- Track momentum patterns

## Truth Layer Examples

### Good Practice

```typescript
// Include uncertainty
description: "Signals suggest creative content may perform well..."

// Confidence bands
confidence: 0.72 // Never 1.0

// Disclaimers
uncertaintyNotes: "Limited data available - prediction has higher uncertainty. This is a probabilistic estimate, not a guarantee."
```

### Prohibited

```typescript
// ❌ Deterministic claims
description: "You will get 50% more engagement"

// ❌ Perfect confidence
confidence: 1.0

// ❌ Missing disclaimers
uncertaintyNotes: ""
```

## Next Steps

1. **Phase 96+**: Consider adding:
   - Real-time opportunity alerts
   - A/B testing on opportunity actions
   - Competitor opportunity comparison
   - ROI tracking on acted opportunities
   - Machine learning for scoring improvements
