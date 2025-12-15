-- Decision Circuits A/B Testing (CX09) v1.0 Migration
-- Autonomous variant evaluation and winner selection
-- Phase 1: Evaluation-only (no traffic mutation)

-- A/B Tests table (metadata and configuration)
CREATE TABLE IF NOT EXISTS circuit_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  circuit_execution_id TEXT NOT NULL,

  -- Test metadata
  test_id TEXT NOT NULL UNIQUE,
  test_name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'social', 'multichannel')),

  -- Variants (JSON array of {variant_id, agent_execution_id, allocation_percentage})
  variants JSONB NOT NULL,

  -- Evaluation configuration
  evaluation_window_hours INT NOT NULL DEFAULT 72,
  minimum_sample_size INT NOT NULL DEFAULT 100,
  confidence_threshold FLOAT NOT NULL DEFAULT 0.95,
  primary_metric TEXT NOT NULL DEFAULT 'engagement_rate',
  secondary_metric TEXT,
  tie_breaker_metric TEXT,

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('running', 'paused', 'completed', 'terminated')) DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evaluation_window_end_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_ab_tests_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_circuit_ab_tests_workspace
  ON circuit_ab_tests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_ab_tests_circuit_execution
  ON circuit_ab_tests(circuit_execution_id);
CREATE INDEX IF NOT EXISTS idx_circuit_ab_tests_test_id
  ON circuit_ab_tests(workspace_id, test_id);
CREATE INDEX IF NOT EXISTS idx_circuit_ab_tests_status
  ON circuit_ab_tests(status, started_at DESC);

-- A/B Test Results table (evaluation outcomes)
CREATE TABLE IF NOT EXISTS circuit_ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ab_test_id UUID NOT NULL REFERENCES circuit_ab_tests(id) ON DELETE CASCADE,

  -- Variant being evaluated
  variant_id TEXT NOT NULL,
  agent_execution_id TEXT NOT NULL,

  -- Metrics snapshot at evaluation time
  metrics_snapshot JSONB NOT NULL,

  -- Evaluation results
  engagement_rate FLOAT,
  click_through_rate FLOAT,
  time_to_first_engagement INT, -- seconds
  conversion_assist_score FLOAT,

  -- Sample size
  sample_size INT NOT NULL DEFAULT 0,

  -- Timestamps
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT circuit_ab_test_results_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT circuit_ab_test_results_test_fk
    FOREIGN KEY (ab_test_id) REFERENCES circuit_ab_tests(id)
);

CREATE INDEX IF NOT EXISTS idx_circuit_ab_test_results_workspace
  ON circuit_ab_test_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_ab_test_results_ab_test
  ON circuit_ab_test_results(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_circuit_ab_test_results_variant
  ON circuit_ab_test_results(ab_test_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_circuit_ab_test_results_evaluated_at
  ON circuit_ab_test_results(evaluated_at DESC);

-- Winner selection log
CREATE TABLE IF NOT EXISTS circuit_ab_test_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ab_test_id UUID NOT NULL REFERENCES circuit_ab_tests(id) ON DELETE CASCADE,

  -- Winner details
  winning_variant_id TEXT NOT NULL,
  confidence_score FLOAT NOT NULL,
  performance_delta FLOAT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('promote', 'continue_test', 'terminate')),

  -- Recommendation for CX08
  optimization_signal JSONB NOT NULL,

  -- Decision metadata
  evaluated_at TIMESTAMPTZ NOT NULL,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_ab_test_winners_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT circuit_ab_test_winners_test_fk
    FOREIGN KEY (ab_test_id) REFERENCES circuit_ab_tests(id)
);

CREATE INDEX IF NOT EXISTS idx_circuit_ab_test_winners_workspace
  ON circuit_ab_test_winners(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_ab_test_winners_ab_test
  ON circuit_ab_test_winners(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_circuit_ab_test_winners_selected_at
  ON circuit_ab_test_winners(selected_at DESC);

-- Enable Row Level Security
ALTER TABLE circuit_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_ab_test_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
DROP POLICY IF EXISTS "circuit_ab_tests_tenant_isolation" ON circuit_ab_tests;
CREATE POLICY "circuit_ab_tests_tenant_isolation" ON circuit_ab_tests
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "circuit_ab_test_results_tenant_isolation" ON circuit_ab_test_results;
CREATE POLICY "circuit_ab_test_results_tenant_isolation" ON circuit_ab_test_results
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "circuit_ab_test_winners_tenant_isolation" ON circuit_ab_test_winners;
CREATE POLICY "circuit_ab_test_winners_tenant_isolation" ON circuit_ab_test_winners
FOR ALL USING (workspace_id = get_current_workspace_id());

-- View for A/B test summary
CREATE OR REPLACE VIEW circuit_ab_test_summary AS
SELECT
  t.workspace_id,
  t.test_id,
  t.test_name,
  t.channel,
  t.status,
  COUNT(DISTINCT r.variant_id) as variant_count,
  SUM(r.sample_size) as total_samples,
  AVG(r.engagement_rate) as avg_engagement_rate,
  MAX(r.engagement_rate) as max_engagement_rate,
  t.started_at,
  t.evaluation_window_end_at
FROM circuit_ab_tests t
LEFT JOIN circuit_ab_test_results r ON t.id = r.ab_test_id
GROUP BY t.id, t.workspace_id, t.test_id, t.test_name, t.channel, t.status, t.started_at, t.evaluation_window_end_at;

-- Comments
COMMENT ON TABLE circuit_ab_tests IS 'A/B tests for evaluating content variants across channels';
COMMENT ON TABLE circuit_ab_test_results IS 'Metrics snapshots for each variant at evaluation time';
COMMENT ON TABLE circuit_ab_test_winners IS 'Winner selection decisions and optimization signals for CX08';
COMMENT ON VIEW circuit_ab_test_summary IS 'Summary view of active and completed A/B tests';
