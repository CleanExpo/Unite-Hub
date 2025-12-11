-- Guardian X03: Network Early-Warning Signals & Playbook Hints
--
-- Extends X01/X02 with coarse pattern signatures (global, cohort-scoped)
-- and per-tenant early-warning signals derived from pattern matching.
--
-- Privacy Model:
-- - guardian_network_pattern_signatures: No tenant IDs; only aggregated features
-- - guardian_network_early_warnings: Tenant-scoped; derived from patterns + tenant anomalies
-- - All pattern descriptions and feature vectors remain anonymized

-- Create pattern signature table (global, no RLS)
CREATE TABLE IF NOT EXISTS guardian_network_pattern_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pattern_key TEXT NOT NULL,
  -- e.g., 'alerts_burst_followed_by_incidents', 'high_risk_and_notifications_lag'
  cohort_key TEXT NOT NULL,
  -- e.g., 'global', 'region:apac', 'size:small', 'vertical:saas'
  metric_family TEXT NOT NULL,
  -- Main family this pattern concerns: 'alerts', 'incidents', 'risk', 'qa', 'performance'
  metric_keys TEXT[] NOT NULL,
  -- Specific keys involved: ARRAY['alerts.total', 'incidents.critical', ...]
  window_days INTEGER NOT NULL,
  -- Observation window in days (e.g., 7, 14, 30)
  severity TEXT NOT NULL,
  -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  -- Human-readable pattern description (no tenant IDs)
  feature_vector JSONB NOT NULL,
  -- Normalized aggregated features: counts, weights, histograms per metric_family/type
  evidence_stats JSONB NOT NULL,
  -- Aggregate stats: support count, confidence-like metrics, avg deltas
  metadata JSONB NOT NULL DEFAULT '{}' ::jsonb,
  -- Additional context (no PII or tenant-identifying info)
  CONSTRAINT uq_x03_pattern_signature UNIQUE (pattern_key, cohort_key)
);

-- Indexes for pattern lookup
CREATE INDEX IF NOT EXISTS idx_x03_pattern_cohort ON guardian_network_pattern_signatures(cohort_key);

CREATE INDEX IF NOT EXISTS idx_x03_pattern_metric_family ON guardian_network_pattern_signatures(metric_family);

CREATE INDEX IF NOT EXISTS idx_x03_pattern_severity ON guardian_network_pattern_signatures(severity);

-- Create early-warning signals table (tenant-scoped, RLS enabled)
CREATE TABLE IF NOT EXISTS guardian_network_early_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pattern_id UUID NOT NULL REFERENCES guardian_network_pattern_signatures(id) ON DELETE CASCADE,
  bucket_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  -- 'open' | 'acknowledged' | 'dismissed'
  severity TEXT NOT NULL,
  -- Derived from pattern severity and match strength
  match_score NUMERIC NOT NULL,
  -- 0�1 confidence-like score (0.5 = moderate match, 0.8+ = strong match)
  evidence JSONB NOT NULL,
  -- Summary: which anomalies contributed, relative deltas, metrics involved
  suggestion_theme TEXT,
  -- e.g., 'tighten_alert_thresholds', 'review_malware_playbooks', 'tune_risk_model'
  metadata JSONB NOT NULL DEFAULT '{}' ::jsonb,
  -- Additional context for this warning
  CONSTRAINT uq_x03_early_warning_dedup UNIQUE (tenant_id, pattern_id, bucket_date)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_x03_warning_tenant_date ON guardian_network_early_warnings(
  tenant_id,
  created_at DESC,
  status
);

CREATE INDEX IF NOT EXISTS idx_x03_warning_pattern_date ON guardian_network_early_warnings(
  pattern_id,
  bucket_date DESC
);

CREATE INDEX IF NOT EXISTS idx_x03_warning_severity ON guardian_network_early_warnings(severity, created_at DESC);

-- Enable RLS on early warnings
ALTER TABLE
  guardian_network_early_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant can only see their own early warnings
DROP POLICY IF EXISTS "tenant_isolation_early_warnings" ON guardian_network_early_warnings;

CREATE POLICY "tenant_isolation_early_warnings" ON guardian_network_early_warnings FOR ALL USING (
  tenant_id = get_current_workspace_id()
);

-- Document the schema
COMMENT ON TABLE guardian_network_pattern_signatures IS 'Global pattern signatures derived from aggregated network telemetry. No tenant IDs; purely anonymized cohort-level patterns.';

COMMENT ON TABLE guardian_network_early_warnings IS E'Tenant-scoped early-warning signals indicating that a tenant\'s anomalies match known network patterns.';

COMMENT ON COLUMN guardian_network_pattern_signatures.feature_vector IS 'Aggregated features (no PII): metric family counts, anomaly type weights, severity histograms, average deltas per key.';

COMMENT ON COLUMN guardian_network_pattern_signatures.evidence_stats IS 'Aggregate statistics: support count (# tenants/windows), average z-scores, delta ratios, confidence metrics.';

COMMENT ON COLUMN guardian_network_early_warnings.match_score IS 'Normalized score (0�1) indicating confidence that tenant anomalies match this pattern. 0.5+ = actionable signal.';

COMMENT ON COLUMN guardian_network_early_warnings.evidence IS 'High-level summary of anomalies that triggered this warning: metric families, keys, deltas, and cohort context. No raw data.';

COMMENT ON COLUMN guardian_network_early_warnings.suggestion_theme IS 'Operator hint for recommended next steps: e.g., review_alert_thresholds, exercise_incident_playbooks, tune_risk_model.';
