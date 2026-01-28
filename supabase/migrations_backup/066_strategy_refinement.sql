-- Phase 11 Week 7-8: Strategy Refinement Tables
-- Drift detection, historical learning, reinforcement adjustments, cross-domain coordination

-- Refinement Cycles Table - Track refinement iterations
CREATE TABLE IF NOT EXISTS refinement_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  horizon_plan_id UUID REFERENCES horizon_plans(id),

  -- Cycle metadata
  cycle_number INTEGER NOT NULL,
  cycle_type TEXT NOT NULL CHECK (cycle_type IN (
    'SCHEDULED',      -- Regular scheduled refinement
    'DRIFT_TRIGGERED', -- Triggered by drift detection
    'MANUAL',         -- Manually requested
    'PERFORMANCE'     -- Triggered by poor performance
  )),

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Analysis results
  drift_detected BOOLEAN NOT NULL DEFAULT false,
  drift_severity TEXT CHECK (drift_severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  domains_analyzed TEXT[] NOT NULL DEFAULT '{}',

  -- Adjustments made
  adjustments_count INTEGER NOT NULL DEFAULT 0,
  adjustments_summary JSONB DEFAULT '{}',

  -- Scoring
  confidence_before DECIMAL(5,2),
  confidence_after DECIMAL(5,2),
  improvement_percent DECIMAL(8,4),

  -- Status
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN (
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
  )),

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drift Signals Table - Detected drifts from expected performance
CREATE TABLE IF NOT EXISTS drift_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  refinement_cycle_id UUID REFERENCES refinement_cycles(id) ON DELETE CASCADE,

  -- Signal metadata
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'KPI_DRIFT',          -- KPI deviated from projection
    'TIMELINE_DRIFT',     -- Step timing deviation
    'RESOURCE_DRIFT',     -- Resource allocation deviation
    'DEPENDENCY_DRIFT',   -- Dependency chain broken
    'EXTERNAL_DRIFT'      -- External factor impact
  )),

  -- Affected entities
  domain TEXT NOT NULL,
  metric_name TEXT,
  horizon_step_id UUID REFERENCES horizon_steps(id),

  -- Drift measurement
  expected_value DECIMAL(15,4),
  actual_value DECIMAL(15,4),
  drift_percent DECIMAL(8,4),
  drift_direction TEXT CHECK (drift_direction IN ('ABOVE', 'BELOW', 'DELAYED', 'ACCELERATED')),

  -- Severity assessment
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  impact_score DECIMAL(5,2),

  -- Root cause analysis
  probable_causes JSONB DEFAULT '[]',
  contributing_factors JSONB DEFAULT '{}',

  -- Recommendations
  recommended_actions JSONB DEFAULT '[]',
  auto_correctable BOOLEAN NOT NULL DEFAULT false,

  -- Resolution
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_action TEXT,

  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Domain Balances Table - Cross-domain resource and priority balancing
CREATE TABLE IF NOT EXISTS domain_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  refinement_cycle_id UUID REFERENCES refinement_cycles(id),

  -- Balance snapshot
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Domain allocations (percentage)
  seo_allocation DECIMAL(5,2) NOT NULL DEFAULT 20,
  geo_allocation DECIMAL(5,2) NOT NULL DEFAULT 20,
  content_allocation DECIMAL(5,2) NOT NULL DEFAULT 20,
  ads_allocation DECIMAL(5,2) NOT NULL DEFAULT 20,
  cro_allocation DECIMAL(5,2) NOT NULL DEFAULT 20,

  -- Performance weights
  seo_performance DECIMAL(5,2),
  geo_performance DECIMAL(5,2),
  content_performance DECIMAL(5,2),
  ads_performance DECIMAL(5,2),
  cro_performance DECIMAL(5,2),

  -- Balance metrics
  balance_score DECIMAL(5,2), -- 0-100, how balanced
  entropy DECIMAL(8,6), -- Distribution entropy
  gini_coefficient DECIMAL(5,4), -- Inequality measure

  -- Recommendations
  recommended_shifts JSONB DEFAULT '{}',
  over_optimized_domains TEXT[] DEFAULT '{}',
  under_invested_domains TEXT[] DEFAULT '{}',

  -- Applied changes
  changes_applied BOOLEAN NOT NULL DEFAULT false,
  applied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance History Table - Historical performance for learning
