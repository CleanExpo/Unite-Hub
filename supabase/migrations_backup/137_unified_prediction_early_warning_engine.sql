-- Migration 137: Unified Prediction & Early-Warning Engine
-- Required by Phase 85 - Unified Prediction & Early-Warning Engine (UPEWE)
-- Cross-system forecasting engine for predictive risk analysis

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS upewe_policy_rules CASCADE;
DROP TABLE IF EXISTS upewe_signal_cache CASCADE;
DROP TABLE IF EXISTS upewe_forecast_events CASCADE;

-- UPEWE forecast events table
CREATE TABLE upewe_forecast_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  signal_source TEXT NOT NULL,
  risk_type TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  forecast_window TEXT NOT NULL,
  recommended_action TEXT NOT NULL DEFAULT 'warn',
  raw_features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Signal source check
  CONSTRAINT upewe_forecast_events_source_check CHECK (
    signal_source IN ('mcse', 'asrs', 'hsoe', 'maos', 'adre', 'voice', 'billing', 'aggregate')
  ),

  -- Risk type check
  CONSTRAINT upewe_forecast_events_risk_check CHECK (
    risk_type IN (
      'failure', 'anomaly', 'misuse', 'budget_risk', 'bottleneck',
      'misalignment', 'escalation_spike', 'approval_delay', 'pattern_match'
    )
  ),

  -- Forecast window check
  CONSTRAINT upewe_forecast_events_window_check CHECK (
    forecast_window IN ('5m', '30m', '6h', '24h', '7d')
  ),

  -- Recommended action check
  CONSTRAINT upewe_forecast_events_action_check CHECK (
    recommended_action IN ('warn', 'block_future', 'auto_escalate', 'require_hsoe', 'monitor')
  ),

  -- Confidence range
  CONSTRAINT upewe_forecast_events_confidence_check CHECK (
    confidence >= 0 AND confidence <= 100
  ),

  -- Foreign keys
  CONSTRAINT upewe_forecast_events_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_tenant ON upewe_forecast_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_source ON upewe_forecast_events(signal_source);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_risk ON upewe_forecast_events(risk_type);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_confidence ON upewe_forecast_events(confidence);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_window ON upewe_forecast_events(forecast_window);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_action ON upewe_forecast_events(recommended_action);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_created ON upewe_forecast_events(created_at DESC);

-- Enable RLS
ALTER TABLE upewe_forecast_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY upewe_forecast_events_select ON upewe_forecast_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_forecast_events_insert ON upewe_forecast_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE upewe_forecast_events IS 'Predicted risks and forecasts (Phase 85)';

-- UPEWE signal cache table
CREATE TABLE upewe_signal_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  signal_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ DEFAULT NOW(),

  -- Signal type check
  CONSTRAINT upewe_signal_cache_type_check CHECK (
    signal_type IN ('mcse', 'asrs', 'hsoe', 'maos', 'adre', 'voice', 'billing')
  ),

  -- Foreign keys
  CONSTRAINT upewe_signal_cache_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upewe_signal_cache_tenant ON upewe_signal_cache(tenant_id);
CREATE INDEX IF NOT EXISTS idx_upewe_signal_cache_type ON upewe_signal_cache(signal_type);
CREATE INDEX IF NOT EXISTS idx_upewe_signal_cache_received ON upewe_signal_cache(received_at DESC);

-- Enable RLS
ALTER TABLE upewe_signal_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY upewe_signal_cache_select ON upewe_signal_cache
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_signal_cache_insert ON upewe_signal_cache
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_signal_cache_delete ON upewe_signal_cache
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE upewe_signal_cache IS 'Short-term signal cache for pattern recognition (Phase 85)';

-- UPEWE policy rules table
CREATE TABLE upewe_policy_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  recommended_action TEXT NOT NULL DEFAULT 'warn',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Recommended action check
  CONSTRAINT upewe_policy_rules_action_check CHECK (
    recommended_action IN ('warn', 'block_future', 'auto_escalate', 'require_hsoe', 'monitor')
  ),

  -- Foreign keys
  CONSTRAINT upewe_policy_rules_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upewe_policy_rules_tenant ON upewe_policy_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_upewe_policy_rules_name ON upewe_policy_rules(rule_name);
CREATE INDEX IF NOT EXISTS idx_upewe_policy_rules_action ON upewe_policy_rules(recommended_action);
CREATE INDEX IF NOT EXISTS idx_upewe_policy_rules_enabled ON upewe_policy_rules(enabled);

-- Enable RLS
ALTER TABLE upewe_policy_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY upewe_policy_rules_select ON upewe_policy_rules
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_policy_rules_insert ON upewe_policy_rules
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_policy_rules_update ON upewe_policy_rules
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_policy_rules_delete ON upewe_policy_rules
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE upewe_policy_rules IS 'Predictive policy rules (Phase 85)';
