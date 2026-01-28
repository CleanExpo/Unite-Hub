-- Migration 126: Client Operations Agent v1 (Safety-Caged)
-- Phase 83: AI agent for client operations with safety constraints

-- ============================================================================
-- Table 1: client_agent_policies
-- Per-client agent settings: allowed actions, auto-exec scope, risk thresholds
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_agent_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope
  client_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Agent settings
  agent_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Allowed action types
  allowed_actions JSONB NOT NULL DEFAULT '["send_followup", "update_status", "add_tag", "schedule_task", "generate_content"]'::jsonb,

  -- Auto-execution settings
  auto_exec_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_exec_risk_threshold TEXT NOT NULL DEFAULT 'low' CHECK (auto_exec_risk_threshold IN ('low', 'medium', 'high')),

  -- Risk thresholds (0-1 scale)
  low_risk_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.30,
  medium_risk_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.60,

  -- Safety constraints
  max_actions_per_day INTEGER NOT NULL DEFAULT 10,
  require_human_review_above_score INTEGER NOT NULL DEFAULT 70,

  -- Early Warning integration
  respect_early_warnings BOOLEAN NOT NULL DEFAULT true,
  pause_on_high_severity_warning BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_by UUID,
  updated_by UUID,

  UNIQUE(client_id, workspace_id)
);

-- Index for quick policy lookup
CREATE INDEX IF NOT EXISTS idx_client_agent_policies_lookup
  ON client_agent_policies(workspace_id, client_id);

-- ============================================================================
-- Table 2: client_agent_sessions
-- Conversational and operational sessions between client and agent
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope
  client_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Session metadata
  session_type TEXT NOT NULL DEFAULT 'operational' CHECK (session_type IN ('operational', 'conversational', 'review')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'error')),

  -- Context
  context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Contains: client_profile, recent_interactions, performance_metrics, early_warnings

  -- Messages
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of: { role: 'user'|'agent'|'system', content: string, timestamp: string }

  -- Session stats
  actions_proposed INTEGER NOT NULL DEFAULT 0,
  actions_executed INTEGER NOT NULL DEFAULT 0,
  actions_rejected INTEGER NOT NULL DEFAULT 0,

  -- Safety tracking
  risk_score_avg NUMERIC(3,2) DEFAULT 0,
  truth_compliance_score NUMERIC(3,2) DEFAULT 1.0,

  -- Duration
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Error tracking
  error_message TEXT,

  -- Audit
  initiated_by UUID
);

-- Indexes for session queries
CREATE INDEX IF NOT EXISTS idx_client_agent_sessions_workspace
  ON client_agent_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_agent_sessions_client
  ON client_agent_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_agent_sessions_status
  ON client_agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_client_agent_sessions_created
  ON client_agent_sessions(created_at DESC);

-- ============================================================================
-- Table 3: client_agent_actions
-- Immutable log of all actions the agent proposes or executes
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope
  session_id UUID REFERENCES client_agent_sessions(id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Action details
  action_type TEXT NOT NULL,
  -- Types: send_followup, update_status, add_tag, remove_tag, schedule_task,
  --        generate_content, update_score, create_note, send_notification

  action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Contains action-specific data

  -- Risk assessment
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_score NUMERIC(3,2) NOT NULL DEFAULT 0,
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of: { factor: string, weight: number, description: string }

  -- Approval workflow
  approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('auto_executed', 'awaiting_approval', 'approved_executed', 'rejected', 'expired')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Execution
  executed_at TIMESTAMPTZ,
  execution_result JSONB,
  -- Contains: success: boolean, message: string, affected_records: string[]

  -- Truth Layer compliance
  truth_compliant BOOLEAN NOT NULL DEFAULT true,
  truth_disclaimers JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of disclaimer strings

  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.8,
  data_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of: { source: string, recency: string, reliability: number }

  -- Early Warning integration
  triggered_by_warning UUID,
  warning_severity TEXT,

  -- Reasoning
  agent_reasoning TEXT,
  -- Why the agent proposed this action

  -- Audit
  proposed_by TEXT NOT NULL DEFAULT 'agent',
  execution_mode TEXT NOT NULL DEFAULT 'manual' CHECK (execution_mode IN ('auto', 'manual', 'override'))
);

-- Indexes for action queries
CREATE INDEX IF NOT EXISTS idx_client_agent_actions_session
  ON client_agent_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_client_agent_actions_client
  ON client_agent_actions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_agent_actions_workspace
  ON client_agent_actions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_agent_actions_status
  ON client_agent_actions(approval_status);
