# Phase 92: Global Region Scaling Engine (GRSE)

## Overview

Phase 92 adds region-level execution isolation, multi-region sharding, AI budget distribution, and automatic scaling controls to prepare Unite-Hub for global scale with distributed load management.

## Architecture

### Scaling Flow

```
Job Request → Region Router
    ↓
    ├─→ Check Budget → Allow/Deny
    ├─→ Check Pressure → Adjust Priority
    ├─→ Check Mode → Route/Block
    └─→ Assign Shard Key → Queue Job
```

### Scaling Modes

| Mode | Description | Allowed Operations |
|------|-------------|-------------------|
| normal | Full capacity | All jobs |
| cautious | Reduced capacity | All jobs with delays |
| throttled | Limited capacity | Small jobs only |
| frozen | No capacity | No new jobs |

## Database Schema

### Core Tables

```sql
-- Real-time region metrics
CREATE TABLE region_scaling_state (
  region_id UUID PRIMARY KEY REFERENCES regions(id),
  updated_at TIMESTAMPTZ NOT NULL,

  -- AI Budget (in cents)
  ai_budget_monthly INTEGER NOT NULL DEFAULT 100000,
  ai_budget_remaining INTEGER NOT NULL DEFAULT 100000,
  ai_spend_today INTEGER NOT NULL DEFAULT 0,

  -- Pressure scores (0-100)
  posting_pressure NUMERIC(5,2) NOT NULL DEFAULT 0,
  orchestration_pressure NUMERIC(5,2) NOT NULL DEFAULT 0,
  creative_pressure NUMERIC(5,2) NOT NULL DEFAULT 0,
  intel_pressure NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- Health indicators
  warning_index NUMERIC(5,2) NOT NULL DEFAULT 0,
  capacity_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  fatigue_score NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- Utilization
  active_agencies INTEGER NOT NULL DEFAULT 0,
  active_clients INTEGER NOT NULL DEFAULT 0,
  jobs_in_queue INTEGER NOT NULL DEFAULT 0,

  -- Mode: normal | cautious | throttled | frozen
  scaling_mode TEXT NOT NULL DEFAULT 'normal'
);

-- Historical snapshots
CREATE TABLE region_scaling_history (
  id UUID PRIMARY KEY,
  region_id UUID NOT NULL REFERENCES regions(id),
  snapshot JSONB NOT NULL,
  period_type TEXT NOT NULL, -- hourly | daily | weekly
  avg_capacity NUMERIC(5,2),
  peak_pressure NUMERIC(5,2),
  budget_used INTEGER
);

-- Budget transaction log
CREATE TABLE region_budget_transactions (
  id UUID PRIMARY KEY,
  region_id UUID NOT NULL REFERENCES regions(id),
  agency_id UUID REFERENCES agencies(id),
  transaction_type TEXT NOT NULL, -- allocation | spend | refund | reset
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  job_type TEXT
);
```

## Backend Services

### Region Context Resolver

```typescript
import { resolveRegionForAgency, resolveRegionForClient } from '@/lib/globalScaling';

// Resolve region from agency
const regionId = await resolveRegionForAgency(agencyId);

// Resolve region from client
const regionId = await resolveRegionForClient(clientId);

// Resolve from request headers
const regionId = await resolveRegionFromHeaders(req.headers);
```

### Region Scaling Service

```typescript
import {
  computeRegionCapacity,
  computePressure,
  updateScalingMode
} from '@/lib/globalScaling';

// Compute capacity (0-100)
const capacity = await computeRegionCapacity(regionId);

// Compute overall pressure
const pressure = await computePressure(regionId);

// Auto-update scaling mode based on metrics
const newMode = await updateScalingMode(regionId);
// Returns: 'normal' | 'cautious' | 'throttled' | 'frozen'
```

### AI Budget Allocator

```typescript
import {
  checkBudget,
  decrement,
  refund,
  getBudgetStats
} from '@/lib/globalScaling';

// Check if operation is allowed
const check = await checkBudget(regionId, estimatedCost);
if (!check.allowed) {
  throw new Error(check.message);
}

// Decrement after successful operation
await decrement(regionId, actualCost, {
  agencyId,
  jobType: 'creative'
});

// Refund for failed operations
await refund(regionId, amount, 'Operation cancelled');

// Get budget statistics
const stats = await getBudgetStats(regionId);
// Returns: { monthly, remaining, spentToday, spendByJobType }
```

