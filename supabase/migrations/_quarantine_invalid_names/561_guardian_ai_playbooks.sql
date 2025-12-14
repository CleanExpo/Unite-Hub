-- Guardian Phase H12: AI Playbook & Runbook Recommender
-- Migration: 561
-- Purpose: Add playbook feature toggle, playbook registry, and AI recommendations
-- Tables: guardian_playbooks, guardian_ai_playbook_recommendations, guardian_ai_settings (extended)

-- ============================================================================
-- EXTEND: guardian_ai_settings (add playbook_enabled flag)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings'
      AND column_name = 'playbook_enabled'
  ) THEN
    ALTER TABLE guardian_ai_settings
    ADD COLUMN playbook_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN guardian_ai_settings.playbook_enabled IS 'Enable AI-powered playbook and runbook recommendations (H12)';

-- ============================================================================
-- TABLE: guardian_playbooks
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  severity_hint TEXT CHECK (severity_hint IN ('low', 'medium', 'high', 'critical')),
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  link_url TEXT,
  estimated_duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  UNIQUE (tenant_id, key)
);

-- ============================================================================
-- TABLE: guardian_ai_playbook_recommendations
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_playbook_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('incident', 'alert', 'anomaly', 'predictive_score', 'rca')),
  source_id TEXT NOT NULL,
  model TEXT NOT NULL,
  recommendation_markdown TEXT NOT NULL,
  recommended_playbooks JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC(4, 3) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_guardian_playbooks_tenant
  ON guardian_playbooks (tenant_id, is_active, category);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_playbook_recommendations_source
  ON guardian_ai_playbook_recommendations (tenant_id, source_type, source_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_playbook_recommendations_tenant_created
  ON guardian_ai_playbook_recommendations (tenant_id, created_at DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_ai_playbook_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rw_guardian_playbooks ON guardian_playbooks;
CREATE POLICY tenant_rw_guardian_playbooks
  ON guardian_playbooks
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_playbooks ON guardian_playbooks;
CREATE POLICY service_all_guardian_playbooks
  ON guardian_playbooks
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS tenant_rw_guardian_ai_playbook_recommendations ON guardian_ai_playbook_recommendations;
CREATE POLICY tenant_rw_guardian_ai_playbook_recommendations
  ON guardian_ai_playbook_recommendations
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_ai_playbook_recommendations ON guardian_ai_playbook_recommendations;
CREATE POLICY service_all_guardian_ai_playbook_recommendations
  ON guardian_ai_playbook_recommendations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_playbooks IS 'Tenant-specific playbooks and runbooks for incident response';
COMMENT ON TABLE guardian_ai_playbook_recommendations IS 'AI-generated playbook recommendations for incidents/alerts/anomalies';
COMMENT ON COLUMN guardian_playbooks.key IS 'Unique playbook key within tenant (e.g., "api-outage-response")';
COMMENT ON COLUMN guardian_playbooks.link_url IS 'External link to playbook documentation';
COMMENT ON COLUMN guardian_ai_playbook_recommendations.recommended_playbooks IS 'JSON array of recommended playbook IDs with relevance scores';
