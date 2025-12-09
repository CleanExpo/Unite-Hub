-- =====================================================
-- Phase D33: AI-Powered Outcome Simulator
-- =====================================================
-- Simulation runs for Campaign, SEO, and Audience outcomes
-- with scenario modeling and prediction analytics
-- =====================================================

-- Drop existing types if they exist (for re-runs)
DROP TYPE IF EXISTS synthex_simulation_type CASCADE;
DROP TYPE IF EXISTS synthex_simulation_status CASCADE;
DROP TYPE IF EXISTS synthex_scenario_type CASCADE;
DROP TYPE IF EXISTS synthex_prediction_confidence CASCADE;

-- Enum Types
CREATE TYPE synthex_simulation_type AS ENUM (
  'campaign',
  'seo',
  'audience',
  'revenue',
  'engagement',
  'churn',
  'conversion',
  'content',
  'pricing',
  'ab_test',
  'custom'
);

CREATE TYPE synthex_simulation_status AS ENUM (
  'draft',
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
  'archived'
);

CREATE TYPE synthex_scenario_type AS ENUM (
  'baseline',
  'optimistic',
  'pessimistic',
  'conservative',
  'aggressive',
  'custom'
);

CREATE TYPE synthex_prediction_confidence AS ENUM (
  'very_low',
  'low',
  'medium',
  'high',
  'very_high'
);

