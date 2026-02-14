-- Migration 225: Orchestrator Engine Core
-- Purpose: Multi-agent coordination, task decomposition, global context assembly,
--          cross-agent risk supervision, and intelligent execution oversight
-- Created: 2025-11-25
-- Security: Workspace isolation + founder full access + service role management

-- ============================================================================
-- 1. ORCHESTRATOR_TASKS Table - Top-level workflow coordination
-- ============================================================================

CREATE TABLE IF NOT EXISTS orchestrator_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Context & ownership
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Task definition
  objective TEXT NOT NULL,
  description TEXT,

  -- Execution plan
  agent_chain TEXT[] NOT NULL DEFAULT '{}',
  step_count INTEGER DEFAULT 0,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',          -- Not yet started
    'running',          -- Currently executing
    'paused',           -- Paused for review/approval
    'completed',        -- Successfully finished
    'failed',           -- Failed with error
    'halted'            -- Manually halted
  )),

  -- Quality metrics
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  uncertainty_score INTEGER DEFAULT 0 CHECK (uncertainty_score >= 0 AND uncertainty_score <= 100),
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Outcomes
  final_output JSONB,
  error_message TEXT,

  -- Metadata & lineage
  initiating_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_orchestrator_tasks_workspace ON orchestrator_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_tasks_status ON orchestrator_tasks(status);
CREATE INDEX IF NOT EXISTS idx_orchestrator_tasks_created ON orchestrator_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orchestrator_tasks_risk ON orchestrator_tasks(risk_score DESC);

COMMENT ON TABLE orchestrator_tasks IS 'Top-level orchestrator tasks coordinating multi-agent workflows';

-- ============================================================================
-- 2. ORCHESTRATOR_STEPS Table - Individual agent execution steps
-- ============================================================================

CREATE TABLE IF NOT EXISTS orchestrator_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Reference to parent task
  task_id UUID NOT NULL REFERENCES orchestrator_tasks(id) ON DELETE CASCADE,

  -- Step metadata
  step_index INTEGER NOT NULL CHECK (step_index >= 1 AND step_index <= 100),
  assigned_agent TEXT NOT NULL,

  -- Input/output
  input_context JSONB NOT NULL,
  output_payload JSONB,

  -- Memory integration
  memory_used UUID[] DEFAULT '{}',
  memory_created UUID[] DEFAULT '{}',

  -- Quality metrics
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  uncertainty_score INTEGER CHECK (uncertainty_score >= 0 AND uncertainty_score <= 100),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Processing metadata
  processing_time_ms INTEGER,
  token_count INTEGER,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'skipped'
  )),
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_orchestrator_steps_task ON orchestrator_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_steps_agent ON orchestrator_steps(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_orchestrator_steps_index ON orchestrator_steps(task_id, step_index);
CREATE INDEX IF NOT EXISTS idx_orchestrator_steps_created ON orchestrator_steps(created_at DESC);

COMMENT ON TABLE orchestrator_steps IS 'Individual agent execution steps within orchestrator tasks';

-- ============================================================================
-- 3. ORCHESTRATOR_SIGNALS Table - Task-level signals and alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS orchestrator_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  -- Reference to parent task
  task_id UUID NOT NULL REFERENCES orchestrator_tasks(id) ON DELETE CASCADE,

  -- Signal metadata
  signal_type TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 0 AND severity <= 100),
  message TEXT NOT NULL,

  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_orchestrator_signals_task ON orchestrator_signals(task_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_signals_severity ON orchestrator_signals(severity DESC);
CREATE INDEX IF NOT EXISTS idx_orchestrator_signals_resolved ON orchestrator_signals(resolved);
CREATE INDEX IF NOT EXISTS idx_orchestrator_signals_created ON orchestrator_signals(created_at DESC);

COMMENT ON TABLE orchestrator_signals IS 'Alerts and signals requiring attention during orchestrator execution';

-- ============================================================================
-- 4. Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE orchestrator_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_signals ENABLE ROW LEVEL SECURITY;

-- Service role has full access to all orchestrator tables
CREATE POLICY "Service role manages orchestrator_tasks"
  ON orchestrator_tasks FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages orchestrator_steps"
  ON orchestrator_steps FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages orchestrator_signals"
  ON orchestrator_signals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Founders can view all orchestrator tasks in their workspace
CREATE POLICY "Founders can view orchestrator_tasks"
  ON orchestrator_tasks FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
        AND role = 'owner'
    )
  );

-- Founders can view all orchestrator steps
CREATE POLICY "Founders can view orchestrator_steps"
  ON orchestrator_steps FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM orchestrator_tasks
      WHERE auth.uid() IN (
        SELECT user_id FROM user_organizations
        WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
          AND role = 'owner'
      )
    )
  );

