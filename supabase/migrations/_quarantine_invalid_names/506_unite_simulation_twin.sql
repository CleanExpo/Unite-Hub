/**
 * Phase D78: Unite Simulation Twin Engine
 *
 * Digital twins for scenario simulation + prediction.
 * CRITICAL: Store ai_trace for auditing.
 */

-- ============================================================================
-- SIMULATION TWINS (digital twin definitions)
-- ============================================================================

DROP TABLE IF EXISTS unite_sim_twin CASCADE;

CREATE TABLE unite_sim_twin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state jsonb NOT NULL,
  metadata jsonb,
  tenant_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_sim_twin_tenant_name ON unite_sim_twin(tenant_id, name);
CREATE INDEX idx_unite_sim_twin_name ON unite_sim_twin(name);

COMMENT ON TABLE unite_sim_twin IS 'Digital twins for scenario simulation';
COMMENT ON COLUMN unite_sim_twin.name IS 'Twin identifier (e.g., "pipeline_model", "user_behavior")';
COMMENT ON COLUMN unite_sim_twin.state IS 'Current state: {variables, parameters, rules, thresholds}';
COMMENT ON COLUMN unite_sim_twin.metadata IS 'Twin config: {description, version, created_by}';

-- ============================================================================
-- SIMULATION RUNS (execution history with AI traces)
-- ============================================================================

DROP TABLE IF EXISTS unite_sim_runs CASCADE;

CREATE TABLE unite_sim_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id uuid REFERENCES unite_sim_twin(id) ON DELETE CASCADE,
  input jsonb,
  output jsonb,
  ai_trace jsonb,
  tenant_id uuid,
  executed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_sim_runs_twin ON unite_sim_runs(twin_id, executed_at DESC);
CREATE INDEX idx_unite_sim_runs_executed ON unite_sim_runs(executed_at DESC);
CREATE INDEX idx_unite_sim_runs_tenant ON unite_sim_runs(tenant_id, executed_at DESC);

COMMENT ON TABLE unite_sim_runs IS 'Simulation execution history with AI reasoning';
COMMENT ON COLUMN unite_sim_runs.input IS 'Simulation input: {scenario, variables, constraints}';
COMMENT ON COLUMN unite_sim_runs.output IS 'Simulation results: {predictions, confidence_scores, recommendations}';
COMMENT ON COLUMN unite_sim_runs.ai_trace IS 'AI trace: {model, prompt, response, thinking_tokens}';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_sim_twin ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_sim_runs ENABLE ROW LEVEL SECURITY;

-- Simulation Twins
CREATE POLICY "Users can view sim twins for their tenant"
  ON unite_sim_twin FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage sim twins for their tenant"
  ON unite_sim_twin FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Simulation Runs
CREATE POLICY "Users can view sim runs for their tenant"
  ON unite_sim_runs FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage sim runs for their tenant"
  ON unite_sim_runs FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);
