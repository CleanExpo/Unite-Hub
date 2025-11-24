# Phase 91: Licensing, Franchise & Region Expansion Engine (LFRE)

## Overview

Phase 91 adds hierarchical agency structures, region ownership, revenue share logic, and cross-tenant franchise controls to prepare Unite-Hub for national/international expansion and licensee models.

## Architecture

### Franchise Hierarchy

```
Master Agency (Franchisor)
├── Regional Licensee (AU-NSW)
│   ├── Sub-Agency A
│   └── Sub-Agency B
├── Regional Licensee (AU-VIC)
│   └── Sub-Agency C
└── White-label Partner (NZ)
    └── Sub-Agency D
```

### Revenue Flow

```
Sub-Agency Revenue
      ↓
Regional Aggregate (rollup_franchise_metrics)
      ↓
Parent Dashboard (aggregates only)
      ↓
Revenue Share Calculation
```

## Database Schema

### Core Tables

```sql
-- Geographic territories
CREATE TABLE regions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL,
  state_code TEXT,
  boundary_geojson JSONB,
  parent_region_id UUID REFERENCES regions(id)
);

-- License tier definitions
CREATE TABLE franchise_tiers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  max_clients INTEGER,        -- -1 = unlimited
  max_users INTEGER,
  max_sub_agencies INTEGER,
  posting_rate_limit_hour INTEGER,
  ai_budget_monthly INTEGER,  -- in cents
  monthly_fee INTEGER,
  revenue_share_percent NUMERIC(5,2),
  features JSONB
);

-- Agency-region-tier assignments
CREATE TABLE agency_licenses (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  region_id UUID REFERENCES regions(id),
  tier_id INTEGER REFERENCES franchise_tiers(id),
  license_key TEXT UNIQUE,
  expires_on DATE NOT NULL,
  status TEXT,  -- active | suspended | expired | cancelled
  current_clients INTEGER,
  current_users INTEGER,
  UNIQUE(agency_id, region_id)
);

-- Aggregated metrics for rollups
CREATE TABLE franchise_metrics (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  period_start DATE,
  period_end DATE,
  total_clients INTEGER,
  gross_revenue INTEGER,
  mrr INTEGER,
  avg_client_health NUMERIC(5,2),
  UNIQUE(agency_id, period_start, period_end)
);
```

### Default Tiers

| Tier | Max Clients | Max Users | Post Rate/hr | AI Budget | Monthly Fee |
|------|-------------|-----------|--------------|-----------|-------------|
| Starter | 25 | 3 | 20 | $5 | $99 |
| Growth | 100 | 10 | 50 | $20 | $299 |
| Professional | 500 | 25 | 200 | $100 | $999 |
| Enterprise | ∞ | ∞ | ∞ | ∞ | 10% rev share |

## Backend Services

### Agency Hierarchy Service

```typescript
import { getChildAgencies, getParentAgency, getAgencyTree } from '@/lib/franchise';

// Get children
const children = await getChildAgencies(parentId);

// Get parent
const parent = await getParentAgency(childId);

// Get full tree
const tree = await getAgencyTree(rootId);
```

### Region Ownership Service

```typescript
import { assignRegion, listRegionsForAgency, isRegionOwnedByAgency } from '@/lib/franchise';

// Assign region to agency
const license = await assignRegion({
  agencyId: 'abc-123',
  regionId: 'region-nsw',
  tierId: 2,  // Growth tier
  expiresOn: '2025-12-31',
});

// List agency's regions
const regions = await listRegionsForAgency(agencyId);

// Check ownership
const owns = await isRegionOwnedByAgency(regionId, agencyId);
```

### Franchise Tier Service

```typescript
import { getTier, getAgencyLicense, applyTierLimits, hasFeature } from '@/lib/franchise';

// Get tier details
const tier = await getTier(tierId);

// Get agency's license
const license = await getAgencyLicense(agencyId);

// Check limits before action
const { allowed, message } = await applyTierLimits(agencyId, 'add_client');
if (!allowed) {
  throw new Error(message);
}

// Check feature availability
const canUseAutopilot = await hasFeature(agencyId, 'autopilot');
```

### Revenue Rollup Service

```typescript
import { rollUpToParent, recordMetrics, computeClientGrowth } from '@/lib/franchise';

// Get aggregated metrics for parent
const rollup = await rollUpToParent(parentId, periodStart, periodEnd);
// Returns: { totalAgencies, totalClients, totalRevenue, avgHealth }

// Record metrics for agency
await recordMetrics(agencyId, periodStart, periodEnd, {
  totalClients: 50,
  grossRevenue: 100000,  // in cents
  mrr: 50000,
  avgClientHealth: 85.5,
});

// Get growth over time
const growth = await computeClientGrowth(agencyId, 6);  // 6 periods
```

## API Endpoints

### Assign Region

```typescript
POST /api/franchise/assign-region
Body: { agencyId, regionId, tierId, expiresOn }
Auth: Agency owner or parent agency owner
Response: { success, license }
```

### Get Agency Tree

```typescript
GET /api/franchise/agency-tree?agencyId={id}
Auth: Agency member
Response: { success, tree, license, children, rollup }
```

## UI Components

### TierBadge

