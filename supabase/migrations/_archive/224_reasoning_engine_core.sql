-- Migration 224: Reasoning Engine Core
-- Purpose: Multi-pass reasoning infrastructure with memory integration,
-- uncertainty propagation, and risk modeling for autonomous agents
-- Created: 2025-11-25
-- Security: Workspace isolation + founder full access

-- ============================================================================
-- 1. REASONING_RUNS Table - Core reasoning session
-- ============================================================================

CREATE TABLE IF NOT EXISTS reasoning_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Context & ownership
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,

  -- Reasoning objective
  objective TEXT NOT NULL,

  -- Input/output memory references
  initial_memory_ids UUID[] DEFAULT '{}',
  final_memory_id UUID REFERENCES ai_memory(id) ON DELETE SET NULL,

  -- Computed scores
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  uncertainty_score INTEGER NOT NULL DEFAULT 0 CHECK (uncertainty_score >= 0 AND uncertainty_score <= 100),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'halted')),
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_reasoning_runs_workspace ON reasoning_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_runs_agent ON reasoning_runs(agent);
CREATE INDEX IF NOT EXISTS idx_reasoning_runs_created ON reasoning_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reasoning_runs_status ON reasoning_runs(status);

COMMENT ON TABLE reasoning_runs IS 'Multi-pass reasoning sessions with memory integration and risk tracking';

-- ============================================================================
-- 2. REASONING_PASSES Table - Individual reasoning passes
-- ============================================================================

CREATE TABLE IF NOT EXISTS reasoning_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Reference to parent run
  run_id UUID NOT NULL REFERENCES reasoning_runs(id) ON DELETE CASCADE,

  -- Pass metadata
  pass_number INTEGER NOT NULL CHECK (pass_number >= 1 AND pass_number <= 10),
  pass_type TEXT NOT NULL CHECK (pass_type IN (
    'recall',           -- Pass 1: Retrieve relevant memories
    'analysis',         -- Pass 2: Analyze and synthesize
    'draft',            -- Pass 3: Generate initial output
    'refinement',       -- Pass 4: Improve and refine
    'validation'        -- Pass 5: Verify and validate
  )),

  -- Input context
  input_context JSONB NOT NULL,
  memory_used UUID[] DEFAULT '{}',

  -- Generated content
  generated_content JSONB,

  -- Quality metrics
  uncertainty INTEGER CHECK (uncertainty >= 0 AND uncertainty <= 100),
  risk INTEGER CHECK (risk >= 0 AND risk <= 100),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),

  -- Processing metadata
  processing_time_ms INTEGER,
  token_count INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_reasoning_passes_run ON reasoning_passes(run_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_passes_type ON reasoning_passes(pass_type);
CREATE INDEX IF NOT EXISTS idx_reasoning_passes_created ON reasoning_passes(created_at DESC);

COMMENT ON TABLE reasoning_passes IS 'Individual reasoning passes within a run with memory and uncertainty tracking';

-- ============================================================================
-- 3. REASONING_ARTIFACTS Table - Intermediate outputs
-- ============================================================================

CREATE TABLE IF NOT EXISTS reasoning_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Reference to parent pass
  pass_id UUID NOT NULL REFERENCES reasoning_passes(id) ON DELETE CASCADE,

  -- Artifact type
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'context_packet',   -- Assembled memory context
    'analysis',         -- Analysis output
    'decision_tree',    -- Decision path
    'risk_assessment',  -- Risk evaluation
    'uncertainty_map',  -- Uncertainty propagation
    'refinement',       -- Refinement suggestions
    'validation_check'  -- Validation results
  )),

  -- Content
  content JSONB NOT NULL,

  -- Quality
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_reasoning_artifacts_pass ON reasoning_artifacts(pass_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_artifacts_type ON reasoning_artifacts(artifact_type);

COMMENT ON TABLE reasoning_artifacts IS 'Intermediate artifacts produced during reasoning passes';

-- ============================================================================
-- 4. Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE reasoning_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reasoning_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reasoning_artifacts ENABLE ROW LEVEL SECURITY;

-- Service role can manage all reasoning tables
CREATE POLICY "Service role manages reasoning_runs"
  ON reasoning_runs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages reasoning_passes"
  ON reasoning_passes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages reasoning_artifacts"
  ON reasoning_artifacts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Founders can view all reasoning in their workspace
CREATE POLICY "Founders can view reasoning_runs"
  ON reasoning_runs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
        AND role = 'owner'
    )
  );

CREATE POLICY "Founders can view reasoning_passes"
  ON reasoning_passes FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM reasoning_runs
      WHERE auth.uid() IN (
        SELECT user_id FROM user_organizations
        WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
          AND role = 'owner'
      )
    )
  );

