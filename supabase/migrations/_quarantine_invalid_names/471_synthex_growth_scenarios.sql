-- =============================================================================
-- D42: Growth Scenario Planner + Simulation Engine
-- Phase: Synthex Autonomous Growth Stack
-- Prefix: synthex_gsp_* (growth scenario planner)
-- =============================================================================
-- SQL Pre-Flight Checklist:
-- ✅ Dependencies with IF NOT EXISTS
-- ✅ ENUMs with DO blocks and pg_type checks
-- ✅ Unique prefix: synthex_gsp_*
-- ✅ Column naming to avoid type conflicts
-- ✅ RLS with current_setting('app.tenant_id', true)::uuid
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENUM Types (with existence checks)
-- -----------------------------------------------------------------------------

-- Scenario status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_gsp_scenario_status') THEN
    CREATE TYPE synthex_gsp_scenario_status AS ENUM (
      'draft',
      'active',
      'simulating',
      'completed',
      'archived'
    );
  END IF;
END $$;

-- Scenario type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_gsp_scenario_type') THEN
    CREATE TYPE synthex_gsp_scenario_type AS ENUM (
      'growth',
      'expansion',
      'optimization',
      'risk',
      'what_if',
      'custom'
    );
  END IF;
END $$;

-- Variable type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_gsp_variable_type') THEN
    CREATE TYPE synthex_gsp_variable_type AS ENUM (
      'revenue',
      'cost',
      'headcount',
      'customers',
      'market_share',
      'price',
      'volume',
      'conversion',
      'churn',
      'custom'
    );
  END IF;
END $$;

-- Simulation status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_gsp_simulation_status') THEN
    CREATE TYPE synthex_gsp_simulation_status AS ENUM (
      'pending',
      'running',
      'completed',
      'failed',
      'cancelled'
    );
  END IF;
END $$;

-- Assumption confidence
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_gsp_confidence') THEN
    CREATE TYPE synthex_gsp_confidence AS ENUM (
      'high',
      'medium',
      'low',
      'uncertain'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Main Tables
-- -----------------------------------------------------------------------------

-- Growth scenarios (main planning entity)
CREATE TABLE IF NOT EXISTS synthex_gsp_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_id UUID REFERENCES synthex_br_businesses(id) ON DELETE SET NULL,

  -- Scenario info
  scenario_name TEXT NOT NULL,
  description TEXT,
  scenario_type synthex_gsp_scenario_type DEFAULT 'growth',
  status synthex_gsp_scenario_status DEFAULT 'draft',

  -- Time horizon
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  time_granularity TEXT DEFAULT 'monthly', -- 'weekly', 'monthly', 'quarterly', 'yearly'

  -- Base values
  base_values JSONB DEFAULT '{}', -- starting point for projections
  target_values JSONB DEFAULT '{}', -- end goals

  -- Simulation settings
  monte_carlo_runs INTEGER DEFAULT 1000,
  confidence_interval DECIMAL DEFAULT 0.95,
  random_seed INTEGER,

  -- Results
  last_simulation_at TIMESTAMPTZ,
  simulation_results JSONB, -- aggregated results
  success_probability DECIMAL,
  expected_outcome JSONB,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Ownership
  created_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, scenario_name)
);

-- Scenario variables (inputs that can be adjusted)
CREATE TABLE IF NOT EXISTS synthex_gsp_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES synthex_gsp_scenarios(id) ON DELETE CASCADE,

  -- Variable info
  variable_name TEXT NOT NULL,
  variable_code TEXT NOT NULL,
  variable_type synthex_gsp_variable_type DEFAULT 'custom',
  description TEXT,

  -- Values
  base_value DECIMAL NOT NULL,
  min_value DECIMAL,
  max_value DECIMAL,
  projected_value DECIMAL,

  -- Growth settings
  growth_type TEXT DEFAULT 'linear', -- 'linear', 'exponential', 'compound', 'custom'
  growth_rate DECIMAL, -- percentage per period
  growth_formula TEXT, -- custom formula

  -- Distribution for Monte Carlo
  distribution_type TEXT DEFAULT 'normal', -- 'normal', 'uniform', 'triangular', 'custom'
  distribution_params JSONB DEFAULT '{}', -- mean, std_dev, etc.

  -- Confidence
  confidence synthex_gsp_confidence DEFAULT 'medium',
  data_source TEXT,

  -- Dependencies
  depends_on UUID[], -- other variable IDs this depends on
  dependency_formula TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(scenario_id, variable_code)
);

