/**
 * Phase D69: Experimentation & Feature Flag Engine
 *
 * Pure, side-effect-free feature flag evaluation.
 * Stable experiment assignment via hash-based bucketing.
 * Integration with existing analytics.
 * No raw PII in Founder views.
 */

-- ============================================================================
-- FEATURE FLAGS (pure evaluation, no side effects)
-- ============================================================================

DROP TABLE IF EXISTS unite_feature_flags CASCADE;

CREATE TABLE unite_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  flag_key text NOT NULL,
  name text NOT NULL,
  description text,
  flag_type text NOT NULL DEFAULT 'boolean',
  default_value jsonb NOT NULL,
  override_rules jsonb,
  targeting_rules jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE INDEX idx_unite_feature_flags_tenant ON unite_feature_flags(tenant_id);
CREATE INDEX idx_unite_feature_flags_active ON unite_feature_flags(is_active);
CREATE UNIQUE INDEX idx_unite_feature_flags_key ON unite_feature_flags(flag_key);

COMMENT ON TABLE unite_feature_flags IS 'Feature flag definitions for progressive rollout';
COMMENT ON COLUMN unite_feature_flags.flag_type IS 'boolean | string | number | json';
COMMENT ON COLUMN unite_feature_flags.default_value IS 'Fallback value when no rules match';
COMMENT ON COLUMN unite_feature_flags.override_rules IS 'User/org-specific overrides (e.g., [{user_id: "x", value: true}])';
COMMENT ON COLUMN unite_feature_flags.targeting_rules IS 'Percentage rollout, region targeting, etc.';

-- ============================================================================
-- EXPERIMENTS (A/B/n testing)
-- ============================================================================

DROP TABLE IF EXISTS unite_experiments CASCADE;

CREATE TABLE unite_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  experiment_key text NOT NULL,
  name text NOT NULL,
  description text,
  hypothesis text,
  variants jsonb NOT NULL,
  traffic_allocation numeric(5,2) NOT NULL DEFAULT 100.00,
  status text NOT NULL DEFAULT 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE INDEX idx_unite_experiments_tenant ON unite_experiments(tenant_id);
CREATE INDEX idx_unite_experiments_status ON unite_experiments(status);
CREATE UNIQUE INDEX idx_unite_experiments_key ON unite_experiments(experiment_key);

COMMENT ON TABLE unite_experiments IS 'A/B/n experiment definitions with variant allocation';
COMMENT ON COLUMN unite_experiments.variants IS '[{key: "control", weight: 50}, {key: "variant_a", weight: 50}]';
COMMENT ON COLUMN unite_experiments.traffic_allocation IS 'Percentage of users enrolled (0.00-100.00)';
COMMENT ON COLUMN unite_experiments.status IS 'draft | running | paused | completed';

-- ============================================================================
-- EXPERIMENT ASSIGNMENTS (stable, hash-based)
-- ============================================================================

DROP TABLE IF EXISTS unite_experiment_assignments CASCADE;

CREATE TABLE unite_experiment_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES unite_experiments(id) ON DELETE CASCADE,
  user_id uuid,
  anonymous_id text,
  variant_key text NOT NULL,
  assignment_hash text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE INDEX idx_unite_experiment_assignments_experiment ON unite_experiment_assignments(experiment_id);
CREATE INDEX idx_unite_experiment_assignments_user ON unite_experiment_assignments(user_id);
CREATE INDEX idx_unite_experiment_assignments_anon ON unite_experiment_assignments(anonymous_id);
CREATE UNIQUE INDEX idx_unite_experiment_assignments_hash ON unite_experiment_assignments(assignment_hash);

COMMENT ON TABLE unite_experiment_assignments IS 'Stable user-to-variant assignments via hash';
COMMENT ON COLUMN unite_experiment_assignments.assignment_hash IS 'Hash of experiment_key + user_id/anon_id for stable bucketing';
COMMENT ON COLUMN unite_experiment_assignments.anonymous_id IS 'Cookie/device ID for non-authenticated users';

-- ============================================================================
-- EXPERIMENT METRICS (analytics integration)
-- ============================================================================

DROP TABLE IF EXISTS unite_experiment_metrics CASCADE;

CREATE TABLE unite_experiment_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES unite_experiments(id) ON DELETE CASCADE,
  variant_key text NOT NULL,
  metric_key text NOT NULL,
  metric_value numeric(18,4) NOT NULL,
  user_count integer NOT NULL DEFAULT 1,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE INDEX idx_unite_experiment_metrics_experiment ON unite_experiment_metrics(experiment_id);
CREATE INDEX idx_unite_experiment_metrics_variant ON unite_experiment_metrics(variant_key);
CREATE INDEX idx_unite_experiment_metrics_metric ON unite_experiment_metrics(metric_key);
CREATE INDEX idx_unite_experiment_metrics_recorded ON unite_experiment_metrics(recorded_at DESC);

COMMENT ON TABLE unite_experiment_metrics IS 'Per-variant performance metrics for analysis';
COMMENT ON COLUMN unite_experiment_metrics.metric_key IS 'e.g., "conversion_rate", "avg_session_duration", "revenue_per_user"';
COMMENT ON COLUMN unite_experiment_metrics.user_count IS 'Number of users contributing to this metric value';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_experiment_metrics ENABLE ROW LEVEL SECURITY;

-- Feature Flags
CREATE POLICY "Users can view feature flags for their tenant"
  ON unite_feature_flags FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage feature flags for their tenant"
  ON unite_feature_flags FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Experiments
CREATE POLICY "Users can view experiments for their tenant"
  ON unite_experiments FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage experiments for their tenant"
  ON unite_experiments FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Experiment Assignments (public read for evaluation)
CREATE POLICY "Users can view experiment assignments"
  ON unite_experiment_assignments FOR SELECT
  USING (true);

CREATE POLICY "Users can create experiment assignments"
  ON unite_experiment_assignments FOR INSERT
  WITH CHECK (true);

-- Experiment Metrics
CREATE POLICY "Users can view experiment metrics for their tenant"
  ON unite_experiment_metrics FOR SELECT
  USING (
    experiment_id IN (
      SELECT id FROM unite_experiments
      WHERE tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL
    )
  );

CREATE POLICY "Users can insert experiment metrics"
  ON unite_experiment_metrics FOR INSERT
  WITH CHECK (true);
