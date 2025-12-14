/**
 * Migration 230: Autonomy Tuning Results Storage
 *
 * Stores the results of autonomy tuning operations:
 * - Applied parameter adjustments
 * - Agent weights and risk weights
 * - Uncertainty scaling and reasoning depth allocations
 * - Orchestration schedules
 * - Confidence scores and explainability notes
 */

-- ============================================================================
-- AUTONOMY_TUNING_RESULTS - Stores tuning execution results
-- ============================================================================

CREATE TABLE IF NOT EXISTS autonomy_tuning_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Link to calibration cycle that triggered this tuning
  calibration_cycle_id UUID NOT NULL REFERENCES autonomy_calibration_cycles(id) ON DELETE CASCADE,

  -- Unique tuning execution ID
  tuning_id UUID NOT NULL UNIQUE,

  -- Parameter adjustments applied
  adjustments_applied JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Final calibrated parameters
  agent_weights JSONB NOT NULL DEFAULT '{}'::JSONB,
  risk_weights JSONB NOT NULL DEFAULT '{}'::JSONB,
  uncertainty_scaling NUMERIC NOT NULL,
  reasoning_depth_allocation JSONB NOT NULL DEFAULT '{}'::JSONB,
  orchestration_schedule JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Confidence and explainability
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),
  explainability_notes TEXT,
  parameters_locked BOOLEAN DEFAULT FALSE, -- True if safety constraints locked any adjustments

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tuning_results_workspace ON autonomy_tuning_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tuning_results_cycle ON autonomy_tuning_results(calibration_cycle_id);
CREATE INDEX IF NOT EXISTS idx_tuning_results_timestamp ON autonomy_tuning_results(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE autonomy_tuning_results ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to autonomy_tuning_results"
  ON autonomy_tuning_results FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Founder has SELECT-scoped access (read-only)
CREATE POLICY "Founder can view autonomy_tuning_results"
  ON autonomy_tuning_results FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_latest_tuning_result(p_workspace_id UUID)
RETURNS TABLE (
  tuning_id UUID,
  calibration_cycle_id UUID,
  confidence_score INT,
  parameters_locked BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    atr.tuning_id,
    atr.calibration_cycle_id,
    atr.confidence_score,
    atr.parameters_locked,
    atr.created_at
  FROM autonomy_tuning_results atr
  WHERE atr.workspace_id = p_workspace_id
  ORDER BY atr.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_tuning_history(
  p_workspace_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  tuning_id UUID,
  calibration_cycle_id UUID,
  confidence_score INT,
  parameters_locked BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    atr.tuning_id,
    atr.calibration_cycle_id,
    atr.confidence_score,
    atr.parameters_locked,
    atr.created_at
  FROM autonomy_tuning_results atr
  WHERE atr.workspace_id = p_workspace_id
  ORDER BY atr.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_latest_tuning_result TO authenticated;
GRANT EXECUTE ON FUNCTION get_tuning_history TO authenticated;
