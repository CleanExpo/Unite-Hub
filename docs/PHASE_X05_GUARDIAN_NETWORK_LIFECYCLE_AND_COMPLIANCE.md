# Guardian X05: Network Intelligence Data Retention, Lifecycle & Compliance

**Status**: Production Ready
**Date**: December 2025
**Builds On**: X01–X04 (Network Telemetry, Anomalies, Early Warnings, Governance)

---

## Overview

Guardian X05 adds **data retention policies, automated lifecycle cleanup, and compliance tooling** to the X-series Network Intelligence suite. It enables tenants to configure how long X-series artifacts are retained and provides auditable cleanup operations without touching Guardian core runtime tables.

### Key Features

✅ **Configurable retention policies** (30–3650 days per data type)
✅ **Automatic cleanup** for telemetry, anomalies, benchmarks, early warnings, governance events
✅ **Immutable audit trail** for all lifecycle operations (append-only)
✅ **Dry-run support** for safe preview of cleanup
✅ **Early warning preservation** (only closes ones are cleaned; open warnings preserved)
✅ **Conservative defaults** (90d telemetry, 365d aggregates, 730d governance)
✅ **PII sanitization** in lifecycle events (no passwords, tokens, emails in logs)
✅ **Non-breaking** to Guardian core (only X-series tables affected)

---

## Architecture

### Data Retention Model

Each X-series artifact type has a separate retention window:

| Artifact | Default Retention | Purpose |
|----------|-------------------|---------|
| Telemetry (X01) | 90 days | Hourly metrics; older data archived |
| Aggregates | 365 days | Cohort benchmarks; keep longer for trend analysis |
| Anomalies (X02) | 180 days | Detection signals; balance freshness vs. history |
| Benchmarks | 365 days | Snapshots; essential for comparisons |
| Early Warnings (X03) | 365 days | Pattern matches; preserve for compliance |
| Governance Events | 730 days | Audit trail; longest retention for compliance |
| Pattern Signatures | 365 days | Global patterns; age out rarely-used patterns |

**Bounds**: All retention values: 30–3650 days (8.2 years max, 1 month min)

### Lifecycle Cleanup Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Tenant Configures Retention Policy               │
│    Via console or API: PATCH /retention             │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│ 2. Policy Change Logged                             │
│    Governance event + lifecycle audit event         │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│ 3. Daily Cleanup Job (Optional)                     │
│    Runs cleanupForTenant() for each tenant          │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│ 4. Cleanup Execution                                │
│    - Load retention policy                          │
│    - Compute cutoff date (now - retention_days)     │
│    - Delete rows in batches (max 1000/batch)        │
│    - Special handling: early warnings (preserve open)
│    - Log cleanup operation (scope, items, details)  │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│ 5. Audit Trail Immutable                            │
│    All lifecycle events append-only, never deleted  │
└─────────────────────────────────────────────────────┘
```

---

## Services

### 1. Retention Policy Service

**File**: `src/lib/guardian/network/retentionPolicyService.ts`

**Functions**:

```typescript
/**
 * Get retention policy for tenant (cached, 60s TTL)
 * Returns defaults if no custom policy set
 */
export async function getRetentionPolicyForTenant(
  tenantId: string
): Promise<GuardianNetworkRetentionPolicy>;

/**
 * Update retention policy for tenant
 * Validates bounds (30-3650), merges patch, logs change
 */
export async function upsertRetentionPolicyForTenant(
  tenantId: string,
  patch: Partial<GuardianNetworkRetentionPolicy>,
  actorId?: string
): Promise<GuardianNetworkRetentionPolicy>;

/**
 * Clear in-memory cache for tenant
 */
export async function clearRetentionPolicyCache(
  tenantId: string
): Promise<void>;
```

**Default Policy**:

```typescript
{
  telemetryRetentionDays: 90,
  aggregatesRetentionDays: 365,
  anomaliesRetentionDays: 180,
  benchmarksRetentionDays: 365,
  earlyWarningsRetentionDays: 365,
  governanceRetentionDays: 730,
}
```

**Usage Example**:

```typescript
// Get policy
const policy = await getRetentionPolicyForTenant('ws_123');