CREATE TABLE IF NOT EXISTS performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Context
  horizon_plan_id UUID REFERENCES horizon_plans(id),
  horizon_step_id UUID REFERENCES horizon_steps(id),
  domain TEXT NOT NULL,

  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_days INTEGER NOT NULL,

  -- Metrics
  metric_name TEXT NOT NULL,
  target_value DECIMAL(15,4),
  actual_value DECIMAL(15,4),
  achievement_percent DECIMAL(8,4),

  -- Performance assessment
  performance_grade TEXT CHECK (performance_grade IN ('A', 'B', 'C', 'D', 'F')),
  on_track BOOLEAN NOT NULL,

  -- Context factors
  external_factors JSONB DEFAULT '{}',
  resource_constraints JSONB DEFAULT '{}',
  dependencies_met BOOLEAN DEFAULT true,

  -- Learning signals
  success_patterns JSONB DEFAULT '[]',
  failure_patterns JSONB DEFAULT '[]',
  lessons_learned JSONB DEFAULT '[]',

  -- Reinforcement data
  reinforcement_score DECIMAL(5,2), -- -100 to +100
  confidence_adjustment DECIMAL(5,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reinforcement Adjustments Table - Track strategy reinforcements
CREATE TABLE IF NOT EXISTS reinforcement_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  refinement_cycle_id UUID REFERENCES refinement_cycles(id),

  -- Target
  adjustment_target TEXT NOT NULL CHECK (adjustment_target IN (
    'STEP',
    'DOMAIN',
    'KPI_TARGET',
    'TIMELINE',
    'RESOURCE',
    'PRIORITY'
  )),
  target_id UUID,
  domain TEXT,

  -- Adjustment details
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN (
    'STRENGTHEN',     -- Increase investment/priority
    'WEAKEN',        -- Decrease investment/priority
    'MAINTAIN',      -- Keep current
    'REDIRECT',      -- Shift to different approach
    'PAUSE',         -- Temporary halt
    'ACCELERATE'     -- Speed up execution
  )),

  -- Values
  previous_value JSONB,
  new_value JSONB,
  change_magnitude DECIMAL(8,4),

  -- Reasoning
  trigger_reason TEXT NOT NULL,
  supporting_evidence JSONB DEFAULT '[]',
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,

  -- Feedback
  operator_feedback TEXT,
  operator_approved BOOLEAN,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),

  -- Outcome tracking
  expected_impact DECIMAL(8,4),
  actual_impact DECIMAL(8,4),
  outcome_recorded BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refinement_cycles_org ON refinement_cycles(organization_id);
CREATE INDEX IF NOT EXISTS idx_refinement_cycles_plan ON refinement_cycles(horizon_plan_id);
CREATE INDEX IF NOT EXISTS idx_refinement_cycles_status ON refinement_cycles(status);
CREATE INDEX IF NOT EXISTS idx_refinement_cycles_type ON refinement_cycles(cycle_type);

CREATE INDEX IF NOT EXISTS idx_drift_signals_org ON drift_signals(organization_id);
CREATE INDEX IF NOT EXISTS idx_drift_signals_cycle ON drift_signals(refinement_cycle_id);
CREATE INDEX IF NOT EXISTS idx_drift_signals_domain ON drift_signals(domain);
CREATE INDEX IF NOT EXISTS idx_drift_signals_severity ON drift_signals(severity);
CREATE INDEX IF NOT EXISTS idx_drift_signals_resolved ON drift_signals(resolved);

CREATE INDEX IF NOT EXISTS idx_domain_balances_org ON domain_balances(organization_id);
CREATE INDEX IF NOT EXISTS idx_domain_balances_cycle ON domain_balances(refinement_cycle_id);
CREATE INDEX IF NOT EXISTS idx_domain_balances_date ON domain_balances(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_performance_history_org ON performance_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_history_plan ON performance_history(horizon_plan_id);
CREATE INDEX IF NOT EXISTS idx_performance_history_domain ON performance_history(domain);
CREATE INDEX IF NOT EXISTS idx_performance_history_period ON performance_history(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_reinforcement_adjustments_org ON reinforcement_adjustments(organization_id);
CREATE INDEX IF NOT EXISTS idx_reinforcement_adjustments_cycle ON reinforcement_adjustments(refinement_cycle_id);
CREATE INDEX IF NOT EXISTS idx_reinforcement_adjustments_target ON reinforcement_adjustments(adjustment_target);

-- RLS Policies
ALTER TABLE refinement_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reinforcement_adjustments ENABLE ROW LEVEL SECURITY;

-- Refinement Cycles: org members
CREATE POLICY refinement_cycles_select ON refinement_cycles
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY refinement_cycles_insert ON refinement_cycles
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY refinement_cycles_update ON refinement_cycles
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Drift Signals: org members
CREATE POLICY drift_signals_select ON drift_signals
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY drift_signals_insert ON drift_signals
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY drift_signals_update ON drift_signals
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Domain Balances: org members
CREATE POLICY domain_balances_select ON domain_balances
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY domain_balances_insert ON domain_balances
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Performance History: org members
CREATE POLICY performance_history_select ON performance_history
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY performance_history_insert ON performance_history
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Reinforcement Adjustments: org members
CREATE POLICY reinforcement_adjustments_select ON reinforcement_adjustments
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY reinforcement_adjustments_insert ON reinforcement_adjustments
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY reinforcement_adjustments_update ON reinforcement_adjustments
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );
