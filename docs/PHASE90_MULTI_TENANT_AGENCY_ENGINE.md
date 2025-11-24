# Phase 90: Unified Multi-Tenant Agency Engine (Nucleus Mode)

## Overview

Phase 90 transforms Unite-Hub into a fully isolated, multi-tenant system where each agency (tenant) has its own data boundaries, scaling rules, posting pools, orchestration queues, VIF libraries, and user roles.

## Architecture

### Tenant Isolation Model

```
┌─────────────────────────────────────────────────┐
│                  Unite-Hub Platform              │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  Agency A   │  │  Agency B   │  │ Agency C │ │
│  │  (Tenant)   │  │  (Tenant)   │  │ (Tenant) │ │
│  │             │  │             │  │          │ │
│  │ - Contacts  │  │ - Contacts  │  │ - Data   │ │
│  │ - Playbooks │  │ - Playbooks │  │ - Users  │ │
│  │ - Combat    │  │ - Combat    │  │ - etc    │ │
│  │ - Intel     │  │ - Intel     │  │          │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────┘
```

### Franchise/White-Label Support

```
Parent Agency (Franchise Owner)
├── Sub-Agency 1 (Franchisee)
├── Sub-Agency 2 (Franchisee)
└── Sub-Agency 3 (White-label Partner)
```

## Database Schema

### Core Tables

```sql
-- Top-level tenant container
CREATE TABLE agencies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  parent_agency_id UUID REFERENCES agencies(id),  -- Franchise support
  active BOOLEAN DEFAULT true,
  settings JSONB,
  metadata JSONB
);

-- User-agency role bindings
CREATE TABLE agency_users (
  id UUID PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL,  -- owner | manager | staff | client
  permissions JSONB,
  UNIQUE(agency_id, user_id)
);
```

### Tenant ID Expansion

All core tables gain `tenant_id`:
- contacts
- early_warning_events
- performance_reality_snapshots
- scaling_health_snapshots
- founder_intel_snapshots
- combat_rounds
- autopilot_playbooks
- autopilot_actions
- autopilot_preferences
- vif_archive_entries
- posting_engine_posts
- orchestration_schedules

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **owner** | Full control | All permissions, manage users, billing |
| **manager** | Operational control | Manage contacts, run engines, view reports |
| **staff** | Limited access | View data, execute assigned tasks |
| **client** | View-only | View their own data and reports |

## Backend Services

### Tenant Context Resolver

```typescript
import { resolveForRequest, assertTenantAccess } from '@/lib/tenancy';

// Resolve tenant from request
const context = await resolveForRequest(userId, tenantId);
// Returns: { tenantId, tenantName, role, isOwner, isManager }

// Check access
const hasAccess = await assertTenantAccess(userId, tenantId);
```

### Scoped Query Service

```typescript
import { query, insert, update, remove } from '@/lib/tenancy';

// All queries automatically scoped to tenant
const contacts = await query('contacts', tenantId, {
  filters: { status: 'active' },
  orderBy: 'created_at',
  limit: 50
});

// Inserts include tenant_id automatically
const contact = await insert('contacts', tenantId, {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### Engine Adapters

Each engine has a tenant adapter:

```typescript
// Orchestration
import { getTenantSchedules, getTenantAssets } from '@/lib/tenancy';

// Posting
import { getTenantTokens, postForTenant } from '@/lib/tenancy';

// Scaling
import { computeTenantScaling, recommendTenantMode } from '@/lib/tenancy';

// Intel
import { loadTenantIntel, loadTenantAlerts } from '@/lib/tenancy';
```

## API Endpoints

### Create Agency

```typescript
POST /api/agency/create
Body: { name, slug, parentAgencyId?, settings? }
Response: { success, agency }
```

### Switch Agency

```typescript
// Get user's agencies
GET /api/agency/switch
Response: { success, tenants: UserAgency[] }

// Switch to agency
POST /api/agency/switch
Body: { tenantId }
Response: { success, context: TenantContext }
```

## UI Components

### AgencySwitcher

Dropdown to switch between agencies:
- Shows all user's agencies
- Displays role badge
- Indicates inactive agencies

### TenantIndicator

Visual indicator of current tenant:
- Tenant name
- User's role badge
- Building icon

## Pages

### Agency Switcher Page

`/founder/agency-switcher`
- List all user's agencies
- Create new agency
- Switch to agency

### Agency Dashboard

`/founder/agency/[agencyId]/dashboard`
- Tenant-scoped stats
- Quick actions
- Permission info

## Truth Layer Compliance

### Data Isolation Rules

1. **No cross-tenant leakage** - All queries MUST include tenant_id
2. **AI scoping** - AI summaries reference only tenant data
3. **Global aggregates only** - Cross-tenant views show counts, no details
4. **Mandatory dimension** - tenant_id is required, not optional

### RLS Policies

```sql
-- Users can only view agencies they belong to
CREATE POLICY "Users can view agencies they belong to" ON agencies
  FOR SELECT USING (
    id IN (SELECT agency_id FROM agency_users WHERE user_id = auth.uid())
  );

