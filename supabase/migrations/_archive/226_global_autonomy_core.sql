/**
 * Migration 226: Global Multi-Agent Autonomy System
 *
 * Creates core infrastructure for global cross-agent reasoning, autonomy scoring,
 * and unified workflow coordination across all intelligence systems.
 *
 * Tables:
 * - global_autonomy_runs: Top-level autonomy execution contexts
 * - global_autonomy_events: Real-time events during autonomy runs
 * - global_autonomy_links: Relationships between runs, memories, and steps
 *
 * Functions:
 * - create_global_autonomy_run(): Initialize new run
 * - record_autonomy_event(): Log cross-agent events
 * - get_global_autonomy_summary(): Retrieve run metrics
 * - update_autonomy_scores(): Batch score updates
 * - link_autonomy_to_memory(): Archive to memory system
 */

-- Required extensions already available in Supabase
-- uuid-ossp: Standard UUID generation
-- pgvector: Already configured for ai_memory table

-- ============================================================================
-- GLOBAL_AUTONOMY_RUNS - Top-level autonomy execution contexts
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_autonomy_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  description TEXT,

  -- Context and state
  global_context JSONB DEFAULT '{}'::JSONB,

  -- Metrics
  risk_score INT DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  uncertainty_score INT DEFAULT 0 CHECK (uncertainty_score >= 0 AND uncertainty_score <= 100),
  autonomy_score INT DEFAULT 0 CHECK (autonomy_score >= 0 AND autonomy_score <= 100),
  readiness_score INT DEFAULT 0,
  consistency_score INT DEFAULT 0,
  confidence_score INT DEFAULT 0,

  -- Workflow tracking
  active_agents TEXT[] DEFAULT '{}',
  total_steps INT DEFAULT 0,
  completed_steps INT DEFAULT 0,
  failed_steps INT DEFAULT 0,

  -- Status and lifecycle
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'initializing', 'running', 'paused', 'completed', 'failed', 'halted'
  )),

  started_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autonomy_runs_workspace ON global_autonomy_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_runs_status ON global_autonomy_runs(status);
