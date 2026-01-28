-- Migration 176: Human Training Insight Engine
-- Phase 133: Converts intelligence into recommended training topics

-- Training insights table
CREATE TABLE IF NOT EXISTS training_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  audience_type TEXT NOT NULL CHECK (audience_type IN ('founder', 'agency_owner', 'operator', 'all')),
  source_signals JSONB NOT NULL DEFAULT '[]',
  capability_gap TEXT,
  recommended_modules JSONB DEFAULT '[]',
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'acknowledged', 'addressed', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_insights_tenant ON training_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_insights_audience ON training_insights(audience_type);
CREATE INDEX IF NOT EXISTS idx_training_insights_status ON training_insights(status);

-- RLS
ALTER TABLE training_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view training insights" ON training_insights;
CREATE POLICY "Users can view training insights" ON training_insights
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage training insights" ON training_insights;
CREATE POLICY "Users can manage training insights" ON training_insights
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
