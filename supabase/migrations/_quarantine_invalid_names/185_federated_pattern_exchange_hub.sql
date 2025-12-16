-- Migration 185: Federated Pattern Exchange Hub (FPEH)
-- Phase 142: Global hub aggregating anonymised patterns from all tenants

-- Global pattern catalog table
CREATE TABLE IF NOT EXISTS global_pattern_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_hash TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  anonymised_context JSONB NOT NULL,
  submission_count INTEGER NOT NULL DEFAULT 1,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 0.95),
  uncertainty_notes TEXT,
  similarity_tags JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pattern submissions table (for tracking without revealing source)
CREATE TABLE IF NOT EXISTS pattern_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_catalog_id UUID REFERENCES global_pattern_catalog(id) ON DELETE CASCADE,
  submission_hash TEXT NOT NULL,
  anonymisation_level INTEGER NOT NULL CHECK (anonymisation_level >= 1 AND anonymisation_level <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_global_patterns_category ON global_pattern_catalog(category);
CREATE INDEX IF NOT EXISTS idx_global_patterns_published ON global_pattern_catalog(is_published);
CREATE INDEX IF NOT EXISTS idx_pattern_submissions_catalog ON pattern_submissions(pattern_catalog_id);

-- RLS (global catalog is readable by all authenticated users)
ALTER TABLE global_pattern_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view global patterns" ON global_pattern_catalog;
CREATE POLICY "Authenticated users can view global patterns" ON global_pattern_catalog
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "System can manage global patterns" ON global_pattern_catalog;
CREATE POLICY "System can manage global patterns" ON global_pattern_catalog
  FOR ALL USING (auth.uid() IS NOT NULL);
