-- Guardian Phase H13: AI Safety, Compliance & Drift Monitor
-- Migration: 562
-- Purpose: Add AI safety monitoring, output auditing, and policy violation tracking
-- Tables: guardian_ai_output_audits, guardian_ai_policy_violations, guardian_ai_settings (extended)

-- ============================================================================
-- EXTEND: guardian_ai_settings (add safety monitoring controls)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings'
      AND column_name = 'safety_monitoring_enabled'
  ) THEN
    ALTER TABLE guardian_ai_settings
    ADD COLUMN safety_monitoring_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings'
      AND column_name = 'safety_sampling_rate'
  ) THEN
    ALTER TABLE guardian_ai_settings
    ADD COLUMN safety_sampling_rate NUMERIC(4, 3) NOT NULL DEFAULT 0.2
      CHECK (safety_sampling_rate >= 0 AND safety_sampling_rate <= 1);
  END IF;
END $$;

COMMENT ON COLUMN guardian_ai_settings.safety_monitoring_enabled IS 'Enable AI safety and drift monitoring (H13)';
COMMENT ON COLUMN guardian_ai_settings.safety_sampling_rate IS 'Fraction of AI outputs to audit (0-1, default 0.2 = 20%)';

-- ============================================================================
-- TABLE: guardian_ai_output_audits
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_output_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  feature TEXT NOT NULL,
  source_type TEXT,
  source_id TEXT,
  model TEXT NOT NULL,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  safety_classification TEXT NOT NULL CHECK (safety_classification IN ('ok', 'suspicious', 'policy_concern', 'drift_suspected', 'other')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  drift_score NUMERIC(4, 3) CHECK (drift_score >= 0 AND drift_score <= 1),
  output_hash TEXT NOT NULL,
  truncated_preview TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TABLE: guardian_ai_policy_violations
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  audit_id UUID REFERENCES guardian_ai_output_audits(id) ON DELETE CASCADE,
  violation_code TEXT NOT NULL,
  violation_description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_guardian_ai_output_audits_tenant_sampled
  ON guardian_ai_output_audits (tenant_id, sampled_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_output_audits_classification
  ON guardian_ai_output_audits (tenant_id, safety_classification, severity);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_policy_violations_tenant_created
  ON guardian_ai_policy_violations (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_policy_violations_audit
  ON guardian_ai_policy_violations (audit_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_ai_output_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_ai_policy_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rw_guardian_ai_output_audits ON guardian_ai_output_audits;
CREATE POLICY tenant_rw_guardian_ai_output_audits
  ON guardian_ai_output_audits
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_ai_output_audits ON guardian_ai_output_audits;
CREATE POLICY service_all_guardian_ai_output_audits
  ON guardian_ai_output_audits
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS tenant_rw_guardian_ai_policy_violations ON guardian_ai_policy_violations;
CREATE POLICY tenant_rw_guardian_ai_policy_violations
  ON guardian_ai_policy_violations
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_ai_policy_violations ON guardian_ai_policy_violations;
CREATE POLICY service_all_guardian_ai_policy_violations
  ON guardian_ai_policy_violations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_ai_output_audits IS 'Sampled AI output audits for safety and drift monitoring';
COMMENT ON TABLE guardian_ai_policy_violations IS 'Policy violations detected in AI outputs';
COMMENT ON COLUMN guardian_ai_output_audits.safety_classification IS 'Safety category: ok, suspicious, policy_concern, drift_suspected, other';
COMMENT ON COLUMN guardian_ai_output_audits.output_hash IS 'Hash of output for privacy-aware deduplication';
COMMENT ON COLUMN guardian_ai_output_audits.truncated_preview IS 'Small excerpt for admin review (max 500 chars)';
COMMENT ON COLUMN guardian_ai_policy_violations.violation_code IS 'Policy violation code (e.g., EXCESSIVE_LENGTH, SUSPICIOUS_CONTENT)';
