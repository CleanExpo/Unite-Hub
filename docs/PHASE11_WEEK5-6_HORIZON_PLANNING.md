# Phase 11 Week 5-6: Long-Horizon Autonomous Strategy Planning

## Overview

This phase implements long-horizon autonomous strategy planning with rolling optimization, KPI-driven adjustments, and coordinated multi-domain strategy generation for 30/60/90-day rolling plans.

## Features Implemented

### 1. Database Schema (Migration 065)

**Tables Created:**
- `horizon_plans` - Rolling strategy plans with status and scoring
- `horizon_steps` - Individual steps with timing and KPI targets
- `kpi_snapshots` - Historical and projected KPI values
- `dependency_links` - Step dependencies (FINISH_TO_START, etc.)
- `horizon_adjustments` - Plan modification history

**Key Features:**
- Rolling optimization support (weekly roll-forward)
- Cross-domain dependencies with lag/lead times
- Confidence, feasibility, and impact scoring
- Comprehensive RLS policies for org isolation

### 2. LongHorizonPlannerService

**Location:** `src/lib/strategy/longHorizonPlannerService.ts`

**Capabilities:**
- Create horizon plans (30/60/90 days)
- Generate domain-specific steps automatically
- Resolve dependencies using topological sort
- Calculate critical path for project management
- Roll plans forward with date adjustments

**Key Methods:**
```typescript
createPlan(request) → HorizonPlan
generatePlan(orgId, type, config) → { plan, steps, dependencies }
rollPlan(planId) → HorizonPlan
resolveDependencies(planId) → { criticalPath, totalDuration, parallelGroups }
```

### 3. KPITrackingService

**Location:** `src/lib/strategy/kpiTrackingService.ts`

**Capabilities:**
- Create and manage KPI snapshots (baseline, current, projected, target)
- Track trends across domains (SEO, GEO, CONTENT, ADS, CRO)
- Generate domain health summaries
- Project KPIs forward in time
- Record step-level KPI achievements

**Standard KPIs Included:**
- **SEO**: organic_traffic, keyword_rankings, domain_authority, backlinks, page_speed, indexed_pages
- **GEO**: local_pack_rankings, gmb_views, local_citations, review_count, review_rating
- **CONTENT**: content_pieces, avg_time_on_page, bounce_rate, pages_per_session, social_shares
- **ADS**: ctr, cpc, conversion_rate, roas, quality_score
- **CRO**: conversion_rate, form_completion_rate, cart_abandonment, avg_order_value, revenue_per_visitor

### 4. API Endpoints

**Generate Plan:**
```
POST /api/strategy/horizon/generate
{
  "organization_id": "uuid",
  "horizon_type": "MEDIUM",
  "name": "Q1 Strategy",
  "description": "..."
}
```

**List Plans:**
```
GET /api/strategy/horizon/list?organization_id=uuid&status=ACTIVE
```

**KPI Operations:**
```
GET /api/strategy/horizon/kpi?organization_id=uuid&action=trends
GET /api/strategy/horizon/kpi?organization_id=uuid&action=summary&domain=SEO
GET /api/strategy/horizon/kpi?organization_id=uuid&action=projections&domain=SEO&days=30
POST /api/strategy/horizon/kpi (create snapshot)
```

### 5. HorizonPlannerTab Component

**Location:** `src/components/strategy/HorizonPlannerTab.tsx`

**Features:**
- Plan list with status badges and scores
- Create new plan dialog with horizon type selection
- KPI dashboard with domain summaries
- Trend visualization with up/down indicators
- Plan details with timeline and scoring breakdown

### 6. Integration Layer

**Location:** `src/lib/strategy/horizonPlannerIntegration.ts`

**Functions:**
- `convertHorizonToProposals()` - Convert plans to executable proposals
- `recordStepCompletion()` - Record results and calculate achievement
- `optimizeRemainingPlan()` - Adjust targets based on performance
- `getNextPlanRecommendations()` - KPI-driven next plan suggestions

## Usage Examples

### Create a 60-Day Rolling Plan