-- Scenario assumptions (documented assumptions)
CREATE TABLE IF NOT EXISTS synthex_gsp_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES synthex_gsp_scenarios(id) ON DELETE CASCADE,

  -- Assumption info
  assumption_name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'market', 'competition', 'internal', 'economic', 'regulatory'

  -- Confidence
  confidence synthex_gsp_confidence DEFAULT 'medium',
  evidence TEXT,
  risk_factor TEXT, -- what happens if wrong

  -- Impact
  impacts_variables UUID[], -- variable IDs this affects
  impact_magnitude TEXT, -- 'high', 'medium', 'low'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulation runs
CREATE TABLE IF NOT EXISTS synthex_gsp_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES synthex_gsp_scenarios(id) ON DELETE CASCADE,

  -- Simulation info
  simulation_name TEXT,
  status synthex_gsp_simulation_status DEFAULT 'pending',

  -- Configuration
  num_runs INTEGER DEFAULT 1000,
  confidence_interval DECIMAL DEFAULT 0.95,
  random_seed INTEGER,

  -- Variable overrides (for what-if)
  variable_overrides JSONB DEFAULT '{}',

  -- Progress
  completed_runs INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Results
  results_summary JSONB, -- percentiles, mean, std_dev per period
  raw_results_url TEXT, -- link to full results if stored externally

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulation results (detailed per-period results)
CREATE TABLE IF NOT EXISTS synthex_gsp_simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES synthex_gsp_simulations(id) ON DELETE CASCADE,

  -- Period
  period_index INTEGER NOT NULL,
  period_date DATE NOT NULL,

  -- Aggregated results
  variable_results JSONB NOT NULL, -- per variable: {mean, median, p10, p25, p75, p90, std_dev}

  -- Key metrics
  total_revenue DECIMAL,
  total_cost DECIMAL,
  net_profit DECIMAL,
  customer_count INTEGER,

  -- Confidence intervals
  revenue_p10 DECIMAL,
  revenue_p50 DECIMAL,
  revenue_p90 DECIMAL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(simulation_id, period_index)
);

-- Scenario comparisons
CREATE TABLE IF NOT EXISTS synthex_gsp_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Comparison info
  comparison_name TEXT NOT NULL,
  description TEXT,

  -- Scenarios to compare
  scenario_ids UUID[] NOT NULL,

  -- Comparison settings
  comparison_metrics TEXT[] DEFAULT ARRAY['revenue', 'profit', 'customers']::TEXT[],
  time_points TEXT[] DEFAULT ARRAY['6m', '1y', '2y']::TEXT[],

  -- Results
  comparison_results JSONB,
  winner_scenario_id UUID,
  analysis_summary TEXT,

  -- AI analysis
  ai_recommendation TEXT,
  ai_analysis_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenario milestones (checkpoints)
CREATE TABLE IF NOT EXISTS synthex_gsp_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES synthex_gsp_scenarios(id) ON DELETE CASCADE,

  -- Milestone info
  milestone_name TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,

  -- Target
  target_metric TEXT NOT NULL,
  target_value DECIMAL NOT NULL,
  current_value DECIMAL,

  -- Status
  is_achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  probability_of_achievement DECIMAL, -- from simulation

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenario templates
CREATE TABLE IF NOT EXISTS synthex_gsp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for system templates

  -- Template info
  template_name TEXT NOT NULL,
  description TEXT,
  scenario_type synthex_gsp_scenario_type DEFAULT 'growth',

  -- Template content
  default_variables JSONB NOT NULL DEFAULT '[]',
  default_assumptions JSONB DEFAULT '[]',
  default_milestones JSONB DEFAULT '[]',

  -- Settings
  recommended_horizon TEXT DEFAULT '1y',
  recommended_granularity TEXT DEFAULT 'monthly',

  -- Metadata
  industry TEXT,
  business_stage TEXT, -- 'startup', 'growth', 'mature'
  is_public BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------

-- Scenarios indexes
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_scenarios_tenant ON synthex_gsp_scenarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_scenarios_business ON synthex_gsp_scenarios(business_id);
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_scenarios_status ON synthex_gsp_scenarios(status);
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_scenarios_type ON synthex_gsp_scenarios(scenario_type);

-- Variables indexes
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_variables_scenario ON synthex_gsp_variables(scenario_id);
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_variables_type ON synthex_gsp_variables(variable_type);

-- Assumptions indexes
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_assumptions_scenario ON synthex_gsp_assumptions(scenario_id);

-- Simulations indexes
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_simulations_scenario ON synthex_gsp_simulations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_simulations_status ON synthex_gsp_simulations(status);

-- Results indexes
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_simulation_results_sim ON synthex_gsp_simulation_results(simulation_id);
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_simulation_results_period ON synthex_gsp_simulation_results(period_date);

-- Comparisons indexes
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_comparisons_tenant ON synthex_gsp_comparisons(tenant_id);

-- Milestones indexes
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_milestones_scenario ON synthex_gsp_milestones(scenario_id);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_templates_type ON synthex_gsp_templates(scenario_type);
CREATE INDEX IF NOT EXISTS idx_synthex_gsp_templates_public ON synthex_gsp_templates(is_public) WHERE is_public = TRUE;

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE synthex_gsp_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_gsp_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_gsp_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_gsp_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_gsp_simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_gsp_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_gsp_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_gsp_templates ENABLE ROW LEVEL SECURITY;

-- Scenarios policy
DROP POLICY IF EXISTS synthex_gsp_scenarios_tenant_isolation ON synthex_gsp_scenarios;
CREATE POLICY synthex_gsp_scenarios_tenant_isolation ON synthex_gsp_scenarios
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Variables policy
DROP POLICY IF EXISTS synthex_gsp_variables_tenant_isolation ON synthex_gsp_variables;
CREATE POLICY synthex_gsp_variables_tenant_isolation ON synthex_gsp_variables
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Assumptions policy
DROP POLICY IF EXISTS synthex_gsp_assumptions_tenant_isolation ON synthex_gsp_assumptions;
CREATE POLICY synthex_gsp_assumptions_tenant_isolation ON synthex_gsp_assumptions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Simulations policy
DROP POLICY IF EXISTS synthex_gsp_simulations_tenant_isolation ON synthex_gsp_simulations;
CREATE POLICY synthex_gsp_simulations_tenant_isolation ON synthex_gsp_simulations
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Results policy
DROP POLICY IF EXISTS synthex_gsp_simulation_results_tenant_isolation ON synthex_gsp_simulation_results;
CREATE POLICY synthex_gsp_simulation_results_tenant_isolation ON synthex_gsp_simulation_results
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Comparisons policy
DROP POLICY IF EXISTS synthex_gsp_comparisons_tenant_isolation ON synthex_gsp_comparisons;
CREATE POLICY synthex_gsp_comparisons_tenant_isolation ON synthex_gsp_comparisons
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Milestones policy
DROP POLICY IF EXISTS synthex_gsp_milestones_tenant_isolation ON synthex_gsp_milestones;
CREATE POLICY synthex_gsp_milestones_tenant_isolation ON synthex_gsp_milestones
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Templates policy (public or owned)
DROP POLICY IF EXISTS synthex_gsp_templates_access ON synthex_gsp_templates;
CREATE POLICY synthex_gsp_templates_access ON synthex_gsp_templates
  FOR ALL USING (
    is_public = TRUE
    OR tenant_id IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- -----------------------------------------------------------------------------
-- 5. Helper Functions
-- -----------------------------------------------------------------------------

-- Generate date series for projections
CREATE OR REPLACE FUNCTION synthex_gsp_generate_periods(
  p_start_date DATE,
  p_end_date DATE,
  p_granularity TEXT
)
RETURNS TABLE (
  period_index INTEGER,
  period_start DATE,
  period_end DATE
) AS $$
DECLARE
  v_interval INTERVAL;
BEGIN
  v_interval := CASE p_granularity
    WHEN 'weekly' THEN '1 week'::INTERVAL
    WHEN 'monthly' THEN '1 month'::INTERVAL
    WHEN 'quarterly' THEN '3 months'::INTERVAL
    WHEN 'yearly' THEN '1 year'::INTERVAL
    ELSE '1 month'::INTERVAL
  END;

  RETURN QUERY
  WITH periods AS (
    SELECT
      ROW_NUMBER() OVER ()::INTEGER - 1 AS idx,
      d::DATE AS p_start,
      (d + v_interval - '1 day'::INTERVAL)::DATE AS p_end
    FROM generate_series(p_start_date, p_end_date, v_interval) AS d
  )
  SELECT idx, p_start, LEAST(p_end, p_end_date)
  FROM periods;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate projected value for a variable
CREATE OR REPLACE FUNCTION synthex_gsp_project_value(
  p_base_value DECIMAL,
  p_growth_type TEXT,
  p_growth_rate DECIMAL,
  p_period_index INTEGER
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN CASE p_growth_type
    WHEN 'linear' THEN p_base_value + (p_base_value * (p_growth_rate / 100) * p_period_index)
    WHEN 'exponential' THEN p_base_value * POWER(1 + (p_growth_rate / 100), p_period_index)
    WHEN 'compound' THEN p_base_value * POWER(1 + (p_growth_rate / 100), p_period_index)
    ELSE p_base_value
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION synthex_gsp_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trg_synthex_gsp_scenarios_updated ON synthex_gsp_scenarios;
CREATE TRIGGER trg_synthex_gsp_scenarios_updated
  BEFORE UPDATE ON synthex_gsp_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION synthex_gsp_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_gsp_variables_updated ON synthex_gsp_variables;
CREATE TRIGGER trg_synthex_gsp_variables_updated
  BEFORE UPDATE ON synthex_gsp_variables
  FOR EACH ROW
  EXECUTE FUNCTION synthex_gsp_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_gsp_comparisons_updated ON synthex_gsp_comparisons;
CREATE TRIGGER trg_synthex_gsp_comparisons_updated
  BEFORE UPDATE ON synthex_gsp_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION synthex_gsp_update_timestamp();

-- -----------------------------------------------------------------------------
-- 6. Seed Default Templates
-- -----------------------------------------------------------------------------

INSERT INTO synthex_gsp_templates (template_name, description, scenario_type, default_variables, default_assumptions, recommended_horizon, recommended_granularity, is_public)
VALUES
  (
    'SaaS Growth Model',
    'Standard SaaS business growth projection with MRR, churn, and customer metrics',
    'growth',
    '[
      {"variable_code": "mrr", "variable_name": "Monthly Recurring Revenue", "variable_type": "revenue", "growth_type": "compound", "growth_rate": 10},
      {"variable_code": "customers", "variable_name": "Active Customers", "variable_type": "customers", "growth_type": "compound", "growth_rate": 8},
      {"variable_code": "churn_rate", "variable_name": "Monthly Churn Rate", "variable_type": "churn", "growth_type": "linear", "growth_rate": -0.5},
      {"variable_code": "arpu", "variable_name": "Average Revenue Per User", "variable_type": "revenue", "growth_type": "linear", "growth_rate": 2},
      {"variable_code": "cac", "variable_name": "Customer Acquisition Cost", "variable_type": "cost", "growth_type": "linear", "growth_rate": -1}
    ]'::JSONB,
    '[
      {"assumption_name": "Market Growth", "description": "TAM grows at 15% annually", "category": "market", "confidence": "medium"},
      {"assumption_name": "Competitive Pressure", "description": "No major new entrants expected", "category": "competition", "confidence": "low"}
    ]'::JSONB,
    '2y',
    'monthly',
    TRUE
  ),
  (
    'E-commerce Expansion',
    'E-commerce growth model with revenue, orders, and marketing spend',
    'expansion',
    '[
      {"variable_code": "gmv", "variable_name": "Gross Merchandise Value", "variable_type": "revenue", "growth_type": "compound", "growth_rate": 15},
      {"variable_code": "orders", "variable_name": "Total Orders", "variable_type": "volume", "growth_type": "compound", "growth_rate": 12},
      {"variable_code": "aov", "variable_name": "Average Order Value", "variable_type": "revenue", "growth_type": "linear", "growth_rate": 3},
      {"variable_code": "marketing_spend", "variable_name": "Marketing Spend", "variable_type": "cost", "growth_type": "linear", "growth_rate": 5},
      {"variable_code": "conversion_rate", "variable_name": "Website Conversion Rate", "variable_type": "conversion", "growth_type": "linear", "growth_rate": 0.1}
    ]'::JSONB,
    '[
      {"assumption_name": "Supply Chain Stability", "description": "No major supply disruptions", "category": "internal", "confidence": "medium"},
      {"assumption_name": "Consumer Spending", "description": "Consumer confidence remains stable", "category": "economic", "confidence": "medium"}
    ]'::JSONB,
    '1y',
    'monthly',
    TRUE
  ),
  (
    'Market Expansion Risk Analysis',
    'Risk-focused scenario for entering new markets',
    'risk',
    '[
      {"variable_code": "market_size", "variable_name": "Addressable Market Size", "variable_type": "market_share", "growth_type": "linear", "growth_rate": 5},
      {"variable_code": "market_share", "variable_name": "Target Market Share", "variable_type": "market_share", "growth_type": "compound", "growth_rate": 20},
      {"variable_code": "entry_cost", "variable_name": "Market Entry Cost", "variable_type": "cost", "growth_type": "linear", "growth_rate": 0},
      {"variable_code": "revenue_new", "variable_name": "New Market Revenue", "variable_type": "revenue", "growth_type": "exponential", "growth_rate": 25},
      {"variable_code": "regulatory_risk", "variable_name": "Regulatory Risk Factor", "variable_type": "custom", "growth_type": "linear", "growth_rate": 0}
    ]'::JSONB,
    '[
      {"assumption_name": "Regulatory Approval", "description": "Necessary licenses obtained within 6 months", "category": "regulatory", "confidence": "low"},
      {"assumption_name": "Local Competition", "description": "Local competitors will respond within 3 months", "category": "competition", "confidence": "high"}
    ]'::JSONB,
    '2y',
    'quarterly',
    TRUE
  )
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Migration complete
-- -----------------------------------------------------------------------------