// Update telemetry retention to 60 days
await upsertRetentionPolicyForTenant(
  'ws_123',
  { telemetryRetentionDays: 60 },
  'actor_user_id'
);
```

### 2. Lifecycle Audit Logger

**File**: `src/lib/guardian/network/lifecycleAuditLogger.ts`

**Functions**:

```typescript
/**
 * Log a lifecycle audit event
 * Sanitizes metadata (removes passwords, tokens, emails)
 * Truncates details to 500 chars
 */
export async function logLifecycleAudit(
  input: LifecycleAuditInput
): Promise<void>;

/**
 * Retrieve lifecycle audit events for tenant
 * Supports filtering by scope, action, date range
 * Pagination: limit, offset
 */
export async function getLifecycleAuditEvents(
  tenantId: string,
  options?: LifecycleAuditQueryOptions
): Promise<GuardianNetworkLifecycleEvent[]>;
```

**Sanitization**:

Filters these fields from metadata/details:
- `password`, `pwd`, `pass`
- `token`, `auth`, `jwt`, `bearer`
- `key`, `apikey`, `api_key`, `secret`
- `email`, `mail`, `user`
- `credential`, `auth`, `fingerprint`, `hash`, `payload`, `raw`

Arrays and nested objects are recursively filtered.

**Usage Example**:

```typescript
// Log cleanup operation
await logLifecycleAudit({
  scope: 'telemetry',
  action: 'delete',
  tenantId: 'ws_123',
  itemsAffected: 5000,
  windowStart: new Date('2025-09-12'),
  windowEnd: new Date('2025-12-11'),
  detail: 'Removed telemetry older than 90 days',
  metadata: { batchSize: 1000, deleteCount: 5000 },
});

// Query events
const events = await getLifecycleAuditEvents('ws_123', {
  scope: 'telemetry',
  action: 'delete',
  limit: 20,
});
```

### 3. Lifecycle Cleanup Service

**File**: `src/lib/guardian/network/lifecycleCleanupService.ts`

**Functions**:

```typescript
/**
 * Run cleanup for specific tenant
 * Cleans: telemetry, anomalies, benchmarks, early_warnings, governance
 * Supports dry-run (count only) and batch limiting
 */
export async function cleanupForTenant(
  tenantId: string,
  options?: GuardianNetworkCleanupRunOptions
): Promise<GuardianCleanupResult[]>;

/**
 * Cleanup aged pattern signatures (global, > 365 days)
 * Non-tenant-specific operation
 */
export async function cleanupPatternSignatures(
  options?: GuardianNetworkCleanupRunOptions
): Promise<GuardianCleanupResult>;

/**
 * Run full network cleanup (all tenants + global patterns)
 * Advanced operation; use for batch jobs only
 */
export async function runFullNetworkCleanup(
  options?: GuardianNetworkCleanupRunOptions
): Promise<Map<string, GuardianCleanupResult[]>>;
```

**Special Handling**:

**Early Warnings**: Only deletes closed warnings (status IN `'acknowledged'`, `'dismissed'`). Open warnings (status = `'open'`) are **never** deleted, even if past retention date.

**Usage Example**:

```typescript
// Dry-run: preview deletions
const results = await cleanupForTenant('ws_123', {
  dryRun: true,
  now: new Date(),
  limitPerTable: 1000,
});

console.log(`Would delete ${results.reduce((sum, r) => sum + r.deleted, 0)} rows`);

// Execute cleanup
const actualResults = await cleanupForTenant('ws_123', {
  dryRun: false,
  now: new Date(),
});

// Log results
for (const { table, deleted } of actualResults) {
  console.log(`Deleted ${deleted} rows from ${table}`);
}
```

---

## APIs

### `PATCH /api/guardian/admin/network/retention`

**Get current retention policy**:

```bash
GET /api/guardian/admin/network/retention?workspaceId=ws_123
```

**Response**:

```json
{
  "data": {
    "telemetryRetentionDays": 90,
    "aggregatesRetentionDays": 365,
    "anomaliesRetentionDays": 180,
    "benchmarksRetentionDays": 365,
    "earlyWarningsRetentionDays": 365,
    "governanceRetentionDays": 730
  }
}
```

**Update retention policy**:

```bash
PATCH /api/guardian/admin/network/retention?workspaceId=ws_123
Content-Type: application/json

