/**
 * Phase D80: Futurecasting Intelligence Engine
 *
 * Predictive intelligence: macro trends, competitive shifts, regulatory changes.
 */

-- ============================================================================
-- FUTURECASTING MODELS (predictive intelligence models)
-- ============================================================================

DROP TABLE IF EXISTS futurecasting_models CASCADE;

CREATE TABLE futurecasting_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text NOT NULL,
  domain text NOT NULL,
  timeframe text NOT NULL CHECK (timeframe IN ('short_term', 'medium_term', 'long_term', 'multi_horizon')),
  inputs jsonb,
  outputs jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_futurecasting_models_tenant ON futurecasting_models(tenant_id, created_at DESC);
CREATE INDEX idx_futurecasting_models_domain ON futurecasting_models(domain, timeframe);
CREATE INDEX idx_futurecasting_models_timeframe ON futurecasting_models(timeframe, created_at DESC);

COMMENT ON TABLE futurecasting_models IS 'Predictive intelligence models for macro + competitive foresight';
COMMENT ON COLUMN futurecasting_models.domain IS 'Prediction domain (e.g., "market", "technology", "regulatory", "competitive")';
COMMENT ON COLUMN futurecasting_models.timeframe IS 'Prediction timeframe: short_term (3-6mo) | medium_term (6-18mo) | long_term (18mo+) | multi_horizon';
COMMENT ON COLUMN futurecasting_models.inputs IS 'Forecast inputs: {variables, constraints, data_sources, assumptions}';
COMMENT ON COLUMN futurecasting_models.outputs IS 'Forecast results: {macro_trends, industry_shifts, competitor_moves, regulatory_changes, tech_evolution, leading_indicators}';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE futurecasting_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view futurecasting models for their tenant"
  ON futurecasting_models FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "Users can manage futurecasting models for their tenant"
  ON futurecasting_models FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
