-- Migration 203: Field Reliability Certification System (FRCS)
-- Phase 170: Reliability scoring and certification

-- Reliability scores table
CREATE TABLE IF NOT EXISTS reliability_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('global', 'region', 'tenant', 'engine')),
  scope_identifier TEXT NOT NULL,
  score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  uptime_percentage REAL NOT NULL,
  incident_count INTEGER NOT NULL DEFAULT 0,
  mttr_minutes REAL,
  scoring_period_days INTEGER NOT NULL DEFAULT 30,
  confidence REAL NOT NULL DEFAULT 0.85,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certifications table
CREATE TABLE IF NOT EXISTS reliability_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL,
  scope_identifier TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  criteria_version TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reliability_scores_scope ON reliability_scores(scope_type, scope_identifier);
CREATE INDEX IF NOT EXISTS idx_reliability_certifications_tier ON reliability_certifications(tier);

-- RLS
ALTER TABLE reliability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reliability_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view reliability scores" ON reliability_scores;
CREATE POLICY "Authenticated users can view reliability scores" ON reliability_scores
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view certifications" ON reliability_certifications;
CREATE POLICY "Authenticated users can view certifications" ON reliability_certifications
  FOR SELECT USING (auth.uid() IS NOT NULL);