-- =====================================================
-- SIMULATION RUNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_simulation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Simulation Identity
  simulation_name TEXT NOT NULL,
  simulation_description TEXT,
  simulation_type synthex_simulation_type NOT NULL DEFAULT 'campaign',

  -- Simulation Parameters
  target_entity_type TEXT, -- campaign, content, audience, etc.
  target_entity_id UUID,
  time_horizon_days INTEGER DEFAULT 30,
  start_date DATE,
  end_date DATE,

  -- Input Configuration
  input_parameters JSONB NOT NULL DEFAULT '{}',
  baseline_metrics JSONB NOT NULL DEFAULT '{}',
  assumptions JSONB NOT NULL DEFAULT '{}',
  constraints JSONB NOT NULL DEFAULT '{}',

  -- Monte Carlo Settings
  monte_carlo_iterations INTEGER DEFAULT 1000,
  confidence_level NUMERIC(5,4) DEFAULT 0.95,
  random_seed INTEGER,

  -- Model Configuration
  model_type TEXT DEFAULT 'bayesian',
  model_parameters JSONB NOT NULL DEFAULT '{}',
  feature_weights JSONB NOT NULL DEFAULT '{}',

  -- External Factors
  market_conditions JSONB NOT NULL DEFAULT '{}',
  competitive_factors JSONB NOT NULL DEFAULT '{}',
  seasonal_adjustments JSONB NOT NULL DEFAULT '{}',

  -- Execution Status
  status synthex_simulation_status DEFAULT 'draft',
  status_message TEXT,
  progress_percent INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Results Summary
  primary_outcome JSONB,
  outcome_distribution JSONB,
  key_insights TEXT[],
  recommendations TEXT[],

  -- Risk Analysis
  risk_factors JSONB NOT NULL DEFAULT '[]',
  sensitivity_analysis JSONB,

  -- AI Analysis
  ai_narrative TEXT,
  ai_confidence NUMERIC(5,4),
  ai_reasoning JSONB,

  -- Resource Usage
  tokens_used INTEGER DEFAULT 0,
  compute_cost NUMERIC(12,6) DEFAULT 0,

  -- Metadata
  version INTEGER DEFAULT 1,
  parent_simulation_id UUID REFERENCES synthex_simulation_runs(id),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SIMULATION SCENARIOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES synthex_simulation_runs(id) ON DELETE CASCADE,

  -- Scenario Identity
  scenario_name TEXT NOT NULL,
  scenario_description TEXT,
  scenario_type synthex_scenario_type NOT NULL DEFAULT 'baseline',

  -- Scenario Configuration
  parameter_overrides JSONB NOT NULL DEFAULT '{}',
  assumption_overrides JSONB NOT NULL DEFAULT '{}',
  multipliers JSONB NOT NULL DEFAULT '{}',

  -- Probability Settings
  probability_weight NUMERIC(5,4) DEFAULT 0.20,
  occurrence_probability NUMERIC(5,4),

  -- Results
  predicted_outcomes JSONB NOT NULL DEFAULT '{}',
  outcome_range JSONB, -- { min, max, mean, median, p10, p90 }
  confidence_interval JSONB,

  -- Comparison
  delta_from_baseline JSONB,
  percentage_change JSONB,

  -- Impact Analysis
  positive_factors TEXT[],
  negative_factors TEXT[],
  key_drivers JSONB,

  -- Ordering
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SIMULATION PREDICTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_simulation_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES synthex_simulation_runs(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES synthex_simulation_scenarios(id) ON DELETE SET NULL,

  -- Prediction Identity
  metric_name TEXT NOT NULL,
  metric_category TEXT, -- revenue, engagement, conversion, etc.

  -- Prediction Values
  predicted_value NUMERIC(18,4),
  predicted_min NUMERIC(18,4),
  predicted_max NUMERIC(18,4),
  predicted_mean NUMERIC(18,4),
  predicted_median NUMERIC(18,4),
  standard_deviation NUMERIC(18,4),

  -- Percentiles
  p5 NUMERIC(18,4),
  p10 NUMERIC(18,4),
  p25 NUMERIC(18,4),
  p75 NUMERIC(18,4),
  p90 NUMERIC(18,4),
  p95 NUMERIC(18,4),

  -- Confidence
  confidence synthex_prediction_confidence DEFAULT 'medium',
  confidence_score NUMERIC(5,4),
  confidence_reasoning TEXT,

  -- Time Dimension
  prediction_date DATE,
  prediction_period TEXT, -- daily, weekly, monthly

  -- Comparison to Baseline
  baseline_value NUMERIC(18,4),
  absolute_change NUMERIC(18,4),
  percentage_change NUMERIC(8,4),

  -- Probability Distribution
  distribution_type TEXT DEFAULT 'normal', -- normal, lognormal, beta, etc.
  distribution_params JSONB,

  -- Contributing Factors
  top_positive_factors JSONB,
  top_negative_factors JSONB,
  factor_contributions JSONB,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SIMULATION RESULTS HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES synthex_simulation_runs(id) ON DELETE CASCADE,

  -- Result Type
  result_type TEXT NOT NULL, -- iteration, aggregate, summary
  iteration_number INTEGER,

  -- Raw Results
  raw_output JSONB NOT NULL DEFAULT '{}',
  processed_output JSONB NOT NULL DEFAULT '{}',

  -- Metrics
  metrics JSONB NOT NULL DEFAULT '{}',

  -- Model Performance
  model_accuracy NUMERIC(5,4),
  model_loss NUMERIC(12,6),
  convergence_status BOOLEAN,

  -- Metadata
  computation_time_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SIMULATION TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_simulation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES synthex_tenants(id) ON DELETE CASCADE, -- NULL for global templates

  -- Template Identity
  template_name TEXT NOT NULL,
  template_description TEXT,
  template_type synthex_simulation_type NOT NULL,

  -- Configuration
  default_parameters JSONB NOT NULL DEFAULT '{}',
  default_assumptions JSONB NOT NULL DEFAULT '{}',
  default_constraints JSONB NOT NULL DEFAULT '{}',

  -- Scenarios
  default_scenarios JSONB NOT NULL DEFAULT '[]',

  -- Model Settings
  recommended_model TEXT DEFAULT 'bayesian',
  recommended_iterations INTEGER DEFAULT 1000,
  recommended_horizon_days INTEGER DEFAULT 30,

  -- Usage
  is_public BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,

  -- Categorization
  category TEXT,
  industry TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SIMULATION VALIDATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_simulation_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES synthex_simulation_runs(id) ON DELETE CASCADE,
  prediction_id UUID REFERENCES synthex_simulation_predictions(id) ON DELETE SET NULL,

  -- Validation Data
  metric_name TEXT NOT NULL,
  predicted_value NUMERIC(18,4),
  actual_value NUMERIC(18,4),
  validation_date DATE NOT NULL,

  -- Accuracy Metrics
  absolute_error NUMERIC(18,4),
  percentage_error NUMERIC(8,4),
  within_confidence_interval BOOLEAN,

  -- Analysis
  error_category TEXT, -- underestimate, overestimate, accurate
  error_magnitude TEXT, -- minor, moderate, significant

  -- Learning
  contributing_factors JSONB,
  improvement_suggestions TEXT[],

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Simulation Runs
CREATE INDEX IF NOT EXISTS idx_simulation_runs_tenant
  ON synthex_simulation_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_type
  ON synthex_simulation_runs(simulation_type);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_status
  ON synthex_simulation_runs(status);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_created
  ON synthex_simulation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_target
  ON synthex_simulation_runs(target_entity_type, target_entity_id);

-- Simulation Scenarios
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_simulation
  ON synthex_simulation_scenarios(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_type
  ON synthex_simulation_scenarios(scenario_type);

-- Simulation Predictions
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_simulation
  ON synthex_simulation_predictions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_metric
  ON synthex_simulation_predictions(metric_name);
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_date
  ON synthex_simulation_predictions(prediction_date);

-- Simulation Results
CREATE INDEX IF NOT EXISTS idx_simulation_results_simulation
  ON synthex_simulation_results(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_type
  ON synthex_simulation_results(result_type);

-- Simulation Templates
CREATE INDEX IF NOT EXISTS idx_simulation_templates_type
  ON synthex_simulation_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_simulation_templates_public
  ON synthex_simulation_templates(is_public) WHERE is_public = TRUE;

-- Simulation Validations
CREATE INDEX IF NOT EXISTS idx_simulation_validations_simulation
  ON synthex_simulation_validations(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_validations_date
  ON synthex_simulation_validations(validation_date);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE synthex_simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_simulation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_simulation_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_simulation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_simulation_validations ENABLE ROW LEVEL SECURITY;

-- Simulation Runs
CREATE POLICY "simulation_runs_tenant_isolation" ON synthex_simulation_runs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Simulation Scenarios
CREATE POLICY "simulation_scenarios_tenant_isolation" ON synthex_simulation_scenarios
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Simulation Predictions
CREATE POLICY "simulation_predictions_tenant_isolation" ON synthex_simulation_predictions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Simulation Results
CREATE POLICY "simulation_results_tenant_isolation" ON synthex_simulation_results
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Simulation Templates (tenant + public)
CREATE POLICY "simulation_templates_access" ON synthex_simulation_templates
  FOR ALL USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR is_public = TRUE
  );

-- Simulation Validations
CREATE POLICY "simulation_validations_tenant_isolation" ON synthex_simulation_validations
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_simulation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER simulation_runs_updated_at
  BEFORE UPDATE ON synthex_simulation_runs
  FOR EACH ROW EXECUTE FUNCTION update_simulation_timestamp();

CREATE TRIGGER simulation_scenarios_updated_at
  BEFORE UPDATE ON synthex_simulation_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_simulation_timestamp();

CREATE TRIGGER simulation_templates_updated_at
  BEFORE UPDATE ON synthex_simulation_templates
  FOR EACH ROW EXECUTE FUNCTION update_simulation_timestamp();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get simulation stats for a tenant
CREATE OR REPLACE FUNCTION get_simulation_stats(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_simulations', COUNT(*),
    'completed_simulations', COUNT(*) FILTER (WHERE status = 'completed'),
    'running_simulations', COUNT(*) FILTER (WHERE status = 'running'),
    'queued_simulations', COUNT(*) FILTER (WHERE status = 'queued'),
    'failed_simulations', COUNT(*) FILTER (WHERE status = 'failed'),
    'avg_accuracy', COALESCE(
      (SELECT AVG(100 - ABS(v.percentage_error))
       FROM synthex_simulation_validations v
       JOIN synthex_simulation_runs r ON v.simulation_id = r.id
       WHERE r.tenant_id = p_tenant_id), 0
    ),
    'total_predictions', (
      SELECT COUNT(*)
      FROM synthex_simulation_predictions p
      JOIN synthex_simulation_runs r ON p.simulation_id = r.id
      WHERE r.tenant_id = p_tenant_id
    ),
    'total_validations', (
      SELECT COUNT(*)
      FROM synthex_simulation_validations v
      JOIN synthex_simulation_runs r ON v.simulation_id = r.id
      WHERE r.tenant_id = p_tenant_id
    ),
    'simulation_types', (
      SELECT jsonb_object_agg(simulation_type, cnt)
      FROM (
        SELECT simulation_type, COUNT(*) as cnt
        FROM synthex_simulation_runs
        WHERE tenant_id = p_tenant_id
        GROUP BY simulation_type
      ) t
    )
  ) INTO result
  FROM synthex_simulation_runs
  WHERE tenant_id = p_tenant_id;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Start a simulation run
CREATE OR REPLACE FUNCTION start_simulation(p_simulation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE synthex_simulation_runs
  SET
    status = 'running',
    started_at = NOW(),
    progress_percent = 0,
    updated_at = NOW()
  WHERE id = p_simulation_id
    AND status IN ('draft', 'queued');

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete a simulation run
CREATE OR REPLACE FUNCTION complete_simulation(
  p_simulation_id UUID,
  p_primary_outcome JSONB,
  p_outcome_distribution JSONB,
  p_key_insights TEXT[],
  p_recommendations TEXT[],
  p_ai_narrative TEXT,
  p_ai_confidence NUMERIC,
  p_tokens_used INTEGER,
  p_compute_cost NUMERIC
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE synthex_simulation_runs
  SET
    status = 'completed',
    completed_at = NOW(),
    duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000,
    progress_percent = 100,
    primary_outcome = p_primary_outcome,
    outcome_distribution = p_outcome_distribution,
    key_insights = p_key_insights,
    recommendations = p_recommendations,
    ai_narrative = p_ai_narrative,
    ai_confidence = p_ai_confidence,
    tokens_used = p_tokens_used,
    compute_cost = p_compute_cost,
    updated_at = NOW()
  WHERE id = p_simulation_id
    AND status = 'running';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate prediction accuracy
CREATE OR REPLACE FUNCTION calculate_prediction_accuracy(
  p_simulation_id UUID
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_validated', COUNT(*),
    'within_interval', COUNT(*) FILTER (WHERE within_confidence_interval),
    'accuracy_rate', ROUND(
      100.0 * COUNT(*) FILTER (WHERE within_confidence_interval) / NULLIF(COUNT(*), 0),
      2
    ),
    'mean_absolute_error', ROUND(AVG(absolute_error)::numeric, 4),
    'mean_percentage_error', ROUND(AVG(percentage_error)::numeric, 4),
    'by_error_category', jsonb_object_agg(
      COALESCE(error_category, 'unknown'),
      category_count
    )
  ) INTO result
  FROM synthex_simulation_validations v
  LEFT JOIN LATERAL (
    SELECT error_category, COUNT(*) as category_count
    FROM synthex_simulation_validations
    WHERE simulation_id = p_simulation_id
    GROUP BY error_category
  ) cats ON TRUE
  WHERE v.simulation_id = p_simulation_id;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE synthex_simulation_runs IS 'AI-powered outcome simulation runs with Monte Carlo and Bayesian modeling';
COMMENT ON TABLE synthex_simulation_scenarios IS 'Scenarios within simulations (baseline, optimistic, pessimistic, etc.)';
COMMENT ON TABLE synthex_simulation_predictions IS 'Individual metric predictions with confidence intervals';
COMMENT ON TABLE synthex_simulation_results IS 'Raw and processed simulation results history';
COMMENT ON TABLE synthex_simulation_templates IS 'Reusable simulation templates';
COMMENT ON TABLE synthex_simulation_validations IS 'Validation of predictions against actual outcomes';