CREATE POLICY "Founders can view reasoning_artifacts"
  ON reasoning_artifacts FOR SELECT
  USING (
    pass_id IN (
      SELECT id FROM reasoning_passes
      WHERE run_id IN (
        SELECT id FROM reasoning_runs
        WHERE auth.uid() IN (
          SELECT user_id FROM user_organizations
          WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
            AND role = 'owner'
        )
      )
    )
  );

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Start a reasoning run
CREATE OR REPLACE FUNCTION start_reasoning_run(
  p_workspace_id UUID,
  p_agent TEXT,
  p_objective TEXT,
  p_initial_memory_ids UUID[] DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_run_id UUID;
BEGIN
  INSERT INTO reasoning_runs (
    workspace_id,
    agent,
    objective,
    initial_memory_ids,
    status
  ) VALUES (
    p_workspace_id,
    p_agent,
    p_objective,
    p_initial_memory_ids,
    'running'
  ) RETURNING id INTO v_run_id;

  RETURN v_run_id;
END;
$$;

-- Record a reasoning pass
CREATE OR REPLACE FUNCTION record_reasoning_pass(
  p_run_id UUID,
  p_pass_number INTEGER,
  p_pass_type TEXT,
  p_input_context JSONB,
  p_memory_ids UUID[],
  p_generated_content JSONB,
  p_uncertainty INTEGER,
  p_risk INTEGER,
  p_confidence INTEGER
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_pass_id UUID;
BEGIN
  INSERT INTO reasoning_passes (
    run_id,
    pass_number,
    pass_type,
    input_context,
    memory_used,
    generated_content,
    uncertainty,
    risk,
    confidence
  ) VALUES (
    p_run_id,
    p_pass_number,
    p_pass_type,
    p_input_context,
    p_memory_ids,
    p_generated_content,
    p_uncertainty,
    p_risk,
    p_confidence
  ) RETURNING id INTO v_pass_id;

  RETURN v_pass_id;
END;
$$;

-- Record reasoning artifact
CREATE OR REPLACE FUNCTION record_reasoning_artifact(
  p_pass_id UUID,
  p_artifact_type TEXT,
  p_content JSONB,
  p_quality_score INTEGER
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_artifact_id UUID;
BEGIN
  INSERT INTO reasoning_artifacts (
    pass_id,
    artifact_type,
    content,
    quality_score
  ) VALUES (
    p_pass_id,
    p_artifact_type,
    p_content,
    p_quality_score
  ) RETURNING id INTO v_artifact_id;

  RETURN v_artifact_id;
END;
$$;

-- Finalize a reasoning run
CREATE OR REPLACE FUNCTION finalize_reasoning_run(
  p_run_id UUID,
  p_final_memory_id UUID,
  p_risk_score INTEGER,
  p_uncertainty_score INTEGER,
  p_status TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE reasoning_runs
  SET
    final_memory_id = p_final_memory_id,
    risk_score = p_risk_score,
    uncertainty_score = p_uncertainty_score,
    status = p_status,
    completed_at = NOW()
  WHERE id = p_run_id;
END;
$$;

-- Get complete reasoning trace
CREATE OR REPLACE FUNCTION get_reasoning_trace(
  p_run_id UUID
) RETURNS TABLE (
  run_id UUID,
  objective TEXT,
  agent TEXT,
  final_risk INTEGER,
  final_uncertainty INTEGER,
  passes JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.objective,
    r.agent,
    r.risk_score,
    r.uncertainty_score,
    jsonb_agg(
      jsonb_build_object(
        'pass_number', p.pass_number,
        'pass_type', p.pass_type,
        'uncertainty', p.uncertainty,
        'risk', p.risk,
        'confidence', p.confidence,
        'memory_used', p.memory_used
      ) ORDER BY p.pass_number
    )
  FROM reasoning_runs r
  LEFT JOIN reasoning_passes p ON r.id = p.run_id
  WHERE r.id = p_run_id
  GROUP BY r.id, r.objective, r.agent, r.risk_score, r.uncertainty_score;
END;
$$;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Reasoning Engine Core schema installed successfully';
  RAISE NOTICE '   📊 Tables created: reasoning_runs, passes, artifacts';
  RAISE NOTICE '   🔐 RLS policies enabled (service role + founder access)';
  RAISE NOTICE '   🔧 Helper functions created (start run, record pass, artifact, finalize, trace)';
  RAISE NOTICE '   🧠 Multi-pass reasoning infrastructure ready';
END $$;
