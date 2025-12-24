/**
 * H02: AI Anomaly Detection (Meta-Only) & Signal Baselines
 *
 * Creates tenant-scoped tables for:
 * - Anomaly detectors (configurations for baseline + threshold monitoring)
 * - Baseline statistics (computed from historical aggregates)
 * - Anomaly events (triggered when observations exceed baseline)
 *
 * All data is aggregate-only and PII-free (no raw payloads, no destinations).
 * Advisory-only: anomalies do not auto-create incidents/rules or send external notifications.
 */

-- Table 1: guardian_anomaly_detectors
-- Defines what metrics to monitor and how to detect anomalies
CREATE TABLE IF NOT EXISTS guardian_anomaly_detectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Detector identity
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metric to monitor
  metric_key TEXT NOT NULL,
  -- Supported: 'alerts_total', 'incidents_total', 'correlation_clusters',
  -- 'notif_fail_rate', 'risk_p95', 'insights_activity_24h'

  -- Granularity and lookback window
  granularity TEXT NOT NULL DEFAULT 'hour',
  -- 'hour' | 'day'
  window_size INTEGER NOT NULL DEFAULT 24,
  -- Number of buckets to consider in window
  baseline_lookback INTEGER NOT NULL DEFAULT 168,
  -- Number of hours/days to build baseline from

  -- Detection method and thresholds
  method TEXT NOT NULL DEFAULT 'zscore',
  -- 'zscore' | 'ewma' | 'iqr'
  threshold NUMERIC NOT NULL DEFAULT 3.0,
  -- zscore multiple (e.g., 3.0), iqr fence distance, or ewma deviation
  min_count INTEGER NOT NULL DEFAULT 0,
  -- Ignore observations below this value (noise filtering)

  -- Extra configuration (seasonal hints, method params)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Audit
  created_by TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT uq_detector_name UNIQUE (tenant_id, name),
  CONSTRAINT metric_key_valid CHECK (metric_key IN (
    'alerts_total', 'incidents_total', 'correlation_clusters',
    'notif_fail_rate', 'risk_p95', 'insights_activity_24h'
  )),
  CONSTRAINT granularity_valid CHECK (granularity IN ('hour', 'day')),
  CONSTRAINT method_valid CHECK (method IN ('zscore', 'ewma', 'iqr')),
  CONSTRAINT threshold_positive CHECK (threshold > 0),
  CONSTRAINT min_count_non_negative CHECK (min_count >= 0),
  CONSTRAINT window_size_positive CHECK (window_size > 0),
  CONSTRAINT lookback_positive CHECK (baseline_lookback > 0)
);

-- Indexes for detector queries
CREATE INDEX IF NOT EXISTS idx_anomaly_detectors_tenant_active
  ON guardian_anomaly_detectors(tenant_id, is_active, metric_key);
CREATE INDEX IF NOT EXISTS idx_anomaly_detectors_tenant_created
  ON guardian_anomaly_detectors(tenant_id, created_at DESC);

-- Table 2: guardian_anomaly_baselines
-- Stores rolling baseline statistics computed from historical aggregates
CREATE TABLE IF NOT EXISTS guardian_anomaly_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  detector_id UUID NOT NULL REFERENCES guardian_anomaly_detectors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Time window this baseline covers
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Baseline statistics (PII-free aggregates only)
  -- Includes: mean/stddev (zscore), ewma parameters, quartiles (iqr), seasonal distributions
  stats JSONB NOT NULL,
  -- {
  --   method: 'zscore' | 'ewma' | 'iqr',
  --   zscore?: { mean: number, stddev: number, seasonal?: {...} },
  --   ewma?: { alpha: number, mean: number, variance: number },
  --   iqr?: { median: number, q1: number, q3: number, iqr: number, lower_fence: number, upper_fence: number },
  --   datapoints: number,
  --   min_value: number,
  --   max_value: number
  -- }

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT period_order CHECK (period_start < period_end)
);