```typescript
import { longHorizonPlannerService } from '@/lib/strategy/longHorizonPlannerService';

const result = await longHorizonPlannerService.generatePlan(
  'org-123',
  'MEDIUM',
  {
    priorityDomains: ['SEO', 'CONTENT', 'CRO'],
    targetKPIs: {
      SEO: { organic_traffic: 5000, domain_authority: 45 },
      CRO: { conversion_rate: 3.5 }
    }
  }
);

console.log(`Created ${result.steps.length} steps`);
```

### Track KPI Progress

```typescript
import { kpiTrackingService } from '@/lib/strategy/kpiTrackingService';

// Create baseline
await kpiTrackingService.createSnapshot({
  organization_id: 'org-123',
  snapshot_type: 'BASELINE',
  domain: 'SEO',
  metric_name: 'organic_traffic',
  metric_value: 3000,
});

// Get trends
const trends = await kpiTrackingService.getKPITrends('org-123', 'SEO');

// Get projections
const projections = await kpiTrackingService.projectKPIs('org-123', 'SEO', 30);
```

### Record Step Completion

```typescript
import { recordStepCompletion } from '@/lib/strategy/horizonPlannerIntegration';

const result = await recordStepCompletion('step-123', {
  organic_traffic: 3500,
  domain_authority: 42,
});

console.log(`Achievement: ${result.achievement_percent}%`);
console.log('Recommendations:', result.recommendations);
```

## Database Migration

Run migration 065 in Supabase SQL Editor:

```sql
-- Located at: supabase/migrations/065_strategy_horizons.sql
```

This creates:
- 5 tables with proper constraints
- 15+ indexes for query performance
- RLS policies for organization isolation

## Testing

Run the unit tests:

```bash
npm test src/lib/__tests__/horizonPlanning.test.ts
```

**Test Coverage:**
- LongHorizonPlannerService: 8 tests
- KPITrackingService: 10 tests
- Type definitions: 6 tests
- KPI weight validation: 5 tests

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    HorizonPlannerTab UI                     │
│  (Plan list, KPI dashboard, create dialog, trend charts)    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Endpoints                              │
│  /api/strategy/horizon/generate                              │
│  /api/strategy/horizon/list                                  │
│  /api/strategy/horizon/kpi                                   │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────────┐
│LongHorizonPlanner│ │KPITracking   │ │HorizonPlanner        │
│Service           │ │Service       │ │Integration           │
│- createPlan      │ │- createSnap  │ │- toProposals         │
│- generatePlan    │ │- getTrends   │ │- recordComplete      │
│- rollPlan        │ │- projectKPIs │ │- optimize            │
│- resolveDeps     │ │- getSummary  │ │- recommendations     │
└────────┬─────────┘ └──────┬───────┘ └──────────┬───────────┘
         │                  │                    │
         └──────────────────┼────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL                        │
│  horizon_plans | horizon_steps | kpi_snapshots               │
│  dependency_links | horizon_adjustments                      │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps (Phase 11 Week 7+)

1. **Real-time KPI collection** - Integrate with analytics APIs (GA4, GSC)
2. **AI-powered optimization** - Use Claude to suggest step adjustments
3. **Automated rolling** - Scheduled cron jobs for weekly roll-forward
4. **Gantt chart visualization** - Visual timeline with dependencies
5. **Alerting system** - Notifications when KPIs drift off-target

## Files Created

- `supabase/migrations/065_strategy_horizons.sql`
- `src/lib/strategy/longHorizonPlannerService.ts`
- `src/lib/strategy/kpiTrackingService.ts`
- `src/lib/strategy/horizonPlannerIntegration.ts`
- `src/app/api/strategy/horizon/generate/route.ts`
- `src/app/api/strategy/horizon/list/route.ts`
- `src/app/api/strategy/horizon/kpi/route.ts`
- `src/components/strategy/HorizonPlannerTab.tsx`
- `src/lib/__tests__/horizonPlanning.test.ts`
- `docs/PHASE11_WEEK5-6_HORIZON_PLANNING.md`