-- Founders can view all orchestrator signals
CREATE POLICY "Founders can view orchestrator_signals"
  ON orchestrator_signals FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM orchestrator_tasks
      WHERE auth.uid() IN (
        SELECT user_id FROM user_organizations
        WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
          AND role = 'owner'
      )
    )
  );

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Create a new orchestrator task
CREATE OR REPLACE FUNCTION create_orchestrator_task(
  p_workspace_id UUID,
  p_objective TEXT,
  p_description TEXT DEFAULT NULL,
  p_agent_chain TEXT[] DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_task_id UUID;
BEGIN
  INSERT INTO orchestrator_tasks (
    workspace_id,
    objective,
    description,
    agent_chain,
    status,
    step_count
  ) VALUES (
    p_workspace_id,
    p_objective,
    p_description,
    p_agent_chain,
    'pending',
    COALESCE(array_length(p_agent_chain, 1), 0)
  ) RETURNING id INTO v_task_id;

  RETURN v_task_id;
END;
$$;

-- Record an orchestrator step
CREATE OR REPLACE FUNCTION record_orchestrator_step(
  p_task_id UUID,
  p_step_index INTEGER,
  p_assigned_agent TEXT,
  p_input_context JSONB,
  p_output_payload JSONB DEFAULT NULL,
  p_memory_used UUID[] DEFAULT '{}',
  p_memory_created UUID[] DEFAULT '{}',
  p_risk_score INTEGER DEFAULT NULL,
  p_uncertainty_score INTEGER DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_step_id UUID;
BEGIN
  INSERT INTO orchestrator_steps (
    task_id,
    step_index,
    assigned_agent,
    input_context,
    output_payload,
    memory_used,
    memory_created,
    risk_score,
    uncertainty_score,
    status
  ) VALUES (
    p_task_id,
    p_step_index,
    p_assigned_agent,
    p_input_context,
    p_output_payload,
    p_memory_used,
    p_memory_created,
    p_risk_score,
    p_uncertainty_score,
    'pending'
  ) RETURNING id INTO v_step_id;

  RETURN v_step_id;
END;
$$;

-- Update orchestrator task status
CREATE OR REPLACE FUNCTION update_orchestrator_task(
  p_task_id UUID,
  p_status TEXT,
  p_risk_score INTEGER DEFAULT NULL,
  p_uncertainty_score INTEGER DEFAULT NULL,
  p_final_output JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orchestrator_tasks
  SET
    status = p_status,
    risk_score = COALESCE(p_risk_score, risk_score),
    uncertainty_score = COALESCE(p_uncertainty_score, uncertainty_score),
    final_output = COALESCE(p_final_output, final_output),
    updated_at = NOW(),
    completed_at = CASE WHEN p_status IN ('completed', 'failed', 'halted') THEN NOW() ELSE completed_at END
  WHERE id = p_task_id;
END;
$$;

-- Add an orchestrator signal
CREATE OR REPLACE FUNCTION add_orchestrator_signal(
  p_task_id UUID,
  p_signal_type TEXT,
  p_severity INTEGER,
  p_message TEXT
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_signal_id UUID;
BEGIN
  INSERT INTO orchestrator_signals (
    task_id,
    signal_type,
    severity,
    message,
    resolved
  ) VALUES (
    p_task_id,
    p_signal_type,
    p_severity,
    p_message,
    FALSE
  ) RETURNING id INTO v_signal_id;

  RETURN v_signal_id;
END;
$$;

-- Resolve an orchestrator signal
CREATE OR REPLACE FUNCTION resolve_orchestrator_signal(
  p_signal_id UUID,
  p_resolution_notes TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orchestrator_signals
  SET
    resolved = TRUE,
    resolved_at = NOW(),
    resolution_notes = p_resolution_notes
  WHERE id = p_signal_id;
END;
$$;

-- Get orchestrator task summary
CREATE OR REPLACE FUNCTION get_orchestrator_task_summary(
  p_task_id UUID
) RETURNS TABLE (
  task_id UUID,
  objective TEXT,
  status TEXT,
  step_count INTEGER,
  completed_steps INTEGER,
  failed_steps INTEGER,
  risk_score INTEGER,
  uncertainty_score INTEGER,
  unresolved_signals INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.objective,
    t.status,
    t.step_count,
    (SELECT COUNT(*) FROM orchestrator_steps WHERE task_id = p_task_id AND status = 'completed')::INTEGER,
    (SELECT COUNT(*) FROM orchestrator_steps WHERE task_id = p_task_id AND status = 'failed')::INTEGER,
    t.risk_score,
    t.uncertainty_score,
    (SELECT COUNT(*) FROM orchestrator_signals WHERE task_id = p_task_id AND resolved = FALSE)::INTEGER
  FROM orchestrator_tasks t
  WHERE t.id = p_task_id;
END;
$$;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Orchestrator Engine Core schema installed successfully';
  RAISE NOTICE '   🎯 Tables created: orchestrator_tasks, steps, signals';
  RAISE NOTICE '   🔐 RLS policies enabled (service role + founder access)';
  RAISE NOTICE '   🔧 Helper functions: create task, record step, update status, add signal, resolve signal';
  RAISE NOTICE '   🧠 Multi-agent coordination infrastructure ready';
END $$;