-- Indexes for baseline queries
CREATE INDEX IF NOT EXISTS idx_anomaly_baselines_detector_computed
  ON guardian_anomaly_baselines(detector_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_baselines_tenant_detector
  ON guardian_anomaly_baselines(tenant_id, detector_id, computed_at DESC);

-- Table 3: guardian_anomaly_events
-- Records anomalies triggered when observations exceed baseline
CREATE TABLE IF NOT EXISTS guardian_anomaly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  detector_id UUID NOT NULL REFERENCES guardian_anomaly_detectors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observed_at TIMESTAMPTZ NOT NULL,

  -- Observation values (aggregate only, no PII)
  observed_value NUMERIC NOT NULL,
  expected_value NUMERIC NULL,  -- Baseline expectation
  score NUMERIC NOT NULL,       -- zscore, deviation, or IQR distance

  -- Severity derived from score
  severity TEXT NOT NULL,
  -- 'info' | 'warn' | 'high' | 'critical'
  -- Typically: warn >= threshold, high >= threshold+1, critical >= threshold+2

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'open',
  -- 'open' | 'acknowledged' | 'resolved'

  -- Summary and context (PII-free only)
  summary TEXT NOT NULL,
  -- One-liner e.g., "Alerts exceeded expected baseline by 3.2x"
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   window_values: [num, num, ...],
  --   window_average: number,
  --   baseline_mean: number,
  --   baseline_stddev: number,
  --   recent_trend: 'stable' | 'rising' | 'falling',
  --   related_metrics: { metric_key: value, ... }
  -- }

  -- Admin actions
  acknowledged_at TIMESTAMPTZ NULL,
  acknowledged_by TEXT NULL,
  resolved_at TIMESTAMPTZ NULL,
  resolved_by TEXT NULL,

  -- Optional link to H01 rule suggestion or future H03 refinement
  related_suggestion_id UUID NULL,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT severity_valid CHECK (severity IN ('info', 'warn', 'high', 'critical')),
  CONSTRAINT status_valid CHECK (status IN ('open', 'acknowledged', 'resolved')),
  CONSTRAINT acknowledged_logic CHECK (
    (status = 'acknowledged' AND acknowledged_at IS NOT NULL AND acknowledged_by IS NOT NULL) OR
    (status IN ('open', 'resolved'))
  ),
  CONSTRAINT resolved_logic CHECK (
    (status = 'resolved' AND resolved_at IS NOT NULL AND resolved_by IS NOT NULL) OR
    (status IN ('open', 'acknowledged'))
  )
);

-- Indexes for anomaly event queries
CREATE INDEX IF NOT EXISTS idx_anomaly_events_tenant_status_observed
  ON guardian_anomaly_events(tenant_id, status, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_detector_observed
  ON guardian_anomaly_events(detector_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_tenant_severity
  ON guardian_anomaly_events(tenant_id, severity, created_at DESC);

-- Enable RLS on all tables
ALTER TABLE guardian_anomaly_detectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_anomaly_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_anomaly_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenant isolation for detectors
DROP POLICY IF EXISTS "tenant_isolation_anomaly_detectors" ON guardian_anomaly_detectors;
CREATE POLICY "tenant_isolation_anomaly_detectors" ON guardian_anomaly_detectors
FOR ALL USING (tenant_id = get_current_workspace_id());

-- RLS Policies: Tenant isolation for baselines
DROP POLICY IF EXISTS "tenant_isolation_anomaly_baselines" ON guardian_anomaly_baselines;
CREATE POLICY "tenant_isolation_anomaly_baselines" ON guardian_anomaly_baselines
FOR ALL USING (tenant_id = get_current_workspace_id());

-- RLS Policies: Tenant isolation for events
DROP POLICY IF EXISTS "tenant_isolation_anomaly_events" ON guardian_anomaly_events;
CREATE POLICY "tenant_isolation_anomaly_events" ON guardian_anomaly_events
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Comments for documentation
COMMENT ON TABLE guardian_anomaly_detectors IS
  'Tenant-scoped anomaly detector configurations. Each detector monitors an aggregate metric (alerts, incidents, correlation clusters, etc.) and triggers events when observations exceed computed baselines. Advisory-only: anomalies do not auto-create incidents/rules or send external notifications.';

COMMENT ON COLUMN guardian_anomaly_detectors.metric_key IS
  'Supported metrics: alerts_total (count of alerts in bucket), incidents_total (count of incidents), correlation_clusters (count of active clusters), notif_fail_rate (failure % in bucket), risk_p95 (95th percentile risk score), insights_activity_24h (activity count).';

COMMENT ON COLUMN guardian_anomaly_detectors.method IS
  'Detection method: zscore (standard deviation bands), ewma (exponential moving average), iqr (interquartile range fences). All methods work on aggregate values only.';

COMMENT ON TABLE guardian_anomaly_baselines IS
  'Computed baseline statistics for each detector, covering a historical lookback period. Stats include mean/stddev/seasonal patterns (zscore), ewma parameters, or quartiles (iqr). All data is aggregate-only and PII-free.';

COMMENT ON COLUMN guardian_anomaly_baselines.stats IS
  'JSON object containing baseline statistics: mean/stddev for zscore, alpha/mean/variance for ewma, quartiles for iqr. Includes datapoint count and value ranges. No raw payloads or PII.';

COMMENT ON TABLE guardian_anomaly_events IS
  'Anomaly events triggered when detector thresholds are exceeded. Advisory-only: recorded for review and optional administrative action. Severity derives from score magnitude. Status tracks admin acknowledgment/resolution. Details include recent window context (PII-free aggregates only) and optional AI explanation.';

COMMENT ON COLUMN guardian_anomaly_events.details IS
  'PII-free context: recent window values (counts/rates), baseline statistics, trend direction, and related metric summaries. Never includes raw alert payloads, incident details, or notification destinations.';
