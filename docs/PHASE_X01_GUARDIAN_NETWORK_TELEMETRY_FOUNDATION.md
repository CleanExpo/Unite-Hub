# Guardian X01: Privacy-Preserving Network Telemetry Foundation

**Status**: Implementation Complete
**Last Updated**: 2025-12-11
**Version**: Guardian X01 1.0
**Phase**: X-Series Initialization

## Executive Summary

Guardian X01 establishes the **privacy-first, k-anonymity-enforcing** foundation for cross-tenant network intelligence. This system enables:

1. **Network Benchmarking** — Compare performance metrics across anonymized tenant cohorts
2. **Competitive Intelligence** — Understand industry baselines without exposing individual tenant data
3. **Anomaly Detection** — Identify outliers within anonymized peer groups
4. **Privacy Guarantees** — Irreversible hashing, de-identified metrics, k-anonymity enforcement

All metrics are coarse-grained (counts, averages, percentiles), cohort-based, and subject to minimum sample size thresholds. **No raw per-tenant data, rule identifiers, domain names, or PII are ever exposed.**

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Guardian & I-Series Tables (Tenant-Scoped via RLS)           │
│ • guardian_alerts, guardian_incidents, guardian_drills, ... │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼─────────────────────────────────┐
                    │ X01 Pipeline Layer                   │
                    │ ┌──────────────────────────────────┐ │
                    │ │ 1. Fingerprinting Service        │ │
                    │ │    (HMAC-SHA256 tenant hashes)   │ │
                    │ └──────────────────────────────────┘ │
                    │ ┌──────────────────────────────────┐ │
                    │ │ 2. Extraction Service            │ │
                    │ │    (Coarse metrics only)         │ │
                    │ └──────────────────────────────────┘ │
                    │ ┌──────────────────────────────────┐ │
                    │ │ 3. Ingestion Service             │ │
                    │ │    (Orchestration + DB insert)   │ │
                    │ └──────────────────────────────────┘ │
                    │ ┌──────────────────────────────────┐ │
                    │ │ 4. Aggregation Pipeline          │ │
                    │ │    (Percentiles + k-anonymity)   │ │
                    │ └──────────────────────────────────┘ │
                    └────┬──────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ Guardian X-Series Tables (Privacy-Enforced)                 │
│ • guardian_network_tenant_fingerprints (hashes only)        │
│ • guardian_network_telemetry_hourly (no tenant IDs)         │
│ • guardian_network_aggregates_daily (safe-to-expose)        │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼────────────────────────────┐
                    │ Benchmark API                   │
                    │ GET /api/guardian/network/...   │
                    │ (Read-only, aggregated)         │
                    └────────────────────────────────┘
```

## Core Concepts

### Tenant Hashing (Irreversible)

Each tenant is assigned an irreversible, deterministic hash using HMAC-SHA256:

```typescript
function computeTenantHash(tenantId: string, saltId: string = 'v1'): string {
  const secret = process.env.GUARDIAN_TENANT_HASH_SECRET;
  const hmac = createHmac('sha256', secret);
  hmac.update(`${tenantId}:${saltId}`);
  return hmac.digest('hex'); // 64-character hex string
}
```

**Properties**:
- **Deterministic**: Same input always produces same hash
- **Irreversible**: Cryptographically impossible to reverse
- **Secure**: Uses HMAC with server-side secret (never exposed)
- **Versioned**: Salt parameter allows future re-hashing without breaking existing data

**Storage**:
- Hash stored in `guardian_network_tenant_fingerprints.tenant_hash`
- Raw tenant ID **never** stored in X-series tables
- Fingerprint maps hash → cohort metadata (region, size, vertical)

### De-Identified Metrics

Only coarse-grained aggregates are extracted and stored:

| Metric Family | Metric Keys | Source | Privacy Level |
|---|---|---|---|
| **alerts** | `alerts.total`, `alerts.critical` | `guardian_alerts` | Coarse count |
| **incidents** | `incidents.total`, `incidents.critical` | `guardian_incidents` | Coarse count |
| **risk** | `risk.avg_score` | `guardian_incidents.risk_score` | Aggregated average |
| **qa** | `qa.drills_completed`, `qa.regression_runs`, `qa.coverage_snapshots` | I07, I02, I08 | Run counts |
| **performance** | `perf.p95_ms` | I09 performance runs | Aggregated latency |

**Excluded** (intentionally):
- Rule names, rule IDs, rule patterns
- Domain names, playbook identifiers
- Customer names, team members
- Specific incident payloads
- Email addresses, phone numbers, any PII

### K-Anonymity Enforcement

Metrics are only exposed if contributed by ≥ minimum tenant count:

```typescript
// Example: Metric for region:apac has 3 contributors (below 5-tenant minimum)
{
  bucket_date: '2025-01-15',
  cohort_key: 'region:apac',
  metric_family: 'alerts',
  metric_key: 'alerts.total',
  sample_size: 3,
  // Result is NOT published to benchmark API (redacted)
  // since sample_size (3) < minSampleSize threshold (5)
}
```

**Enforcement**:
- `sample_size` field in `guardian_network_aggregates_daily` tracks contributor count
- Benchmark API filters results by `minSampleSize` parameter (default: 5)
- Aggregates with insufficient samples are logically redacted at query time

### Cohort-Based Grouping

Tenants are clustered into cohorts for cross-tenant comparison:

```typescript
function computeCohortKeysForFingerprint(fp: GuardianTenantFingerprint): string[] {
  const keys = ['global']; // Always included
  if (fp.region) keys.push(`region:${fp.region}`);
  if (fp.sizeBand) keys.push(`size:${fp.sizeBand}`);
  if (fp.vertical) keys.push(`vertical:${fp.vertical}`);
  return keys;
}

