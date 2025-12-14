-- Guardian Phase H05: AI Governance & Controls Layer
-- Migration: 554
-- Purpose: Per-tenant AI feature toggles, quotas, and safety limits
-- Tables: guardian_ai_settings

-- ============================================================================
-- TABLE: guardian_ai_settings
-- ============================================================================
-- Stores per-tenant AI feature configuration and usage limits
-- Controls which AI features are enabled and enforces quotas
-- Admin-only modification, tenant-readable
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  rule_assistant_enabled BOOLEAN NOT NULL DEFAULT true,
  anomaly_detection_enabled BOOLEAN NOT NULL DEFAULT true,
  correlation_refinement_enabled BOOLEAN NOT NULL DEFAULT true,
  predictive_scoring_enabled BOOLEAN NOT NULL DEFAULT true,
  max_daily_ai_calls INTEGER NOT NULL DEFAULT 500 CHECK (max_daily_ai_calls >= 0 AND max_daily_ai_calls <= 10000),
  soft_token_limit INTEGER NOT NULL DEFAULT 200000 CHECK (soft_token_limit >= 0 AND soft_token_limit <= 10000000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_ai_settings_tenant
  ON guardian_ai_settings (tenant_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_ai_settings ENABLE ROW LEVEL SECURITY;

-- Tenants can read their own AI settings
CREATE POLICY tenant_select_guardian_ai_settings
  ON guardian_ai_settings
  FOR SELECT
  USING (tenant_id = auth.uid());

-- Only admins can modify AI settings (enforced at API layer)
CREATE POLICY tenant_upsert_guardian_ai_settings
  ON guardian_ai_settings
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access
CREATE POLICY service_all_guardian_ai_settings
  ON guardian_ai_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_ai_settings IS 'Per-tenant AI feature toggles and quotas';
COMMENT ON COLUMN guardian_ai_settings.ai_enabled IS 'Master toggle for all Guardian AI features';
COMMENT ON COLUMN guardian_ai_settings.rule_assistant_enabled IS 'Enable AI-assisted rule authoring (H01)';
COMMENT ON COLUMN guardian_ai_settings.anomaly_detection_enabled IS 'Enable AI-powered anomaly detection (H02)';
COMMENT ON COLUMN guardian_ai_settings.correlation_refinement_enabled IS 'Enable AI correlation refinement (H03)';
COMMENT ON COLUMN guardian_ai_settings.predictive_scoring_enabled IS 'Enable predictive incident scoring (H04)';
COMMENT ON COLUMN guardian_ai_settings.max_daily_ai_calls IS 'Maximum AI calls per day (0-10000)';
COMMENT ON COLUMN guardian_ai_settings.soft_token_limit IS 'Soft token limit per day (0-10M)';
COMMENT ON COLUMN guardian_ai_settings.updated_by IS 'User ID who last updated settings';
