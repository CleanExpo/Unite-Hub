/**
 * Migration 227: Global Self-Correction & Adaptive Intelligence System
 *
 * Enables system-wide error anticipation, weakness detection, and continuous
 * improvement through self-correction cycles, predictive failure models, and
 * adaptive agent behavior adjustment.
 *
 * Tables:
 * - self_correction_cycles: Top-level correction execution contexts
 * - self_correction_graph: Relationship graph for weakness clustering
 *
 * Functions:
 * - create_correction_cycle(): Initialize new correction cycle
 * - record_correction_event(): Log correction actions
 * - update_correction_scores(): Update cycle metrics
 * - link_correction_to_memory(): Archive to memory system
 */

-- ============================================================================
-- SELF_CORRECTION_CYCLES - Correction cycle execution contexts
-- ============================================================================

CREATE TABLE IF NOT EXISTS self_correction_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  autonomy_run_id UUID REFERENCES global_autonomy_runs(id) ON DELETE SET NULL,

  -- Cycle configuration
  cycle_type TEXT NOT NULL CHECK (cycle_type IN (
    'preventive', 'reactive', 'adaptive', 'learning', 'system_wide'
  )),
  description TEXT,

  -- Predictions
  predicted_failure_probability INT DEFAULT 0 CHECK (predicted_failure_probability >= 0 AND predicted_failure_probability <= 100),
  predicted_failure_type TEXT,
  confidence INT DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),

  -- System state
  affected_agents TEXT[] DEFAULT '{}',
  weakness_clusters JSONB DEFAULT '{}'::JSONB,
  improvement_actions JSONB DEFAULT '{}'::JSONB,

  -- Metrics
  risk_score INT DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  effectiveness_score INT DEFAULT 0 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),

  -- Status and lifecycle
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'analyzing', 'predicting', 'planning', 'executing', 'validating', 'completed', 'failed', 'halted'
  )),

  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_correction_cycles_workspace ON self_correction_cycles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_correction_cycles_status ON self_correction_cycles(status);