// Example output for a SaaS company in APAC with 50-200 employees:
// ['global', 'region:apac', 'size:medium', 'vertical:saas']
```

**Cohort Dimensions**:
- **global**: Baseline across all tenants
- **region**: Geographic region (e.g., `us-east`, `eu-west`, `apac`)
- **sizeBand**: Employee count band (e.g., `small` 1-50, `medium` 51-200, `large` 200+)
- **vertical**: Industry vertical (e.g., `saas`, `healthcare`, `fintech`, `retail`)

## Database Schema

### Table 1: `guardian_network_tenant_fingerprints`

Stores irreversible tenant hashes with cohort metadata.

```sql
CREATE TABLE guardian_network_tenant_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_hash TEXT UNIQUE NOT NULL, -- HMAC-SHA256 of tenant_id
  hash_salt TEXT DEFAULT 'v1', -- Salt version identifier
  region TEXT, -- Geographic region (e.g., 'us-west')
  size_band TEXT, -- Employee band (e.g., 'small', 'medium')
  vertical TEXT, -- Industry vertical (e.g., 'saas')
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_x01_tenant_hash ON guardian_network_tenant_fingerprints(tenant_hash);
CREATE INDEX idx_x01_cohort ON guardian_network_tenant_fingerprints(region, size_band, vertical);
```

**Key Properties**:
- NO `tenant_id` column (privacy by design)
- Unique constraint on `tenant_hash` (one entry per tenant)
- Cohort fields are nullable (tenants may not have all dimensions)

### Table 2: `guardian_network_telemetry_hourly`

Hourly per-tenant metrics identified only by hash.

```sql
CREATE TABLE guardian_network_telemetry_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_hash TEXT NOT NULL, -- Reference to fingerprint (not foreign key)
  bucket_start TIMESTAMPTZ NOT NULL, -- Hour-truncated timestamp
  metric_family TEXT NOT NULL, -- 'alerts', 'incidents', 'risk', 'qa', 'performance'
  metric_key TEXT NOT NULL, -- 'alerts.total', 'risk.avg_score', etc.
  metric_value NUMERIC NOT NULL,
  unit TEXT, -- 'count', 'ms', 'score', etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_x01_hourly_point UNIQUE (tenant_hash, bucket_start, metric_family, metric_key)
);

CREATE INDEX idx_x01_hourly_time ON guardian_network_telemetry_hourly(bucket_start);
CREATE INDEX idx_x01_hourly_hash_time ON guardian_network_telemetry_hourly(tenant_hash, bucket_start);
CREATE INDEX idx_x01_hourly_metric ON guardian_network_telemetry_hourly(metric_family, metric_key);
CREATE INDEX idx_x01_hourly_composite ON guardian_network_telemetry_hourly(bucket_start, metric_family, metric_key);
```

**Key Properties**:
- Identified by `tenant_hash`, not `tenant_id`
- Hour-truncated timestamps for temporal aggregation
- Unique constraint ensures idempotent ingestion
- NO `tenant_id` or identifying information stored

### Table 3: `guardian_network_aggregates_daily`

Safe-to-expose daily aggregates per cohort (k-anonymity enforced).

```sql
CREATE TABLE guardian_network_aggregates_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_date DATE NOT NULL,
  cohort_key TEXT NOT NULL, -- 'global', 'region:apac', 'size:small', etc.
  metric_family TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  p50 NUMERIC,
  p75 NUMERIC,
  p90 NUMERIC,
  p95 NUMERIC,
  p99 NUMERIC,
  mean NUMERIC,
  stddev NUMERIC,
  sample_size INTEGER NOT NULL, -- Number of unique tenant contributors
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_x01_daily_aggregate UNIQUE (bucket_date, cohort_key, metric_family, metric_key)
);

