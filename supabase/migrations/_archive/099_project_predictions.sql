-- Migration 099: Project Predictions
-- Required by Phase 47 - Project Prediction AI (PPA)
-- Timeline and risk predictions for projects

-- Project predictions table
CREATE TABLE IF NOT EXISTS project_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  org_id UUID NOT NULL,
  predicted_completion TIMESTAMPTZ,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  risk_factors JSONB DEFAULT '[]'::jsonb,
  staffing_recommendations JSONB DEFAULT '{}'::jsonb,
  budget_forecast JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk level check
  CONSTRAINT project_predictions_risk_check CHECK (
    risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),

  -- Foreign keys
  CONSTRAINT project_predictions_project_fk
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT project_predictions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_predictions_project ON project_predictions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_predictions_org ON project_predictions(org_id);
CREATE INDEX IF NOT EXISTS idx_project_predictions_risk ON project_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_project_predictions_created ON project_predictions(created_at DESC);

-- Enable RLS
ALTER TABLE project_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY project_predictions_select ON project_predictions
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY project_predictions_insert ON project_predictions
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE project_predictions IS 'AI predictions for project timelines and risks (Phase 47)';
