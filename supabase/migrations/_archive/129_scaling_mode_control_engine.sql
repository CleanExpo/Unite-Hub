-- Migration 129: Scaling Mode Control & Capacity Engine
-- Phase 86: Truth-governed scaling modes with capacity limits and investor-ready views

-- ============================================================================
-- Table 1: scaling_mode_config
-- Global and per-environment scaling mode settings and thresholds
-- ============================================================================

CREATE TABLE IF NOT EXISTS scaling_mode_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Environment
  environment TEXT NOT NULL UNIQUE,
  -- e.g. 'production', 'staging', 'sandbox'

  -- Current mode
  current_mode TEXT NOT NULL DEFAULT 'lab'
    CHECK (current_mode IN ('lab', 'pilot', 'growth', 'scale')),

  -- Mode limits
  mode_limits JSONB NOT NULL DEFAULT '{
    "lab": {"max_clients": 5, "max_posts_per_day": 50, "max_ai_spend_daily": 10},
    "pilot": {"max_clients": 15, "max_posts_per_day": 200, "max_ai_spend_daily": 50},
    "growth": {"max_clients": 50, "max_posts_per_day": 1000, "max_ai_spend_daily": 200},
    "scale": {"max_clients": 500, "max_posts_per_day": 10000, "max_ai_spend_daily": 2000}
  }'::jsonb,

  -- Auto mode switching
  auto_mode_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Guardrail thresholds
  guardrail_thresholds JSONB NOT NULL DEFAULT '{
    "min_health_for_increase": 80,
    "max_utilisation_for_increase": 0.7,
    "freeze_below_health": 40,
    "max_warning_density": 0.3,
    "max_churn_risk": 0.2,
    "max_ai_cost_pressure": 0.8,
    "min_confidence_for_change": 0.7
  }'::jsonb,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID
);

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_scaling_mode_config_env
  ON scaling_mode_config(environment);

-- Insert default production config
INSERT INTO scaling_mode_config (environment, current_mode)
VALUES ('production', 'lab')
ON CONFLICT (environment) DO NOTHING;

-- ============================================================================
-- Table 2: scaling_health_snapshots
-- Periodic snapshots of scaling health and capacity
-- ============================================================================