CREATE INDEX idx_x01_daily_date ON guardian_network_aggregates_daily(bucket_date);
CREATE INDEX idx_x01_daily_cohort ON guardian_network_aggregates_daily(cohort_key, bucket_date);
CREATE INDEX idx_x01_daily_metric ON guardian_network_aggregates_daily(metric_family, metric_key, bucket_date);
CREATE INDEX idx_x01_daily_composite ON guardian_network_aggregates_daily(bucket_date, cohort_key, metric_family, metric_key);
```

**Key Properties**:
- `sample_size` tracks number of unique `tenant_hash` contributors (k-anonymity)
- NO `tenant_hash` stored (completely de-identified)
- Percentiles: p50, p75, p90, p95, p99 (plus mean, stddev for distribution analysis)
- Unique constraint prevents duplicate aggregation

## Implementation Components

### 1. Tenant Fingerprint Service (`tenantFingerprintService.ts`)

**Responsibilities**:
- Compute irreversible tenant hashes using HMAC-SHA256
- Manage cohort metadata (region, size, vertical)
- Generate cohort keys for aggregation

**Key Functions**:

```typescript
// Compute irreversible hash
export function computeTenantHash(tenantId: string, saltId: string = 'v1'): string

// Get or create tenant fingerprint
export async function getTenantFingerprintByTenantId(tenantId: string): Promise<GuardianTenantFingerprint>

// Upsert fingerprint with cohort metadata
export async function upsertTenantFingerprint(
  tenantId: string,
  options?: { region?: string; sizeBand?: string; vertical?: string }
): Promise<GuardianTenantFingerprint>

// Compute all cohort keys for a tenant
export function computeCohortKeysForFingerprint(fp: GuardianTenantFingerprint): string[]
```

**Security Considerations**:
- HMAC secret never logged or exposed
- Tenant ID never stored in X-series
- Deterministic hashing enables idempotent re-runs

### 2. Telemetry Extractor Service (`telemetryExtractor.ts`)

**Responsibilities**:
- Extract coarse-grained metrics from Guardian & I-series tables
- Read-only operations (SELECT only)
- Bucket timestamps to hourly boundaries

**Key Functions**:

```typescript
// Extract hourly telemetry for a single tenant
export async function extractHourlyTelemetryForTenant(
  tenantId: string,
  window: { start: Date; end: Date }
): Promise<GuardianTelemetryPoint[]>

// Merge duplicate telemetry points
export function mergeTelemetryPoints(points: GuardianTelemetryPoint[]): GuardianTelemetryPoint[]
```

**Metrics Extracted**:
- Alerts: count by severity
- Incidents: count by priority, average risk score
- QA: drill counts, regression run counts, coverage snapshots
- Performance: p95 latency averages

**Privacy Controls**:
- Select only necessary columns (not entire row)
- Aggregate at extraction time (no individual events exposed)
- No rule names, domain names, or PII

### 3. Telemetry Ingestion Service (`telemetryIngestionService.ts`)

**Responsibilities**:
- Orchestrate fingerprinting → extraction → database insertion
- Ensure idempotency over time windows
- Support bulk ingestion for all tenants

**Key Functions**:

```typescript
// Ingest for single tenant
export async function ingestHourlyTelemetryForTenant(
  tenantId: string,
  window: { start: Date; end: Date }
): Promise<IngestionResult>

// Ingest for all tenants (last N hours)
export async function ingestRecentTelemetryForAllTenants(hoursBack?: number): Promise<IngestionResult[]>

// Ingest for date range (backfilling)
export async function ingestTelemetryForDateRange(startDate: Date, endDate: Date): Promise<IngestionResult[]>
```

**Idempotency**:
- Uses upsert with composite unique key: `(tenant_hash, bucket_start, metric_family, metric_key)`
- Re-running over same window produces identical results
- Safe for concurrent execution

### 4. Daily Aggregation Pipeline (`dailyAggregationService.ts`)

**Responsibilities**:
- Group hourly telemetry by cohort
- Compute statistical aggregates (percentiles, mean, stddev)
- Enforce k-anonymity thresholds
- Generate safe-to-expose daily benchmark data

**Key Functions**:

```typescript
// Build daily aggregates for specific date
export async function buildDailyAggregatesForDate(
  date: Date,
  minSampleSize?: number
): Promise<AggregateResult[]>

