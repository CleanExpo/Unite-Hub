-- Phase 11 Week 5-6: Strategy Horizons Tables
-- Long-horizon planning with rolling optimization and KPI tracking

-- Horizon Plans Table - 30/60/90-day rolling strategy plans
CREATE TABLE IF NOT EXISTS horizon_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Plan metadata
  name TEXT NOT NULL,
  description TEXT,
  horizon_type TEXT NOT NULL CHECK (horizon_type IN (
    'SHORT',      -- 30 days
    'MEDIUM',     -- 60 days
    'LONG',       -- 90 days
    'QUARTERLY',  -- 90 days aligned to quarter
    'CUSTOM'      -- User-defined
  )),

  -- Time range
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  days_total INTEGER NOT NULL,

  -- Rolling optimization
  is_rolling BOOLEAN NOT NULL DEFAULT true,
  roll_frequency_days INTEGER DEFAULT 7,
  last_rolled_at TIMESTAMPTZ,
  next_roll_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT',
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'ARCHIVED'
  )),

  -- Scoring
  confidence_score DECIMAL(5,2),
  feasibility_score DECIMAL(5,2),
  impact_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),

  -- References
  parent_plan_id UUID REFERENCES horizon_plans(id),
  source_simulation_id UUID,

  -- Ownership
  created_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Horizon Steps Table - Individual steps within a horizon plan
CREATE TABLE IF NOT EXISTS horizon_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horizon_plan_id UUID NOT NULL REFERENCES horizon_plans(id) ON DELETE CASCADE,

  -- Step metadata
  name TEXT NOT NULL,
  description TEXT,
  step_number INTEGER NOT NULL,
  domain TEXT NOT NULL,

  -- Timing
  start_day INTEGER NOT NULL, -- Day offset from plan start
  end_day INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,

  -- Target KPIs
  target_kpis JSONB DEFAULT '{}',

  -- Status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'SKIPPED',
    'FAILED'
  )),
  progress DECIMAL(5,2) NOT NULL DEFAULT 0,

  -- Resources
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  assigned_to UUID REFERENCES auth.users(id),

  -- Risk
  risk_level TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  risk_factors JSONB DEFAULT '{}',

  -- Results
  outcome_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- KPI Snapshots Table - Track KPIs over time
CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Snapshot metadata
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN (
    'BASELINE',
    'CURRENT',
    'PROJECTED',
    'TARGET',
    'MILESTONE'
  )),
  snapshot_date TIMESTAMPTZ NOT NULL,

  -- Domain-specific KPIs
  domain TEXT NOT NULL CHECK (domain IN (
    'SEO',
    'GEO',
    'CONTENT',
    'ADS',
    'CRO',
    'EMAIL',
    'SOCIAL',
    'OVERALL'
  )),

  -- Metric values
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  metric_unit TEXT,

  -- Comparison
  baseline_value DECIMAL(15,4),
  target_value DECIMAL(15,4),
  change_percent DECIMAL(8,4),
  trend TEXT CHECK (trend IN ('UP', 'DOWN', 'STABLE', 'VOLATILE')),

  -- Confidence
  confidence DECIMAL(3,2) DEFAULT 0.50,
  data_quality TEXT DEFAULT 'MEDIUM' CHECK (data_quality IN ('LOW', 'MEDIUM', 'HIGH')),

  -- References
  horizon_plan_id UUID REFERENCES horizon_plans(id),
  horizon_step_id UUID REFERENCES horizon_steps(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dependency Links Table - Track dependencies between steps
CREATE TABLE IF NOT EXISTS dependency_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horizon_plan_id UUID NOT NULL REFERENCES horizon_plans(id) ON DELETE CASCADE,

  -- Dependency relationship
  source_step_id UUID NOT NULL REFERENCES horizon_steps(id) ON DELETE CASCADE,
  target_step_id UUID NOT NULL REFERENCES horizon_steps(id) ON DELETE CASCADE,

  -- Link type
  link_type TEXT NOT NULL CHECK (link_type IN (
    'FINISH_TO_START',   -- Target starts after source finishes
    'START_TO_START',    -- Target starts when source starts
    'FINISH_TO_FINISH',  -- Target finishes when source finishes
    'START_TO_FINISH'    -- Target finishes when source starts
  )),

  -- Lag/Lead
  lag_days INTEGER NOT NULL DEFAULT 0, -- Positive = lag, Negative = lead

  -- Criticality
  is_critical BOOLEAN NOT NULL DEFAULT false,
  flexibility_days INTEGER DEFAULT 0,

  -- Metadata
  description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate links
  UNIQUE(source_step_id, target_step_id, link_type)
);

