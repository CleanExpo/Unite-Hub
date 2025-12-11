/**
 * Guardian X02: Network Anomaly Signals & Benchmark Snapshots
 *
 * Creates tenant-scoped tables for storing per-tenant anomaly detections
 * and benchmark snapshots relative to network cohorts.
 *
 * Privacy Model:
 * - guardian_network_anomaly_signals: tenant-scoped, stores this tenant's anomalies
 *   relative to anonymous cohort baselines (no other tenant identifiers)
 * - guardian_network_benchmark_snapshots: tenant-scoped, stores this tenant's metrics
 *   alongside aggregated cohort statistics (no cross-tenant raw data)
 * - Both tables enable RLS to prevent cross-tenant visibility
 * - Anomaly detection uses only: (a) this tenant's own metrics and
 *   (b) aggregated cohort statistics from guardian_network_aggregates_daily
 */

-- guardian_network_anomaly_signals
-- Per-tenant anomaly detections with severity and explanation
CREATE TABLE IF NOT EXISTS guardian_network_anomaly_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_family TEXT NOT NULL,
  -- e.g., 'alerts', 'incidents', 'risk', 'qa', 'performance'
  metric_key TEXT NOT NULL,
  -- e.g., 'alerts.total', 'incidents.critical', 'risk.avg_score', 'perf.p95_ms'
  window_start TIMESTAMPTZ NOT NULL,
  -- Start of observation window (e.g., start of day)
  window_end TIMESTAMPTZ NOT NULL,
  -- End of observation window
  anomaly_type TEXT NOT NULL,
  -- 'elevated', 'suppressed', 'volatile', 'shift'
  severity TEXT NOT NULL,
  -- 'low', 'medium', 'high', 'critical'
  tenant_value NUMERIC NOT NULL,
  -- This tenant's actual metric value
  cohort_p50 NUMERIC,
  -- Cohort median (for reference)
  cohort_p90 NUMERIC,
  -- Cohort 90th percentile
  cohort_p95 NUMERIC,
  -- Cohort 95th percentile
  z_score NUMERIC,
  -- Standard deviations from cohort mean (if computed)
  delta_ratio NUMERIC,
  -- (tenant_value - cohort_p50) / cohort_p50, where applicable
  sample_size INTEGER NOT NULL DEFAULT 0,
  -- Number of tenants in the cohort that contributed to baseline
  cohort_key TEXT NOT NULL,
  -- e.g., 'global', 'region:apac', 'size:small', 'vertical:saas'
  explanation TEXT,
  -- Human-readable explanation of why this is flagged as anomalous
  metadata JSONB NOT NULL DEFAULT '{}' :: jsonb,
  -- Additional context (no PII or tenant-identifying info)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_x02_anomaly_dedup UNIQUE (tenant_id, metric_family, metric_key, window_start, anomaly_type)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_x02_anomaly_tenant_time ON guardian_network_anomaly_signals(
  tenant_id,
  detected_at DESC
);

CREATE INDEX IF NOT EXISTS idx_x02_anomaly_tenant_metric_severity ON guardian_network_anomaly_signals(
  tenant_id,
  metric_family,
  severity,
  detected_at DESC
);

CREATE INDEX IF NOT EXISTS idx_x02_anomaly_severity_date ON guardian_network_anomaly_signals(
  severity,
  detected_at DESC
);

-- Enable RLS on guardian_network_anomaly_signals
ALTER TABLE
  guardian_network_anomaly_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant can only see their own anomalies
DROP POLICY IF EXISTS "tenant_isolation_anomaly_signals" ON guardian_network_anomaly_signals;

CREATE POLICY "tenant_isolation_anomaly_signals" ON guardian_network_anomaly_signals FOR ALL USING (
  tenant_id = get_current_workspace_id()
);

-- guardian_network_benchmark_snapshots
-- Per-tenant daily metric snapshots alongside cohort statistics
CREATE TABLE IF NOT EXISTS guardian_network_benchmark_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bucket_date DATE NOT NULL,
  metric_family TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  tenant_value NUMERIC NOT NULL,
  -- This tenant's actual value for this metric/date
  cohort_key TEXT NOT NULL,
  -- e.g., 'global', 'region:apac', 'size:small', 'vertical:saas'
  cohort_p50 NUMERIC,
  cohort_p75 NUMERIC,
  cohort_p90 NUMERIC,
  cohort_p95 NUMERIC,
  cohort_p99 NUMERIC,
  mean NUMERIC,
  stddev NUMERIC,
  sample_size INTEGER NOT NULL DEFAULT 0,
  -- Number of unique tenants that contributed to this cohort aggregate
  metadata JSONB NOT NULL DEFAULT '{}' :: jsonb,
  CONSTRAINT uq_x02_benchmark_snapshot UNIQUE (tenant_id, bucket_date, metric_family, metric_key, cohort_key)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_x02_snapshot_tenant_date ON guardian_network_benchmark_snapshots(
  tenant_id,
  bucket_date DESC
);

CREATE INDEX IF NOT EXISTS idx_x02_snapshot_tenant_metric ON guardian_network_benchmark_snapshots(
  tenant_id,
  bucket_date,
  metric_family,
  metric_key
);

-- Enable RLS on guardian_network_benchmark_snapshots
ALTER TABLE
  guardian_network_benchmark_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant can only see their own benchmark snapshots
DROP POLICY IF EXISTS "tenant_isolation_benchmark_snapshots" ON guardian_network_benchmark_snapshots;

CREATE POLICY "tenant_isolation_benchmark_snapshots" ON guardian_network_benchmark_snapshots FOR ALL USING (
  tenant_id = get_current_workspace_id()
);

-- Document the schema for administrators
COMMENT ON TABLE guardian_network_anomaly_signals IS 'Tenant-scoped anomaly detections relative to network baselines. Privacy: No cross-tenant identifiers; only aggregated cohort statistics.';

COMMENT ON TABLE guardian_network_benchmark_snapshots IS 'Tenant-scoped daily metric snapshots with cohort statistics for benchmark comparison. Privacy: No raw metrics from other tenants; only aggregated cohort percentiles.';

COMMENT ON COLUMN guardian_network_anomaly_signals.cohort_key IS 'Anonymized cohort identifier (e.g., region:apac, size:small). Never reveals specific tenant membership.';

COMMENT ON COLUMN guardian_network_benchmark_snapshots.sample_size IS 'Number of unique tenants in the cohort for this metric. Used for k-anonymity verification.';