// Backfill date range
export async function buildDailyAggregatesForDateRange(
  startDate: Date,
  endDate: Date,
  minSampleSize?: number
): Promise<AggregateResult[]>

// Cleanup old telemetry (90-day retention)
export async function cleanupOldTelemetry(hoursRetention?: number): Promise<void>
```

**Aggregation Algorithm**:
1. Fetch all hourly telemetry for the date
2. Map `tenant_hash` → cohort keys via fingerprints
3. Group by (cohort, metric_family, metric_key)
4. Compute statistics: p50, p75, p90, p95, p99, mean, stddev
5. Track `sample_size` (unique tenant contributors)
6. Upsert only results with `sample_size >= minSampleSize`

### 5. Benchmark API (`/api/guardian/network/benchmarks`)

**Read-only, aggregated API** exposing network benchmarks.

```
GET /api/guardian/network/benchmarks
  ?cohortKey=global
  &metricFamily=alerts
  &metricKey=alerts.total
  &startDate=2025-01-01
  &endDate=2025-01-31
  &minSampleSize=5
  &limit=100

Returns:
{
  benchmarks: [
    {
      date: '2025-01-15',
      cohortKey: 'global',
      metricFamily: 'alerts',
      metricKey: 'alerts.total',
      percentiles: {
        p50: 45,
        p75: 67,
        p90: 89,
        p95: 105,
        p99: 150,
        mean: 62.5,
        stddev: 28.3
      },
      sampleSize: 42,
      redacted: false
    }
  ],
  count: 1,
  hasMore: false,
  cohortKey: 'global',
  dateRange: { start: '2025-01-01', end: '2025-01-31' },
  filters: {
    metricFamily: 'alerts',
    metricKey: 'alerts.total',
    minSampleSize: 5
  }
}
```

**Query Parameters**:
- `cohortKey` (optional, default 'global'): `global`, `region:*`, `size:*`, `vertical:*`
- `metricFamily` (optional): Filter to alerts, incidents, risk, qa, or performance
- `metricKey` (optional): Filter to specific metric (e.g., alerts.total)
- `startDate`, `endDate` (optional): Date range in YYYY-MM-DD format (default: 30 days)
- `minSampleSize` (optional, default 5): Enforce k-anonymity threshold
- `limit` (optional, default 100, max 1000): Result pagination

**Validation**:
- Cohort key format validation
- Date range validation
- Metric family validation
- Numeric parameter bounds checking
- No tenant-scoped access control (public read-only data)

## Operational Workflows

### Daily Telemetry Pipeline (Hourly Cron Job)

**Recommended Schedule**: Every hour, 5 minutes after the hour boundary

```bash
# Example: 10:05 UTC runs ingestion for 09:00-10:00 UTC window
curl -X POST /api/cron/ingest-network-telemetry

# Internally:
// 1. Call ingestRecentTelemetryForAllTenants(hoursBack=1)
// 2. For each active tenant:
//    - Compute tenant hash (deterministic, no DB call)
//    - Extract hourly metrics from Guardian & I-series
//    - Upsert into guardian_network_telemetry_hourly
// 3. Log summary of ingestion (tenant count, points ingested, errors)
```

### Daily Aggregation (Daily Cron Job)

**Recommended Schedule**: 01:00 UTC (process previous day)

```bash
curl -X POST /api/cron/aggregate-network-telemetry
  -H "Content-Type: application/json"
  -d '{ "date": "2025-01-15" }'

# Internally:
// 1. Call buildDailyAggregatesForDate(yesterday)
// 2. Fetch all hourly telemetry for date
// 3. For each (cohort, metric_family, metric_key):
//    - Compute p50, p75, p90, p95, p99, mean, stddev
//    - Track sample_size
//    - Upsert to guardian_network_aggregates_daily
// 4. Log aggregation summary
```

### Cleanup Job (Weekly Cron Job)

**Recommended Schedule**: Sunday 02:00 UTC

```bash
curl -X POST /api/cron/cleanup-network-telemetry