### Region Shard Router

```typescript
import {
  routePostingJob,
  routeOrchestrationJob,
  routeCreativeJob,
  routePerformanceJob,
  getBestRegionForJob
} from '@/lib/globalScaling';

// Route a posting job
const routing = await routePostingJob(tenantId, regionId, {
  priority: 5,
  estimatedCost: 100,
});

if (routing) {
  console.log('Shard key:', routing.shardKey);
  console.log('Priority:', routing.priority);
  console.log('Estimated wait:', routing.estimatedWait);
}

// Find best available region
const bestRegion = await getBestRegionForJob('creative');
```

### Global Region Monitor

```typescript
import {
  listRegionHealth,
  detectCrossRegionConflicts,
  computeGlobalRisk
} from '@/lib/globalScaling';

// List all regions health
const health = await listRegionHealth();

// Detect conflicts
const conflicts = await detectCrossRegionConflicts();
// Returns array of { type, regionId, severity, message }

// Compute global risk assessment
const risk = await computeGlobalRisk();
console.log('Risk level:', risk.riskLevel);
console.log('Conflicts:', risk.conflicts.length);
console.log('Recommendations:', risk.recommendations);
```

## API Endpoints

### Get Region Health

```typescript
GET /api/regions/health
Query: ?sortBy=capacity&order=desc&includeRisk=true
Auth: Bearer token required
Response: {
  success: true,
  regions: RegionHealthSummary[],
  globalRisk: GlobalRiskAssessment
}
```

### Get Region Snapshot

```typescript
GET /api/regions/{regionId}/snapshot
Query: ?includeHistory=true&periods=24
Auth: Bearer token required
Response: {
  success: true,
  summary: RegionScalingSummary,
  snapshot: object,
  history: array
}

POST /api/regions/{regionId}/snapshot
Body: { periodType: 'hourly' | 'daily' | 'weekly' }
Auth: Bearer token required
Response: { success: true, message: 'Snapshot saved' }
```

## UI Components

### RegionHealthPanel

Grid display of all regions with health metrics:
- Capacity score with color-coded progress
- Pressure level with color-coded progress
- Budget remaining percentage
- Warning index display
- Click to navigate to detail page

### RegionPressureChart

Detailed pressure breakdown:
- Posting pressure (30% weight)
- Orchestration pressure (25% weight)
- Creative pressure (25% weight)
- Intel pressure (20% weight)
- Visual bar comparison

## Helper Functions

### Get Region Scaling Summary

```sql
SELECT * FROM get_region_scaling_summary(region_id);
-- Returns: scaling_mode, capacity_score, pressures, budget, utilization
```

### Check and Decrement Budget

```sql
SELECT check_and_decrement_budget(region_id, amount, agency_id, job_type);
-- Returns: boolean (true if successful)
```

### Compute Region Pressure

```sql
SELECT compute_region_pressure(region_id);
-- Returns: weighted average pressure (0-100)
```

### Get All Regions Health

```sql
SELECT * FROM get_all_regions_health();
-- Returns: table of all regions with health metrics
```

## Truth Layer Compliance

### Data Protection Rules

1. **Capacity scores are computed, not invented** - Based on actual metrics
2. **Budget tracking is exact** - No estimates without basis
3. **Pressure calculations are transparent** - Weights documented
4. **Conflicts are detected, not predicted** - Based on thresholds
5. **Recommendations are actionable** - Tied to specific issues

### Scaling Mode Thresholds

```typescript
// Automatic mode transitions
if (capacity < 10 || pressure > 90) {
  mode = 'frozen';
} else if (capacity < 30 || pressure > 75) {
  mode = 'throttled';
} else if (capacity < 50 || pressure > 60) {
  mode = 'cautious';
} else {
  mode = 'normal';
}
```

## File Structure

