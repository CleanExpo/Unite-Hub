/**
 * Migration 229: Global Autonomy Calibration & Alignment Engine
 *
 * Enables continuous self-optimization of the autonomous system through:
 * - Dynamic risk threshold adjustment
 * - Agent weight learning from performance data
 * - Uncertainty rebalancing
 * - Reasoning depth tuning
 * - Orchestrator workflow optimization
 *
 * Tables:
 * - autonomy_calibration_cycles: Records of calibration runs and improvements
 * - autonomy_calibration_parameters: Current active thresholds and weights
 * - autonomy_calibration_metrics: Performance metrics used for tuning
 *
 * Functions:
 * - create_calibration_cycle(): Start a new calibration evaluation
 * - update_calibration_parameters(): Apply new tuned parameters
 * - record_calibration_metric(): Log performance data
 * - get_active_parameters(): Retrieve current calibrated thresholds
 */

-- ============================================================================
-- AUTONOMY_CALIBRATION_CYCLES - Records of calibration runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS autonomy_calibration_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Calibration cycle metadata
  cycle_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'analyzing', 'evaluating', 'proposing', 'approved', 'applied', 'failed'
  )),

  -- Time window for analysis
  analysis_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  analysis_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  lookback_hours INT NOT NULL DEFAULT 24,

  -- What metrics were analyzed
  metrics_analyzed JSONB DEFAULT '{}'::JSONB,

  -- Key findings from calibration
  findings JSONB DEFAULT '{}'::JSONB, -- {false_positives, false_negatives, missed_predictions, etc}

  -- Proposed parameter changes
  proposed_changes JSONB NOT NULL DEFAULT '{}'::JSONB,
  change_rationale TEXT,

  -- Confidence that changes are beneficial
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Approval tracking
  requires_approval BOOLEAN DEFAULT FALSE, -- Large changes need founder approval
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,

  -- Execution
  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMP WITH TIME ZONE,
  rollback_available BOOLEAN DEFAULT TRUE,

  -- Results after application
  results JSONB DEFAULT '{}'::JSONB, -- {improvement_percentage, metric_deltas, etc}

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_calibration_cycles_workspace ON autonomy_calibration_cycles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calibration_cycles_status ON autonomy_calibration_cycles(status);
CREATE INDEX IF NOT EXISTS idx_calibration_cycles_timestamp ON autonomy_calibration_cycles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calibration_cycles_cycle_number ON autonomy_calibration_cycles(cycle_number DESC);

-- ============================================================================
-- AUTONOMY_CALIBRATION_PARAMETERS - Current active thresholds and weights
-- ============================================================================

