/**
 * Migration 231: Threshold Adjustment Proposals & Executions
 *
 * Tracks proposed and executed threshold adjustments:
 * - Proposals for threshold changes with metrics justification
 * - Execution records showing what was applied and any constraints
 * - Full audit trail for safety threshold modifications
 */

-- ============================================================================
-- THRESHOLD_ADJUSTMENT_PROPOSALS - Proposed changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS threshold_adjustment_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Link to calibration cycle
  calibration_cycle_id UUID NOT NULL REFERENCES autonomy_calibration_cycles(id) ON DELETE CASCADE,

  -- Proposal tracking
  adjustment_id UUID NOT NULL UNIQUE,
  parameter_name TEXT NOT NULL,
  parameter_category TEXT NOT NULL CHECK (parameter_category IN (
    'critical', 'high', 'uncertainty', 'cascade', 'deadlock', 'memory'
  )),

  -- Values
  current_value NUMERIC NOT NULL,
  proposed_value NUMERIC NOT NULL,
  delta_percentage NUMERIC,
  delta_absolute NUMERIC,

  -- Approval tracking
  requires_approval BOOLEAN DEFAULT FALSE,
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Rationale and metrics
  rationale TEXT,
  metrics_justification TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_workspace ON threshold_adjustment_proposals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_cycle ON threshold_adjustment_proposals(calibration_cycle_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_parameter ON threshold_adjustment_proposals(parameter_name);

-- ============================================================================
-- THRESHOLD_ADJUSTMENT_EXECUTIONS - Execution records
-- ============================================================================

CREATE TABLE IF NOT EXISTS threshold_adjustment_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Link to proposal and cycle
  adjustment_id UUID NOT NULL,
  calibration_cycle_id UUID NOT NULL REFERENCES autonomy_calibration_cycles(id) ON DELETE CASCADE,

  -- Execution details
  parameter_name TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  final_value NUMERIC NOT NULL,

  -- Safety constraint tracking
  safety_constraint_active BOOLEAN DEFAULT FALSE,
  constraint_reason TEXT,

  -- Approval
  -- Keep FK reference to auth.users (allowed in migrations)
approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adjustment_executions_workspace ON threshold_adjustment_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_executions_adjustment ON threshold_adjustment_executions(adjustment_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_executions_cycle ON threshold_adjustment_executions(calibration_cycle_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_executions_timestamp ON threshold_adjustment_executions(executed_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE threshold_adjustment_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold_adjustment_executions ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to adjustment_proposals"
  ON threshold_adjustment_proposals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to adjustment_executions"
  ON threshold_adjustment_executions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Founder has SELECT access (read-only)
CREATE POLICY "Founder can view adjustment_proposals"
  ON threshold_adjustment_proposals FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Founder can view adjustment_executions"
  ON threshold_adjustment_executions FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_adjustment_proposals_for_cycle(p_cycle_id UUID)
RETURNS TABLE (
  adjustment_id UUID,
  parameter_name TEXT,
  current_value NUMERIC,
  proposed_value NUMERIC,
  delta_percentage NUMERIC,
  requires_approval BOOLEAN,
  confidence_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tap.adjustment_id,
    tap.parameter_name,
    tap.current_value,
    tap.proposed_value,
    tap.delta_percentage,
    tap.requires_approval,
    tap.confidence_score
  FROM threshold_adjustment_proposals tap
  WHERE tap.calibration_cycle_id = p_cycle_id
  ORDER BY tap.delta_percentage DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_adjustment_history(
  p_workspace_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  parameter_name TEXT,
  final_value NUMERIC,
  executed_at TIMESTAMP WITH TIME ZONE,
  safety_constraint_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tae.parameter_name,
    tae.final_value,
    tae.executed_at,
    tae.safety_constraint_active
  FROM threshold_adjustment_executions tae
  WHERE tae.workspace_id = p_workspace_id
  ORDER BY tae.executed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_adjustment_proposals_for_cycle TO authenticated;
GRANT EXECUTE ON FUNCTION get_adjustment_history TO authenticated;
