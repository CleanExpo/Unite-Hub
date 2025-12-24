-- Migration 127: Investor Forecast Engine
-- Required by Phase 75 - Investor Forecast Engine (IFE)
-- Long-term forecasts for investor relations

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS long_term_forecasts CASCADE;
DROP TABLE IF EXISTS forecast_inputs CASCADE;

-- Forecast inputs table
CREATE TABLE forecast_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  input_type TEXT NOT NULL,
  value JSONB DEFAULT '{}'::jsonb,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Input type check
  CONSTRAINT forecast_inputs_type_check CHECK (
    input_type IN (
      'revenue', 'costs', 'headcount', 'market_share',
      'customer_count', 'franchise_count', 'capex', 'other'
    )
  ),

  -- Foreign key
  CONSTRAINT forecast_inputs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forecast_inputs_org ON forecast_inputs(org_id);
CREATE INDEX IF NOT EXISTS idx_forecast_inputs_type ON forecast_inputs(input_type);
CREATE INDEX IF NOT EXISTS idx_forecast_inputs_period ON forecast_inputs(period);
CREATE INDEX IF NOT EXISTS idx_forecast_inputs_created ON forecast_inputs(created_at DESC);

-- Enable RLS
ALTER TABLE forecast_inputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY forecast_inputs_select ON forecast_inputs
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY forecast_inputs_insert ON forecast_inputs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY forecast_inputs_update ON forecast_inputs
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE forecast_inputs IS 'Forecast input data (Phase 75)';

-- Long-term forecasts table
CREATE TABLE long_term_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  forecast_type TEXT NOT NULL,
  projection_years INTEGER NOT NULL DEFAULT 5,
  projections JSONB DEFAULT '{}'::jsonb,
  growth_curve JSONB DEFAULT '{}'::jsonb,
  exit_valuation NUMERIC,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Forecast type check
  CONSTRAINT long_term_forecasts_type_check CHECK (
    forecast_type IN (
      'revenue', 'valuation', 'market_penetration',
      'franchise_expansion', 'profitability', 'comprehensive'
    )
  ),

  -- Confidence check
  CONSTRAINT long_term_forecasts_confidence_check CHECK (
    confidence_score >= 0 AND confidence_score <= 100
  ),

  -- Foreign key
  CONSTRAINT long_term_forecasts_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_long_term_forecasts_org ON long_term_forecasts(org_id);
CREATE INDEX IF NOT EXISTS idx_long_term_forecasts_type ON long_term_forecasts(forecast_type);
CREATE INDEX IF NOT EXISTS idx_long_term_forecasts_confidence ON long_term_forecasts(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_long_term_forecasts_generated ON long_term_forecasts(generated_at DESC);

-- Enable RLS
ALTER TABLE long_term_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY long_term_forecasts_select ON long_term_forecasts
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY long_term_forecasts_insert ON long_term_forecasts
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE long_term_forecasts IS 'Long-term investor forecasts (Phase 75)';
