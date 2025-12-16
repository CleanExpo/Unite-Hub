/**
 * Phase D79: Scenario Engine
 *
 * Multi-path outcome simulations, stress-tests, strategic risk models.
 */

-- ============================================================================
-- SCENARIO TEMPLATES (reusable scenario definitions)
-- ============================================================================

DROP TABLE IF EXISTS scenario_templates CASCADE;

CREATE TABLE scenario_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  variables jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scenario_templates_tenant ON scenario_templates(tenant_id, created_at DESC);
CREATE INDEX idx_scenario_templates_name ON scenario_templates(name);

COMMENT ON TABLE scenario_templates IS 'Reusable scenario templates for stress-testing + simulations';
COMMENT ON COLUMN scenario_templates.variables IS 'Template variables: {input_vars, constraints, expected_outputs}';

-- ============================================================================
-- SCENARIO RUNS (execution history)
-- ============================================================================

DROP TABLE IF EXISTS scenario_runs CASCADE;

CREATE TABLE scenario_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  template_id uuid REFERENCES scenario_templates(id) ON DELETE CASCADE,
  inputs jsonb NOT NULL,
  outputs jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_scenario_runs_tenant ON scenario_runs(tenant_id, created_at DESC);
CREATE INDEX idx_scenario_runs_template ON scenario_runs(template_id, created_at DESC);
CREATE INDEX idx_scenario_runs_status ON scenario_runs(status, created_at DESC);

COMMENT ON TABLE scenario_runs IS 'Scenario execution history with outcomes';
COMMENT ON COLUMN scenario_runs.inputs IS 'Scenario inputs: {variables, parameters, constraints}';
COMMENT ON COLUMN scenario_runs.outputs IS 'Scenario results: {paths, probabilities, risks, opportunities, timeline}';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE scenario_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_runs ENABLE ROW LEVEL SECURITY;

-- Scenario Templates
CREATE POLICY "Users can view scenario templates for their tenant"
  ON scenario_templates FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "Users can manage scenario templates for their tenant"
  ON scenario_templates FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Scenario Runs
CREATE POLICY "Users can view scenario runs for their tenant"
  ON scenario_runs FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "Users can manage scenario runs for their tenant"
  ON scenario_runs FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
