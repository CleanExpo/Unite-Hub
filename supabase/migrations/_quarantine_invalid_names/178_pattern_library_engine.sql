-- Migration 178: Pattern Library Engine
-- Phase 135: Canonical library of successful and failed patterns

-- Patterns table
CREATE TABLE IF NOT EXISTS pattern_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('campaign', 'creative', 'scaling', 'automation', 'workflow', 'other')),
  description TEXT NOT NULL,
  success_context JSONB,
  failure_reasons JSONB,
  guardrails JSONB DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  is_success BOOLEAN NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pattern_library_tenant ON pattern_library(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pattern_library_category ON pattern_library(category);
CREATE INDEX IF NOT EXISTS idx_pattern_library_success ON pattern_library(is_success);

-- RLS
ALTER TABLE pattern_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view patterns" ON pattern_library;
CREATE POLICY "Users can view patterns" ON pattern_library
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage patterns" ON pattern_library;
CREATE POLICY "Users can manage patterns" ON pattern_library
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
