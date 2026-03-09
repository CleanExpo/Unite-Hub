-- Migration 192: Cross-Tenant Safety & Fairness Auditor (CTSFA)
-- Phase 149: Audits global learning for fairness and bias detection

-- Fairness audit reports table
CREATE TABLE IF NOT EXISTS fairness_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL CHECK (audit_type IN ('pattern_distribution', 'benefit_concentration', 'region_balance', 'cohort_equity')),
  audit_scope TEXT NOT NULL CHECK (audit_scope IN ('global', 'region', 'cohort')),
  findings JSONB NOT NULL,
  bias_flags JSONB DEFAULT '[]',
  risk_level TEXT NOT NULL CHECK (risk_level IN ('none', 'low', 'medium', 'high', 'critical')) DEFAULT 'none',
  recommendations JSONB DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  is_suppressed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pattern bias flags table
CREATE TABLE IF NOT EXISTS pattern_bias_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID,
  bias_type TEXT NOT NULL,
  affected_groups JSONB NOT NULL DEFAULT '[]',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'low',
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fairness_reports_type ON fairness_audit_reports(audit_type);
CREATE INDEX IF NOT EXISTS idx_fairness_reports_risk ON fairness_audit_reports(risk_level);
CREATE INDEX IF NOT EXISTS idx_pattern_bias_flags_pattern ON pattern_bias_flags(pattern_id);

-- RLS (audit reports visible to all authenticated users for transparency)
ALTER TABLE fairness_audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_bias_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view fairness reports" ON fairness_audit_reports;
CREATE POLICY "Authenticated users can view fairness reports" ON fairness_audit_reports
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_suppressed = false);

DROP POLICY IF EXISTS "Authenticated users can view bias flags" ON pattern_bias_flags;
CREATE POLICY "Authenticated users can view bias flags" ON pattern_bias_flags
  FOR SELECT USING (auth.uid() IS NOT NULL);
