/**
 * Guardian X01: Privacy-Preserving Network Telemetry Foundation
 *
 * Cross-tenant, de-identified telemetry aggregation for network-wide benchmarking.
 * NO DIRECT TENANT IDENTIFIERS stored; all data is hashed or aggregated.
 * Enforces k-anonymity (minimum cohort size) for all exposed metrics.
 */

-- Tenant fingerprints: irreversible hash mapping + cohort metadata
-- One row per tenant, but tenant_id is NOT stored here; only tenant_hash (computed server-side)
CREATE TABLE IF NOT EXISTS guardian_network_tenant_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_hash TEXT NOT NULL UNIQUE, -- Irreversible hash of tenant_id + salt (computed server-side)
  hash_salt TEXT NOT NULL, -- Salt identifier / key version (NOT the raw secret)
  region TEXT NULL, -- Coarse region: 'apac', 'emea', 'amer'
  size_band TEXT NULL, -- Rough sizing: 'small', 'medium', 'large'
  vertical TEXT NULL, -- Business vertical: 'saas', 'fintech', 'retail', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Hourly telemetry: de-identified metrics from each tenant
-- tenant_hash is the ONLY tenant link; no reverse mapping tenant_hash → tenant_id exists
CREATE TABLE IF NOT EXISTS guardian_network_telemetry_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_start TIMESTAMPTZ NOT NULL, -- Truncated to hour (UTC)
  tenant_hash TEXT NOT NULL, -- Link to fingerprint table (not a foreign key to preserve privacy)
  metric_family TEXT NOT NULL, -- 'alerts', 'incidents', 'risk', 'notifications', 'qa', 'performance'
  metric_key TEXT NOT NULL, -- e.g., 'alerts.total', 'incidents.critical', 'risk.avg_score', 'qa.drills_completed'
  metric_value NUMERIC NOT NULL, -- Numeric value (count, score, latency, etc.)
  metric_unit TEXT NULL, -- 'count', 'ms', 'score', 'percent'
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Non-identifying context only
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily aggregates: cohort-based percentiles and statistics
-- Safe to expose to tenants: only aggregated metrics, no tenant identifiers
CREATE TABLE IF NOT EXISTS guardian_network_aggregates_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_date DATE NOT NULL, -- Aggregation date (UTC)
  cohort_key TEXT NOT NULL, -- 'global' or 'region:apac', 'size:small', 'vertical:saas', etc.
  metric_family TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  p50 NUMERIC NULL,
  p75 NUMERIC NULL,
  p90 NUMERIC NULL,
  p95 NUMERIC NULL,
  p99 NUMERIC NULL,
  mean NUMERIC NULL,
  stddev NUMERIC NULL,
  sample_size INTEGER NOT NULL DEFAULT 0, -- Number of unique tenant_hash contributors
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- May note k-anonymity status, data quality, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_network_fingerprints_tenant_hash ON guardian_network_tenant_fingerprints(tenant_hash);
CREATE INDEX IF NOT EXISTS idx_network_fingerprints_region ON guardian_network_tenant_fingerprints(region) WHERE region IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_network_fingerprints_size ON guardian_network_tenant_fingerprints(size_band) WHERE size_band IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_network_fingerprints_vertical ON guardian_network_tenant_fingerprints(vertical) WHERE vertical IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_network_telemetry_bucket_start ON guardian_network_telemetry_hourly(bucket_start DESC);
CREATE INDEX IF NOT EXISTS idx_network_telemetry_tenant_hash ON guardian_network_telemetry_hourly(tenant_hash);
CREATE INDEX IF NOT EXISTS idx_network_telemetry_metric ON guardian_network_telemetry_hourly(metric_family, metric_key);
CREATE INDEX IF NOT EXISTS idx_network_telemetry_composite ON guardian_network_telemetry_hourly(bucket_start, tenant_hash, metric_family, metric_key);

CREATE INDEX IF NOT EXISTS idx_network_aggregates_date ON guardian_network_aggregates_daily(bucket_date DESC);
CREATE INDEX IF NOT EXISTS idx_network_aggregates_cohort ON guardian_network_aggregates_daily(cohort_key);
CREATE INDEX IF NOT EXISTS idx_network_aggregates_metric ON guardian_network_aggregates_daily(metric_family, metric_key);
CREATE INDEX IF NOT EXISTS idx_network_aggregates_composite ON guardian_network_aggregates_daily(bucket_date, cohort_key, metric_family, metric_key);

-- Comments documenting privacy model
COMMENT ON TABLE guardian_network_tenant_fingerprints IS
  'Tenant cohort metadata keyed by irreversible tenant_hash. No reverse mapping tenant_hash → tenant_id is stored or exposed.';

COMMENT ON TABLE guardian_network_telemetry_hourly IS
  'Hourly metrics from each tenant, identified only by tenant_hash. Metrics are coarse-grained (e.g., "alerts.total", "risk.avg_score") and non-identifying. No rule/playbook names, domains, or PII.';

COMMENT ON TABLE guardian_network_aggregates_daily IS
  'Daily aggregated (p50, p75, p90, p95, p99, mean, stddev) metrics per cohort. Safe to expose to tenants. Enforces k-anonymity: rows with sample_size < 5 (or configured minimum) must be marked incomplete or hidden.';

COMMENT ON COLUMN guardian_network_tenant_fingerprints.tenant_hash IS
  'Irreversible cryptographic hash of tenant_id + secret salt. Computed server-side only; never logged or exposed.';

COMMENT ON COLUMN guardian_network_tenant_fingerprints.hash_salt IS
  'Salt identifier / key version for hash algorithm (e.g., "v1"). NOT the raw secret; secret is read from environment.';

COMMENT ON COLUMN guardian_network_telemetry_hourly.bucket_start IS
  'Truncated to the nearest hour (UTC). Used for time-series alignment and daily aggregation.';

COMMENT ON COLUMN guardian_network_telemetry_hourly.metric_key IS
  'Coarse metric identifier, never revealing specific rules, playbooks, or domains. Examples: "alerts.total", "incidents.critical", "risk.avg_score", "qa.drills_completed", "perf.p95_ms".';

COMMENT ON COLUMN guardian_network_aggregates_daily.sample_size IS
  'Number of unique tenant_hash contributors to this aggregate. Used for k-anonymity enforcement (e.g., hide if < 5).';