CREATE TABLE IF NOT EXISTS scaling_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Environment
  environment TEXT NOT NULL,

  -- Current state
  current_mode TEXT NOT NULL
    CHECK (current_mode IN ('lab', 'pilot', 'growth', 'scale')),

  -- Capacity metrics
  active_clients INTEGER NOT NULL,
  safe_capacity INTEGER NOT NULL,
  utilisation_ratio NUMERIC(4,3) NOT NULL,

  -- Health scores (0-100)
  infra_health_score NUMERIC(5,2) NOT NULL,
  ai_cost_pressure_score NUMERIC(5,2) NOT NULL,
  warning_density_score NUMERIC(5,2) NOT NULL,
  churn_risk_score NUMERIC(5,2) NOT NULL,
  overall_scaling_health_score NUMERIC(5,2) NOT NULL,

  -- Recommendation
  recommendation TEXT NOT NULL
    CHECK (recommendation IN ('hold', 'increase_mode', 'decrease_mode', 'freeze')),

  -- Narrative
  summary_markdown TEXT NOT NULL,

  -- Confidence
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.8,
  data_completeness JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scaling_snapshots_env_time
  ON scaling_health_snapshots(environment, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scaling_snapshots_mode
  ON scaling_health_snapshots(current_mode);
CREATE INDEX IF NOT EXISTS idx_scaling_snapshots_recommendation
  ON scaling_health_snapshots(recommendation);

-- ============================================================================
-- Table 3: scaling_history
-- Append-only log of mode changes and scaling events
-- ============================================================================

CREATE TABLE IF NOT EXISTS scaling_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Environment
  environment TEXT NOT NULL,

  -- Event details
  event_type TEXT NOT NULL
    CHECK (event_type IN ('mode_change', 'capacity_update', 'freeze', 'unfreeze', 'note', 'config_update')),

  -- Mode transition
  old_mode TEXT,
  new_mode TEXT,

  -- Rationale
  reason_markdown TEXT NOT NULL,

  -- Actor
  actor TEXT NOT NULL DEFAULT 'system',
  -- 'founder' | 'system' | 'admin'

  -- Related data
  snapshot_id UUID REFERENCES scaling_health_snapshots(id),

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scaling_history_env_time
  ON scaling_history(environment, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scaling_history_event_type
  ON scaling_history(event_type);
CREATE INDEX IF NOT EXISTS idx_scaling_history_snapshot
  ON scaling_history(snapshot_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE scaling_mode_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE scaling_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scaling_history ENABLE ROW LEVEL SECURITY;

-- Config policies (founder/admin only)
CREATE POLICY "Admins can view scaling config" ON scaling_mode_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage scaling config" ON scaling_mode_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Snapshots policies (founder/admin only)
CREATE POLICY "Admins can view scaling snapshots" ON scaling_health_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "System can create snapshots" ON scaling_health_snapshots
  FOR INSERT WITH CHECK (true);

-- History policies (founder/admin only)
CREATE POLICY "Admins can view scaling history" ON scaling_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "System can create history" ON scaling_history
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get mode limits for a specific mode
CREATE OR REPLACE FUNCTION get_mode_limits(
  p_environment TEXT,
  p_mode TEXT
) RETURNS JSONB AS $$
DECLARE
  v_config scaling_mode_config;
BEGIN
  SELECT * INTO v_config FROM scaling_mode_config WHERE environment = p_environment;

  IF v_config.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_config.mode_limits->p_mode;
END;
$$ LANGUAGE plpgsql;

-- Check if can scale up
CREATE OR REPLACE FUNCTION can_scale_up(
  p_environment TEXT,
  p_current_health NUMERIC,
  p_current_utilisation NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_config scaling_mode_config;
  v_thresholds JSONB;
BEGIN
  SELECT * INTO v_config FROM scaling_mode_config WHERE environment = p_environment;

  IF v_config.id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_thresholds := v_config.guardrail_thresholds;

  -- Check health threshold
  IF p_current_health < (v_thresholds->>'min_health_for_increase')::NUMERIC THEN
    RETURN FALSE;
  END IF;

  -- Check utilisation threshold
  IF p_current_utilisation > (v_thresholds->>'max_utilisation_for_increase')::NUMERIC THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Calculate overall health score
CREATE OR REPLACE FUNCTION calculate_scaling_health(
  p_infra_health NUMERIC,
  p_ai_cost_pressure NUMERIC,
  p_warning_density NUMERIC,
  p_churn_risk NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  -- Weighted average: infra 30%, cost pressure 25%, warnings 25%, churn 20%
  -- Note: cost pressure and warnings are inverted (lower is better)
  RETURN (
    p_infra_health * 0.30 +
    (100 - p_ai_cost_pressure) * 0.25 +
    (100 - p_warning_density) * 0.25 +
    (100 - p_churn_risk) * 0.20
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE scaling_mode_config IS 'Phase 86: Scaling mode settings and thresholds per environment';
COMMENT ON TABLE scaling_health_snapshots IS 'Phase 86: Periodic scaling health and capacity snapshots';
COMMENT ON TABLE scaling_history IS 'Phase 86: Append-only log of scaling events and mode changes';

COMMENT ON COLUMN scaling_mode_config.current_mode IS 'lab | pilot | growth | scale';
COMMENT ON COLUMN scaling_mode_config.auto_mode_enabled IS 'If true, system can auto-recommend mode changes';
COMMENT ON COLUMN scaling_health_snapshots.utilisation_ratio IS 'active_clients / safe_capacity';
COMMENT ON COLUMN scaling_health_snapshots.recommendation IS 'hold | increase_mode | decrease_mode | freeze';
COMMENT ON COLUMN scaling_history.actor IS 'founder | system | admin';