CREATE INDEX IF NOT EXISTS idx_client_agent_actions_created
  ON client_agent_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_agent_actions_risk
  ON client_agent_actions(risk_level);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE client_agent_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_agent_actions ENABLE ROW LEVEL SECURITY;

-- Policies for client_agent_policies
CREATE POLICY "Users can view policies in their workspace" ON client_agent_policies
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage policies" ON client_agent_policies
  FOR ALL USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policies for client_agent_sessions
CREATE POLICY "Users can view sessions in their workspace" ON client_agent_sessions
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions in their workspace" ON client_agent_sessions
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sessions in their workspace" ON client_agent_sessions
  FOR UPDATE USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policies for client_agent_actions
CREATE POLICY "Users can view actions in their workspace" ON client_agent_actions
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create actions in their workspace" ON client_agent_actions
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update actions in their workspace" ON client_agent_actions
  FOR UPDATE USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Helper function for action risk calculation
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_action_risk(
  p_action_type TEXT,
  p_payload JSONB,
  p_client_score INTEGER DEFAULT 50
) RETURNS TABLE (
  risk_level TEXT,
  risk_score NUMERIC,
  risk_factors JSONB
) AS $$
DECLARE
  v_risk_score NUMERIC := 0;
  v_factors JSONB := '[]'::jsonb;
BEGIN
  -- Base risk by action type
  CASE p_action_type
    WHEN 'add_tag' THEN v_risk_score := 0.1;
    WHEN 'remove_tag' THEN v_risk_score := 0.15;
    WHEN 'create_note' THEN v_risk_score := 0.1;
    WHEN 'update_status' THEN v_risk_score := 0.2;
    WHEN 'update_score' THEN v_risk_score := 0.25;
    WHEN 'schedule_task' THEN v_risk_score := 0.3;
    WHEN 'generate_content' THEN v_risk_score := 0.35;
    WHEN 'send_followup' THEN v_risk_score := 0.5;
    WHEN 'send_notification' THEN v_risk_score := 0.6;
    ELSE v_risk_score := 0.5;
  END CASE;

  v_factors := v_factors || jsonb_build_object(
    'factor', 'action_type',
    'weight', v_risk_score,
    'description', format('Base risk for %s action', p_action_type)
  );

  -- Adjust for high-value clients
  IF p_client_score >= 80 THEN
    v_risk_score := v_risk_score * 1.3;
    v_factors := v_factors || jsonb_build_object(
      'factor', 'high_value_client',
      'weight', 0.3,
      'description', 'Client has high score, increased caution'
    );
  END IF;

  -- Determine risk level
  RETURN QUERY SELECT
    CASE
      WHEN v_risk_score <= 0.30 THEN 'low'
      WHEN v_risk_score <= 0.60 THEN 'medium'
      ELSE 'high'
    END,
    LEAST(v_risk_score, 1.0),
    v_factors;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger to update session stats
-- ============================================================================

CREATE OR REPLACE FUNCTION update_session_action_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE client_agent_sessions
    SET
      actions_proposed = (
        SELECT COUNT(*) FROM client_agent_actions
        WHERE session_id = NEW.session_id
      ),
      actions_executed = (
        SELECT COUNT(*) FROM client_agent_actions
        WHERE session_id = NEW.session_id
        AND approval_status IN ('auto_executed', 'approved_executed')
      ),
      actions_rejected = (
        SELECT COUNT(*) FROM client_agent_actions
        WHERE session_id = NEW.session_id
        AND approval_status = 'rejected'
      ),
      risk_score_avg = (
        SELECT AVG(risk_score) FROM client_agent_actions
        WHERE session_id = NEW.session_id
      ),
      updated_at = now()
    WHERE id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_session_stats
  AFTER INSERT OR UPDATE ON client_agent_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_action_stats();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE client_agent_policies IS 'Phase 83: Per-client agent configuration and safety constraints';
COMMENT ON TABLE client_agent_sessions IS 'Phase 83: Agent operational and conversational sessions';
COMMENT ON TABLE client_agent_actions IS 'Phase 83: Immutable audit log of all agent actions';

COMMENT ON COLUMN client_agent_policies.auto_exec_risk_threshold IS 'Maximum risk level for auto-execution without approval';
COMMENT ON COLUMN client_agent_actions.truth_compliant IS 'Whether action meets Truth Layer standards';
COMMENT ON COLUMN client_agent_actions.agent_reasoning IS 'Explanation of why agent proposed this action';
