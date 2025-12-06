# Phase B32: Synthex Agency Multi-Workspace + Brand Switcher

**Status**: Complete
**Date**: 2025-12-07
**Phase**: B32 of Synthex Portal

## Overview

Phase B32 implements a comprehensive agency workspace management system that allows agencies to manage multiple client workspaces (tenants) from a single Synthex account. Features include a fast brand/workspace switcher and portfolio overview dashboard.

## Components Implemented

### 1. Database Migration (438_synthex_agency_workspaces.sql)

**Tables Created**:
- `synthex_agency_accounts` - Top-level agency entities with owner and settings
- `synthex_agency_clients` - Links tenants to agencies as managed clients
- `synthex_agency_memberships` - User memberships in agencies with roles
- `synthex_agency_active_tenant` - Tracks currently active tenant per user

**Key Features**:
- Client status enum: active, paused, archived
- Role-based access: owner, admin, member, viewer
- Helper function `get_user_agencies_with_stats` for dashboard queries
- Full RLS policies for agency and tenant isolation

### 2. Service Layer (agencyWorkspaceService.ts)

**Agency Management**:
- `getUserAgencies(userId)` - Get all agencies user belongs to
- `createAgency(userId, name, description)` - Create new agency
- `getAgency(agencyId)` - Get agency by ID

**Client Management**:
- `getAgencyClients(agencyId)` - List all clients for an agency
- `linkTenantToAgencyClient(agencyId, tenantId, label, domain)` - Link tenant
- `updateClientStatus(clientId, status)` - Update client status
- `removeAgencyClient(clientId)` - Remove client from agency

**Active Tenant**:
- `setActiveTenantForUser(userId, tenantId, agencyId)` - Switch active tenant
- `getActiveTenantForUser(userId)` - Get current active tenant

**Portfolio Summary**:
- `getAgencyPortfolioSummary(agencyId)` - Aggregated stats per client
  - SEO health scores
  - Active campaigns
  - Audience size
  - Leads this month
  - Risk indicators

### 3. API Routes

**GET/POST /api/synthex/agency**
- GET: List agencies for current user, or get portfolio summary
- POST: Create new agency

**GET/POST/PATCH/DELETE /api/synthex/agency/clients**
- Full CRUD for agency clients
- Admin access required for client management

**GET/POST /api/synthex/agency/switch**
- GET: Get current active tenant
- POST: Switch to a different tenant

### 4. UI Page (/synthex/agency)

**Features**:
- Agency selector dropdown in header
- Aggregate stats cards: Total Audience, Active Campaigns, Leads, Avg SEO Health
- Tabs: Overview, Clients, Add New
- Client cards with metrics and risk indicators
- One-click workspace switching
- Create agency and add client forms

## Usage Examples

### Create an Agency
```typescript
const agency = await createAgency('user-123', 'My Digital Agency', 'Full-service marketing');
```

### Link a Client
```typescript
const client = await linkTenantToAgencyClient(
  'agency-123',
  'tenant-456',
  'Acme Corporation',
  'acme.com'
);
```

### Switch Tenant
```typescript
await setActiveTenantForUser('user-123', 'tenant-456', 'agency-123');
```

### Get Portfolio Summary
```typescript
const portfolio = await getAgencyPortfolioSummary('agency-123');
// Returns: { agency_id, agency_name, total_clients, active_clients, clients[], aggregate_stats }
```

## Dependencies

- Supabase client libraries
- Existing Synthex tables for stats aggregation

## Migration Notes

Run migration 438 in Supabase SQL Editor:
```sql
\i supabase/migrations/438_synthex_agency_workspaces.sql
```

## Related Phases

- B10: SEO Reports (client SEO health)
- B12: Campaign Management (active campaigns)
- B17: Audience Intelligence (audience size)
- B19: Lead Management (leads count)