-- Horizon Adjustments Table - Track plan adjustments over time
CREATE TABLE IF NOT EXISTS horizon_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horizon_plan_id UUID NOT NULL REFERENCES horizon_plans(id) ON DELETE CASCADE,

  -- Adjustment metadata
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN (
    'REPLAN',
    'RESCHEDULE',
    'REPRIORITIZE',
    'RESOURCE_CHANGE',
    'SCOPE_CHANGE',
    'KPI_UPDATE'
  )),
  reason TEXT NOT NULL,
  description TEXT,

  -- Changes
  changes_summary JSONB NOT NULL DEFAULT '{}',
  affected_step_ids UUID[],

  -- Impact
  impact_on_timeline INTEGER, -- Days added/removed
  impact_on_score DECIMAL(5,2),

  -- Approval
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Created by
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_horizon_plans_org ON horizon_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_horizon_plans_status ON horizon_plans(status);
CREATE INDEX IF NOT EXISTS idx_horizon_plans_type ON horizon_plans(horizon_type);
CREATE INDEX IF NOT EXISTS idx_horizon_plans_dates ON horizon_plans(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_horizon_plans_rolling ON horizon_plans(is_rolling, next_roll_at);

CREATE INDEX IF NOT EXISTS idx_horizon_steps_plan ON horizon_steps(horizon_plan_id);
CREATE INDEX IF NOT EXISTS idx_horizon_steps_domain ON horizon_steps(domain);
CREATE INDEX IF NOT EXISTS idx_horizon_steps_status ON horizon_steps(status);
CREATE INDEX IF NOT EXISTS idx_horizon_steps_timing ON horizon_steps(start_day, end_day);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_org ON kpi_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_domain ON kpi_snapshots(domain);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_type ON kpi_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_date ON kpi_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_metric ON kpi_snapshots(metric_name);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_plan ON kpi_snapshots(horizon_plan_id);

CREATE INDEX IF NOT EXISTS idx_dependency_links_plan ON dependency_links(horizon_plan_id);
CREATE INDEX IF NOT EXISTS idx_dependency_links_source ON dependency_links(source_step_id);
CREATE INDEX IF NOT EXISTS idx_dependency_links_target ON dependency_links(target_step_id);

CREATE INDEX IF NOT EXISTS idx_horizon_adjustments_plan ON horizon_adjustments(horizon_plan_id);
CREATE INDEX IF NOT EXISTS idx_horizon_adjustments_type ON horizon_adjustments(adjustment_type);

-- RLS Policies
ALTER TABLE horizon_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE horizon_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE horizon_adjustments ENABLE ROW LEVEL SECURITY;

-- Horizon Plans: org members
CREATE POLICY horizon_plans_select ON horizon_plans
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY horizon_plans_insert ON horizon_plans
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY horizon_plans_update ON horizon_plans
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY horizon_plans_delete ON horizon_plans
  FOR DELETE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Horizon Steps: via plan
CREATE POLICY horizon_steps_select ON horizon_steps
  FOR SELECT USING (
    horizon_plan_id IN (
      SELECT id FROM horizon_plans
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY horizon_steps_insert ON horizon_steps
  FOR INSERT WITH CHECK (
    horizon_plan_id IN (
      SELECT id FROM horizon_plans
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY horizon_steps_update ON horizon_steps
  FOR UPDATE USING (
    horizon_plan_id IN (
      SELECT id FROM horizon_plans
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

-- KPI Snapshots: org members
CREATE POLICY kpi_snapshots_select ON kpi_snapshots
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY kpi_snapshots_insert ON kpi_snapshots
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Dependency Links: via plan
CREATE POLICY dependency_links_select ON dependency_links
  FOR SELECT USING (
    horizon_plan_id IN (
      SELECT id FROM horizon_plans
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY dependency_links_insert ON dependency_links
  FOR INSERT WITH CHECK (
    horizon_plan_id IN (
      SELECT id FROM horizon_plans
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

-- Horizon Adjustments: via plan
CREATE POLICY horizon_adjustments_select ON horizon_adjustments
  FOR SELECT USING (
    horizon_plan_id IN (
      SELECT id FROM horizon_plans
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY horizon_adjustments_insert ON horizon_adjustments
  FOR INSERT WITH CHECK (
    horizon_plan_id IN (
      SELECT id FROM horizon_plans
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );
