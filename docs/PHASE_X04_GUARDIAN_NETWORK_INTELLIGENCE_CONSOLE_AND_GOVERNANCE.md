# Guardian X04: Network Intelligence Console & Governance Finalization

**Status**: Production Ready
**Phase**: X04 (Final governance & console layer for X01–X03)
**Date**: December 2025
**Risk Level**: Low (additive, no breaking changes)

---

## Overview

Guardian X04 is the governance and console layer that finalizes the **X-series Network Intelligence suite** (X01–X03). It introduces:

1. **Tenant-Scoped Feature Flags**: Conservative (opt-in) controls for X-series participation
2. **Governance Event Audit Trail**: Tracks feature flag changes, opt-in/out events, and policy acknowledgments
3. **Unified Network Intelligence Console**: Single dashboard for viewing X-series metrics, stats, and configuration
4. **Integration Gating**: Ensures X01–X03 services only operate when tenants have explicitly enabled features

### Design Principles

- **Privacy-First**: No feature is enabled by default; tenants must explicitly opt in
- **Non-Breaking**: X04 adds no functionality to Guardian core; it only controls visibility and participation
- **Audit-Ready**: Every governance action is logged for compliance and troubleshooting
- **Transparent**: Tenants can see exactly which features are enabled and when they were changed

---

## Architecture

### Feature Flags (X04-T01)

**Table**: `guardian_network_feature_flags` (tenant-scoped)

| Flag | Default | Purpose |
|------|---------|---------|
| `enable_network_telemetry` | `false` | Participate in hourly metric ingestion (X01) |
| `enable_network_benchmarks` | `false` | Access cohort-level benchmarks (X01/X02) |
| `enable_network_anomalies` | `false` | View anomaly detection results (X02) |
| `enable_network_early_warnings` | `false` | Receive pattern-based early warnings (X03) |
| `enable_ai_hints` | `false` | Enable AI-generated suggestions in console |
| `enable_cohort_metadata_sharing` | `false` | Allow region/vertical in cohort derivation |

**RLS Policy**: Tenant can only see and modify their own flags row.

### Governance Events (X04-T01)

**Table**: `guardian_network_governance_events` (tenant-scoped audit trail)

Tracks all flag changes, opt-in/out events, and policy acknowledgments with:
- `event_type`: 'opt_in', 'opt_out', 'flags_changed', 'policy_acknowledged', 'consent_granted'
- `context`: Which feature was affected ('network_telemetry', 'benchmarks', etc.)
- `details`: Non-PII event details (state transitions, reasons)
- `actor_id`: User who triggered the action

**RLS Policy**: Tenant can only see their own governance events.

### Services (X04-T02 to X04-T05)

#### `networkFeatureFlagsService.ts`
- `getNetworkFeatureFlagsForTenant(tenantId)` — Get flags with in-memory caching (60s TTL)
- `upsertNetworkFeatureFlags(tenantId, patch, actorId)` — Update flags and log governance events
- `clearFeatureFlagsCache(tenantId)` — Invalidate cache

#### `networkGovernanceLogger.ts`
- `logNetworkGovernanceEvent(input)` — Log governance action with PII sanitization
- `getNetworkGovernanceEventsForTenant(tenantId, options)` — Retrieve audit trail with filtering

#### `networkOverviewService.ts`
- `getNetworkOverviewForTenant(tenantId)` — Aggregate X01–X03 metrics + flags + governance events into single dashboard model

### APIs (X04-T04)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/guardian/admin/network/settings` | GET | Retrieve feature flags |
| `/api/guardian/admin/network/settings` | PATCH | Update feature flags |
| `/api/guardian/admin/network/governance` | GET | Retrieve governance events |
| `/api/guardian/admin/network/overview` | GET | Get unified console dashboard |

### Console UI (X04-T06)

**Page**: `/guardian/admin/network`

Three-tab layout:

1. **Overview Tab**
   - Feature flag status badges
   - KPIs: anomalies (30d), open warnings, benchmarks available, cohorts used
   - Recent anomalies list
   - Recent early warnings list

2. **Insights Tab**
   - Conditional visibility of X02 anomalies and X03 early warnings based on flags
   - Messaging if features are disabled

3. **Settings Tab**
   - Toggles for each feature flag with descriptions
   - Governance & history panel showing recent events
   - Privacy guarantee statement

---

## Feature Flag Integration with X01–X03