CREATE INDEX IF NOT EXISTS idx_correction_cycles_failure_prob ON self_correction_cycles(predicted_failure_probability DESC);
CREATE INDEX IF NOT EXISTS idx_correction_cycles_confidence ON self_correction_cycles(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_correction_cycles_created_at ON self_correction_cycles(created_at DESC);

-- ============================================================================
-- SELF_CORRECTION_GRAPH - Weakness cluster relationship tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS self_correction_graph (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES self_correction_cycles(id) ON DELETE CASCADE,

  -- Node classification
  node_type TEXT NOT NULL CHECK (node_type IN (
    'weakness', 'agent_failure', 'memory_contradiction', 'reasoning_error',
    'orchestration_bottleneck', 'cross_agent_conflict', 'risk_spike', 'uncertainty_drift'
  )),

  -- Related entities
  related_memory_id UUID REFERENCES ai_memory(id) ON DELETE SET NULL,
  related_agent TEXT,
  related_orchestrator_task_id UUID REFERENCES orchestrator_tasks(id) ON DELETE SET NULL,
  related_reasoning_run_id UUID REFERENCES reasoning_runs(id) ON DELETE SET NULL,

  -- Relationship details
  severity INT DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  link_type TEXT CHECK (link_type IN (
    'causes', 'contributes_to', 'conflicts_with', 'amplifies', 'depends_on'
  )),

  confidence INT DEFAULT 75 CHECK (confidence >= 0 AND confidence <= 100),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_correction_graph_cycle ON self_correction_graph(cycle_id);
CREATE INDEX IF NOT EXISTS idx_correction_graph_node_type ON self_correction_graph(node_type);
CREATE INDEX IF NOT EXISTS idx_correction_graph_severity ON self_correction_graph(severity DESC);
CREATE INDEX IF NOT EXISTS idx_correction_graph_agent ON self_correction_graph(related_agent);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE self_correction_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_correction_graph ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to correction_cycles"
  ON self_correction_cycles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to correction_graph"
  ON self_correction_graph FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Founder has SELECT-scoped access (read-only)
CREATE POLICY "Founder can view correction_cycles"
  ON self_correction_cycles FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Founder can view correction_graph"
  ON self_correction_graph FOR SELECT
  USING (
    cycle_id IN (
      SELECT id FROM self_correction_cycles
      WHERE workspace_id IN (
        SELECT DISTINCT workspace_id FROM user_organizations
        WHERE user_id = auth.uid() AND role = 'owner'
      )
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_correction_cycle(
  p_workspace_id UUID,
  p_cycle_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_cycle_id UUID;
BEGIN
  INSERT INTO self_correction_cycles (
    workspace_id, cycle_type, description, status, created_by
  ) VALUES (
    p_workspace_id, p_cycle_type, p_description, 'pending', p_user_id
  )
  RETURNING id INTO v_cycle_id;

  RETURN v_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_correction_scores(
  p_cycle_id UUID,
  p_status TEXT DEFAULT NULL,
  p_predicted_failure_probability INT DEFAULT NULL,
  p_confidence INT DEFAULT NULL,
  p_risk_score INT DEFAULT NULL,
  p_effectiveness_score INT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE self_correction_cycles
  SET
    status = COALESCE(p_status, status),
    predicted_failure_probability = COALESCE(p_predicted_failure_probability, predicted_failure_probability),
    confidence = COALESCE(p_confidence, confidence),
    risk_score = COALESCE(p_risk_score, risk_score),
    effectiveness_score = COALESCE(p_effectiveness_score, effectiveness_score),
    updated_at = now()
  WHERE id = p_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_correction_graph_node(
  p_cycle_id UUID,
  p_node_type TEXT,
  p_severity INT,
  p_related_agent TEXT DEFAULT NULL,
  p_related_memory_id UUID DEFAULT NULL,
  p_related_task_id UUID DEFAULT NULL,
  p_link_type TEXT DEFAULT NULL,
  p_confidence INT DEFAULT 75,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_node_id UUID;
BEGIN
  INSERT INTO self_correction_graph (
    cycle_id, node_type, severity, related_agent, related_memory_id,
    related_orchestrator_task_id, link_type, confidence, notes
  ) VALUES (
    p_cycle_id, p_node_type, p_severity, p_related_agent, p_related_memory_id,
    p_related_task_id, p_link_type, p_confidence, p_notes
  )
  RETURNING id INTO v_node_id;

  RETURN v_node_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_correction_cycle_summary(p_cycle_id UUID)
RETURNS TABLE (
  cycle_id UUID,
  cycle_type TEXT,
  status TEXT,
  predicted_failure_probability INT,
  confidence INT,
  risk_score INT,
  effectiveness_score INT,
  affected_agents TEXT[],
  total_graph_nodes INT,
  critical_nodes INT,
  memory_contradictions INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.cycle_type,
    c.status,
    c.predicted_failure_probability,
    c.confidence,
    c.risk_score,
    c.effectiveness_score,
    c.affected_agents,
    (SELECT COUNT(*) FROM self_correction_graph WHERE cycle_id = p_cycle_id)::INT,
    (SELECT COUNT(*) FROM self_correction_graph WHERE cycle_id = p_cycle_id AND severity >= 4)::INT,
    (SELECT COUNT(*) FROM self_correction_graph WHERE cycle_id = p_cycle_id AND node_type = 'memory_contradiction')::INT
  FROM self_correction_cycles c
  WHERE c.id = p_cycle_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_correction_affected_agents(
  p_cycle_id UUID,
  p_agents TEXT[]
)
RETURNS VOID AS $$
BEGIN
  UPDATE self_correction_cycles
  SET
    affected_agents = p_agents,
    updated_at = now()
  WHERE id = p_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_correction_actions(
  p_cycle_id UUID,
  p_improvement_actions JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE self_correction_cycles
  SET
    improvement_actions = p_improvement_actions,
    updated_at = now()
  WHERE id = p_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_correction_cycle TO authenticated;
GRANT EXECUTE ON FUNCTION update_correction_scores TO authenticated;
GRANT EXECUTE ON FUNCTION add_correction_graph_node TO authenticated;
GRANT EXECUTE ON FUNCTION get_correction_cycle_summary TO authenticated;
GRANT EXECUTE ON FUNCTION set_correction_affected_agents TO authenticated;
GRANT EXECUTE ON FUNCTION set_correction_actions TO authenticated;
