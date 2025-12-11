-- Guardian Phase H10: AI Configuration Optimization Assistant
-- Migration: 559
-- Purpose: Add optimization feature toggle and optimization suggestions storage
-- Tables: guardian_ai_optimization_suggestions, guardian_ai_settings (extended)

-- ============================================================================
-- EXTEND: guardian_ai_settings (add optimization_enabled flag)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings'
      AND column_name = 'optimization_enabled'
  ) THEN
    ALTER TABLE guardian_ai_settings
    ADD COLUMN optimization_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN guardian_ai_settings.optimization_enabled IS 'Enable AI-powered configuration optimization suggestions (H10)';

-- ============================================================================
-- TABLE: guardian_ai_optimization_suggestions
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('rule_tuning', 'noise_reduction', 'coverage_gap', 'routing', 'other')),
  target_type TEXT NOT NULL CHECK (target_type IN ('rule', 'rule_group', 'global', 'notification_channel')),
  target_id TEXT,
  model TEXT NOT NULL,
  suggestion_markdown TEXT NOT NULL,
  impact_score NUMERIC(4, 3) NOT NULL CHECK (impact_score >= 0 AND impact_score <= 1),
  confidence NUMERIC(4, 3) CHECK (confidence >= 0 AND confidence <= 1),
  rationale_summary TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'dismissed', 'applied')),
  status_changed_at TIMESTAMPTZ,
  status_changed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_guardian_ai_optimization_suggestions_tenant
  ON guardian_ai_optimization_suggestions (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_optimization_suggestions_status
  ON guardian_ai_optimization_suggestions (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_optimization_suggestions_target
  ON guardian_ai_optimization_suggestions (tenant_id, target_type, target_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_ai_optimization_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rw_guardian_ai_optimization_suggestions ON guardian_ai_optimization_suggestions;
CREATE POLICY tenant_rw_guardian_ai_optimization_suggestions
  ON guardian_ai_optimization_suggestions
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_ai_optimization_suggestions ON guardian_ai_optimization_suggestions;
CREATE POLICY service_all_guardian_ai_optimization_suggestions
  ON guardian_ai_optimization_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_ai_optimization_suggestions IS 'AI-generated configuration optimization suggestions (advisory only)';
COMMENT ON COLUMN guardian_ai_optimization_suggestions.category IS 'Optimization category: rule_tuning, noise_reduction, coverage_gap, routing, other';
COMMENT ON COLUMN guardian_ai_optimization_suggestions.target_type IS 'What to optimize: rule, rule_group, global, notification_channel';
COMMENT ON COLUMN guardian_ai_optimization_suggestions.impact_score IS 'Expected impact score 0-1 (1=high impact)';
COMMENT ON COLUMN guardian_ai_optimization_suggestions.status IS 'Suggestion status: proposed, accepted, dismissed, applied';