# Internally:
// 1. Call cleanupOldTelemetry(hoursRetention=90*24)
// 2. Delete hourly telemetry older than 90 days
// 3. Delete daily aggregates older than 365 days
// 4. Log cleanup summary (rows deleted)
```

## Testing

**Test Suite**: `tests/guardian/x01_network_telemetry_foundation.test.ts`

**Coverage**:
- Tenant fingerprinting (determinism, irreversibility, salt versioning)
- Telemetry extraction (metric families, de-identification, deduplication)
- Daily aggregation (percentile computation, k-anonymity enforcement)
- Benchmark API (validation, filtering, error handling)
- Privacy & security (no raw IDs, no PII, k-anonymity)
- Edge cases (empty data, single value, concurrent access)

**Run Tests**:
```bash
npm run test -- tests/guardian/x01_network_telemetry_foundation.test.ts
```

## Security & Privacy Guarantees

### Tenant Identification Prevention

✅ **Guarantee**: Tenants cannot be identified from X-series data

- Tenant ID is never stored in X-series tables
- Hash is irreversible (HMAC-SHA256 with server-side secret)
- Only metadata (region, size, vertical) is stored alongside hash
- Coarse cohort dimensions prevent re-identification

### Data De-Identification

✅ **Guarantee**: No rule names, domains, or PII exposed

- Extraction selects only coarse metrics (counts, averages)
- Field names are generic (`alerts.total`, `perf.p95_ms`)
- No incident payloads, email addresses, or customer data
- String length limits (500 chars max) on any detail fields

### K-Anonymity

✅ **Guarantee**: Minimum cohort size enforcement

- `sample_size` tracks unique tenant contributors
- Benchmark API filters results by `minSampleSize` (default: 5)
- Aggregates with insufficient samples are logically redacted
- Prevents inference attacks on small cohorts

### Cryptographic Assurance

✅ **Guarantee**: Hashes are deterministic and irreversible

- HMAC-SHA256 is cryptographically secure
- Server-side secret ensures only authorized systems can recompute
- Salt versioning allows future re-hashing without breaking data
- No private keys or raw secrets exposed

## Configuration

### Environment Variables

```bash
# REQUIRED
GUARDIAN_TENANT_HASH_SECRET=<64-character random hex string>
  # Used for HMAC-SHA256 tenant hashing
  # Generate: openssl rand -hex 32

# OPTIONAL
GUARDIAN_NETWORK_MIN_SAMPLE_SIZE=5
  # Default k-anonymity threshold (can be overridden per API call)

GUARDIAN_NETWORK_RETENTION_HOURS=2160
  # Hourly telemetry retention (default: 90 days = 2160 hours)
  # Daily aggregates retained for 365 days (hardcoded)
```

### Supabase Configuration

**Migration**: `supabase/migrations/590_guardian_x01_network_telemetry_foundation.sql`

Apply via Supabase Dashboard:
1. Go to SQL Editor
2. Paste migration contents
3. Click Run

## Deployment Checklist

Before marking Guardian X01 production-ready:

- [ ] Environment variable `GUARDIAN_TENANT_HASH_SECRET` set and backed up securely
- [ ] Migration 590 applied to production database
- [ ] Tenant fingerprints imported for all active workspaces
- [ ] First hourly ingestion executed (validate zero errors)
- [ ] First daily aggregation executed (validate p-values and sample_size)
- [ ] Benchmark API tested (validate schema, filtering, k-anonymity)
- [ ] Cron jobs scheduled (hourly ingestion, daily aggregation, weekly cleanup)
- [ ] Retention policies configured (90 days hourly, 365 days daily)
- [ ] Documentation reviewed by security/privacy team
- [ ] Load testing conducted (concurrent ingestion, API queries)
- [ ] Monitoring configured (error rate, ingestion latency, aggregation duration)

## Monitoring & Observability

### Key Metrics

| Metric | Threshold | Alert On |
|--------|-----------|----------|
| Ingestion Errors | > 5% of tenants | Error rate spike |
| Aggregation Duration | > 5 minutes | Performance degradation |
| API Response Time | > 500ms (p95) | Latency spike |
| Hash Collisions | 0 | Any collision detected |
| Sample Size Distribution | Min 5 for publication | Low cohort participation |

### Logging

X01 logs ingestion and aggregation events with safe information:

```typescript
// SAFE - logged by X01
console.log(`[Guardian X01] Ingested ${pointCount} points for 42 tenants in 120ms`);
console.log(`[Guardian X01] Aggregated 1500 hourly points into 850 cohort-metric combos`);

// UNSAFE - never logged
console.log(`[Guardian X01] Ingested for tenant ${tenantId}`); // ❌
console.log(`[Guardian X01] Hash ${hash} maps to ${tenantId}`); // ❌
```

## Related Documentation

- [Guardian I-Series Overview](./PHASE_I_SERIES_OVERVIEW.md) — QA & chaos testing
- [Guardian Core Architecture](./GUARDIAN_ARCHITECTURE.md) — System design
- [X-Series Roadmap](./PHASE_X_SERIES_ROADMAP.md) — Future X-series modules

---

**Guardian X01** — Privacy-Preserving Foundation for Cross-Tenant Network Intelligence (v1.0, 2025-12-11)
