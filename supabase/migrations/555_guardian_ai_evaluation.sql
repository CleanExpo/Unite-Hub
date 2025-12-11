-- Guardian Phase H06: AI Evaluation & Tuning Framework
-- Migration: 555
-- Purpose: Store evaluation scenarios and run results for AI quality control
-- Tables: guardian_ai_eval_scenarios, guardian_ai_eval_runs

-- ============================================================================
-- TABLE: guardian_ai_eval_scenarios
-- ============================================================================
-- Stores evaluation test scenarios for Guardian AI features
-- Supports both synthetic (global) and tenant-specific scenarios
-- Used for AI quality testing and prompt tuning
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_eval_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID, -- NULL for global/synthetic scenarios
  feature TEXT NOT NULL CHECK (feature IN ('rule_assistant', 'anomaly_detection', 'correlation_refinement', 'predictive_scoring')),
  label TEXT NOT NULL,
  description TEXT,
  input_payload JSONB NOT NULL,
  expected_behavior JSONB,
  is_synthetic BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

-- ============================================================================
-- TABLE: guardian_ai_eval_runs
-- ============================================================================
-- Stores results of AI evaluation runs
-- Links to scenarios and tracks success/failure metrics
-- Used for AI quality monitoring and regression detection
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_eval_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID, -- NULL for global evaluations
  scenario_id UUID NOT NULL REFERENCES guardian_ai_eval_scenarios(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('rule_assistant', 'anomaly_detection', 'correlation_refinement', 'predictive_scoring')),
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'error', 'timeout')),
  score NUMERIC(4, 3) CHECK (score IS NULL OR (score >= 0 AND score <= 1)),
  metrics JSONB,
  raw_output JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_ai_eval_scenarios_feature
  ON guardian_ai_eval_scenarios (feature, is_synthetic);

CREATE INDEX idx_guardian_ai_eval_scenarios_tenant
  ON guardian_ai_eval_scenarios (tenant_id, created_at DESC);

CREATE INDEX idx_guardian_ai_eval_runs_scenario
  ON guardian_ai_eval_runs (scenario_id, started_at DESC);

CREATE INDEX idx_guardian_ai_eval_runs_feature_status
  ON guardian_ai_eval_runs (feature, status, started_at DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_ai_eval_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_ai_eval_runs ENABLE ROW LEVEL SECURITY;

-- Scenarios: Tenants can view global (NULL tenant_id) and their own scenarios
CREATE POLICY tenant_select_guardian_ai_eval_scenarios
  ON guardian_ai_eval_scenarios
  FOR SELECT
  USING (tenant_id IS NULL OR tenant_id = auth.uid());

-- Scenarios: Only admins can modify (enforced at API layer)
CREATE POLICY tenant_modify_guardian_ai_eval_scenarios
  ON guardian_ai_eval_scenarios
  FOR ALL
  USING (tenant_id IS NULL OR tenant_id = auth.uid())
  WITH CHECK (tenant_id IS NULL OR tenant_id = auth.uid());

-- Runs: Tenants can view global and their own runs
CREATE POLICY tenant_select_guardian_ai_eval_runs
  ON guardian_ai_eval_runs
  FOR SELECT
  USING (tenant_id IS NULL OR tenant_id = auth.uid());

-- Runs: Service can insert
CREATE POLICY service_insert_guardian_ai_eval_runs
  ON guardian_ai_eval_runs
  FOR INSERT
  WITH CHECK (true);

-- Service role: Full access
CREATE POLICY service_all_guardian_ai_eval_scenarios
  ON guardian_ai_eval_scenarios
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY service_all_guardian_ai_eval_runs
  ON guardian_ai_eval_runs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_ai_eval_scenarios IS 'Evaluation test scenarios for Guardian AI quality control';
COMMENT ON TABLE guardian_ai_eval_runs IS 'Results of AI evaluation runs for quality monitoring';
COMMENT ON COLUMN guardian_ai_eval_scenarios.is_synthetic IS 'True for synthetic/global scenarios, false for tenant-specific';
COMMENT ON COLUMN guardian_ai_eval_scenarios.input_payload IS 'Test input (JSON) for AI feature';
COMMENT ON COLUMN guardian_ai_eval_scenarios.expected_behavior IS 'Expected AI output or behavior criteria (JSON)';
COMMENT ON COLUMN guardian_ai_eval_runs.score IS 'Quality score 0-1 (1=perfect match with expected behavior)';
COMMENT ON COLUMN guardian_ai_eval_runs.metrics IS 'Detailed evaluation metrics (JSON)';
COMMENT ON COLUMN guardian_ai_eval_runs.raw_output IS 'AI response for analysis (truncated/synthetic)';
