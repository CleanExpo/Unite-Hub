-- Migration 092: Credit Forecasts
-- Required by Phase 40 - Predictive Credit Forecasting Engine
-- Store forecast predictions for runout dates and risk levels

-- Credit forecasts table
CREATE TABLE IF NOT EXISTS credit_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL UNIQUE,
  voice_tokens_remaining INTEGER NOT NULL DEFAULT 0,
  text_tokens_remaining INTEGER NOT NULL DEFAULT 0,
  predicted_runout_date_voice DATE,
  predicted_runout_date_text DATE,
  confidence_voice NUMERIC NOT NULL DEFAULT 0,
  confidence_text NUMERIC NOT NULL DEFAULT 0,
  avg_daily_voice_burn NUMERIC NOT NULL DEFAULT 0,
  avg_daily_text_burn NUMERIC NOT NULL DEFAULT 0,
  window_days INTEGER NOT NULL DEFAULT 14,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk level check
  CONSTRAINT credit_forecasts_risk_check CHECK (
    risk_level IN ('LOW', 'MEDIUM', 'HIGH')
  ),

  -- Foreign key
  CONSTRAINT credit_forecasts_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_forecasts_org ON credit_forecasts(org_id);
CREATE INDEX IF NOT EXISTS idx_credit_forecasts_risk ON credit_forecasts(risk_level);
CREATE INDEX IF NOT EXISTS idx_credit_forecasts_runout
  ON credit_forecasts(predicted_runout_date_voice, predicted_runout_date_text);

-- Enable RLS
ALTER TABLE credit_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY credit_forecasts_select ON credit_forecasts
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY credit_forecasts_insert ON credit_forecasts
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY credit_forecasts_update ON credit_forecasts
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE credit_forecasts IS 'Predictive credit runout forecasts per org (Phase 40)';