### X01: Telemetry Ingestion
- **Entry Point**: `ingestHourlyTelemetryForTenant()`
- **Check**: If `enableNetworkTelemetry` is false, skip ingestion for that tenant
- **Behavior**: Disabled tenants do not contribute to hourly aggregations

### X02: Benchmarks & Anomalies
- **Benchmark API**: Requires `enableNetworkBenchmarks` true
- **Anomaly API**: Requires `enableNetworkAnomalies` true
- **Behavior**: Return `4xx` error with clear message if disabled

### X03: Early Warnings
- **Early Warning Generation**: Requires `enableNetworkEarlyWarnings` true
- **Early Warning API**: Requires `enableNetworkEarlyWarnings` true
- **Behavior**: Skip processing for disabled tenants; deny access via API

### Cohort Derivation
- **Metadata Sharing**: If `enableCohortMetadataSharing` is false, treat tenant as 'global-only'
- **Behavior**: Only 'global' cohort key used; no region/vertical-specific cohorts

### AI Hints
- **Flag**: `enableAiHints`
- **Behavior**: Skip AI generation for disabled tenants; show only deterministic hints

---

## Configuration Recommendations

### Development Environment
```
All flags: false (test with explicit opt-in)
```

### Staging Environment
```
enable_network_telemetry: true (for testing X01–X03)
enable_network_benchmarks: true
enable_network_anomalies: true
enable_network_early_warnings: true
enable_ai_hints: false (optional)
enable_cohort_metadata_sharing: true (for testing cohorts)
```

### Production Environment
```
All flags: false (conservative default)
Tenants must explicitly enable via Network Intelligence console
```

---

## Governance Event Examples

### Opt-In Event
```json
{
  "tenant_id": "abc123",
  "event_type": "opt_in",
  "context": "network_telemetry",
  "actor_id": "user@example.com",
  "details": {
    "reason": "admin_initiated"
  }
}
```

### Flag Change Event
```json
{
  "tenant_id": "abc123",
  "event_type": "flags_changed",
  "context": "early_warnings",
  "actor_id": "operator@company.com",
  "details": {
    "previous_state": false,
    "new_state": true,
    "reason": "compliance_requirement"
  }
}
```

---

## Privacy & Compliance

### No Cross-Tenant Data Leakage
- Feature flags and governance events are strictly tenant-scoped via RLS
- No flag updates from one tenant affect another
- Governance audit trails are isolated per tenant

### PII Sanitization
- Event details are sanitized to remove: email, password, token, key, credential, auth fields
- Oversized fields are truncated (500 chars)
- Raw payloads are never stored

### Audit Trail
- Every flag change is logged with actor ID and timestamp
- Governance events are immutable (append-only)
- Compliance teams can review tenant participation history

---

## Rollout Checklist

- [ ] Apply X04 SQL migrations (590, 591, 592, 593)
- [ ] Deploy networkFeatureFlagsService, networkGovernanceLogger, networkOverviewService
- [ ] Deploy `/api/guardian/admin/network/*` endpoints
- [ ] Deploy `/guardian/admin/network` console page
- [ ] Verify RLS policies on new tables
- [ ] Test feature flag gating in X01–X03 entry points
- [ ] Manual QA: enable/disable flags, verify X-series behavior changes
- [ ] Document tenant onboarding process for opt-in
- [ ] Brief operators on governance event review
- [ ] Monitor governance event table for audit trail integrity

---

## Testing

**Test Coverage**: 25+ tests for X04 components
- Feature flags service (defaults, caching, updates)
- Governance logger (event creation, sanitization, retrieval)
- Network overview aggregation
- API gating for X01–X03

**Test Location**: `tests/guardian/x04_network_intelligence_governance.test.ts`

---

## Future Extensions

1. **Tenant Self-Service Opt-In**: Allow tenants to enable/disable features without admin intervention
2. **Feature Rollout Rules**: Enable features for specific tenant cohorts (e.g., beta testing)
3. **Compliance Reports**: Auto-generate audit trails for SOC 2 compliance
4. **Cost Tracking**: Track telemetry ingestion costs per tenant and feature

---

## See Also

- [X-Series Overview](./X_SERIES_OVERVIEW.md)
- [X01 Network Telemetry](./PHASE_X01_GUARDIAN_NETWORK_TELEMETRY.md)
- [X02 Network Anomalies & Benchmarks](./PHASE_X02_GUARDIAN_NETWORK_ANOMALY_DETECTION.md)
- [X03 Network Early-Warning Signals](./PHASE_X03_GUARDIAN_NETWORK_EARLY_WARNING_SIGNALS_AND_HINTS.md)
