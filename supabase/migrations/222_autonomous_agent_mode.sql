-- Migration 222: Autonomous Agent Mode
-- Purpose: Enable Synthex to autonomously plan, reason, sequence and execute safe multi-step workflows
-- Created: 2025-11-25
-- Security: Founder-only access, sandbox validation, approval workflow, full audit logging

-- ============================================================================
-- 1. AGENT_EXECUTION_PLANS Table - Store autonomous agent plans
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_execution_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,

  -- Objective & planning
  objective TEXT NOT NULL,
  reasoning_trace JSONB,
  plan JSONB NOT NULL,

  -- Scoring
  complexity_score INTEGER DEFAULT 0 CHECK (complexity_score >= 0 AND complexity_score <= 100),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'running', 'completed', 'failed', 'cancelled')) DEFAULT 'draft',

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_agent_execution_plans_workspace ON agent_execution_plans(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_plans_status ON agent_execution_plans(status);
CREATE INDEX IF NOT EXISTS idx_agent_execution_plans_created_at ON agent_execution_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_execution_plans_agent ON agent_execution_plans(agent_name);

COMMENT ON TABLE agent_execution_plans IS 'Stores autonomous agent execution plans with reasoning traces, complexity/risk/confidence scores';

-- ============================================================================
-- 2. AGENT_EXECUTION_STEPS Table - Track individual plan steps
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,

  -- Context
  plan_id UUID NOT NULL REFERENCES agent_execution_plans(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,

  -- Step definition
  action_type TEXT NOT NULL,
  command JSONB NOT NULL,
  description TEXT,

  -- Status & execution
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'blocked')) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Results
  result JSONB,
  error_message TEXT,
  execution_time_ms NUMERIC,

  -- Truth layer
  promised_outcome TEXT,
  actual_outcome TEXT,
  outcome_mismatch BOOLEAN,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_agent_execution_steps_plan ON agent_execution_steps(plan_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_steps_status ON agent_execution_steps(status);
CREATE INDEX IF NOT EXISTS idx_agent_execution_steps_created_at ON agent_execution_steps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_execution_steps_plan_step ON agent_execution_steps(plan_id, step_number);

COMMENT ON TABLE agent_execution_steps IS 'Individual steps within an agent execution plan with detailed tracking';

-- ============================================================================
-- 3. AGENT_RUNS Table - Track individual plan executions
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Context
  plan_id UUID NOT NULL REFERENCES agent_execution_plans(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')) DEFAULT 'queued',

  -- Statistics
  total_steps INTEGER DEFAULT 0,
  completed_steps INTEGER DEFAULT 0,
  failed_steps INTEGER DEFAULT 0,
  skipped_steps INTEGER DEFAULT 0,

  -- Timing
  estimated_duration_ms INTEGER,
  actual_duration_ms NUMERIC,

  -- Error tracking
  last_error TEXT,
  error_step_id UUID REFERENCES agent_execution_steps(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_plan ON agent_runs(plan_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_workspace ON agent_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_active ON agent_runs(workspace_id) WHERE status = 'running';

COMMENT ON TABLE agent_runs IS 'Individual executions of agent plans with step-by-step tracking and statistics';

-- ============================================================================
-- 4. AGENT_RISK_ASSESSMENTS Table - Risk evaluation and approval workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  plan_id UUID NOT NULL REFERENCES agent_execution_plans(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Risk evaluation
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors JSONB NOT NULL,
  risk_summary TEXT,

  -- Approval workflow
  requires_founder_approval BOOLEAN DEFAULT FALSE,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved', NULL)),
  -- Keep FK reference to auth.users (allowed in migrations)
approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_reason TEXT,
  approved_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_agent_risk_assessments_plan ON agent_risk_assessments(plan_id);
CREATE INDEX IF NOT EXISTS idx_agent_risk_assessments_workspace ON agent_risk_assessments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_risk_assessments_approval ON agent_risk_assessments(approval_status);
CREATE INDEX IF NOT EXISTS idx_agent_risk_assessments_risk ON agent_risk_assessments(risk_score DESC);

COMMENT ON TABLE agent_risk_assessments IS 'Risk assessment and founder approval workflow for agent plans';

-- ============================================================================
-- 5. AGENT_UNCERTAINTY_NOTES Table - Track uncertainty per step
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_uncertainty_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  step_id UUID NOT NULL REFERENCES agent_execution_steps(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES agent_execution_plans(id) ON DELETE CASCADE,

  -- Uncertainty tracking
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  uncertainty_factors TEXT[] DEFAULT '{}',
  disclosed_uncertainty TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_agent_uncertainty_notes_step ON agent_uncertainty_notes(step_id);
CREATE INDEX IF NOT EXISTS idx_agent_uncertainty_notes_plan ON agent_uncertainty_notes(plan_id);

COMMENT ON TABLE agent_uncertainty_notes IS 'Tracks agent uncertainty disclosures per execution step';

-- ============================================================================
-- 6. Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE agent_execution_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_uncertainty_notes ENABLE ROW LEVEL SECURITY;

-- Service role can manage all agent tables
CREATE POLICY "Service role manages agent plans"
  ON agent_execution_plans FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages agent steps"
  ON agent_execution_steps FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages agent runs"
  ON agent_runs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages risk assessments"
  ON agent_risk_assessments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages uncertainty notes"
  ON agent_uncertainty_notes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Founders (owners) can view agent plans in their workspace
CREATE POLICY "Founders can view agent plans"
  ON agent_execution_plans FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
        AND role = 'owner'
    )
  );

CREATE POLICY "Founders can view agent steps"
  ON agent_execution_steps FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE org_id = (
        SELECT org_id FROM workspaces
        WHERE id = (SELECT workspace_id FROM agent_execution_plans WHERE id = plan_id)
      ) AND role = 'owner'
    )
  );

CREATE POLICY "Founders can view agent runs"
  ON agent_runs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
        AND role = 'owner'
    )
  );

CREATE POLICY "Founders can view risk assessments"
  ON agent_risk_assessments FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
        AND role = 'owner'
    )
  );

CREATE POLICY "Founders can view uncertainty notes"
  ON agent_uncertainty_notes FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE org_id = (
        SELECT org_id FROM workspaces
        WHERE id = (SELECT workspace_id FROM agent_execution_plans WHERE id = plan_id)
      ) AND role = 'owner'
    )
  );

-- ============================================================================
-- 7. Helper Functions
-- ============================================================================

-- Function to create an agent execution plan
CREATE OR REPLACE FUNCTION create_agent_plan(
  p_workspace_id UUID,
  p_agent_name TEXT,
  p_objective TEXT,
  p_plan JSONB,
  p_reasoning_trace JSONB DEFAULT NULL,
  p_complexity_score INTEGER DEFAULT 0,
  p_confidence_score INTEGER DEFAULT 0
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  INSERT INTO agent_execution_plans (
    workspace_id,
    agent_name,
    objective,
    plan,
    reasoning_trace,
    complexity_score,
    confidence_score,
    status
  ) VALUES (
    p_workspace_id,
    p_agent_name,
    p_objective,
    p_plan,
    p_reasoning_trace,
    p_complexity_score,
    p_confidence_score,
    'draft'
  ) RETURNING id INTO v_plan_id;

  RETURN v_plan_id;
END;
$$;

-- Function to record an agent step
CREATE OR REPLACE FUNCTION record_agent_step(
  p_plan_id UUID,
  p_step_number INTEGER,
  p_action_type TEXT,
  p_command JSONB,
  p_description TEXT DEFAULT NULL,
  p_promised_outcome TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_step_id UUID;
BEGIN
  INSERT INTO agent_execution_steps (
    plan_id,
    step_number,
    action_type,
    command,
    description,
    promised_outcome,
    status
  ) VALUES (
    p_plan_id,
    p_step_number,
    p_action_type,
    p_command,
    p_description,
    p_promised_outcome,
    'pending'
  ) RETURNING id INTO v_step_id;

  RETURN v_step_id;
END;
$$;

-- Function to update agent step status
CREATE OR REPLACE FUNCTION update_agent_step_status(
  p_step_id UUID,
  p_status TEXT,
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_execution_time_ms NUMERIC DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE agent_execution_steps
  SET
    status = p_status,
    result = p_result,
    error_message = p_error_message,
    execution_time_ms = p_execution_time_ms,
    finished_at = CASE WHEN p_status IN ('completed', 'failed', 'skipped') THEN NOW() ELSE finished_at END,
    started_at = CASE WHEN p_status = 'running' AND started_at IS NULL THEN NOW() ELSE started_at END
  WHERE id = p_step_id;
END;
$$;

-- Function to finalize an agent run
CREATE OR REPLACE FUNCTION finalize_agent_run(
  p_run_id UUID,
  p_status TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE agent_runs
  SET
    status = p_status,
    completed_at = NOW(),
    actual_duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
  WHERE id = p_run_id;
END;
$$;

-- Function to calculate agent risk score
CREATE OR REPLACE FUNCTION calculate_agent_risk(
  p_plan JSONB
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_risk_score INTEGER := 0;
BEGIN
  -- Base risk from plan complexity
  v_risk_score := COALESCE((p_plan ->> 'step_count')::INTEGER, 0) * 5;

  -- Risk from blocked commands
  IF p_plan @> '{"has_blocked_commands": true}' THEN
    v_risk_score := v_risk_score + 50;
  END IF;

  -- Risk from approval-required commands
  IF p_plan @> '{"has_approval_commands": true}' THEN
    v_risk_score := v_risk_score + 30;
  END IF;

  -- Risk from uncertainty
  v_risk_score := v_risk_score + COALESCE((p_plan ->> 'uncertainty_level')::INTEGER, 0);

  -- Cap at 100
  RETURN LEAST(v_risk_score, 100);
END;
$$;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Autonomous Agent Mode schema installed successfully';
  RAISE NOTICE '   📋 Tables created: agent_execution_plans, steps, runs, risk_assessments, uncertainty_notes';
  RAISE NOTICE '   🔐 RLS policies enabled (service role + founder access)';
  RAISE NOTICE '   🔧 Helper functions created (plan creation, step tracking, risk calculation)';
  RAISE NOTICE '   ✨ Full audit trail ready for Living Intelligence Archive';
END $$;
