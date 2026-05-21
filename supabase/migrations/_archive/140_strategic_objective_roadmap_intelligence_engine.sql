-- Migration 140: Strategic Objective & Roadmap Intelligence Engine
-- Required by Phase 88 - Strategic Objective & Roadmap Intelligence Engine (SORIE)
-- High-level strategic intelligence for long-term roadmaps

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS sorie_recommendations CASCADE;
DROP TABLE IF EXISTS sorie_roadmaps CASCADE;
DROP TABLE IF EXISTS sorie_objectives CASCADE;

-- SORIE objectives table
CREATE TABLE sorie_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  kpi_targets JSONB DEFAULT '{}'::jsonb,
  time_horizon TEXT NOT NULL DEFAULT '1y',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Time horizon check
  CONSTRAINT sorie_objectives_horizon_check CHECK (
    time_horizon IN ('1q', '2q', '1y', '2y', '5y')
  ),

  -- Priority range
  CONSTRAINT sorie_objectives_priority_check CHECK (
    priority >= 1 AND priority <= 10
  ),

  -- Foreign keys
  CONSTRAINT sorie_objectives_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sorie_objectives_tenant ON sorie_objectives(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sorie_objectives_priority ON sorie_objectives(priority);
CREATE INDEX IF NOT EXISTS idx_sorie_objectives_horizon ON sorie_objectives(time_horizon);
CREATE INDEX IF NOT EXISTS idx_sorie_objectives_created ON sorie_objectives(created_at DESC);

-- Enable RLS
ALTER TABLE sorie_objectives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY sorie_objectives_select ON sorie_objectives
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY sorie_objectives_insert ON sorie_objectives
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY sorie_objectives_update ON sorie_objectives
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY sorie_objectives_delete ON sorie_objectives
  FOR DELETE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE sorie_objectives IS 'Strategic objectives and KPI targets (Phase 88)';

-- SORIE roadmaps table
CREATE TABLE sorie_roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  objective_id UUID NOT NULL,
  roadmap_items JSONB DEFAULT '[]'::jsonb,
  confidence NUMERIC NOT NULL DEFAULT 0,
  impact_assessment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence range
  CONSTRAINT sorie_roadmaps_confidence_check CHECK (
    confidence >= 0 AND confidence <= 100
  ),

  -- Foreign keys
  CONSTRAINT sorie_roadmaps_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT sorie_roadmaps_objective_fk
    FOREIGN KEY (objective_id) REFERENCES sorie_objectives(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sorie_roadmaps_tenant ON sorie_roadmaps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sorie_roadmaps_objective ON sorie_roadmaps(objective_id);
CREATE INDEX IF NOT EXISTS idx_sorie_roadmaps_confidence ON sorie_roadmaps(confidence);
CREATE INDEX IF NOT EXISTS idx_sorie_roadmaps_created ON sorie_roadmaps(created_at DESC);

-- Enable RLS
ALTER TABLE sorie_roadmaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY sorie_roadmaps_select ON sorie_roadmaps
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY sorie_roadmaps_insert ON sorie_roadmaps
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY sorie_roadmaps_update ON sorie_roadmaps
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE sorie_roadmaps IS 'Strategic roadmaps for objectives (Phase 88)';

-- SORIE recommendations table
CREATE TABLE sorie_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  objective_id UUID,
  recommendation TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  expected_impact JSONB DEFAULT '{}'::jsonb,
  requires_hsoe BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk level check
  CONSTRAINT sorie_recommendations_risk_check CHECK (
    risk_level IN ('low', 'medium', 'high', 'critical')
  ),

  -- Status check
  CONSTRAINT sorie_recommendations_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'implemented', 'deferred')
  ),

  -- Foreign keys
  CONSTRAINT sorie_recommendations_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT sorie_recommendations_objective_fk
    FOREIGN KEY (objective_id) REFERENCES sorie_objectives(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sorie_recommendations_tenant ON sorie_recommendations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sorie_recommendations_objective ON sorie_recommendations(objective_id);
CREATE INDEX IF NOT EXISTS idx_sorie_recommendations_risk ON sorie_recommendations(risk_level);
CREATE INDEX IF NOT EXISTS idx_sorie_recommendations_status ON sorie_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_sorie_recommendations_created ON sorie_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE sorie_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY sorie_recommendations_select ON sorie_recommendations
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY sorie_recommendations_insert ON sorie_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY sorie_recommendations_update ON sorie_recommendations
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE sorie_recommendations IS 'Strategic recommendations (Phase 88)';
