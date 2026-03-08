-- Phase 11 Week 3-4: Strategy Simulation Tables
-- Multi-path forecasting, expected-value scoring, and scenario comparison

-- Simulation Runs Table - Track simulation executions
CREATE TABLE IF NOT EXISTS simulation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Run metadata
  name TEXT NOT NULL,
  description TEXT,
  simulation_type TEXT NOT NULL CHECK (simulation_type IN (
    'SINGLE_PATH',
    'MULTI_PATH',
    'MONTE_CARLO',
    'SCENARIO_ANALYSIS',
    'SENSITIVITY_ANALYSIS'
  )),

  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  num_iterations INTEGER NOT NULL DEFAULT 100,
  confidence_level DECIMAL(3,2) NOT NULL DEFAULT 0.95,
  time_horizon_days INTEGER NOT NULL DEFAULT 90,

  -- Input references
  source_proposal_id UUID,
  source_node_ids UUID[],
  baseline_snapshot_id UUID,

  -- Results summary
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
  )),
  total_paths INTEGER,
  best_path_id UUID,
  expected_value DECIMAL(15,4),
  confidence_interval_low DECIMAL(15,4),
  confidence_interval_high DECIMAL(15,4),

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Ownership
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Simulation Steps Table - Individual steps within a simulation path
CREATE TABLE IF NOT EXISTS simulation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_run_id UUID NOT NULL REFERENCES simulation_runs(id) ON DELETE CASCADE,
  path_id UUID NOT NULL, -- Groups steps by path

  -- Step metadata
  step_number INTEGER NOT NULL,
  node_id UUID,
  action_name TEXT NOT NULL,
  domain TEXT NOT NULL,

  -- Input parameters
  input_parameters JSONB DEFAULT '{}',
  risk_factors JSONB DEFAULT '{}',

  -- Probabilistic outcomes
  success_probability DECIMAL(5,4) NOT NULL DEFAULT 0.5,
  outcome_distribution TEXT NOT NULL DEFAULT 'NORMAL' CHECK (outcome_distribution IN (
    'NORMAL',
    'UNIFORM',
    'BETA',
    'TRIANGULAR',
    'CUSTOM'
  )),

  -- Expected values
  expected_value DECIMAL(15,4),
  variance DECIMAL(15,4),
  min_value DECIMAL(15,4),
  max_value DECIMAL(15,4),

  -- Timing
  expected_duration_hours DECIMAL(10,2),
  duration_variance DECIMAL(10,2),

  -- Dependencies
  depends_on_steps UUID[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Simulation Metrics Table - Tracked metrics across simulation
CREATE TABLE IF NOT EXISTS simulation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_run_id UUID NOT NULL REFERENCES simulation_runs(id) ON DELETE CASCADE,
  path_id UUID,

  -- Metric definition
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'TRAFFIC',
    'CONVERSION',
    'REVENUE',
    'COST',
    'TIME',
    'QUALITY',
    'RISK',
    'CUSTOM'
  )),
  unit TEXT,

  -- Statistical values
  mean_value DECIMAL(15,4),
  median_value DECIMAL(15,4),
  std_dev DECIMAL(15,4),
  min_value DECIMAL(15,4),
  max_value DECIMAL(15,4),
  percentile_5 DECIMAL(15,4),
  percentile_25 DECIMAL(15,4),
  percentile_75 DECIMAL(15,4),
  percentile_95 DECIMAL(15,4),

  -- Distribution data
  histogram_buckets JSONB DEFAULT '[]',
  sample_values DECIMAL(15,4)[],

  -- Timestamps for time-series
  timestamp_bucket TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Benchmark Snapshots Table - Historical performance baselines
CREATE TABLE IF NOT EXISTS benchmark_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Snapshot metadata
  name TEXT NOT NULL,
  description TEXT,
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN (
    'BASELINE',
    'MILESTONE',
    'COMPARISON',
    'ROLLBACK_POINT'
  )),

  -- Metrics captured
  metrics JSONB NOT NULL DEFAULT '{}',

  -- Domain performance
  domain_scores JSONB DEFAULT '{}',

  -- Operator performance
  operator_reliability JSONB DEFAULT '{}',

  -- External factors
  market_conditions JSONB DEFAULT '{}',

  -- References
  related_proposal_id UUID,
  related_simulation_id UUID,

  -- Validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Ownership
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Simulation Comparisons Table - Compare multiple paths/scenarios
CREATE TABLE IF NOT EXISTS simulation_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Comparison metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Paths being compared
  simulation_run_ids UUID[] NOT NULL,
  path_ids UUID[],

  -- Comparison results
  ranking JSONB NOT NULL DEFAULT '[]', -- Ordered list of path_ids
  scores JSONB NOT NULL DEFAULT '{}', -- path_id -> score
  tradeoffs JSONB DEFAULT '{}', -- metric -> path comparisons

  -- Winner selection
  recommended_path_id UUID,
  recommendation_confidence DECIMAL(3,2),
  recommendation_rationale TEXT,

  -- Created
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_simulation_runs_org ON simulation_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_status ON simulation_runs(status);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_type ON simulation_runs(simulation_type);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_proposal ON simulation_runs(source_proposal_id);

CREATE INDEX IF NOT EXISTS idx_simulation_steps_run ON simulation_steps(simulation_run_id);
CREATE INDEX IF NOT EXISTS idx_simulation_steps_path ON simulation_steps(path_id);
CREATE INDEX IF NOT EXISTS idx_simulation_steps_node ON simulation_steps(node_id);

CREATE INDEX IF NOT EXISTS idx_simulation_metrics_run ON simulation_metrics(simulation_run_id);
CREATE INDEX IF NOT EXISTS idx_simulation_metrics_path ON simulation_metrics(path_id);
CREATE INDEX IF NOT EXISTS idx_simulation_metrics_name ON simulation_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_simulation_metrics_type ON simulation_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_benchmark_snapshots_org ON benchmark_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_snapshots_type ON benchmark_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_benchmark_snapshots_active ON benchmark_snapshots(is_active);

CREATE INDEX IF NOT EXISTS idx_simulation_comparisons_org ON simulation_comparisons(organization_id);

-- RLS Policies
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_comparisons ENABLE ROW LEVEL SECURITY;

-- Simulation Runs: org members
CREATE POLICY simulation_runs_select ON simulation_runs
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY simulation_runs_insert ON simulation_runs
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY simulation_runs_update ON simulation_runs
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY simulation_runs_delete ON simulation_runs
  FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Simulation Steps: via simulation_run
CREATE POLICY simulation_steps_select ON simulation_steps
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    simulation_run_id IN (
      SELECT id FROM simulation_runs
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY simulation_steps_insert ON simulation_steps
  FOR INSERT WITH CHECK (
    simulation_run_id IN (
      SELECT id FROM simulation_runs
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

-- Simulation Metrics: via simulation_run
CREATE POLICY simulation_metrics_select ON simulation_metrics
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    simulation_run_id IN (
      SELECT id FROM simulation_runs
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY simulation_metrics_insert ON simulation_metrics
  FOR INSERT WITH CHECK (
    simulation_run_id IN (
      SELECT id FROM simulation_runs
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

-- Benchmark Snapshots: org members
CREATE POLICY benchmark_snapshots_select ON benchmark_snapshots
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY benchmark_snapshots_insert ON benchmark_snapshots
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY benchmark_snapshots_update ON benchmark_snapshots
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Simulation Comparisons: org members
CREATE POLICY simulation_comparisons_select ON simulation_comparisons
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY simulation_comparisons_insert ON simulation_comparisons
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY simulation_comparisons_update ON simulation_comparisons
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
