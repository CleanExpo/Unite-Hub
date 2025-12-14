-- Migration 126: Industry Simulator
-- Required by Phase 74 - Industry Simulator (ISIM)
-- Scenario modeling for weather, compliance, market shifts, supply chain

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS simulation_results CASCADE;
DROP TABLE IF EXISTS simulation_scenarios CASCADE;

-- Simulation scenarios table
CREATE TABLE simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  scenario_type TEXT NOT NULL,
  name TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Scenario type check
  CONSTRAINT simulation_scenarios_type_check CHECK (
    scenario_type IN (
      'weather', 'compliance', 'market_shift',
      'supply_chain', 'expansion', 'economic', 'other'
    )
  ),

  -- Status check
  CONSTRAINT simulation_scenarios_status_check CHECK (
    status IN ('draft', 'running', 'completed', 'failed')
  ),

  -- Foreign key
  CONSTRAINT simulation_scenarios_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_org ON simulation_scenarios(org_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_type ON simulation_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_status ON simulation_scenarios(status);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_created ON simulation_scenarios(created_at DESC);

-- Enable RLS
ALTER TABLE simulation_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY simulation_scenarios_select ON simulation_scenarios
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY simulation_scenarios_insert ON simulation_scenarios
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY simulation_scenarios_update ON simulation_scenarios
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE simulation_scenarios IS 'Simulation scenarios (Phase 74)';

-- Simulation results table
CREATE TABLE simulation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL,
  projected_impact JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence check
  CONSTRAINT simulation_results_confidence_check CHECK (
    confidence_score >= 0 AND confidence_score <= 100
  ),

  -- Foreign key
  CONSTRAINT simulation_results_scenario_fk
    FOREIGN KEY (scenario_id) REFERENCES simulation_scenarios(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_simulation_results_scenario ON simulation_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_confidence ON simulation_results(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_results_generated ON simulation_results(generated_at DESC);

-- Enable RLS
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY simulation_results_select ON simulation_results
  FOR SELECT TO authenticated
  USING (scenario_id IN (
    SELECT id FROM simulation_scenarios
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY simulation_results_insert ON simulation_results
  FOR INSERT TO authenticated
  WITH CHECK (scenario_id IN (
    SELECT id FROM simulation_scenarios
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE simulation_results IS 'Simulation results and projections (Phase 74)';
