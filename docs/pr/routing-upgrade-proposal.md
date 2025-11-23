# PR: Routing Upgrade Proposal

**Branch**: `abacus/routing-upgrade`
**Source Map**: `docs/abacus/routing-map.json`

---

## Summary

This PR modernizes the Next.js routing structure by:

1. Creating centralized route configuration (`src/lib/routing/route-config.ts`)
2. Standardizing route metadata across 120+ pages
3. Improving breadcrumb generation with proper parent-child relationships
4. Adding utility functions for auth/workspace checks

## Changes

### New Files

- `src/lib/routing/route-config.ts` - Centralized routing metadata
  - DASHBOARD_ROUTES (24 routes)
  - CLIENT_ROUTES (9 routes)
  - STAFF_ROUTES (10 routes)
  - CONSOLE_ROUTES (1 route)
  - MARKETING_ROUTES (8 routes)

### Functions Added

- `getRouteConfig(path)` - Get route metadata
- `getRouteLabel(path)` - Get human-readable label
- `requiresAuth(path)` - Check if auth required
- `requiresWorkspace(path)` - Check if workspace required
- `isAdminOnly(path)` - Check if admin only
- `getParentRoute(path)` - Get parent route
- `getBreadcrumbTrail(path)` - Generate breadcrumb trail

## Benefits

1. **Single source of truth** for route metadata
2. **Type-safe** route configuration
3. **Improved navigation** with proper breadcrumbs
4. **Better maintainability** when adding new routes
5. **Consistent auth/workspace checks** across the app

## Test Coverage

- Unit tests for route utility functions
- Tests for breadcrumb generation
- Tests for auth requirement checks

## Migration

No breaking changes. Existing routing continues to work. New components can import from `@/lib/routing/route-config`.

## Usage Examples

```typescript
import { getRouteLabel, requiresAuth, getBreadcrumbTrail } from '@/lib/routing/route-config';

// Get label
const label = getRouteLabel('/dashboard/contacts'); // "Contacts"

// Check auth
const needsAuth = requiresAuth('/dashboard/overview'); // true

// Get breadcrumbs
const trail = getBreadcrumbTrail('/dashboard/campaigns/drip');
// [
//   { label: "Dashboard", href: "/dashboard" },
//   { label: "Campaigns", href: "/dashboard/campaigns" },
//   { label: "Drip Campaigns", href: "/dashboard/campaigns/drip" }
// ]
```

## Validation Checklist

- [x] No protected files modified
- [x] Auth patterns preserved
- [x] Workspace isolation maintained
- [x] Documentation included
- [ ] Tests pass (to be verified)

---

**Risk Level**: Low
**Recommendation**: MERGE after test verification