CREATE TABLE IF NOT EXISTS autonomy_calibration_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Parameter identification
  parameter_name TEXT NOT NULL, -- risk_threshold_critical, agent_weight_orchestrator, etc
  parameter_category TEXT NOT NULL CHECK (parameter_category IN (
    'risk_threshold', 'agent_weight', 'uncertainty_factor', 'reasoning_depth', 'orchestration'
  )),

  -- Current value and baseline
  current_value NUMERIC NOT NULL,
  baseline_value NUMERIC NOT NULL, -- The hard-coded safety minimum
  min_value NUMERIC NOT NULL, -- Calibration cannot go below this
  max_value NUMERIC NOT NULL,

  -- Applied from calibration cycle
  calibration_cycle_id UUID REFERENCES autonomy_calibration_cycles(id) ON DELETE SET NULL,

  -- Confidence and adoption
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),
  times_applied INT DEFAULT 1,
  improvement_trend NUMERIC, -- Percentage improvement observed

  -- When it was applied
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_review_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calibration_parameters_workspace ON autonomy_calibration_parameters(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calibration_parameters_category ON autonomy_calibration_parameters(parameter_category);
CREATE INDEX IF NOT EXISTS idx_calibration_parameters_name ON autonomy_calibration_parameters(parameter_name);

-- ============================================================================
-- AUTONOMY_CALIBRATION_METRICS - Performance data for tuning
-- ============================================================================

CREATE TABLE IF NOT EXISTS autonomy_calibration_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- What we're measuring
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'false_positive', 'false_negative', 'prediction_accuracy', 'autonomy_success',
    'enforcement_effectiveness', 'agent_performance', 'reasoning_quality'
  )),

  -- Value and time period
  metric_value NUMERIC NOT NULL,
  measurement_period_hours INT NOT NULL DEFAULT 24,

  -- Related to specific agents or workflows
  agent_name TEXT,
  workflow_type TEXT,

  -- Context
  details JSONB DEFAULT '{}'::JSONB,

  -- How recent this data is
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calibration_metrics_workspace ON autonomy_calibration_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calibration_metrics_type ON autonomy_calibration_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_calibration_metrics_timestamp ON autonomy_calibration_metrics(measured_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE autonomy_calibration_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_calibration_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_calibration_metrics ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to autonomy_calibration_cycles"
  ON autonomy_calibration_cycles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to autonomy_calibration_parameters"
  ON autonomy_calibration_parameters FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to autonomy_calibration_metrics"
  ON autonomy_calibration_metrics FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Founder has SELECT-scoped access (read-only)
CREATE POLICY "Founder can view autonomy_calibration_cycles"
  ON autonomy_calibration_cycles FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Founder can view autonomy_calibration_parameters"
  ON autonomy_calibration_parameters FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Founder can view autonomy_calibration_metrics"
  ON autonomy_calibration_metrics FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_calibration_cycle(
  p_workspace_id UUID,
  p_analysis_start_time TIMESTAMP WITH TIME ZONE,
  p_analysis_end_time TIMESTAMP WITH TIME ZONE,
  p_metrics_analyzed JSONB DEFAULT NULL,
  p_proposed_changes JSONB DEFAULT NULL,
  p_change_rationale TEXT DEFAULT NULL,
  p_requires_approval BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_cycle_id UUID;
  v_cycle_number INT;
BEGIN
  -- Get next cycle number
  SELECT COALESCE(MAX(cycle_number), 0) + 1 INTO v_cycle_number
  FROM autonomy_calibration_cycles
  WHERE workspace_id = p_workspace_id;

  INSERT INTO autonomy_calibration_cycles (
    workspace_id, cycle_number, status, analysis_start_time, analysis_end_time,
    metrics_analyzed, proposed_changes, change_rationale, requires_approval
  ) VALUES (
    p_workspace_id, v_cycle_number, 'pending', p_analysis_start_time, p_analysis_end_time,
    COALESCE(p_metrics_analyzed, '{}'::JSONB), COALESCE(p_proposed_changes, '{}'::JSONB),
    p_change_rationale, p_requires_approval
  )
  RETURNING id INTO v_cycle_id;

  RETURN v_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_calibration_parameters(
  p_workspace_id UUID,
  p_parameter_name TEXT,
  p_new_value NUMERIC,
  p_calibration_cycle_id UUID DEFAULT NULL,
  p_confidence_score INT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_param_id UUID;
  v_baseline NUMERIC;
  v_min_value NUMERIC;
  v_max_value NUMERIC;
BEGIN
  -- Get baseline values (for safety, these are hard-coded minimums)
  CASE p_parameter_name
    WHEN 'risk_threshold_critical' THEN
      v_baseline := 80; v_min_value := 75; v_max_value := 90;
    WHEN 'risk_threshold_high' THEN
      v_baseline := 65; v_min_value := 60; v_max_value := 75;
    WHEN 'uncertainty_threshold' THEN
      v_baseline := 75; v_min_value := 70; v_max_value := 85;
    ELSE
      v_baseline := p_new_value; v_min_value := p_new_value * 0.8; v_max_value := p_new_value * 1.2;
  END CASE;

  -- Ensure new value respects safety bounds
  IF p_new_value < v_min_value OR p_new_value > v_max_value THEN
    RAISE EXCEPTION 'Parameter value % outside allowed range [%, %]', p_new_value, v_min_value, v_max_value;
  END IF;

  INSERT INTO autonomy_calibration_parameters (
    workspace_id, parameter_name, parameter_category, current_value, baseline_value,
    min_value, max_value, calibration_cycle_id, confidence_score
  ) VALUES (
    p_workspace_id, p_parameter_name, 'risk_threshold', p_new_value, v_baseline,
    v_min_value, v_max_value, p_calibration_cycle_id, p_confidence_score
  )
  RETURNING id INTO v_param_id;

  RETURN v_param_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_calibration_metric(
  p_workspace_id UUID,
  p_metric_type TEXT,
  p_metric_value NUMERIC,
  p_agent_name TEXT DEFAULT NULL,
  p_workflow_type TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO autonomy_calibration_metrics (
    workspace_id, metric_type, metric_value, agent_name, workflow_type, details
  ) VALUES (
    p_workspace_id, p_metric_type, p_metric_value, p_agent_name, p_workflow_type,
    COALESCE(p_details, '{}'::JSONB)
  )
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_active_parameters(p_workspace_id UUID)
RETURNS TABLE (
  parameter_name TEXT,
  current_value NUMERIC,
  baseline_value NUMERIC,
  confidence_score INT,
  improvement_trend NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    acp.parameter_name,
    acp.current_value,
    acp.baseline_value,
    acp.confidence_score,
    acp.improvement_trend
  FROM autonomy_calibration_parameters acp
  WHERE acp.workspace_id = p_workspace_id
  ORDER BY acp.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_calibration_cycle TO authenticated;
GRANT EXECUTE ON FUNCTION update_calibration_parameters TO authenticated;
GRANT EXECUTE ON FUNCTION record_calibration_metric TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_parameters TO authenticated;