-- Owners can manage their agencies
CREATE POLICY "Owners can manage their agencies" ON agencies
  FOR ALL USING (
    id IN (SELECT agency_id FROM agency_users WHERE user_id = auth.uid() AND role = 'owner')
  );
```

## Helper Functions

### Get User Agencies

```sql
SELECT * FROM get_user_agencies(user_id);
-- Returns: agency_id, agency_name, agency_slug, role, is_active
```

### Check Tenant Access

```sql
SELECT user_has_tenant_access(user_id, tenant_id);
-- Returns: boolean
```

### Get Tenant Hierarchy

```sql
SELECT * FROM get_tenant_hierarchy(tenant_id);
-- Returns: agency_id, agency_name, level (for franchise tree)
```

### Get Tenant Stats

```sql
SELECT get_tenant_stats(tenant_id);
-- Returns: { total_users, total_contacts, active_playbooks, sub_agencies }
```

## Implementation Checklist

- [x] Migration 133 with agencies and agency_users tables
- [x] Tenant_id added to all core tables
- [x] RLS policies for tenant isolation
- [x] Helper functions for tenant operations
- [x] Tenant Context Resolver service
- [x] Scoped Query Service
- [x] Orchestration Adapter
- [x] Posting Adapter
- [x] Scaling Adapter
- [x] Intel Adapter
- [x] Agency Service (CRUD)
- [x] API routes (create, switch)
- [x] AgencySwitcher component
- [x] TenantIndicator component
- [x] Agency Switcher page
- [x] Agency Dashboard page

## File Structure

```
src/lib/tenancy/
├── index.ts                        # Module exports
├── tenantTypes.ts                  # Type definitions
├── tenantContextResolver.ts        # Context resolution
├── tenantScopedQueryService.ts     # Scoped queries
├── tenantOrchestrationAdapter.ts   # Orchestration adapter
├── tenantPostingAdapter.ts         # Posting adapter
├── tenantScalingAdapter.ts         # Scaling adapter
├── tenantIntelAdapter.ts           # Intel adapter
└── agencyService.ts                # Agency CRUD

src/app/api/agency/
├── create/route.ts                 # POST create
└── switch/route.ts                 # GET/POST switch

src/components/tenancy/
├── index.ts                        # Component exports
├── AgencySwitcher.tsx              # Agency selector
└── TenantIndicator.tsx             # Current tenant display

src/app/founder/
├── agency-switcher/page.tsx        # Agency list/create
└── agency/[agencyId]/
    └── dashboard/page.tsx          # Tenant dashboard
```

## Usage Examples

### Create Agency

```typescript
const agency = await createAgency({
  name: 'My Agency',
  slug: 'my-agency',
}, userId);
```

### Query with Tenant Scope

```typescript
import { query } from '@/lib/tenancy';

const contacts = await query('contacts', tenantId, {
  filters: { status: 'active' },
  limit: 100
});
```

### Switch Tenant Context

```typescript
const context = await resolveForRequest(userId, newTenantId);

if (context) {
  // User has access
  localStorage.setItem('currentTenantId', newTenantId);
}
```

## Migration Notes

### Existing Data

The migration adds tenant_id as nullable initially. Existing data needs to be:
1. Associated with a default agency
2. Or migrated per-workspace to tenant

### Index Creation

Conditional index creation handles tables that may not exist:
```sql
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE ...) THEN
  CREATE INDEX IF NOT EXISTS ...
END IF;
```

## Future Enhancements (Phase 91+)

1. **Licensing** - Per-tenant feature flags and billing
2. **Franchise Expansion** - Multi-level hierarchy support
3. **Multi-region** - Geographic data isolation
4. **Global Monitoring** - Cross-tenant health dashboard (aggregates only)
5. **White-label Branding** - Per-tenant UI customization

## Summary

Phase 90 Nucleus Mode provides:

- ✅ Complete tenant isolation
- ✅ Franchise/white-label hierarchy
- ✅ Role-based access control
- ✅ Scoped queries for all tables
- ✅ Engine adapters for all systems
- ✅ Agency management UI
- ✅ Tenant context resolution
- ✅ RLS policies for data security
- ✅ Helper functions for common operations

This creates the foundation for Unite-Hub to operate as a true multi-tenant SaaS platform with enterprise-grade isolation and scalability.