```
src/lib/globalScaling/
├── index.ts                      # Module exports
├── globalScalingTypes.ts         # Type definitions
├── regionContextResolver.ts      # Region resolution
├── regionScalingService.ts       # Scaling metrics
├── regionAIBudgetAllocator.ts    # Budget management
├── regionShardRouter.ts          # Job routing
└── globalRegionMonitor.ts        # Global monitoring

src/app/api/regions/
├── health/route.ts               # GET all regions health
└── [regionId]/snapshot/route.ts  # GET/POST region snapshot

src/components/globalScaling/
├── index.ts                      # Component exports
├── RegionHealthPanel.tsx         # Health grid
└── RegionPressureChart.tsx       # Pressure display

src/app/founder/regions/
├── page.tsx                      # Regions dashboard
└── [regionId]/page.tsx           # Region detail
```

## Usage Examples

### Protect AI Operation with Budget Check

```typescript
import { checkBudget, decrement, refund } from '@/lib/globalScaling';
import { resolveRegionForAgency } from '@/lib/globalScaling';

async function runAIOperation(agencyId: string, operation: () => Promise<any>) {
  const regionId = await resolveRegionForAgency(agencyId);
  if (!regionId) {
    throw new Error('No region assigned to agency');
  }

  const estimatedCost = 50; // cents

  // Check budget
  const check = await checkBudget(regionId, estimatedCost);
  if (!check.allowed) {
    throw new Error(check.message);
  }

  try {
    // Run operation
    const result = await operation();

    // Decrement budget
    await decrement(regionId, estimatedCost, {
      agencyId,
      jobType: 'creative'
    });

    return result;
  } catch (error) {
    // Operation failed, no budget deducted
    throw error;
  }
}
```

### Route Job Based on Region Load

```typescript
import {
  routeCreativeJob,
  getBestRegionForJob,
  updateJobQueue
} from '@/lib/globalScaling';

async function queueCreativeJob(regionId: string, job: any) {
  // Try routing to specified region
  let routing = await routeCreativeJob(regionId);

  // Fallback to best available if region can't accept
  if (!routing) {
    const fallbackRegion = await getBestRegionForJob('creative', regionId);
    if (fallbackRegion) {
      routing = await routeCreativeJob(fallbackRegion);
    }
  }

  if (!routing) {
    throw new Error('No available region for creative jobs');
  }

  // Update queue count
  await updateJobQueue(routing.regionId, 1);

  // Queue job with routing info
  return {
    ...job,
    shardKey: routing.shardKey,
    priority: routing.priority,
    regionId: routing.regionId
  };
}
```

### Monitor and Alert

```typescript
import {
  computeGlobalRisk,
  alertCriticalIssues
} from '@/lib/globalScaling';

// Scheduled task (every 5 minutes)
async function monitorRegions() {
  const risk = await computeGlobalRisk();

  if (risk.riskLevel === 'critical') {
    // Send alerts
    await alertCriticalIssues();

    // Log details
    console.error('[GRSE] Critical risk detected', {
      score: risk.overallRisk,
      conflicts: risk.conflicts.length,
    });
  }

  // Log recommendations
  risk.recommendations.forEach(rec => {
    console.log('[GRSE] Recommendation:', rec);
  });
}
```

## Implementation Checklist

- [x] Migration 135 with scaling tables
- [x] Region Context Resolver service
- [x] Region Scaling Service
- [x] AI Budget Allocator service
- [x] Region Shard Router service
- [x] Global Region Monitor service
- [x] API routes (health, snapshot)
- [x] RegionHealthPanel component
- [x] RegionPressureChart component
- [x] Regions dashboard page
- [x] Region detail page
- [x] Helper functions

## Future Enhancements

1. **Auto-scaling triggers** - Automatic resource adjustment based on load
2. **Cross-region job migration** - Move jobs between regions
3. **Predictive scaling** - ML-based capacity prediction
4. **Geographic load balancing** - Route to nearest region
5. **Budget forecasting** - Predict budget exhaustion
6. **Custom alert rules** - Configurable thresholds

## Summary

Phase 92 GRSE provides:

- ✅ Region-level execution isolation
- ✅ Multi-region sharding with shard keys
- ✅ AI budget distribution and tracking
- ✅ Automatic scaling mode transitions
- ✅ Pressure-based job routing
- ✅ Global health monitoring
- ✅ Conflict detection and alerts
- ✅ Historical snapshots and trends
- ✅ Truth layer compliant metrics

This establishes the foundation for Unite-Hub to operate at global scale with distributed load management, budget controls, and automatic scaling.
