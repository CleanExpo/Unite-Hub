-- Migration 139: Incident Learning & Continuous Improvement Engine
-- Required by Phase 87 - Incident Learning & Continuous Improvement Engine (ILCIE)
-- Continuous learning from incidents, runbooks, and forecasts

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS ilcie_improvement_log CASCADE;
DROP TABLE IF EXISTS ilcie_recommendations CASCADE;
DROP TABLE IF EXISTS ilcie_learning_events CASCADE;

-- ILCIE learning events table
CREATE TABLE ilcie_learning_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source TEXT NOT NULL,
  incident_id UUID,
  linked_event_id UUID,
  pattern JSONB DEFAULT '{}'::jsonb,
  impact_assessment TEXT,
  improvement_suggestion JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source check
  CONSTRAINT ilcie_learning_events_source_check CHECK (
    source IN ('aire', 'upewe', 'asrs', 'mcse', 'hsoe', 'runbook', 'manual')
  ),

  -- Foreign keys
  CONSTRAINT ilcie_learning_events_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ilcie_learning_events_tenant ON ilcie_learning_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_learning_events_source ON ilcie_learning_events(source);
CREATE INDEX IF NOT EXISTS idx_ilcie_learning_events_incident ON ilcie_learning_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_learning_events_event ON ilcie_learning_events(linked_event_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_learning_events_created ON ilcie_learning_events(created_at DESC);

-- Enable RLS
ALTER TABLE ilcie_learning_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ilcie_learning_events_select ON ilcie_learning_events
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ilcie_learning_events_insert ON ilcie_learning_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE ilcie_learning_events IS 'Learning observations from incidents and events (Phase 87)';

-- ILCIE recommendations table
CREATE TABLE ilcie_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  recommendation TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  requires_hsoe BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Target type check
  CONSTRAINT ilcie_recommendations_target_check CHECK (
    target_type IN ('runbook', 'policy', 'threshold', 'agent_config', 'forecast_model')
  ),

  -- Severity check
  CONSTRAINT ilcie_recommendations_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),

  -- Status check
  CONSTRAINT ilcie_recommendations_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'applied', 'reverted')
  ),

  -- Foreign keys
  CONSTRAINT ilcie_recommendations_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_tenant ON ilcie_recommendations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_target_type ON ilcie_recommendations(target_type);
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_target_id ON ilcie_recommendations(target_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_severity ON ilcie_recommendations(severity);
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_status ON ilcie_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_created ON ilcie_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE ilcie_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ilcie_recommendations_select ON ilcie_recommendations
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ilcie_recommendations_insert ON ilcie_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ilcie_recommendations_update ON ilcie_recommendations
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE ilcie_recommendations IS 'Improvement recommendations (Phase 87)';

-- ILCIE improvement log table
CREATE TABLE ilcie_improvement_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  recommendation_id UUID NOT NULL,
  change_summary JSONB DEFAULT '{}'::jsonb,
  applied_by TEXT NOT NULL,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT ilcie_improvement_log_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT ilcie_improvement_log_recommendation_fk
    FOREIGN KEY (recommendation_id) REFERENCES ilcie_recommendations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ilcie_improvement_log_tenant ON ilcie_improvement_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_improvement_log_recommendation ON ilcie_improvement_log(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_improvement_log_applied_by ON ilcie_improvement_log(applied_by);
CREATE INDEX IF NOT EXISTS idx_ilcie_improvement_log_created ON ilcie_improvement_log(created_at DESC);

-- Enable RLS
ALTER TABLE ilcie_improvement_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ilcie_improvement_log_select ON ilcie_improvement_log
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ilcie_improvement_log_insert ON ilcie_improvement_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE ilcie_improvement_log IS 'Applied improvements audit log (Phase 87)';