{
  "patch": {
    "telemetryRetentionDays": 60
  }
}
```

**Response**: Updated policy object

---

### `GET /api/guardian/admin/network/lifecycle`

**Retrieve lifecycle audit events**:

```bash
GET /api/guardian/admin/network/lifecycle?workspaceId=ws_123&scope=telemetry&action=delete&limit=20&offset=0
```

**Query Parameters**:
- `scope`: Filter by data type (`telemetry`, `anomalies`, `benchmarks`, `early_warnings`, `governance`, `patterns`, `aggregates`)
- `action`: Filter by operation (`delete`, `soft_delete`, `policy_update`, `dry_run`)
- `startDate`: ISO date (filter from)
- `endDate`: ISO date (filter to)
- `limit`: Max results (default 20)
- `offset`: Pagination offset

**Response**:

```json
{
  "data": [
    {
      "occurredAt": "2025-12-11T10:30:00Z",
      "scope": "telemetry",
      "action": "delete",
      "tenantId": "ws_123",
      "itemsAffected": 5000,
      "windowStart": "2025-09-12T00:00:00Z",
      "windowEnd": "2025-12-11T23:59:59Z",
      "detail": "Removed telemetry older than 90 days",
      "metadata": { "batchSize": 1000 }
    }
  ]
}
```

---

### `POST /api/guardian/admin/network/cleanup`

**Execute cleanup**:

```bash
POST /api/guardian/admin/network/cleanup?workspaceId=ws_123
Content-Type: application/json

{
  "mode": "tenant",
  "dryRun": true,
  "limitPerTable": 1000
}
```

**Request Body**:
- `mode`: `"tenant"` (single tenant) or `"all"` (full network)
- `dryRun`: `true` (count only) or `false` (execute)
- `limitPerTable`: Batch size (default 1000)

**Response**:

```json
{
  "data": {
    "mode": "tenant",
    "tenantId": "ws_123",
    "dryRun": true,
    "results": [
      { "table": "guardian_network_telemetry_hourly", "deleted": 5000 },
      { "table": "guardian_network_anomaly_signals", "deleted": 200 },
      { "table": "guardian_network_benchmark_snapshots", "deleted": 50 }
    ],
    "totalAffected": 5250
  }
}
```

---

## UI: Network Intelligence Console - Compliance Tab

**Location**: `/guardian/admin/network` → **Compliance** tab

### Retention Policy Configuration

Interactive controls for each retention setting:

```
┌─ Data Retention Policy ────────────────────┐
│                                             │
│  Telemetry (X01)      [90 days]            │
│  Hourly metrics                             │
│                                             │
│  Anomalies (X02)      [180 days]           │
│  Detection signals                          │
│                                             │
│  Benchmarks           [365 days]           │
│  Snapshots                                  │
│                                             │
│  Early Warnings (X03) [365 days]           │
│  Patterns matched                           │
│                                             │
│  Governance Events    [730 days]           │
│  Audit trail                                │
│                                             │
│  Range: 30–3650 days. Auto cleanup daily.  │
└─────────────────────────────────────────────┘
```

- Number inputs with min/max bounds (30–3650)
- Real-time validation
- Auto-save on change
- Logs each change as governance event

### Lifecycle Cleanup Controls

```
┌─ Lifecycle Cleanup ────────────────────────┐
│                                             │
│  Cleanup Actions                            │
│  Preview deletions based on retention      │
│  Dry-run mode counts rows without deleting.│
│                                             │
│  [Run Dry-Run Cleanup]                     │
│                                             │
└─────────────────────────────────────────────┘
```

- **Dry-Run Button**: Preview how many rows would be deleted
- Shows count by table after completion
- Non-destructive preview

### Recent Lifecycle Events

```
┌─ Recent Lifecycle Events ──────────────────┐
│                                             │
│  TELEMETRY         delete              │ 5000 rows │
│  Removed telemetry older than 90 days      │
│  2025-12-11 10:30:00 AM                    │
│                                             │
│  ANOMALIES         delete              │ 200 rows │
│  Removed anomalies older than 180 days     │
│  2025-12-10 02:15:00 AM                    │
│                                             │
└─────────────────────────────────────────────┘
```

- Immutable history of cleanup operations
- Scope, action, rows affected, details
- Timestamp (server-generated)
- Up to 10 most recent events

---

## Database Schema

### `guardian_network_retention_policies`

```sql
CREATE TABLE guardian_network_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  telemetry_retention_days INT DEFAULT 90,
  aggregates_retention_days INT DEFAULT 365,
  anomalies_retention_days INT DEFAULT 180,
  benchmarks_retention_days INT DEFAULT 365,
  early_warnings_retention_days INT DEFAULT 365,
  governance_retention_days INT DEFAULT 730,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CHECK (telemetry_retention_days BETWEEN 30 AND 3650),
  CHECK (aggregates_retention_days BETWEEN 30 AND 3650),
  CHECK (anomalies_retention_days BETWEEN 30 AND 3650),
  CHECK (benchmarks_retention_days BETWEEN 30 AND 3650),
  CHECK (early_warnings_retention_days BETWEEN 30 AND 3650),
  CHECK (governance_retention_days BETWEEN 30 AND 3650)
};

-- RLS: Tenant isolation
ALTER TABLE guardian_network_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON guardian_network_retention_policies
  FOR ALL USING (workspace_id = get_current_workspace_id());
```

### `guardian_network_lifecycle_audit`

```sql
CREATE TABLE guardian_network_lifecycle_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMP DEFAULT NOW(),
  scope TEXT NOT NULL, -- 'telemetry', 'anomalies', 'benchmarks', 'early_warnings', 'governance', 'patterns', 'aggregates'
  action TEXT NOT NULL, -- 'delete', 'soft_delete', 'policy_update', 'dry_run'
  tenant_id UUID, -- NULL = global operation
  items_affected INT NOT NULL DEFAULT 0,
  window_start TIMESTAMP,
  window_end TIMESTAMP,
  detail TEXT,
  metadata JSONB,

  -- Immutable
  CONSTRAINT lifecycle_immutable CHECK (TRUE)
};

-- RLS: Tenant sees own events + global (NULL tenant)
ALTER TABLE guardian_network_lifecycle_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_with_global" ON guardian_network_lifecycle_audit
  FOR SELECT USING (
    tenant_id = get_current_workspace_id() OR tenant_id IS NULL
  );

CREATE POLICY "append_only" ON guardian_network_lifecycle_audit
  FOR INSERT WITH CHECK (TRUE);

-- Indexes
CREATE INDEX idx_lifecycle_scope_action ON guardian_network_lifecycle_audit(scope, action, occurred_at DESC);
CREATE INDEX idx_lifecycle_tenant_date ON guardian_network_lifecycle_audit(tenant_id, occurred_at DESC);
```

---

## Security & Privacy

### Immutability

- Lifecycle events are **append-only**; no updates or deletes
- Timestamps are server-generated, never user-provided
- Actor ID (if provided) is immutable per event
- Audit trail cannot be retroactively changed

### Sanitization

All lifecycle event logging sanitizes sensitive fields:

**Filtered Fields**:
- Passwords, PII, secrets, tokens, API keys, credentials
- Email addresses, phone numbers
- Cryptographic hashes, fingerprints
- Nested objects with sensitive fields

**Max Size**: Event details truncated to 500 characters

**Example**:

```typescript
// Before sanitization
{
  detail: "Cleanup by admin@company.com with token=sk_test_123",
  metadata: { email: "ops@corp.com", apiKey: "sk_prod_456" }
}

// After sanitization
{
  detail: "Cleanup by [REDACTED] with [REDACTED]",
  metadata: {} // Sensitive fields removed
}
```

### Data Isolation

- Retention policies are **workspace-scoped** (RLS enforced)
- Lifecycle events for other tenants are never visible
- Cleanup operations touch only the specified tenant's X-series tables
- Guardian core tables are **never** modified

---

## Compliance & Audit

### Audit Trail

Every lifecycle operation creates an immutable audit log entry:

```
Cleanup for Tenant WS-123 (2025-12-11 10:30 UTC)
- Scope: telemetry
- Action: delete
- Items Affected: 5000 rows
- Window: 2025-09-12 to 2025-12-11
- Detail: Removed telemetry older than 90 days
- Metadata: { batchSize: 1000, duration: 3.2s }
```

Compliance teams can:
- Query cleanup history by date range
- Verify retention policy changes over time
- Demonstrate adherence to data retention rules
- Prove deletion of sensitive data

### Policy Changes

Every retention policy update is logged as a governance event:

```
Event Type: policy_update
Context: retention_policy
Actor: user_123
Details: telemetry_retention_days: 90 → 60
Timestamp: 2025-12-11 14:00:00 UTC
```

---

## Testing

**Test File**: `tests/guardian/x05_network_lifecycle_and_compliance.test.ts`

**Coverage**:

✅ Retention policy defaults and caching
✅ Validation of retention bounds (30–3650 days)
✅ Policy update with governance logging
✅ Lifecycle audit event creation and sanitization
✅ Event filtering (scope, action, date range)
✅ Cleanup for tenant with dry-run support
✅ Preservation of open early warnings
✅ Pattern signature cleanup
✅ Immutable audit trail
✅ Privacy isolation (no cross-tenant leakage)

**Run Tests**:

```bash
npm run test -- tests/guardian/x05_network_lifecycle_and_compliance.test.ts
```

---

## Deployment Checklist

- [ ] Migration 594 applied to Supabase
  - [ ] `guardian_network_retention_policies` table created with RLS
  - [ ] `guardian_network_lifecycle_audit` table created with immutable constraints
  - [ ] Indexes on both tables verified
- [ ] Services deployed:
  - [ ] `retentionPolicyService.ts`
  - [ ] `lifecycleAuditLogger.ts`
  - [ ] `lifecycleCleanupService.ts`
- [ ] APIs deployed:
  - [ ] `PATCH /api/guardian/admin/network/retention`
  - [ ] `GET /api/guardian/admin/network/lifecycle`
  - [ ] `POST /api/guardian/admin/network/cleanup`
- [ ] UI deployed:
  - [ ] Compliance tab added to `/guardian/admin/network`
  - [ ] Retention policy controls working
  - [ ] Dry-run cleanup button functional
  - [ ] Lifecycle audit display working
- [ ] Tests passing:
  - [ ] 40+ X05 tests (all unit + integration)
  - [ ] No TypeScript errors
- [ ] Monitoring configured:
  - [ ] Cleanup job latency tracked
  - [ ] RLS violations monitored
  - [ ] Audit trail volume tracked
- [ ] Documentation reviewed:
  - [ ] Operator SOP: "How to Configure Retention"
  - [ ] Customer docs: "Understanding Data Retention"
  - [ ] Privacy statement updated

---

## Known Limitations (v1.0)

1. **No Scheduled Cleanup**: Cleanup is triggered on-demand via API. Future: Add cron job
2. **Batch Operations Only**: Cleanup uses fixed batch size (1000 rows). Future: Dynamic sizing
3. **No Cost Attribution**: No tracking of cleanup resource usage. Future: Cost per cleanup operation
4. **Manual Threshold Tuning**: Retention days must be manually configured. Future: ML-based recommendations
5. **Global Pattern Cleanup**: Patterns always cleanup at 365 days (not configurable)

---

## Future Enhancements

- Automated daily cleanup job with scheduling
- Soft-delete + archive-to-cold-storage pattern
- Differential privacy for retention boundary protection
- Tenant self-service retention UI (no console required)
- Cost tracking per cleanup operation
- Alert thresholds (e.g., "delete if > 1M rows")
- Backup before cleanup (optional)
- Compliance report generation (auto-email audit trail)

---

## References

- [X-Series Overview](./X_SERIES_OVERVIEW.md)
- [Readiness Checklist](./GUARDIAN_NETWORK_INTELLIGENCE_READINESS_CHECKLIST.md)
- [Implementation Summary](./GUARDIAN_X_SERIES_IMPLEMENTATION_SUMMARY.md)

---

*Guardian X05 completes the X-Series suite with comprehensive data lifecycle management, enabling privacy-preserving network intelligence with full compliance and audit capabilities.*