CREATE INDEX IF NOT EXISTS idx_autonomy_runs_autonomy_score ON global_autonomy_runs(autonomy_score DESC);
CREATE INDEX IF NOT EXISTS idx_autonomy_runs_risk_score ON global_autonomy_runs(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_autonomy_runs_created_at ON global_autonomy_runs(created_at DESC);

-- ============================================================================
-- GLOBAL_AUTONOMY_EVENTS - Real-time events during autonomy execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_autonomy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES global_autonomy_runs(id) ON DELETE CASCADE,

  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'context_assembled', 'agent_activated', 'agent_completed', 'agent_failed',
    'reasoning_started', 'reasoning_completed', 'decision_made', 'approval_required',
    'risk_escalation', 'uncertainty_spike', 'memory_influence', 'workflow_branched',
    'workflow_merged', 'bottleneck_detected', 'anomaly_detected', 'safety_gate_triggered'
  )),

  severity INT DEFAULT 0 CHECK (severity >= 0 AND severity <= 5),

  -- Actor and context
  agent TEXT,
  source_type TEXT, -- 'memory', 'reasoning', 'orchestrator', 'agent'
  source_id UUID,

  -- Payload with rich event data
  payload JSONB DEFAULT '{}'::JSONB,

  -- Timing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autonomy_events_run ON global_autonomy_events(run_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_events_type ON global_autonomy_events(event_type);
CREATE INDEX IF NOT EXISTS idx_autonomy_events_severity ON global_autonomy_events(severity DESC);
CREATE INDEX IF NOT EXISTS idx_autonomy_events_agent ON global_autonomy_events(agent);
CREATE INDEX IF NOT EXISTS idx_autonomy_events_created_at ON global_autonomy_events(created_at DESC);

-- ============================================================================
-- GLOBAL_AUTONOMY_LINKS - Cross-system relationship tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_autonomy_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES global_autonomy_runs(id) ON DELETE CASCADE,

  -- Linked entities
  memory_id UUID REFERENCES ai_memory(id) ON DELETE SET NULL,
  orchestrator_step_id UUID REFERENCES orchestrator_steps(id) ON DELETE SET NULL,
  reasoning_run_id UUID REFERENCES reasoning_runs(id) ON DELETE SET NULL,

  -- Link metadata
  agent TEXT NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN (
    'informed_by', 'influences', 'depends_on', 'enables', 'blocks', 'enhances'
  )),
  confidence INT DEFAULT 80 CHECK (confidence >= 0 AND confidence <= 100),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autonomy_links_run ON global_autonomy_links(run_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_links_memory ON global_autonomy_links(memory_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_links_step ON global_autonomy_links(orchestrator_step_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_links_reasoning ON global_autonomy_links(reasoning_run_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_links_agent ON global_autonomy_links(agent);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all autonomy tables
ALTER TABLE global_autonomy_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_autonomy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_autonomy_links ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to autonomy_runs"
  ON global_autonomy_runs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to autonomy_events"
  ON global_autonomy_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to autonomy_links"
  ON global_autonomy_links FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Founder has SELECT-scoped access (read-only)
CREATE POLICY "Founder can view autonomy_runs"
  ON global_autonomy_runs FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Founder can view autonomy_events"
  ON global_autonomy_events FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM global_autonomy_runs
      WHERE workspace_id IN (
        SELECT DISTINCT workspace_id FROM user_organizations
        WHERE user_id = auth.uid() AND role = 'owner'
      )
    )
  );

CREATE POLICY "Founder can view autonomy_links"
  ON global_autonomy_links FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM global_autonomy_runs
      WHERE workspace_id IN (
        SELECT DISTINCT workspace_id FROM user_organizations
        WHERE user_id = auth.uid() AND role = 'owner'
      )
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Create a new global autonomy run
CREATE OR REPLACE FUNCTION create_global_autonomy_run(
  p_workspace_id UUID,
  p_objective TEXT,
  p_description TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_run_id UUID;
BEGIN
  INSERT INTO global_autonomy_runs (
    workspace_id, objective, description, status, created_by
  ) VALUES (
    p_workspace_id, p_objective, p_description, 'pending', p_user_id
  )
  RETURNING id INTO v_run_id;

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record an autonomy event
CREATE OR REPLACE FUNCTION record_autonomy_event(
  p_run_id UUID,
  p_event_type TEXT,
  p_severity INT DEFAULT 0,
  p_agent TEXT DEFAULT NULL,
  p_source_type TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL,
  p_payload JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO global_autonomy_events (
    run_id, event_type, severity, agent, source_type, source_id, payload
  ) VALUES (
    p_run_id, p_event_type, p_severity, p_agent, p_source_type, p_source_id, COALESCE(p_payload, '{}'::JSONB)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update autonomy run status and scores
CREATE OR REPLACE FUNCTION update_autonomy_scores(
  p_run_id UUID,
  p_status TEXT DEFAULT NULL,
  p_risk_score INT DEFAULT NULL,
  p_uncertainty_score INT DEFAULT NULL,
  p_autonomy_score INT DEFAULT NULL,
  p_readiness_score INT DEFAULT NULL,
  p_consistency_score INT DEFAULT NULL,
  p_confidence_score INT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE global_autonomy_runs
  SET
    status = COALESCE(p_status, status),
    risk_score = COALESCE(p_risk_score, risk_score),
    uncertainty_score = COALESCE(p_uncertainty_score, uncertainty_score),
    autonomy_score = COALESCE(p_autonomy_score, autonomy_score),
    readiness_score = COALESCE(p_readiness_score, readiness_score),
    consistency_score = COALESCE(p_consistency_score, consistency_score),
    confidence_score = COALESCE(p_confidence_score, confidence_score),
    updated_at = now()
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get complete autonomy run summary
CREATE OR REPLACE FUNCTION get_global_autonomy_summary(p_run_id UUID)
RETURNS TABLE (
  run_id UUID,
  objective TEXT,
  status TEXT,
  autonomy_score INT,
  risk_score INT,
  uncertainty_score INT,
  active_agents TEXT[],
  total_events INT,
  critical_events INT,
  memory_influences INT,
  orchestrator_links INT,
  reasoning_links INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.objective,
    r.status,
    r.autonomy_score,
    r.risk_score,
    r.uncertainty_score,
    r.active_agents,
    (SELECT COUNT(*) FROM global_autonomy_events WHERE run_id = p_run_id)::INT,
    (SELECT COUNT(*) FROM global_autonomy_events WHERE run_id = p_run_id AND severity >= 3)::INT,
    (SELECT COUNT(*) FROM global_autonomy_links WHERE run_id = p_run_id AND memory_id IS NOT NULL)::INT,
    (SELECT COUNT(*) FROM global_autonomy_links WHERE run_id = p_run_id AND orchestrator_step_id IS NOT NULL)::INT,
    (SELECT COUNT(*) FROM global_autonomy_links WHERE run_id = p_run_id AND reasoning_run_id IS NOT NULL)::INT
  FROM global_autonomy_runs r
  WHERE r.id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- Link autonomy run to memory
CREATE OR REPLACE FUNCTION link_autonomy_to_memory(
  p_run_id UUID,
  p_memory_id UUID,
  p_agent TEXT,
  p_link_type TEXT,
  p_confidence INT DEFAULT 85
)
RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
BEGIN
  INSERT INTO global_autonomy_links (
    run_id, memory_id, agent, link_type, confidence
  ) VALUES (
    p_run_id, p_memory_id, p_agent, p_link_type, p_confidence
  )
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Link autonomy run to orchestrator step
CREATE OR REPLACE FUNCTION link_autonomy_to_orchestrator(
  p_run_id UUID,
  p_step_id UUID,
  p_agent TEXT,
  p_link_type TEXT,
  p_confidence INT DEFAULT 85
)
RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
BEGIN
  INSERT INTO global_autonomy_links (
    run_id, orchestrator_step_id, agent, link_type, confidence
  ) VALUES (
    p_run_id, p_step_id, p_agent, p_link_type, p_confidence
  )
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch update step counts
CREATE OR REPLACE FUNCTION update_autonomy_step_counts(
  p_run_id UUID,
  p_total_steps INT DEFAULT NULL,
  p_completed_steps INT DEFAULT NULL,
  p_failed_steps INT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE global_autonomy_runs
  SET
    total_steps = COALESCE(p_total_steps, total_steps),
    completed_steps = COALESCE(p_completed_steps, completed_steps),
    failed_steps = COALESCE(p_failed_steps, failed_steps),
    updated_at = now()
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set active agents
CREATE OR REPLACE FUNCTION set_autonomy_active_agents(
  p_run_id UUID,
  p_agents TEXT[]
)
RETURNS VOID AS $$
BEGIN
  UPDATE global_autonomy_runs
  SET
    active_agents = p_agents,
    updated_at = now()
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION create_global_autonomy_run TO authenticated;
GRANT EXECUTE ON FUNCTION record_autonomy_event TO authenticated;
GRANT EXECUTE ON FUNCTION update_autonomy_scores TO authenticated;
GRANT EXECUTE ON FUNCTION get_global_autonomy_summary TO authenticated;
GRANT EXECUTE ON FUNCTION link_autonomy_to_memory TO authenticated;
GRANT EXECUTE ON FUNCTION link_autonomy_to_orchestrator TO authenticated;
GRANT EXECUTE ON FUNCTION update_autonomy_step_counts TO authenticated;
GRANT EXECUTE ON FUNCTION set_autonomy_active_agents TO authenticated;