Visual indicator of franchise tier with icon and color:
- Starter: Gray, Star icon
- Growth: Blue, Zap icon
- Professional: Purple, Rocket icon
- Enterprise: Amber, Crown icon

### HierarchyTree

Displays parent-child agency structure:
- Root agency (highlighted)
- Child agencies with tier badges
- Click to navigate to child

## Helper Functions

### Get Agency License

```sql
SELECT * FROM get_agency_license(agency_id);
-- Returns: license_id, region_name, tier_name, status, limits, usage
```

### Check Tier Limit

```sql
SELECT check_tier_limit(agency_id, 'clients');
-- Returns: boolean (true if within limit)
```

### Get Child Agencies

```sql
SELECT * FROM get_child_agencies(parent_id);
-- Returns: agency details with license info
```

### Rollup Metrics

```sql
SELECT rollup_franchise_metrics(parent_id, period_start, period_end);
-- Returns: { total_agencies, total_clients, total_revenue, avg_health }
```

## Truth Layer Compliance

### Data Protection Rules

1. **No cross-agency data leaks** - Rollups show only aggregates
2. **AI summaries scoped** - No performance implications beyond measured data
3. **Region conflicts disclosed** - Ownership conflicts fully transparent
4. **Tier constraints visible** - Limits shown in UI at all times
5. **Expiry warnings** - Franchise status always transparent

### Limit Enforcement

```typescript
// Before adding client
const { allowed, message } = await applyTierLimits(agencyId, 'add_client');

if (!allowed) {
  // Show truth layer warning
  showWarning(`Cannot add client: ${message}`);
  return;
}
```

## File Structure

```
src/lib/franchise/
├── index.ts                     # Module exports
├── franchiseTypes.ts            # Type definitions
├── agencyHierarchyService.ts    # Parent-child management
├── regionOwnershipService.ts    # Region assignment
├── franchiseTierService.ts      # Tier limits
└── revenueRollupService.ts      # Metric aggregation

src/app/api/franchise/
├── assign-region/route.ts       # POST assign
└── agency-tree/route.ts         # GET tree

src/components/franchise/
├── index.ts                     # Component exports
├── TierBadge.tsx                # Tier indicator
└── HierarchyTree.tsx            # Hierarchy display

src/app/founder/franchise/
└── page.tsx                     # Dashboard
```

## Usage Examples

### Create Regional Franchise

```typescript
import { createAgency, addAgencyUser } from '@/lib/tenancy';
import { assignRegion } from '@/lib/franchise';

// 1. Create sub-agency
const agency = await createAgency({
  name: 'Brisbane Agency',
  slug: 'brisbane-agency',
}, ownerId);

// 2. Set parent
await setParentAgency(agency.id, parentAgencyId);

// 3. Assign region with tier
await assignRegion({
  agencyId: agency.id,
  regionId: 'region-qld-brisbane',
  tierId: 2,  // Growth
  expiresOn: '2026-12-31',
});
```

### Check Limits Before Action

```typescript
import { applyTierLimits, updateLicenseUsage } from '@/lib/franchise';

async function addClient(agencyId: string, clientData: any) {
  // Check limit
  const { allowed, message } = await applyTierLimits(agencyId, 'add_client');

  if (!allowed) {
    throw new Error(`Tier limit: ${message}`);
  }

  // Add client
  const client = await createClient(clientData);

  // Update usage count
  const license = await getAgencyLicense(agencyId);
  await updateLicenseUsage(agencyId, {
    clients: license.currentClients + 1,
  });

  return client;
}
```

### View Franchise Metrics

```typescript
import { rollUpToParent, getMetricsHistory } from '@/lib/franchise';

// Get current period rollup
const rollup = await rollUpToParent(parentId, periodStart, periodEnd);
console.log(`Total network revenue: $${rollup.totalRevenue / 100}`);

// Get history for trend
const history = await getMetricsHistory(agencyId, 12);  // 12 months
```

## Implementation Checklist

- [x] Migration 134 with regions, tiers, licenses, metrics tables
- [x] Default tier seeding (Starter, Growth, Professional, Enterprise)
- [x] Agency Hierarchy Service
- [x] Region Ownership Service
- [x] Franchise Tier Service
- [x] Revenue Rollup Service
- [x] API routes (assign-region, agency-tree)
- [x] TierBadge component
- [x] HierarchyTree component
- [x] Franchise Dashboard page
- [x] Helper functions (get_agency_license, check_tier_limit, etc.)

## Future Enhancements

1. **Multi-region licensing** - Agency owns multiple non-contiguous regions
2. **Automated billing** - Stripe integration for license fees
3. **Performance-based tiers** - Auto-upgrade based on metrics
4. **Geographic visualization** - Interactive map with region boundaries
5. **Franchise analytics** - Cross-network benchmarking

## Summary

Phase 91 LFRE provides:

- ✅ Hierarchical agency structures
- ✅ Region ownership with territories
- ✅ License tiers with configurable limits
- ✅ Revenue rollup to parent agencies
- ✅ Tier-based feature gating
- ✅ Usage tracking and enforcement
- ✅ Franchise dashboard UI
- ✅ Truth layer compliant aggregates

This establishes the foundation for Unite-Hub to operate as a franchise platform with licensee controls, regional expansion, and multi-tier pricing.
